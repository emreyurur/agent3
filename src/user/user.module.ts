import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SuiModule } from '../sui/sui.module';

@Module({
  imports: [SuiModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
