import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { WebhookEvent } from '../entities/webhook-event.entity';
import { WebhookEventStatus } from '../enums/billing.enums';
import {
  PAYMENT_PROVIDER,
  ParsedWebhookEvent,
  PaymentProvider,
} from '../payment/payment-provider.interface';
import { SubscriptionService } from './subscription.service';

const PROVIDER = 'stripe';
const POSTGRES_UNIQUE_VIOLATION = '23505';

/** Thrown when the inbound webhook fails signature verification — a malformed request, not a server fault. */
export class WebhookSignatureError extends Error {}

interface CheckoutSessionLike {
  subscription?: string | null;
  customer?: string | null;
}

interface SubscriptionLike {
  id: string;
  customer: string;
}

/**
 * Verifies + idempotently dedupes inbound Stripe webhooks, then dispatches
 * to the subscription state machine. Every subscription mutation re-fetches
 * the CURRENT state via `PaymentProvider.getSubscription()` rather than
 * trusting the webhook payload's embedded snapshot — this is what makes
 * dispatch order-independent (see SubscriptionService).
 */
@Injectable()
export class BillingWebhookService {
  private readonly logger = new Logger(BillingWebhookService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly subscriptionService: SubscriptionService,
    @InjectRepository(WebhookEvent) private readonly events: Repository<WebhookEvent>,
    @InjectRepository(Subscription) private readonly subscriptions: Repository<Subscription>,
  ) {}

  async handle(rawBody: Buffer, signature: string): Promise<void> {
    let parsed: ParsedWebhookEvent;
    try {
      parsed = this.provider.verifyWebhook(rawBody, signature);
    } catch (err) {
      throw new WebhookSignatureError((err as Error).message);
    }

    const inserted = await this.tryRecordEvent(parsed);
    if (!inserted) {
      this.logger.log(`Ignoring redelivered webhook event ${parsed.id} (${parsed.type})`);
      return;
    }

    try {
      await this.dispatch(parsed);
      await this.events.update(
        { provider: PROVIDER, eventId: parsed.id },
        { status: WebhookEventStatus.PROCESSED, processedAt: new Date() },
      );
    } catch (err) {
      await this.events.update(
        { provider: PROVIDER, eventId: parsed.id },
        { status: WebhookEventStatus.FAILED, processedAt: new Date() },
      );
      throw err;
    }
  }

  /** Returns false (no-op) when this event id was already recorded — the idempotency gate. */
  private async tryRecordEvent(parsed: ParsedWebhookEvent): Promise<boolean> {
    try {
      const row = this.events.create({
        provider: PROVIDER,
        eventId: parsed.id,
        type: parsed.type,
        payload: parsed.data as Record<string, unknown>,
      });
      await this.events.save(row);
      return true;
    } catch (err) {
      if (this.isUniqueViolation(err)) return false;
      throw err;
    }
  }

  private isUniqueViolation(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }

  private async dispatch(parsed: ParsedWebhookEvent): Promise<void> {
    switch (parsed.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted(parsed.data as CheckoutSessionLike);
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return this.handleSubscriptionMutated(parsed.data as SubscriptionLike);
      default:
        // Stripe sends many event types we don't act on (invoice.finalized,
        // payment_method.attached, ...). Silently ignoring unrecognized
        // types (rather than rejecting) keeps this endpoint forward-compatible
        // as Stripe adds new event types to the same webhook destination.
        return;
    }
  }

  private async handleCheckoutCompleted(session: CheckoutSessionLike): Promise<void> {
    if (!session.subscription || !session.customer) {
      this.logger.warn('checkout.session.completed had no subscription/customer — ignoring');
      return;
    }
    const userId = await this.provider.getCustomerUserId(session.customer);
    if (!userId) {
      this.logger.warn(`Cannot resolve a userId for customer ${session.customer} — ignoring`);
      return;
    }
    const snapshot = await this.provider.getSubscription(session.subscription);
    await this.subscriptionService.upsertFromSnapshot(userId, snapshot);
  }

  private async handleSubscriptionMutated(raw: SubscriptionLike): Promise<void> {
    const existing = await this.subscriptions.findOneBy({ providerSubscriptionId: raw.id });
    const userId = existing?.userId ?? (await this.provider.getCustomerUserId(raw.customer));
    if (!userId) {
      this.logger.warn(`Cannot resolve a userId for subscription ${raw.id} — ignoring`);
      return;
    }
    const snapshot = await this.provider.getSubscription(raw.id);
    await this.subscriptionService.upsertFromSnapshot(userId, snapshot);
  }
}
