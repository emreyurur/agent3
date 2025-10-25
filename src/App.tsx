"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "./components/Navigation";
import { WalletModal } from "./components/WalletModal";
import { BuyCreditsModal } from "./components/BuyCreditsModal";
import { LandingPage } from "./pages/LandingPage";
import { Marketplace } from "./pages/Marketplace";
import { AgentDetail } from "./pages/AgentDetail";
import { MyAgents } from "./pages/MyAgents";
import { DeveloperDashboard } from "./pages/DeveloperDashboard";
import { NewAgentForm } from "./pages/NewAgentForm";
import { AdminOfferManagementPage } from "./pages/AdminOfferManagementPage";
import { Toaster, toast } from "sonner";

// Sui Wallet Imports
import { WalletProvider, useWallet } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

// Custom Wallet Styles
import "./styles/wallet.css";

const API_BASE_URL = 'https://batuhantekin.icu/agent3/'; // Replace with your actual API base URL

// Helper function to parse the view and agentId from the URL
const getViewFromPath = (path: string) => {
  if (path === "/" || path === "/home") return { view: "home", agentId: null };
  if (path === "/marketplace") return { view: "marketplace", agentId: null };
  if (path === "/my-agents") return { view: "my-agents", agentId: null };
  if (path === "/dashboard") return { view: "dashboard", agentId: null };
  if (path === "/new-agent") return { view: "new-agent", agentId: null };
  if (path === "/admin-offers") return { view: "admin-offers", agentId: null };
  if (path.startsWith("/agent/")) {
    const agentId = path.split("/agent/")[1];
    return { view: "agent-detail", agentId: agentId };
  }
  return { view: "home", agentId: null }; // Default
};


