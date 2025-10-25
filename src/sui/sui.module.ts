import { Module } from '@nestjs/common';
import { SuiService } from './sui.service';
import { OfferParser } from './offer-parser';

@Module({
  providers: [SuiService, OfferParser],
  exports: [SuiService, OfferParser],
})
export class SuiModule {}
