import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Injectable, Logger } from '@nestjs/common';
import { SuiService } from '../sui/sui.service';

@Injectable()
export class AdminService {
  private readonly PACKAGE_ID = process.env.PACKAGE_ID!;
  private readonly MODULE_NAME = 'credit_system';
  private readonly logger: Logger;
  constructor(private readonly suiService: SuiService) {
    this.logger = new Logger(AdminService.name);
  }

  /**
   * Admin tarafından yeni kredi teklifi eklemek için işlem hazırlar
   * @param adminAddress Admin adresi
   * @param creditAmount Kredi miktarı
   * @param suiPriceMist SUI fiyatı (mist cinsinden)
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  async addOffer(
    adminAddress: string,
    creditAmount: number,
    suiPriceMist: number,
  ) {
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();

    const FUNCTION_NAME = 'add_offer';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [
        tx.object(process.env.ADMIN_CAP_ID!),
        tx.object(process.env.CREDIT_SYSTEM_ID!),
        tx.pure(String(creditAmount)),
        tx.pure(String(suiPriceMist)),
      ],
    });

    tx.setSender(adminAddress);

    const txBytes = await tx.build({ client });
    this.logger.log(`Transaction bytes for addOffer: ${txBytes}`);
    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message:
        'Kredi teklifi ekleme işlemi hazırlandı. Cüzdanınızla imzalayın.',
    };
  }

  /**
   * Admin tarafından kredi teklifi silmek için işlem hazırlar
   * @param adminAddress Admin adresi
   * @param offerId Teklif ID
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  async removeOffer(adminAddress: string, offerId: number) {
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();

    const FUNCTION_NAME = 'remove_offer';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [
        tx.object(process.env.ADMIN_CAP_ID!),
        tx.object(process.env.CREDIT_SYSTEM_ID!),
        tx.pure(String(offerId)),
      ],
    });

    tx.setSender(adminAddress);

    const txBytes = await tx.build({ client });
    this.logger.log(`Transaction bytes for removeOffer: ${txBytes}`);
    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message: 'Kredi teklifi silme işlemi hazırlandı. Cüzdanınızla imzalayın.',
    };
  }

  /**
   * Admin tarafından kredi-SUI çevrim oranı belirlemek için işlem hazırlar
   * @param adminAddress Admin adresi
   * @param rate Çevrim oranı
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  async setCreditRate(adminAddress: string, rate: number) {
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();

    const FUNCTION_NAME = 'set_credit_rate';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [
        tx.object(process.env.ADMIN_CAP_ID!),
        tx.object(process.env.CREDIT_SYSTEM_ID!),
        tx.pure(String(rate)),
      ],
    });

    tx.setSender(adminAddress);

    const txBytes = await tx.build({ client });
    this.logger.log(`Transaction bytes for setCreditRate: ${txBytes}`);

    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message:
        'Kredi oranı belirleme işlemi hazırlandı. Cüzdanınızla imzalayın.',
    };
  }
}
