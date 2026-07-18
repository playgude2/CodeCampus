import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisConfig } from '../config/configuration';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Shared ioredis client used for cache, the Socket.IO adapter, and throttling.
 * BullMQ manages its own connections via @nestjs/bullmq (see QueueModule).
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = config.getOrThrow<RedisConfig>('redis');
        return new Redis({
          host: redis.host,
          port: redis.port,
          password: redis.password,
          db: redis.db,
          maxRetriesPerRequest: null,
          lazyConnect: false,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  onModuleDestroy(): void {
    // ioredis clients are cleaned up on app shutdown via Nest lifecycle.
  }
}
