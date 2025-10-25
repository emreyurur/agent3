import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { BuilderModule } from './builder/builder.module';

@Module({
  imports: [DbModule, BuilderModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
