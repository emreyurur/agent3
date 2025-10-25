import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class DbService extends PrismaClient implements OnModuleInit {
  private logger = new Logger('DbService');
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }
}
