import { TransactionBlock } from '@mysten/sui.js/transactions';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SuiService, CoinInfo } from '../sui/sui.service';
import { Offer, OfferParser } from '../sui/offer-parser';
import axios from 'axios';
import { DbService } from 'src/db/db.service';
import { buffer } from 'stream/consumers';

interface ChainAgent {
  id: string;
  name: string;
  owner: string;
  revenue_amount: string;
  url: string;
}

interface AgentsEventPayload {
  agents: ChainAgent[];
}
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly PACKAGE_ID = process.env.PACKAGE_ID!;
  private readonly MODULE_NAME = 'credit_system';

  constructor(
    private readonly suiService: SuiService,
    private readonly offerParser: OfferParser,
    private readonly db: DbService,
  ) {}

  /**
   * Prepare a transaction to create a user profile. Returns txBytes base64 for client signing.
   */
  async createUserProfile(userAddress: string) {
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();
    this.logger.log(`Creating user profile for address: ${userAddress}`);
    const FUNCTION_NAME = 'create_user_profile';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [tx.object(process.env.CREDIT_SYSTEM_ID!)],
    });

    tx.setSender(userAddress);

    const txBytes = await tx.build({ client });

    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message: 'Transaction prepared. Please sign with your wallet.',
    };
  }

  /**
   * Kullanıcının SUI coinlerini getir
   * @param userAddress Kullanıcı adresi
   * @returns Kullanıcının SUI coinleri
   */
  async getUserCoins(userAddress: string): Promise<CoinInfo[]> {
    this.logger.log(`Fetching SUI coins for address: ${userAddress}`);
    return this.suiService.getUserSuiCoins(userAddress);
  }

  /**
   * Kredi satın almak için işlem hazırlar
   * @param buyerAddress Alıcının adresi
   * @param paymentCoinId Ödeme için kullanılacak coin ID (opsiyonel)
   * @param offerId Teklif ID
   * @param amount İstenen miktar (SUI) - opsiyonel
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  /**
   * Kredi satın almak için işlem hazırlar
   * @param buyerAddress Alıcının adresi
   * @param offerId Teklif ID
   * @param amount Satın alınacak krediye karşılık gelen SUI miktarı
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  async buyCredits(buyerAddress: string, offerId: number) {
    // 'amount' parametresi kaldırıldı
    this.logger.log(
      `Preparing buyCredits for buyer: ${buyerAddress}, offerId: ${offerId}`,
    );

    // --- Ön Kontroller ---
    if (offerId === undefined || offerId < 0) {
      throw new BadRequestException('Geçerli bir teklif ID belirtilmelidir.');
    }

    const profileId = await this.getUserProfileId(buyerAddress);
    if (!profileId) {
      throw new NotFoundException(
        'Kullanıcı profili bulunamadı. Önce bir profil oluşturun.',
      );
    }

    // --- Teklif Fiyatını Öğrenme ---
    let offerPriceMist: bigint;
    try {
      // getOffers fonksiyonunu çağırıp ilgili teklifi buluyoruz
      const offersResult = await this.getOffers(); // Bu fonksiyonun Offer[] döndürdüğünü varsayıyoruz
      if (!offersResult.success || !offersResult.offers) {
        throw new InternalServerErrorException('Kredi teklifleri alınamadı.');
      }
      const selectedOffer = (offersResult.offers as Offer[]).find(
        (o: Offer) => o.id === String(offerId),
      );
      if (!selectedOffer) {
        throw new NotFoundException(`Teklif ID ${offerId} bulunamadı.`);
      }
      offerPriceMist = BigInt(selectedOffer.suiPriceMist);
      this.logger.log(`Offer ${offerId} price: ${offerPriceMist} MIST`);
    } catch (error) {
      this.logger.error(`Teklif bilgileri alınırken hata: ${error.message}`);
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Teklif bilgileri alınamadı.');
    }

    // --- Uygun Ödeme Coin'ini Bulma ---
    let paymentCoinId: string | null = null;
    let needsMerge = false; // Coin birleştirme gerekip gerekmediğini takip etmek için
    let requiredAmount = offerPriceMist;

    try {
      const userCoins = await this.suiService.getUserSuiCoins(buyerAddress);
      if (userCoins.length === 0) {
        throw new BadRequestException(
          'Ödeme için cüzdanınızda SUI coini bulunamadı.',
        );
      }

      // Fiyatı karşılayan veya aşan ilk coini bul
      const suitableCoin = userCoins.find(
        (coin) => BigInt(coin.balance) >= requiredAmount,
      );

      if (suitableCoin) {
        paymentCoinId = suitableCoin.id;
        this.logger.log(
          `Uygun ödeme coini bulundu: ${paymentCoinId} (Bakiye: ${suitableCoin.balance})`,
        );
      } else {
        // Eğer tek bir coin yetmiyorsa, birleştirme gerektiğini işaretle
        // TODO: Coin birleştirme mantığını buraya veya suiService'e ekle.
        // Şimdilik sadece hata verelim.
        needsMerge = true;
        this.logger.warn(
          `Tek bir coin yeterli değil. Coin birleştirme işlemi gerekli (henüz implemente edilmedi).`,
        );
        throw new BadRequestException(
          `Ödeme için yeterli bakiyeye sahip tek bir SUI coini bulunamadı. Lütfen coinlerinizi birleştirin.`,
        );
      }
    } catch (error) {
      this.logger.error(`Ödeme coini aranırken hata: ${error.message}`);
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Ödeme coini bulunamadı.');
    }

    // --- Transaction Bloğunu Oluşturma ---
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();

    this.logger.log(
      `Transaction oluşturuluyor: Profile=${profileId}, Offer=${offerId}, PaymentCoin=${paymentCoinId}`,
    );

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::buy_credits`,
      arguments: [
        tx.object(process.env.CREDIT_SYSTEM_ID!), // system objesi
        tx.object(profileId), // profile objesi
        tx.pure(String(offerId)), // offer_id (u64)
        tx.object(paymentCoinId), // payment (Coin<SUI> objesi)
      ],
    });

    tx.setSender(buyerAddress);

    try {
      const txBytes = await tx.build({ client });
      this.logger.log(`Transaction bytes for buyCredits oluşturuldu.`);
      return {
        txBytes: Buffer.from(txBytes).toString('base64'),
        message: 'Kredi satın alma işlemi hazırlandı. Cüzdanınızla imzalayın.',
      };
    } catch (buildError) {
      this.logger.error(`Transaction build hatası: ${buildError.message}`);
      throw new InternalServerErrorException('İşlem oluşturulamadı.');
    }
  }
  /**
   * Prepare a transaction to use an agent and spend credits.
   * Expects: callerAddress, profileId, agentId, creditsToSpend
   */
  async useAgentAndSpendCredits(
    callerAddress: string,
    //profileId: string,
    agentId: number,
    creditsToSpend: number,
  ) {
    this.logger.log(
      `Preparing useAgentAndSpendCredits for caller: ${callerAddress}, agentId: ${agentId}, creditsToSpend: ${creditsToSpend}`,
    );
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();
    const FUNCTION_NAME = 'use_agent_and_spend_credits';
    const profileId = await this.getUserProfileId(callerAddress);

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [
        tx.object(process.env.CREDIT_SYSTEM_ID!),
        tx.object(profileId),
        tx.pure(String(agentId)),
        tx.pure(String(creditsToSpend)),
      ],
    });

    tx.setSender(callerAddress);

    const txBytes = await tx.build({ client });

    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message: 'Use agent transaction prepared. Sign with your wallet.',
    };
  }

  /**
   * Kullanıcının profil ID'sini döndürür (varsa) veya null döner
   * Option<ID> tipindeki dönüşü işleyerek string'e çevirir
   */
  async getUserProfileId(wallet: string): Promise<string | null> {
    this.logger.log(`Fetching user profile ID for wallet: ${wallet}`);
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();
    const FUNCTION_NAME = 'get_user_profile_id';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [tx.object(process.env.CREDIT_SYSTEM_ID!), tx.pure(wallet)],
    });

    // Geçerli bir adres olsun - eğer wallet geçersizse dummy adres kullan
    const senderAddress = wallet.startsWith('0x')
      ? wallet
      : '0x0000000000000000000000000000000000000000000000000000000000000000';
    tx.setSender(senderAddress);

    try {
      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: senderAddress,
      });

      console.log(
        'Profil ID ham sonuç:',
        JSON.stringify(result.results?.[0]?.returnValues),
      );
      this.logger.log(
        `Profile ID raw result: ${JSON.stringify(result.results?.[0]?.returnValues)}`,
      );

      // Move call'un dönüş değerlerini al
      const returnValues = result.results?.[0]?.returnValues;

      if (!returnValues || returnValues.length === 0) {
        console.log('Dönüş değeri yok');
        return null;
      }

      // Verdiğiniz örnek formatta: İlk öğe bir byte dizisi, ikinci öğe tip bilgisi
      // [Array(33), "0x1::option::Option<0x2::object::ID>"]
      const optionValue = returnValues[0];

      // Optionvalue'nun tipini belirlemek için bir fonksiyon
      const getType = (value: any): string => {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        return typeof value;
      };

      console.log('Option değerinin tipi:', getType(optionValue));

      // Dönüş değeri bir dizi ise (gönderdiğiniz örnek format)
      if (Array.isArray(optionValue)) {
        console.log('Dizi formatında dönüş değeri alındı');

        // Dizi içindeki ilk eleman byte array'i olmalı
        const bytesArray = optionValue[0];

        if (Array.isArray(bytesArray) && bytesArray.length > 0) {
          // İlk byte 1 ise Some(value), 0 ise None
          const isSome = bytesArray[0] === 1;

          if (isSome) {
            // ID bytes'larını hex'e dönüştür (ilk byte'ı atla)
            const idBytes = bytesArray.slice(1);
            let hexString = '0x';

            for (const b of idBytes) {
              // Sayı değeri olarak almaya çalış
              const byte = typeof b === 'number' ? b : Number(b);
              // 16'lık sistemde ve 2 basamaklı olacak şekilde dönüştür
              hexString += byte.toString(16).padStart(2, '0');
            }

            console.log('Çıkarılan profil ID:', hexString);
            return hexString;
          } else {
            console.log('Option.None değeri (ID yok)');
            return null;
          }
        }
      }

      console.log('Bilinmeyen format, tüm değerler:', optionValue);
      return null;
    } catch (err) {
      console.error('getUserProfileId hatası:', err);
      return null;
    }
  }

  /**
   * Belirli bir agent'ın detaylarını döndürür (endpoint, inputSchema, outputSchema, name)
   */
  async getAgentDetails(agentId: number): Promise<any> {
    const agent = await this.db.agent.findUnique({
      where: { id: agentId },
      select: {
        endpoint: true,
        inputSchema: true,
        outputSchema: true,
        name: true,
        category: true,
        image: true,
        description: true,
        credit: true,
      },
    });
    if (!agent) return null;
    return {
      ...agent,
      image: agent.image,
    };
  }

  /**
   * Try to read the credit balance from the user's profile object.
   * Returns number or null if not found.
   */
  async getUserCreditBalance(wallet: string): Promise<number | null> {
    this.logger.log(`Fetching credit balance for wallet: ${wallet}`);
    const client = this.suiService.getClient();
    const profileId = await this.getUserProfileId(wallet);
    if (!profileId) return null;

    try {
      const obj = await client.getObject({
        id: profileId,
        options: { showContent: true },
      });
      // Try to read credit_balance from object fields if available
      const content = (obj.data as any)?.content;
      const fields = content?.fields;
      const credit = fields?.credit_balance;
      if (typeof credit === 'number') return credit;
      // credit might come as string in some encodings
      if (typeof credit === 'string') return Number(credit);
      return null;
    } catch (err) {
      console.error('getUserCreditBalance error', err);
      return null;
    }
  }

  /**
   * Prepare a transaction to call get_offers_entry for event-based inspection.
   * This returns txBytes so frontend can call as a transaction if desired.
   */
  async getOffersTx(senderAddress: string) {
    this.logger.log(`Preparing getOffersTx for sender: ${senderAddress}`);
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();
    const FUNCTION_NAME = 'get_offers_entry';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [tx.object(process.env.CREDIT_SYSTEM_ID!)],
    });

    tx.setSender(senderAddress);
    try {
      const txBytes = await tx.build({ client });
      return {
        txBytes: Buffer.from(txBytes).toString('base64'),
        message: 'get_offers_entry tx prepared (emit OffersEvent).',
      };
    } catch (err) {
      this.logger.error(`Error building transaction: ${err}`);
      throw new Error('Transaction build failed');
    }
  }

  /**
   * Kredi tekliflerini doğrudan okur (get_offers fonksiyonu ile)
   * devInspectTransactionBlock kullanarak read-only çağrı yapar
   * @returns Mevcut kredi teklifleri listesi veya hata mesajı
   */
  async getOffers() {
    this.logger.log('Kredi teklifleri okunuyor...');
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::get_offers`,
      arguments: [tx.object(process.env.CREDIT_SYSTEM_ID!)],
    });

    const dummyAddress =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    tx.setSender(dummyAddress);

    try {
      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: dummyAddress,
      });

      const returnValues = result.results?.[0]?.returnValues;
      this.logger.debug(
        `Kontrattan dönen ham veri: ${JSON.stringify(returnValues)}`,
      );

      if (!returnValues || returnValues.length === 0) {
        return {
          success: false,
          message: 'Kontrattan teklif verisi alınamadı.',
          offers: [],
        };
      }

      // === TEK DEĞİŞİKLİK BURASI ===
      // Artık doğru ve güvenilir parser'ı çağırıyoruz.
      const offers: Offer[] = this.offerParser.parseOffers(returnValues[0]);

      return {
        success: offers.length > 0,
        message:
          offers.length > 0
            ? `${offers.length} adet kredi teklifi bulundu`
            : 'Kredi teklifi bulunamadı',
        offers,
      };
    } catch (err) {
      this.logger.error(`getOffers hatası: ${err}`);
      return {
        success: false,
        message: 'Kredi teklifleri alınırken bir hata oluştu.',
        error: (err as Error).message,
        offers: [],
      };
    }
  }

  /**
   * Tüm agentları veritabanından çeker (blockchain'e erişmeden)
   * @returns Agent listesi veya hata
   */
  // getAllAgents fonksiyonu - sadece DB'den çekecek şekilde güncellenmiş

  async getAllAgents(): Promise<any> {
    this.logger.log('Agent listesi veritabanından alınıyor...');

    try {
      // Veritabanından tüm agent'ları çek
      const dbAgents = await this.db.agent.findMany({
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!dbAgents || dbAgents.length === 0) {
        return { agents: [], message: 'Veritabanında agent bulunamadı.' };
      }

      this.logger.log(`${dbAgents.length} adet agent veritabanından okundu.`);

      // Agent'ları orijinal yapıyla uyumlu formata dönüştür
      const enrichedAgents = dbAgents.map((agent) => {
        return {
          // Orijinal dönüş formatını koruyoruz
          ...agent,
          id: agent.id.toString(), // BigInt'i string'e çevir
          image: agent.image,
          // Zincirden gelen veriler olmadığı için varsayılan değerler
          owner: agent.walletAddress || '', // owner yerine walletAddress kullanıyoruz
          url: agent.endpoint || '', // url yerine endpoint kullanıyoruz
        };
      });

      return {
        agents: enrichedAgents,
        message: `${enrichedAgents.length} agent başarıyla listelendi.`,
      };
    } catch (err) {
      this.logger.error('getAllAgents fonksiyonunda bir hata oluştu:', err);
      return {
        error: true,
        message: 'Agent listesi alınırken beklenmedik bir hata oluştu.',
        details: (err as Error).message,
      };
    }
  }
  /**
   * Zincir işlemi sonrası agent endpointine inputlara göre istek atar ve sonucu döndürür
   * @param agentId Agent'ın ID'si
   * @param inputData Kullanıcıdan gelen inputlar
   * @returns Agent endpointinden gelen çıktı
   */
  async callAgentEndpoint(agentId: number, inputData: any): Promise<any> {
    // Agent'ı ve şemalarını DB'den çek
    // DbService'in agent tablosunda inputSchema, outputSchema ve endpoint alanları olmalı
    const agent = await this.db.agent.findUnique({
      where: { id: agentId },
      select: {
        endpoint: true,
        inputSchema: true,
        outputSchema: true,
        name: true,
      },
    });
    if (!agent) {
      return { error: true, message: 'Agent bulunamadı.' };
    }

    // Inputları inputSchema'ya göre doğrula (gerekirse)
    // Burada basit bir doğrulama örneği, daha gelişmiş validation için ajv gibi bir kütüphane kullanılabilir
    // Şimdilik inputData'yı doğrudan gönderiyoruz

    try {
      // Agent endpointine HTTP isteği at
      const response = await axios.post(agent.endpoint, inputData, {
        headers: { 'Content-Type': 'application/json' },
      });
      // Output'u outputSchema'ya göre parse et (gerekirse)
      // Şimdilik doğrudan cevabı döndürüyoruz
      return {
        agent: agent.name,
        output: response.data,
      };
    } catch (err) {
      return {
        error: true,
        message: 'Agent endpointine istek atılırken hata oluştu.',
        details: err?.response?.data || err.message,
      };
    }
  }
}
// Artık bu kısımda OfferParser sınıfı kullanıldığından
// eski parseOffers ve ilgili metotlar kaldırıldı
