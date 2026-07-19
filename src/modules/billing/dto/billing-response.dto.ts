import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Plan } from '../entities/plan.entity';
import { Subscription } from '../entities/subscription.entity';
import { PlanInterval, SubscriptionStatus } from '../enums/billing.enums';

export class PlanResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: PlanInterval }) interval!: PlanInterval;
  @ApiProperty() priceMinorUnits!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() features!: Record<string, boolean>;

  static from(plan: Plan): PlanResponseDto {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      interval: plan.interval,
      priceMinorUnits: plan.priceMinorUnits,
      currency: plan.currency,
      features: plan.features,
    };
  }
}

export class SubscriptionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: SubscriptionStatus }) status!: SubscriptionStatus;
  @ApiPropertyOptional({ nullable: true }) planCode!: string | null;
  @ApiProperty() currentPeriodStart!: Date;
  @ApiProperty() currentPeriodEnd!: Date;
  @ApiProperty() cancelAtPeriodEnd!: boolean;

  static from(sub: Subscription): SubscriptionResponseDto {
    return {
      id: sub.id,
      status: sub.status,
      planCode: sub.plan?.code ?? null,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }
}

export class CheckoutResponseDto {
  @ApiProperty() url!: string;
}
