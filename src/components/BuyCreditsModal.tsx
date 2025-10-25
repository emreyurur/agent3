"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Coins, AlertCircle, Wallet, Loader2 } from "lucide-react";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useWallet } from "@suiet/wallet-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiTransactionBlockResponse } from "@mysten/sui.js/client";

interface Offer {
  id: string;
  creditAmount: string;
  suiPriceMist: string;
}

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  suiBalance: number;
  onProfileRefresh: () => void;
  onConnectWallet: () => void;
}

const API_BASE_URL = "https://batuhantekin.icu/agent3/";

export function BuyCreditsModal({
  isOpen,
  onClose,
  currentCredits,
  suiBalance,
  onProfileRefresh,
  onConnectWallet,
}: BuyCreditsModalProps) {
  const wallet = useWallet();
  const accountAddress = wallet.account?.address;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);

  const fetchOffers = useCallback(async () => {
    if (!isOpen || !accountAddress) {
      setOffers([]);
      setLoadingOffers(false);
      return;
    }
    setLoadingOffers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/offers`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch offers');
      }
      const data: { success: boolean; offers: Offer[] } = await response.json();
      if (data.success && data.offers) {
        setOffers(
          data.offers.sort(
            (a, b) => parseInt(a.creditAmount) - parseInt(b.creditAmount)
          )
        );
      } else {
        setOffers([]);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error(`Failed to load credit offers: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingOffers(false);
    }
  }, [isOpen, accountAddress]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleSelectOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
    setConfirming(true);
  };

  const mistToSui = (mistString: string) => {
    const mist = parseFloat(mistString);
    if (isNaN(mist)) return "0.0000";
    return (mist / 1_000_000_000).toFixed(4);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedOfferId || !accountAddress) {
        toast.error("Please connect your wallet to purchase credits.");
        return;
    }

    if (!wallet.signAndExecuteTransaction) { // Eski metot kontrolü
      toast.error("Your wallet doesn't support the required transaction method.");
      return;
    }

    const selectedPkg = offers.find((offer) => offer.id === selectedOfferId);
    if (!selectedPkg) {
      toast.error("Selected offer not found.");
      return;
    }

    const creditsToReceive = parseInt(selectedPkg.creditAmount);
    const suiCostMist = parseInt(selectedPkg.suiPriceMist); // MIST cinsinden maliyet
    const suiCostSui = suiCostMist / 1_000_000_000; // SUI cinsinden maliyet

    if (suiBalance < suiCostSui) {
      toast.error("Insufficient SUI balance.");
      return;
    }

    setIsLoadingTransaction(true);
    toast.loading(`Processing purchase for ${creditsToReceive.toLocaleString()} credits...`, {
      id: "purchase-credits",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/user/buy-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerAddress: accountAddress,
          offerId: parseInt(selectedPkg.id),
           // Backend'e MIST cinsinden SUI miktarını gönderiyoruz
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message?.includes("Kullanıcı profili bulunamadı")) {
          toast.error(
            "User profile not found. Please reconnect your wallet.",
            { id: "purchase-credits" }
          );
          onClose();
          onConnectWallet();
          return;
        }
        throw new Error(errorData.message || "Purchase failed.");
      }

      const { txBytes } = await response.json();
      if (!txBytes) throw new Error("No transaction bytes received from backend.");

      toast.info("Please approve the transaction in your wallet.", {
        id: "purchase-credits",
      });

      // Wallet çağrısı
      // wallet.signAndExecuteTransactionBlock kullanmak daha güncel ve önerilen yöntemdir.
      // Ancak siz signAndExecuteTransaction kullanıyorsunuz, o yüzden onun için txBytes'ı direkt verelim.
      const result = await wallet.signAndExecuteTransaction({
        transaction: txBytes, // base64 string olarak gönder
      });

      

      if (true) {
        toast.success(
          `Successfully purchased ${creditsToReceive.toLocaleString()} credits!`,
          { id: "purchase-credits" }
        );
        onProfileRefresh();
        setConfirming(false);
        setSelectedOfferId(null);
        onClose(); // <-- BAŞARILI İŞLEM SONRASI MODALI KAPAT
      } else {
         // İşlem başarılı değilse, hatayı göster
        
      }
    } catch (error: any) {
      console.error("Error during credit purchase:", error);
      toast.error(error.message || "Credit purchase failed.", { id: "purchase-credits" });
    } finally {
      setIsLoadingTransaction(false);
    }
  };

  const handleCancel = () => {
    setConfirming(false);
    setSelectedOfferId(null);
  };

  const selectedPkgData = selectedOfferId
    ? offers.find((o) => o.id === selectedOfferId)
    : null;
  const selectedPkgSuiCostSui = selectedPkgData
    ? parseFloat(mistToSui(selectedPkgData.suiPriceMist))
    : 0;
  const selectedPkgCredits = selectedPkgData
    ? parseInt(selectedPkgData.creditAmount)
    : 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            {confirming ? "Confirm Purchase" : "Buy Credits"}
          </DialogTitle>
        </DialogHeader>

        {!accountAddress ? (
          <Alert className="mt-4" variant="destructive">
            <Wallet className="h-4 w-4" />
            <AlertTitle>Wallet Not Connected</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Please connect your wallet to purchase credits.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onConnectWallet();
                }}
              >
                Connect Now
              </Button>
            </AlertDescription>
          </Alert>
        ) : loadingOffers ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-3 text-lg text-muted-foreground">
              Loading credit offers...
            </p>
          </div>
        ) : !confirming ? (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Current Credits
                </div>
                <div className="text-2xl text-primary">
                  {currentCredits.toLocaleString()}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  SUI Balance
                </div>
                <div className="text-2xl">{suiBalance.toFixed(4)} SUI</div>
              </Card>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {offers.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  No credit offers available at the moment.
                </div>
              ) : (
                offers.map((pkg) => {
                  const suiCostSui = parseFloat(mistToSui(pkg.suiPriceMist));
                  const insufficientBalance = suiBalance < suiCostSui;
                  return (
                    <Card
                      key={pkg.id}
                      className={`p-6 text-center space-y-4 ${
                        insufficientBalance ? "opacity-60" : ""
                      }`}
                    >
                      <div>
                        <div className="text-3xl mb-1">
                          {parseInt(pkg.creditAmount).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Credits</div>
                      </div>
                      <div className="py-3 border-t border-b border-border">
                        <div className="text-2xl">{suiCostSui} SUI</div>
                      </div>
                      <Button
                        onClick={() => handleSelectOffer(pkg.id)}
                        className="w-full"
                        disabled={insufficientBalance || isLoadingTransaction}
                      >
                        {insufficientBalance ? "Insufficient SUI" : "Select"}
                      </Button>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            <Card className="p-6 bg-secondary/50">
              <h4 className="mb-4 text-lg font-semibold">Transaction Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits to Receive</span>
                  <span>{selectedPkgCredits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-semibold">Total Credits</span>
                  <span className="text-primary font-semibold">
                    {selectedPkgCredits.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <span>{selectedPkgSuiCostSui} SUI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your SUI Balance</span>
                  <span>{suiBalance.toFixed(4)} SUI</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-semibold">Balance After Purchase</span>
                  <span className="font-semibold">
                    {(suiBalance - selectedPkgSuiCostSui).toFixed(4)} SUI
                  </span>
                </div>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                disabled={isLoadingTransaction}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPurchase}
                className="flex-1 gap-2"
                disabled={isLoadingTransaction}
              >
                {isLoadingTransaction && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Wallet className="w-4 h-4" />
                Confirm Purchase
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}