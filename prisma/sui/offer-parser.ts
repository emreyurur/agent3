import { Injectable, Logger } from '@nestjs/common';
import { bcs, BcsType } from '@mysten/bcs';

/**
 * Move akıllı kontratından gelen Offer verisinin TypeScript karşılığı.
 * Not: u64 değerleri güvenlik için string olarak işlenir.
 */
export interface Offer {
  id: string;
  creditAmount: string;
  suiPriceMist: string;
  suiPrice: number; // MIST'ten SUI'ye çevrilmiş hali
}

@Injectable()
export class OfferParser {
  private readonly logger = new Logger(OfferParser.name);
  private readonly offersVectorSchema: BcsType<any>;

  constructor() {
    // 1. Move'daki `Offer` struct'ının BCS şemasını tanımla.
    // Alan adları, tipleri ve sırası Move'daki struct ile %100 aynı olmalı!
    const offerStructSchema = bcs.struct('Offer', {
      id: bcs.u64(),
      credit_amount: bcs.u64(),
      sui_price_mist: bcs.u64(),
      // Eğer Move'da başka alanlar varsa (örn: is_active: bcs.bool()) buraya eklenmelidir.
    });

    // 2. Birden fazla Offer içeren bir vektörün (dizinin) şemasını tanımla.
    this.offersVectorSchema = bcs.vector(offerStructSchema);
  }

  /**
   * Akıllı kontrattan dönen BCS serileştirilmiş byte dizisini parse eder.
   * @param rawData Kontrattan dönen ham `returnValues` dizisinin ilk elemanı.
   * @returns Offer nesnelerinden oluşan bir dizi.
   */
  public parseOffers(rawData: [number[], string]): Offer[] {
    if (!rawData || !Array.isArray(rawData[0])) {
      this.logger.warn('Geçersiz veri formatı. Byte dizisi bekleniyordu.');
      return [];
    }

    // Gelen byte dizisini (number[]) alıyoruz.
    const bytes = new Uint8Array(rawData[0]);
    this.logger.debug(`Çözümlenecek ${bytes.length} byte alındı.`);

    try {
      // 3. Tanımladığımız şemayı kullanarak byte'ları tek satırda çözümlüyoruz.
      const decodedData: any[] = this.offersVectorSchema.parse(bytes);

      // 4. Çözümlenmiş veriyi istenen formata dönüştürüyoruz.
      const offers: Offer[] = decodedData.map((offer) => {
        const suiPriceMist = BigInt(offer.sui_price_mist);
        return {
          id: offer.id.toString(),
          creditAmount: offer.credit_amount.toString(),
          suiPriceMist: suiPriceMist.toString(),
          suiPrice: Number(suiPriceMist) / 1_000_000_000, // 1 SUI = 10^9 MIST
        };
      });

      // Teklifleri ID'ye göre sırala (isteğe bağlı ama önerilir).
      offers.sort((a, b) => Number(a.id) - Number(b.id));

      this.logger.log(
        `${offers.length} adet kredi teklifi başarıyla çözümlendi.`,
      );
      return offers;
    } catch (error) {
      this.logger.error('BCS çözümleme sırasında hata oluştu!', error);
      // Hatanın nedeni genellikle Move struct'ı ile BCS şeması arasındaki uyumsuzluktur.
      return [];
    }
  }
}
