"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Coins, ArrowLeft, Play, Loader2, CheckCircle2, Wallet } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"; // CardDescription kaldırıldı
import { toast } from "sonner";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { DynamicFormRenderer } from "../components/DyanmicFormRenderer"; // Dosya adınızın bu olduğunu varsayıyorum
import { DynamicOutputRenderer } from "../components/DynamicOutputRenderer"; // Output renderer
import { useWallet } from "@suiet/wallet-kit"; // Cüzdan hook'unu import et
import { TransactionBlock } from "@mysten/sui.js/transactions"; // İşlem için gerekli
import { SuiTransactionBlockResponse } from "@mysten/sui.js/client"; // Tip tanımı için

const API_BASE_URL = 'https://batuhantekin.icu/agent3/'; // API adresinizi doğrulayın

// API'den gelen detaylı agent verisi için interface
interface Agent {
  id: string;
  name: string;
  description: string;
  developer: string; // 'owner' alanı
  category: string; // 'category.name' alanı
  creditCost: number; // 'credit' alanı
  likes: number;
  dislikes: number;
  totalRuns: number;
  endpoint: string; // Agent'ın çalıştırılacağı API URL'i
  inputSchema: any; // Parse edilmiş JSON
  outputSchema?: any; // Parse edilmiş JSON
  image: string | null; // Tam URL veya null
}

interface AgentDetailProps {
  agentId: string;
  onNavigate: (view: string, agentId?: string) => void;
  walletConnected: boolean;
  creditBalance: number;
  onBuyCredits: () => void;
  onCreditDeduct: (amount: number) => void;
}

