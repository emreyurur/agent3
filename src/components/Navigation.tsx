import { Wallet, Menu, X, LogOut, Coins, User, Award, Copy, PlusCircle } from "lucide-react"; // PlusCircle eklendi
import { Button } from "./ui/button";
import { useState, useCallback } from "react"; // useCallback eklendi
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import agentLogo from "../assets/agent3.svg";

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string, agentId?: string) => void;
  walletConnected: boolean;
  onConnectWallet: () => void;
  onLogout: () => void;
  onBuyCredits: () => void;
  walletAddress?: string;
  walletName?: string;
  creditBalance?: number;
  suiBalance?: number;
  points?: number;
}

export function Navigation({
  currentView,
  onNavigate,
  walletConnected,
  onConnectWallet,
  onLogout,
  onBuyCredits,
  walletAddress,
  walletName,
  creditBalance = 0,
  suiBalance = 0,
  points = 0,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: "home", label: "Home" },
    { id: "marketplace", label: "Explore" },
    ...(walletConnected
      ? [
          { id: "my-agents", label: "My Agents" },
          { id: "dashboard", label: "Developer" },
        ]
      : []),
  ];

  // Kopyalama işlevi
  const handleCopyAddress = useCallback(() => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Wallet address copied!", {
        description: walletAddress,
        duration: 2000,
      });
    }
  }, [walletAddress]); // useCallback içine alındı

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => onNavigate("home")}
          >
            <img
              src={agentLogo}
              alt="Agent3"
              className="w-12 md:w-14 lg:w-16 rounded-md object-cover ring-2 ring-white/20 shadow-sm"
            />
            <span className="hidden sm:block font-semibold text-lg md:text-xl ml-0">
              Agent3
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`transition-colors ${
                  currentView === item.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Wallet Button / Dropdown */}
          <div className="flex items-center gap-3">
            {walletConnected && (
              <>
                {/* Points Display */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border border-border">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold">
                    {points.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">Points</span>
                </div>
                
                {/* YENİ: Buy Credits Butonu */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden sm:flex items-center gap-1.5 border-2 border-primary animate-neonPulse" // Burası değiştirildi
                  onClick={onBuyCredits}
                >
                  <PlusCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Buy Credits</span>
                  <span className="text-sm font-semibold text-primary ml-1">{creditBalance}</span>
                </Button>
              </>
            )}

            {walletConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <span>Wallet Details</span>
                      {walletName && (
                        <span className="text-xs font-normal text-muted-foreground">
                          Connected via {walletName}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="px-2 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Address
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopyAddress}
                          className="w-7 h-7"
                          aria-label="Copy address"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <span className="text-sm font-mono">
                          {walletAddress?.slice(0, 6)}...
                          {walletAddress?.slice(-4)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-yellow-500" />
                        Points
                      </span>
                      <span className="text-sm font-semibold text-yellow-600">
                        {points.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        SUI Balance
                      </span>
                      <span className="text-sm font-semibold">
                        {suiBalance.toFixed(4)} SUI
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Credits
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {creditBalance} Credits
                      </span>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={onBuyCredits} className="gap-2">
                    <Coins className="w-4 h-4" />
                    Buy Credits
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={onLogout} className="gap-2 text-destructive">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={onConnectWallet} className="gap-2">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  currentView === item.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                {item.label}
              </button>
            ))}
            {walletConnected && (
              <>
                {/* YENİ: Mobil için Buy Credits Butonu */}
                <button
                  onClick={() => {
                    onBuyCredits();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50"
                >
                  <Coins className="w-4 h-4 inline mr-2 text-primary" />
                  Buy Credits ({creditBalance})
                </button>
                
                {/* Mobil cüzdan detayları */}
                <div className="px-4 py-3 bg-secondary/50 rounded-lg space-y-2">
                  {walletName && (
                    <div className="text-xs text-muted-foreground pb-1 border-b border-border">
                      Connected via {walletName}
                    </div>
                  )}
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Address</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyAddress}
                        className="w-7 h-7"
                        aria-label="Copy address"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <span className="font-mono">
                        {walletAddress?.slice(0, 6)}...
                        {walletAddress?.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-yellow-500" />
                      Points
                    </span>
                    <span className="font-semibold text-yellow-600">
                      {points.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SUI Balance</span>
                    <span className="font-semibold">
                      {suiBalance.toFixed(4)} SUI
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="font-semibold text-primary">
                      {creditBalance} Credits
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 rounded-lg text-destructive hover:bg-secondary/50"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}