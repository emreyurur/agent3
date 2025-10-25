import { Body, Controller, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiBody } from '@nestjs/swagger';

class AddOfferDto {
  adminAddress: string;
  creditAmount: number;
  suiPriceMist: number;
}

class RemoveOfferDto {
  adminAddress: string;
  offerId: number;
}

class SetCreditRateDto {
  adminAddress: string;
  rate: number;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('create-offer')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminAddress: { type: 'string', description: 'Admin adresi' },
        creditAmount: { type: 'number', description: 'Kredi miktarı' },
        suiPriceMist: {
          type: 'number',
          description: 'SUI fiyatı (mist cinsinden)',
        },
      },
      required: ['adminAddress', 'creditAmount', 'suiPriceMist'],
    },
  })
  async createOffer(@Body() body: AddOfferDto) {
    return await this.adminService.addOffer(
      body.adminAddress,
      body.creditAmount.valueOf(),
      body.suiPriceMist.valueOf(),
    );
  }

  @Post('remove-offer')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminAddress: { type: 'string', description: 'Admin adresi' },
        offerId: { type: 'number', description: 'Silinecek teklif ID' },
      },
      required: ['adminAddress', 'offerId'],
    },
  })
  async removeOffer(@Body() body: RemoveOfferDto) {
    return await this.adminService.removeOffer(body.adminAddress, body.offerId);
  }

  @Post('set-credit-rate')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminAddress: { type: 'string', description: 'Admin adresi' },
        rate: { type: 'number', description: 'Belirlenecek kredi oranı' },
      },
      required: ['adminAddress', 'rate'],
    },
  })
  async setCreditRate(@Body() body: SetCreditRateDto) {
    return await this.adminService.setCreditRate(body.adminAddress, body.rate);
  }
}
