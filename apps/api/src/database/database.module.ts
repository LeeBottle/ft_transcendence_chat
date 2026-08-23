import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dataSourceOptions } from './data-source.js';

@Module({
  imports: [TypeOrmModule.forRoot({ ...dataSourceOptions, autoLoadEntities: true })],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
