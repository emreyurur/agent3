import { Injectable } from '@nestjs/common';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Coin bilgilerini döndürmek için tip tanımlaması
export interface CoinInfo {
  id: string;
  type: string;
  symbol: string;
  balance: string; // BigInt yerine string olarak tutulacak
  lockedBalance?: string; // Bunu da string yapalım
  displayBalance: string;
}

@Injectable()
export class SuiService {
  private client: SuiClient;

  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl('testnet') });
  }

  getClient() {
    return this.client;
  }

  /**
   * Kullanıcının sahip olduğu SUI coinlerini listeler
   * @param ownerAddress Coin sahibinin adresi
   * @returns SUI coinlerinin listesi
   */
  async getUserSuiCoins(ownerAddress: string): Promise<CoinInfo[]> {
    try {
      const coins = await this.client.getCoins({
        owner: ownerAddress,
        coinType: '0x2::sui::SUI', // Sadece SUI coinleri getir
      });

      // Coinleri dönüştür ve bilgilerini hazırla
      return coins.data.map((coin) => {
        const balance = BigInt(coin.balance);
        const decimals = 9; // SUI için decimal değeri
        const displayBalance = this.formatBalance(balance, decimals);

        return {
          id: coin.coinObjectId,
          type: coin.coinType,
          symbol: 'SUI',
          balance: balance.toString(), // BigInt'i string'e dönüştür
          displayBalance: displayBalance,
        };
      });
    } catch (error) {
      console.error('SUI coinleri alınırken hata oluştu:', error);
      return [];
    }
  }

  /**
   * BigInt değerini decimal basamağıyla insan okunabilir formata çevirir
   */
  private formatBalance(balance: bigint, decimals: number): string {
    if (decimals === 0) return balance.toString();

    const balanceStr = balance.toString().padStart(decimals + 1, '0');
    const integerPart = balanceStr.slice(0, -decimals) || '0';
    const fractionalPart = balanceStr.slice(-decimals);

    return `${integerPart}.${fractionalPart}`;
  }

  /**
   * Parçalanmış SUI coinlerini birleştirip işlemi yapan yardımcı metot
   * @param address Kullanıcı adresi
   * @param targetFunction İşlemin tamamlanması sonrası çalıştırılacak fonksiyon
   * @param requiredAmount Gerekli minimum miktar (opsiyonel)
   * @returns Birleştirme sonrası asıl işlemin sonucu
   */
  async mergeSuiCoinsAndExecute<T>(
    address: string,
    targetFunction: () => Promise<T>,
    requiredAmount?: bigint,
  ): Promise<
    | T
    | { error: boolean; message: string; mergeData?: any; needsMerge?: boolean }
  > {
    try {
      // Önce tüm coinleri al
      const coins = await this.getUserSuiCoins(address);

      if (!coins || coins.length === 0) {
        return {
          error: true,
          message: 'Kullanıcı cüzdanında SUI coin bulunamadı.',
        };
      }

      // En büyük bakiyeye sahip coini bul
      const sortedCoins = [...coins].sort((a, b) => {
        const aBalance = BigInt(a.balance);
        const bBalance = BigInt(b.balance);
        return bBalance > aBalance ? 1 : bBalance < aBalance ? -1 : 0;
      });

      const primaryCoin = sortedCoins[0];
      const primaryBalance = BigInt(primaryCoin.balance);

      // Sadece bir coin varsa ve yeterli bakiyeye sahipse direkt işleme devam et
      if (coins.length === 1) {
        if (!requiredAmount || primaryBalance >= requiredAmount) {
          // Yeterli bakiye var, işleme devam et
          return await targetFunction();
        } else {
          // Yeterli bakiye yok
          return {
            error: true,
            message: `Yeterli bakiye yok. Gereken: ${
              requiredAmount
                ? this.formatBalance(requiredAmount, 9)
                : 'Bilinmiyor'
            } SUI, Mevcut: ${primaryCoin.displayBalance} SUI`,
          };
        }
      }

      // Birden fazla coin varsa ve yeterli bakiye yoksa birleştirme yap
      if (requiredAmount && primaryBalance < requiredAmount) {
        // İşlem için gereken bakiyeyi sağlamak için coinleri birleştir
        const tx = new TransactionBlock();
        let totalBalance = primaryBalance;
        let mergedCount = 0;

        // En fazla 5 coin'i birleştir (transaction limitleri nedeniyle)
        for (let i = 1; i < Math.min(sortedCoins.length, 6); i++) {
          const coin = sortedCoins[i];
          const coinBalance = BigInt(coin.balance);

          tx.mergeCoins(tx.object(primaryCoin.id), [tx.object(coin.id)]);
          totalBalance += coinBalance;
          mergedCount++;

          // Yeterli bakiye elde edildiyse durabilirsin
          if (requiredAmount && totalBalance >= requiredAmount) break;
        }

        // Eğer hiç birleştirme yapılmadıysa ve yeterli bakiye yoksa
        if (
          mergedCount === 0 ||
          (requiredAmount && totalBalance < requiredAmount)
        ) {
          return {
            error: true,
            message: `Yeterli bakiye sağlanamadı. Gereken: ${
              requiredAmount
                ? this.formatBalance(requiredAmount, 9)
                : 'Bilinmiyor'
            } SUI, Mevcut toplam: ${this.formatBalance(totalBalance, 9)} SUI`,
          };
        }

        // Transaction'ı hazırla
        tx.setSender(address);
        const txBytes = await tx.build({ client: this.client });
        const base64Tx = Buffer.from(txBytes).toString('base64');

        // Birleştirme işlemi gerekiyor, kullanıcıya bilgi dön
        return {
          error: false,
          needsMerge: true,
          message: `İşlem için coinlerinizin birleştirilmesi gerekiyor. ${mergedCount} adet coin birleştirilecek.`,
          mergeData: {
            txBytes: base64Tx,
            primaryCoinId: primaryCoin.id,
            totalBalance: this.formatBalance(totalBalance, 9),
            mergedCoins: sortedCoins.slice(0, mergedCount + 1).map((c) => ({
              id: c.id,
              balance: c.displayBalance,
            })),
          },
        };
      }

      // Yeterli bakiye var, işleme devam et
      return await targetFunction();
    } catch (error) {
      console.error('Coin birleştirme hatası:', error);
      return {
        error: true,
        message: `Hata: ${error.message || 'Bilinmeyen bir hata oluştu'}`,
      };
    }
  }
}
