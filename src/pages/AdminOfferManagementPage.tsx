// src/pages/AdminOfferManagementPage.tsx
"use client";

import { useState } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import { TransactionBlock } from '@mysten/sui.js/transactions';

export function AdminOfferManagementPage() {
  const wallet = useWallet();
  const adminAddress = wallet.account?.address;

  // Form state'leri
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [suiPriceMist, setSuiPriceMist] = useState<number>(0);
  const [offerIdToRemove, setOfferIdToRemove] = useState<number>(0);
  const [creditRate, setCreditRate] = useState<number>(0);

  // Loading state
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const API_BASE_URL = 'https://batuhantekin.icu/agent3/admin';

  /**
   * Admin işlemleri için genel işleyici
   */
  const handleAdminTransaction = async (
    endpoint: string,
    body: object,
    loadingId: string,
    successMessage: string
  ): Promise<boolean> => {
    if (!adminAddress) {
      toast.error("Please connect your admin wallet.");
      return false;
    }
    if (!wallet.signAndExecuteTransactionBlock) {
      toast.error("Your wallet doesn't support transaction signing.");
      return false;
    }

    setIsLoading(loadingId);
    toast.loading(`Preparing transaction (${loadingId})...`, { id: loadingId });

    try {
      // Step 1: Get transaction bytes from backend
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Transaction preparation failed: ${response.statusText}`);
      }

      const { txBytes } = await response.json();
      
      if (!txBytes) {
        throw new Error("No transaction bytes received from backend");
      }

      toast.info("Please approve the transaction in your wallet.", { id: loadingId });

      // Step 2: Create TransactionBlock from bytes
      const tx = TransactionBlock.from(txBytes);

      // Step 3: Sign and execute
      const result = await wallet.signAndExecuteTransaction({
        transaction: txBytes,
      });

      console.log("Transaction result:", result);

      // Step 4: Check transaction status
      // Suiet wallet'tan dönen sonuç farklı bir formatta olabilir
      const isSuccess = 
       
        result.digest; // Eğer digest varsa işlem başarılı demektir

      if (isSuccess) {
        toast.success(successMessage, { id: loadingId });
        return true;
      } else {
        // Hata detaylarını logla
        console.error("Transaction failed. Effects:", result.effects);
        throw new Error(
         
          "On-chain transaction failed or was rejected."
        );
      }
    } catch (error: any) {
      console.error(`Error occurred (${loadingId}):`, error);
      
      // Daha detaylı hata mesajı
      let errorMessage = "Transaction failed.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString().includes("User rejected")) {
        errorMessage = "Transaction rejected by user.";
      }
      
      toast.error(errorMessage, { id: loadingId });
      return false;
    } finally {
      setIsLoading(null);
    }
  };

  /**
   * Create new offer
   */
  const handleCreateOffer = async () => {
    if (creditAmount <= 0 || suiPriceMist <= 0) {
      toast.error("Credit amount and SUI price must be greater than 0.");
      return;
    }
    const success = await handleAdminTransaction(
      'create-offer',
      { adminAddress, creditAmount, suiPriceMist },
      'create-offer',
      'Offer created successfully!'
    );
    if (success) {
      setCreditAmount(0);
      setSuiPriceMist(0);
    }
  };

  /**
   * Remove existing offer
   */
  const handleRemoveOffer = async () => {
    if (offerIdToRemove <= 0) {
      toast.error("Offer ID must be a positive number.");
      return;
    }
    const success = await handleAdminTransaction(
      'remove-offer',
      { adminAddress, offerId: offerIdToRemove },
      'remove-offer',
      'Offer removed successfully!'
    );
    if (success) {
      setOfferIdToRemove(0);
    }
  };

  /**
   * Set credit rate
   */
  const handleSetCreditRate = async () => {
    if (creditRate <= 0) {
      toast.error("Credit rate must be a positive number.");
      return;
    }
    const success = await handleAdminTransaction(
      'set-credit-rate',
      { adminAddress, rate: creditRate },
      'set-rate',
      'Credit rate set successfully!'
    );
    if (success) {
      setCreditRate(0);
    }
  };

  return (
    <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Admin: Offer Management</h1>

      {/* Wallet not connected warning */}
      {!adminAddress ? (
        <div className="text-center p-8 border rounded-lg bg-secondary">
          <p className="text-lg text-destructive-foreground">
            Please connect an authorized admin wallet to access this panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Create Offer Card */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="creditAmount">Credit Amount</Label>
                <Input
                  id="creditAmount"
                  type="number"
                  value={creditAmount || ''}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  placeholder="e.g. 1000"
                />
              </div>
              <div>
                <Label htmlFor="suiPriceMist">SUI Price (in MIST)</Label>
                <Input
                  id="suiPriceMist"
                  type="number"
                  value={suiPriceMist || ''}
                  onChange={(e) => setSuiPriceMist(Number(e.target.value))}
                  placeholder="e.g. 1000000000 (for 1 SUI)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  1 SUI = 1,000,000,000 MIST
                </p>
              </div>
              <Button 
                onClick={handleCreateOffer} 
                className="w-full" 
                disabled={!!isLoading}
              >
                {isLoading === 'create-offer' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Offer
              </Button>
            </CardContent>
          </Card>

          {/* Remove Offer Card */}
          <Card>
            <CardHeader>
              <CardTitle>Remove Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="offerIdToRemove">Offer ID</Label>
                <Input
                  id="offerIdToRemove"
                  type="number"
                  value={offerIdToRemove || ''}
                  onChange={(e) => setOfferIdToRemove(Number(e.target.value))}
                  placeholder="e.g. 1"
                />
              </div>
              <Button 
                onClick={handleRemoveOffer} 
                className="w-full" 
                variant="destructive" 
                disabled={!!isLoading}
              >
                {isLoading === 'remove-offer' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove Offer
              </Button>
            </CardContent>
          </Card>

          {/* Set Credit Rate Card */}
          <Card>
            <CardHeader>
              <CardTitle>Set Credit Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="creditRate">New Rate (Credits per 1 SUI)</Label>
                <Input
                  id="creditRate"
                  type="number"
                  value={creditRate || ''}
                  onChange={(e) => setCreditRate(Number(e.target.value))}
                  placeholder="e.g. 10"
                />
              </div>
              <Button 
                onClick={handleSetCreditRate} 
                className="w-full" 
                disabled={!!isLoading}
              >
                {isLoading === 'set-rate' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set Rate
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}