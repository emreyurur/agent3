import {
  IsString,
  IsNumber,
  IsObject,
  IsNotEmpty,
  IsJSON,
} from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  credit: number;

  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsObject()
  @IsJSON()
  inputSchema: Record<string, any>;

  @IsObject()
  @IsJSON()
  outputSchema: Record<string, any>;

  fileName: string; // multer ile gelen dosya adı
}