// App Logic Component
function AppLogic() {
  // State is now derived from the URL
  const [currentView, setCurrentView] = useState("home");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [buyCreditsModalOpen, setBuyCreditsModalOpen] = useState(false);

  // Wallet States
  const [creditBalance, setCreditBalance] = useState(0);
  const [suiBalance, setSuiBalance] = useState(0);
  const [points, setPoints] = useState(0);
  
  const wallet = useWallet();

  // URL listener - This is the single source of truth for the view
  useEffect(() => {
    const handleLocationChange = () => {
      const { view, agentId } = getViewFromPath(window.location.pathname);
      setCurrentView(view);
      setSelectedAgentId(agentId);
    };

    handleLocationChange(); // Set initial view on load
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []); // Runs only once

  const ensureUserProfileExists = useCallback(async (address: string) => {
    if (!address) return false;
    try {
      const checkResponse = await fetch(`${API_BASE_URL}/user/credit-balance/${address}`);
      if (checkResponse.ok) return true;
      const errorData = await checkResponse.json();
      if (errorData.message?.includes("Kullanıcı profili bulunamadı")) {
        toast.info("Creating your user profile...", { id: 'user-profile-creation' });
        const createResponse = await fetch(`${API_BASE_URL}/user/create-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address }),
        });
        if (!createResponse.ok) {
          const createErrorData = await createResponse.json();
          throw new Error(createErrorData.message || "Failed to create user profile.");
        }
        return true;
      } else {
        throw new Error(errorData.message || "Failed to check user profile status.");
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error);
      toast.error(`Failed to ensure user profile: ${error instanceof Error ? error.message : String(error)}`, { id: 'user-profile-creation' });
      return false;
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (wallet.connected && wallet.account?.address) {
      const address = wallet.account.address;
      const profileExists = await ensureUserProfileExists(address);
      if (!profileExists) {
        toast.error("User profile could not be created or found.", { id: 'user-data' });
        // Reset balances
        setSuiBalance(0); setPoints(0); setCreditBalance(0);
        return;
      }
      try {
        // Fetch SUI Balance
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const balance = await client.getBalance({ owner: address });
        const suiAmount = Number(balance.totalBalance) / 1_000_000_000;
        setSuiBalance(suiAmount);

        // Fetch Credit Balance
        const creditResponse = await fetch(`${API_BASE_URL}/user/credit-balance/${address}`);
        if (!creditResponse.ok) throw new Error("Failed to fetch credit balance.");
        const creditData = await creditResponse.json();
        setCreditBalance(creditData.balance || 0);

        // Demo points
        const demoPoints = Math.floor(Math.random() * 10000);
        setPoints(demoPoints);

        
      } catch (error) {
        toast.error(`Failed to load user data: ${error instanceof Error ? error.message : String(error)}`, { id: 'user-data' });
        // Reset balances on error
        setSuiBalance(0); setPoints(0); setCreditBalance(0);
      }
    } else {
      // Reset balances if not connected
      setSuiBalance(0); setPoints(0); setCreditBalance(0);
    }
  }, [wallet.connected, wallet.account?.address, ensureUserProfileExists]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Stable navigation function
  const handleNavigate = useCallback((view: string, agentId?: string) => {
    if (view === "back") {
      window.history.back();
      return;
    }

    let newPath = `/${view}`;
    if (view === "home") newPath = "/";
    if (view === "agent-detail" && agentId) newPath = `/agent/${agentId}`;

    // Only push to history if the path changes
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, "", newPath);
      // Manually trigger the popstate handler to update the view
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);


  const handleConnectWalletClick = useCallback(() => {
    setWalletModalOpen(true);
  }, []);

  const handleWalletModalClose = useCallback(() => {
    setWalletModalOpen(false);
  }, []);

  const handleWalletConnectSuccess = useCallback((walletName: string) => {
    toast.success(`Welcome, ${walletName} user!`);
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = useCallback(async () => {
    try {
      if (wallet.connected) {
        await wallet.disconnect();
      }
      handleNavigate("home");
      toast.info("Wallet disconnected");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to disconnect wallet");
    }
  }, [wallet, handleNavigate]);

  const handleBuyCredits = useCallback(() => {
    setBuyCreditsModalOpen(true);
  }, []);
  
  const handleCreditDeduct = useCallback((amount: number) => {
    setCreditBalance((prev) => prev - amount);
  }, []);

  const renderView = () => {
    const walletConnected = wallet.connected;
    switch (currentView) {
      case "home":
        return <LandingPage onNavigate={handleNavigate} onConnectWallet={handleConnectWalletClick} walletConnected={walletConnected} />;
      case "marketplace":
        return <Marketplace onNavigate={handleNavigate} />;
      case "agent-detail":
        return <AgentDetail
          agentId={selectedAgentId || "1"}
          onNavigate={handleNavigate}
          walletConnected={walletConnected}
          creditBalance={creditBalance}
          onBuyCredits={handleBuyCredits}
          onCreditDeduct={handleCreditDeduct}
        />;
      case "my-agents":
        return <MyAgents onNavigate={handleNavigate} />;
      case "dashboard":
        return <DeveloperDashboard onNavigate={handleNavigate} />;
      case "new-agent":
        return <NewAgentForm onNavigate={handleNavigate} />;
      case "admin-offers":
        return <AdminOfferManagementPage />;
      default:
        return <LandingPage onNavigate={handleNavigate} onConnectWallet={handleConnectWalletClick} walletConnected={walletConnected} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigate}
        walletConnected={wallet.connected}
        onConnectWallet={handleConnectWalletClick}
        onLogout={handleLogout}
        onBuyCredits={handleBuyCredits}
        walletAddress={wallet.account?.address || ""}
        walletName={wallet.name || ""}
        creditBalance={creditBalance}
        suiBalance={suiBalance}
        points={points}
      />

      {renderView()}

      <WalletModal
        isOpen={walletModalOpen}
        onClose={handleWalletModalClose}
        onConnectSuccess={handleWalletConnectSuccess}
      />

      <BuyCreditsModal
        isOpen={buyCreditsModalOpen}
        onClose={() => setBuyCreditsModalOpen(false)}
        currentCredits={creditBalance}
        suiBalance={suiBalance}
        onProfileRefresh={fetchUserData}
        onConnectWallet={handleConnectWalletClick}
      />

      <Toaster position="bottom-right" />
    </div>
  );
}

// Main App Component with Provider
export default function App() {
  return (
    <WalletProvider>
      <AppLogic />
    </WalletProvider>
  );
}