import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBody, ApiParam } from '@nestjs/swagger';

class CreateUserDto {
  address: string;
}

class BuyCreditsDto {
  buyerAddress: string; // Opsiyonel: Verilmezse otomatik seçilir
  offerId: number;
  amount?: number; // Opsiyonel: Belirli bir miktarda kredi almak istiyorsa
}

class UseAgentDto {
  callerAddress: string;
  agentId: number;
  creditsToSpend: number;
}

class SenderAddressDto {
  address: string;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { address: { type: 'string' } },
      required: ['address'],
    },
  })
  async createUser(@Body() body: CreateUserDto) {
    return await this.userService.createUserProfile(body.address);
  }

  @Post('buy-credits')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerAddress: { type: 'string', description: 'Alıcının cüzdan adresi' },
        offerId: { type: 'number', description: 'Satın alınacak teklif ID' },
      },
      required: ['buyerAddress', 'offerId'],
    },
  })
  async buyCredits(@Body() body: BuyCreditsDto) {
    return await this.userService.buyCredits(body.buyerAddress, body.offerId);
  }

  @Post('use-agent')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        callerAddress: { type: 'string' },
        agentId: { type: 'number' },
        creditsToSpend: { type: 'number' },
      },
      required: ['callerAddress', 'agentId', 'creditsToSpend'],
    },
  })
  async useAgent(@Body() body: UseAgentDto) {
    return await this.userService.useAgentAndSpendCredits(
      body.callerAddress,
      body.agentId,
      body.creditsToSpend,
    );
  }

  // @Get('get-offers-tx/:address')
  // @ApiParam({
  //   name: 'address',
  //   required: true,
  //   description: 'Sender address',
  // })
  // async getOffersTx(@Param('address') address: string) {
  //   return await this.userService.getOffersTx(address);
  // }

  @Get('offers')
  async getOffers() {
    return await this.userService.getOffers();
  }

  @Get('user-profile-id/:wallet')
  @ApiParam({ name: 'wallet', required: true, example: '0xabc123...' })
  async getUserProfileId(@Param('wallet') wallet: string) {
    const profileId = await this.userService.getUserProfileId(wallet);

    return {
      wallet: wallet,
      profileId: profileId,
      found: profileId !== null,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('credit-balance/:wallet')
  @ApiParam({ name: 'wallet', required: true, example: '0xabc123...' })
  async getCreditBalance(@Param('wallet') wallet: string) {
    const balance = await this.userService.getUserCreditBalance(wallet);
    if (balance === null)
      return { message: 'Profile or balance not found', balance: null };
    return { balance };
  }

  @Get('user-info/:wallet')
  @ApiParam({ name: 'wallet', required: true, example: '0xabc123...' })
  async getUserInfo(@Param('wallet') wallet: string) {
    // Profil ID'sini al
    const profileId = await this.userService.getUserProfileId(wallet);

    // Profil ID bulunursa kredi bakiyesini de al
    let balance: number | null = null;
    if (profileId) {
      balance = await this.userService.getUserCreditBalance(wallet);
    }

    return {
      wallet: wallet,
      profileId: profileId,
      hasProfile: profileId !== null,
      creditBalance: balance,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('coins/:wallet')
  @ApiParam({
    name: 'wallet',
    required: true,
    example: '0xabc123...',
    description: 'Kullanıcının cüzdan adresi',
  })
  async getUserCoins(@Param('wallet') wallet: string) {
    const coins = await this.userService.getUserCoins(wallet);
    return {
      wallet: wallet,
      coins: coins,
      count: coins.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sui-coins/:wallet')
  @ApiParam({
    name: 'wallet',
    required: true,
    example: '0xabc123...',
    description: 'Kullanıcının cüzdan adresi',
  })
  async getUserSuiCoins(@Param('wallet') wallet: string) {
    const coins = await this.userService.getUserCoins(wallet);
    return {
      wallet: wallet,
      coins: coins,
      count: coins.length,
      timestamp: new Date().toISOString(),
    };
  }
  @Get('agent/full')
  async getAllAgentsFullDetails() {
    return this.userService.getAllAgents();
  }
  @Get('agent-detail/:id')
  async getAgentDetail(@Param('id') id: number) {
    return this.userService.getAgentDetails(+id);
  }
  @Post('use-endpoint')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        agentId: { type: 'number' },
        inputs: { type: 'object' },
      },
      required: ['agentId', 'inputs'],
    },
  })
  async useAgentEndpoint(@Body() body: { agentId: number; inputs: any }) {
    return await this.userService.callAgentEndpoint(body.agentId, body.inputs);
  }
}
