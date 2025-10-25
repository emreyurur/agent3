import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BuilderService } from './builder.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { CreateAgentDto } from './dto/create-agent-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// --- DTO Sınıfları (değişiklik yok) ---
class SenderAddressDto {
  address: string;
}

class WithdrawRevenueDto {
  callerAddress: string;
  agentId: number;
}

class TransferAgentDto {
  callerAddress: string;
  agentId: number;
  newOwnerAddress: string;
}

class RemoveAgentDto {
  callerAddress: string;
  agentId: number;
}

// --- Controller ---
@Controller('builder')
export class BuilderController {
  constructor(private readonly builderService: BuilderService) {}

  @Post('register-agent')
  @ApiConsumes('multipart/form-data')
  @ApiBadRequestResponse({ description: 'Geçersiz istek verisi.' })
  @ApiBody({
    // Swagger dökümantasyonu aynı kalıyor
    schema: {
      type: 'object',
      properties: {
        walletAddress: { type: 'string' },
        name: { type: 'string' },
        endpoint: { type: 'string' },
        credit: { type: 'number' },
        categoryName: { type: 'string' },
        description: { type: 'string' },
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        file: { type: 'string', format: 'binary' },
      },
      required: [
        'walletAddress',
        'name',
        'endpoint',
        'credit',
        'categoryId',
        'description',
        'inputSchema',
        'outputSchema',
        'file',
      ],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      // --- ANA DÜZELTME BURADA ---
      storage: diskStorage({
        /**
         * Dosyanın kaydedileceği hedef klasörü belirler.
         */
        destination: (req, file, cb) => {
          // 1. Mutlak yol oluştur: Projenin kök dizininden başla ve 'public/agents'e git.
          const uploadPath = path.resolve(process.cwd(), 'public', 'agents');

          // 2. Klasörün var olup olmadığını kontrol et. Yoksa oluştur.
          // Bu, 'ENOENT' hatasını tamamen önler.
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          // 3. Multer'a dosyayı bu güvenli yola kaydetmesini söyle.
          cb(null, uploadPath);
        },
        /**
         * Dosya adını belirler.
         */
        filename: (req, file, cb) => {
          // Benzersiz bir dosya adı oluşturuyoruz.
          const uniqueSuffix = `agent_${Date.now()}${path.extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
      fileFilter: (req, file, cb) => {
        // Sadece belirli resim formatlarına izin ver.
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return cb(
            new BadRequestException(
              'Yalnızca resim dosyaları (JPG, PNG, GIF) kabul edilir.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async registerAgent(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateAgentDto,
  ) {
    if (!file) {
      throw new BadRequestException('Agent resmi (file) yüklenmedi.');
    }
    // Servis metoduna dosya ve body'yi iletiyoruz.
    return await this.builderService.registerAsAgent(file, body);
  }

  // --- Diğer endpoint'lerde değişiklik yok ---

  @Post('agent-withdraw')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        callerAddress: { type: 'string' },
        agentId: { type: 'number' },
      },
      required: ['callerAddress', 'agentId'],
    },
  })
  async agentWithdraw(@Body() body: WithdrawRevenueDto) {
    return await this.builderService.agentWithdrawRevenue(
      body.callerAddress,
      body.agentId,
    );
  }

  @Post('transfer-agent')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        callerAddress: { type: 'string' },
        agentId: { type: 'number' },
        newOwnerAddress: { type: 'string' },
      },
      required: ['callerAddress', 'agentId', 'newOwnerAddress'],
    },
  })
  async transferAgent(@Body() body: TransferAgentDto) {
    return await this.builderService.transferAgentOwnership(
      body.callerAddress,
      body.agentId,
      body.newOwnerAddress,
    );
  }

  @Post('remove-agent')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        callerAddress: { type: 'string' },
        agentId: { type: 'number' },
      },
      required: ['callerAddress', 'agentId'],
    },
  })
  async removeAgent(@Body() body: RemoveAgentDto) {
    return await this.builderService.removeAgent(
      body.callerAddress,
      body.agentId,
    );
  }

  @Post('get-agents-tx')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
      },
      required: ['address'],
    },
  })
  async getAgentsTx(@Body() body: SenderAddressDto) {
    return await this.builderService.getAgentsTx(body.address);
  }

  @Get('agents/:address')
  @ApiParam({
    name: 'address',
    required: true,
    example: '0xabc123...',
  })
  async getAgents(@Param('address') address: string) {
    return await this.builderService.getAgents(address);
  }
}