export function AgentDetail({
  agentId,
  onNavigate,
  walletConnected,
  creditBalance,
  onBuyCredits,
  onCreditDeduct,
}: AgentDetailProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  
  const wallet = useWallet(); // Cüzdan hook'unu burada çağırıyoruz

  // Agent detaylarını backend'den çek
  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (!agentId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setAgent(null);
      setFormData({});
      setOutput(null);
      try {
        const response = await fetch(`${API_BASE_URL}/user/agent-detail/${agentId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Agent not found");
        }
        const data = await response.json();

        // API verisini Agent arayüzüne dönüştür
        const transformedAgent: Agent = {
          id: data.id || agentId,
          name: data.name || "Unnamed Agent",
          description: data.description || "No description available.",
          developer: data.owner || "Unknown Developer",
          category: data.category?.name || "Uncategorized",
          // Resim yolunu tam URL'e çevir (Önceki Marketplace kodundaki gibi)
          image: data.image ? `${API_BASE_URL}/${data.image}` : null,
          endpoint: data.endpoint,
          inputSchema: JSON.parse(data.inputSchema || '{}'),
          outputSchema: JSON.parse(data.outputSchema || '{}'),
          creditCost: data.credit || 5,
          likes: data.likes || 0,
          dislikes: data.dislikes || 0,
          totalRuns: data.totalRuns || 0,
        };
        
        setAgent(transformedAgent);

      } catch (error: any) {
        toast.error(`Failed to load agent details: ${error.message}`);
        setAgent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentDetails();
  }, [agentId]);

  const handleFormChange = useCallback((name: string, value: any) => {
    setFormData(prevData => ({ ...prevData, [name]: value }));
  }, []);
  
  // GÜNCELLENMİŞ "Run Agent" Fonksiyonu
  const handleRunAgent = async () => {
    if (!agent) return;
    if (!wallet.connected || !wallet.account?.address) {
      toast.error("Please connect your wallet first to run the agent.");
      onConnectWallet(); // Cüzdan bağlantı modalını aç
      return;
    }
    if (creditBalance < agent.creditCost) {
      toast.error("You have insufficient credits for this agent.");
      onBuyCredits(); // Kredi satın alma modalını aç
      return;
    }
    if (!wallet.signAndExecuteTransactionBlock) {
        toast.error("Your wallet doesn't support the required transaction method.");
        return;
    }

    // Gerekli alanların dolu olup olmadığını kontrol et
    if (agent.inputSchema?.fields) {
      const missingFields = agent.inputSchema.fields.filter(
        (field: any) => field.required && !formData[field.name]
      );
      if (missingFields.length > 0) {
        toast.error(`Please fill in the required field: ${missingFields[0].label}`);
        return;
      }
    }

    setIsRunning(true);
    setOutput(null);
    const toastId = `run-agent-${agent.id}`;
    toast.loading("Step 1/2: Approving credit spend...", { id: toastId });

    try {
      // ------------------------------------------------
      // ADIM 1: Kredi harcaması için backend'den txBytes al ve imzala
      // ------------------------------------------------
      const creditResponse = await fetch(`${API_BASE_URL}/user/use-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerAddress: wallet.account.address,
          agentId: parseInt(agent.id), // API number bekliyorsa
          creditsToSpend: agent.creditCost,
        }),
      });

      if (!creditResponse.ok) {
        const err = await creditResponse.json();
        throw new Error(err.message || "Failed to prepare credit transaction.");
      }

      const { txBytes } = await creditResponse.json();
      if (!txBytes) throw new Error("No txBytes received from backend.");

      toast.info("Please approve the transaction in your wallet.", { id: toastId });

      const tx = TransactionBlock.from(txBytes);
      const txResult = await wallet.signAndExecuteTransaction({
        transaction: txBytes,
        
      }) 

     
      
      // Kredi harcaması başarılı, şimdi asıl agent'ı çalıştır
      toast.loading("Step 2/2: Agent is running...", { id: toastId });

      // ------------------------------------------------
      // ADIM 2: Agent'ın kendi API'sini çalıştır (Off-chain)
      // ------------------------------------------------
      const agentResponse = await fetch(agent.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // Form verilerini agent'ın API'sine gönder
      });

      if (!agentResponse.ok) {
        const errorData = await agentResponse.json();
        throw new Error(errorData.message || "Agent execution failed.");
      }

      const result = await agentResponse.json(); // Agent'ın çıktısı
      setOutput(result);
      onCreditDeduct(agent.creditCost); // Krediyi UI'da düşür
      toast.success("Agent completed successfully!", { id: toastId });

    } catch (error: any) {
      console.error("Agent run error:", error);
      toast.error(`Execution failed: ${error.message}`, { id: toastId });
    } finally {
      setIsRunning(false);
    }
  };

  const handleLike = () => { /* ... */ };
  const handleDislike = () => { /* ... */ };
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center pt-24"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center pt-24">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Agent Not Found</h2>
          <p className="text-muted-foreground mb-6">The agent you are looking for does not exist or could not be loaded.</p>
          <Button onClick={() => onNavigate("marketplace")}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }
  
  const totalVotes = agent.likes + agent.dislikes;
  const likePercentage = totalVotes > 0 ? (agent.likes / totalVotes) * 100 : 0;
  const hasEnoughCredits = creditBalance >= agent.creditCost;

  return (
    <div className="min-h-screen py-8 pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => onNavigate("back")} // "back" string'i AppLogic'te işlenir
          className="gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    {agent.image ? (
                        <img
                            src={agent.image}
                            alt={agent.name}
                            className="w-20 h-20 rounded-lg object-cover border"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-4xl">🤖</div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold">{agent.name}</h1>
                        <p className="text-muted-foreground mt-1">by {agent.developer}</p>
                    </div>
                </div>
                <Badge>{agent.category}</Badge>
            </div>
            <p className="text-muted-foreground">{agent.description}</p>
            
            <div className="flex items-center gap-4 border-t border-b py-4">
              <Button variant={hasLiked ? "default" : "outline"} onClick={handleLike} className="gap-2">
                <ThumbsUp className="w-4 h-4" /> {agent.likes + (hasLiked ? 1 : 0)}
              </Button>
              <Button variant={hasDisliked ? "destructive" : "outline"} onClick={handleDislike} className="gap-2">
                <ThumbsDown className="w-4 h-4" /> {agent.dislikes + (hasDisliked ? 1 : 0)}
              </Button>
              <span className="text-sm text-muted-foreground">
                {likePercentage.toFixed(0)}% positive ({totalVotes.toLocaleString()} votes)
              </span>
            </div>

            <Card>
              <CardHeader><CardTitle>Agent Workspace</CardTitle></CardHeader>
              <CardContent>
                {agent.inputSchema && agent.inputSchema.fields && agent.inputSchema.fields.length > 0 ? (
                  <DynamicFormRenderer
                    schema={agent.inputSchema}
                    formData={formData}
                    onFormChange={handleFormChange}
                  />
                ) : (
                  <p className="text-muted-foreground">This agent does not require any input. Ready to run!</p>
                )}
              </CardContent>
            </Card>

            {(isRunning || output) && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  {isRunning ? (
                    <><Loader2 className="w-5 h-5 text-primary animate-spin" /><CardTitle>Processing...</CardTitle></>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5 text-green-600" /><CardTitle>Output</CardTitle></>
                  )}
                </CardHeader>
                <CardContent>
                  {isRunning ? (
                    <div className="py-8 text-center text-muted-foreground"><p>Agent is processing your request...</p></div>
                  ) : output ? (
                    <div className="max-w-none">
                      <DynamicOutputRenderer
                        schema={agent.outputSchema} 
                        output={output}
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Cost per run</p>
                <div className="flex items-center gap-2 mt-1">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{agent.creditCost}</span>
                  <span className="text-muted-foreground">Credits</span>
                </div>
              </div>
              {walletConnected && (
                <div>
                  <p className="text-sm text-muted-foreground">Your balance</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold">{creditBalance}</span>
                    <span className="text-muted-foreground">Credits</span>
                  </div>
                </div>
              )}
              {walletConnected ? (
                hasEnoughCredits ? (
                  <Button className="w-full gap-2" onClick={handleRunAgent} disabled={isRunning}>
                    {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Running...</> : <><Play className="w-4 h-4" /> Run Agent</>}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">Insufficient credits</div>
                    <Button className="w-full" variant="outline" onClick={onBuyCredits}>Buy Credits</Button>
                  </div>
                )
              ) : (
                <Button className="w-full gap-2" onClick={onConnectWallet}>
                  <Wallet className="w-4 h-4" />
                  Connect Wallet to Run
                </Button>
              )}
            </Card>
            <Card className="p-6 space-y-4">
              <CardTitle>Statistics</CardTitle>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                  <p className="text-xl font-bold">{agent.totalRuns.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-bold">{agent.category}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function onConnectWallet() {
  throw new Error("Function not implemented.");
}
