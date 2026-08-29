import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Redis } from 'ioredis';

import type { ApiEnv } from '#config/api-env.schema.js';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  private client!: Redis;

  constructor(private readonly configService: ConfigService<ApiEnv, true>) {}

  onModuleInit(): void {
    const host = this.configService.get('REDIS_HOST', { infer: true });
    const port = this.configService.get('REDIS_PORT', { infer: true });
    const password = this.configService.get('REDIS_PASSWORD', { infer: true });

    this.client = new Redis({
      host,
      port,
      password: password.length > 0 ? password : undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (error: unknown) => {
      this.logger.error('Redis Client Error', error);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
      return await this.client.set(key, value, 'EX', ttlSeconds);
    }

    return await this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }

    return await this.client.del(...keys);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (values.length === 0) {
      return 0;
    }

    return await this.client.rpush(key, ...values);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return await this.client.llen(key);
  }

  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    return await this.client.ltrim(key, start, stop);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) {
      return 0;
    }

    return await this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) {
      return 0;
    }

    return await this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return await this.client.sismember(key, member);
  }
}
