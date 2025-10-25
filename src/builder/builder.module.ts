import { Module } from '@nestjs/common';
import { BuilderService } from './builder.service';
import { BuilderController } from './builder.controller';
import { SuiModule } from 'src/sui/sui.module';

@Module({
  imports: [SuiModule],
  providers: [BuilderService],
  controllers: [BuilderController],
})
export class BuilderModule {}
