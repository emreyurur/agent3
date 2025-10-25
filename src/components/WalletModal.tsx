"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Wallet, ExternalLink, UserCheck, UserPlus, Loader2 } from "lucide-react";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import suiLogo from "../assets/sui-logo.png";
// TransactionBlock import'una gerek yok, çünkü base64 string kullanıyoruz
// import { TransactionBlock } from '@mysten/sui.js/transactions'; 

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess: (walletName: string) => void;
}

const API_BASE_URL = 'https://batuhantekin.icu/agent3/';

export function WalletModal({ isOpen, onClose, onConnectSuccess }: WalletModalProps) {
  const wallet = useWallet();
  const [modalState, setModalState] = useState<
    "connecting" | "checking_profile" | "creating_profile"
  >("connecting");
  const isProcessing = useRef(false);

  useEffect(() => {
    const handleProfileFlow = async () => {
      // Cüzdan bağlandığında, modal açıksa ve henüz bir işlem başlamamışsa
      if (isOpen && wallet.connected && wallet.account?.address && !isProcessing.current) {
        isProcessing.current = true; // İşlemi başlat
        toast.dismiss(); // Önceki tüm toastları kapat

        try {
          // Adım 1: Profil var mı kontrol et
          setModalState("checking_profile");
          toast.loading("Checking user profile...", { id: "profile-check" });

          const profileCheckResponse = await fetch(
            `${API_BASE_URL}/user/user-profile-id/${wallet.account.address}`
          );

          if (!profileCheckResponse.ok && profileCheckResponse.status !== 404) {
             const errorData = await profileCheckResponse.json().catch(() => ({}));
             throw new Error(errorData.message || `Error checking profile: ${profileCheckResponse.statusText}`);
          }
          
          const profileData = await profileCheckResponse.json();

          // Durum A: Profil Var (found: true)
          if (profileData.found) {
            toast.success("Welcome back!", { id: "profile-check" });
            onConnectSuccess(wallet.adapter?.name || "Sui Wallet");
            setTimeout(() => onClose(), 500);
            return;
          }

          // Durum B: Profil Yok (found: false veya 404)
          if (!profileData.found || profileCheckResponse.status === 404) {
            toast.info("Profile not found. Creating a new one...", { id: "profile-check" });
            setModalState("creating_profile");

            // Adım 2: txBytes al
            const createResponse = await fetch(`${API_BASE_URL}/user/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: wallet.account.address }),
            });

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(errorData.message || `Failed to prepare profile creation: ${createResponse.statusText}`);
            }

            const { txBytes, message } = await createResponse.json();
            if (!txBytes) throw new Error("No transaction bytes received from backend.");
            
            toast.info(message || "Please sign transaction to create profile.", {
              id: "profile-create",
            });

            // Adım 3: İmzala ve onayla
            if (!wallet.signAndExecuteTransaction) {
              throw new Error("Wallet does not support the required action.");
            }
              
            const result = await wallet.signAndExecuteTransaction({
              transaction: txBytes, // base64 string olarak gönder
            });

            if (result?.digest) {
              toast.success("Profile created successfully!", { id: "profile-create" });
              onConnectSuccess(wallet.adapter?.name || "Sui Wallet");
              setTimeout(() => onClose(), 500);
            } else {
              throw new Error("On-chain transaction may have failed.");
            }
          }
        } catch (error: any) {
          console.error("Login/Signup error:", error);
          toast.error(`Process failed: ${error.message}`);
          if (wallet.connected) {
            wallet.disconnect();
          }
        } finally {
          isProcessing.current = false;
          // State'i sadece modal kapalı değilse 'connecting'e çek
          if (isOpen) {
             setModalState("connecting");
          }
        }
      }
    };

    handleProfileFlow();
  // `wallet` objesinin tamamını bağımlılığa eklemek, gereksiz tetiklemelere neden olabilir.
  // Sadece ihtiyaç duyduğumuz parçaları ekleyelim.
  }, [isOpen, wallet.connected, wallet.account?.address, wallet.adapter, wallet.signAndExecuteTransaction, wallet.disconnect, onClose, onConnectSuccess]);

  // Body scroll yönetimi
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Düzeltme: wallet.adapter null/undefined ise walletIcon'u suiLogo olarak ayarla
  const walletIcon = wallet.adapter?.icon || suiLogo;

  const renderModalContent = () => {
    switch (modalState) {
      case "checking_profile":
        return (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
            <UserCheck className="w-12 h-12 text-primary animate-pulse" />
            <p className="font-semibold">Checking your profile...</p>
            <p className="text-sm text-muted-foreground">Please wait a moment.</p>
          </div>
        );
      case "creating_profile":
        return (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
            <UserPlus className="w-12 h-12 text-primary animate-pulse" />
            <p className="font-semibold">Creating your profile on-chain...</p>
            <p className="text-sm text-muted-foreground">
              Please approve the transaction in your wallet.
            </p>
          </div>
        );
      case "connecting":
      default:
        return (
          <>
            <div className="sui-wallet-button-wrapper">
              <ConnectButton>
                <div className="flex items-center gap-2 justify-center">
                  <span className="bold">Connect Sui Wallet</span>
                </div>
              </ConnectButton>
            </div>
            {/* Düzeltme: Cüzdan yüklü değilse (adapter yoksa) indirme linklerini göster */}
            {!wallet.adapter && (
              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  Don't have a Sui wallet?
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() =>
                      window.open(
                        "https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil",
                        "_blank"
                      )
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>Download Sui Wallet</span>
                    </div>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                 
                </div>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setModalState("connecting");
          isProcessing.current = false;
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (document.querySelector('[role="dialog"][data-suiet]')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {modalState === "connecting" && "Connect Wallet"}
            {modalState === "checking_profile" && "Checking Profile"}
            {modalState === "creating_profile" && "Create Profile"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">{renderModalContent()}</div>
        <div className="mt-4 p-3 bg-secondary rounded-lg text-sm text-muted-foreground">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  );
}