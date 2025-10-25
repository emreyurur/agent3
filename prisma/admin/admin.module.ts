import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SuiModule } from '../sui/sui.module';

@Module({
  imports: [SuiModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
