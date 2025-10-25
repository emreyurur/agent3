"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, TrendingUp, ThumbsUp, ThumbsDown, Coins, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { useWallet } from "@suiet/wallet-kit"; // Cüzdan hook'unu import et

interface DeveloperDashboardProps {
  onNavigate: (view: string) => void;
}

// Backend'den gelen agent verisi için tip tanımı
interface DeveloperAgent {
  id: string;
  name: string;
  description: string;
  categoryName: string; // API'den 'categoryName' olarak geliyor
  credit: number;
  totalRuns: number;
  likes: number;
  dislikes: number;
  points: number; // Puanları API'den almayı varsayalım (veya hesaplayalım)
}

const API_BASE_URL = 'https://batuhantekin.icu/agent3/';

export function DeveloperDashboard({ onNavigate }: DeveloperDashboardProps) {
  const { account } = useWallet(); // Bağlı cüzdanı al
  const developerAddress = account?.address;

  const [agents, setAgents] = useState<DeveloperAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Geliştiricinin agent'larını backend'den çek
  const fetchDeveloperAgents = useCallback(async () => {
    if (!developerAddress) {
      setIsLoading(false);
      return; // Cüzdan bağlı değilse istek atma
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/builder/agents/${developerAddress}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch developer agents");
      }
      const data: DeveloperAgent[] = await response.json(); // API'den gelen diziyi doğrudan kullan
      setAgents(data);
    } catch (error: any) {
      console.error("Error fetching developer agents:", error);
      toast.error(error.message || "Could not load your agents.");
      setAgents([]); // Hata durumunda listeyi boşalt
    } finally {
      setIsLoading(false);
    }
  }, [developerAddress]);

  // Cüzdan adresi değiştiğinde agent'ları yeniden çek
  useEffect(() => {
    fetchDeveloperAgents();
  }, [fetchDeveloperAgents]);

  // Toplam istatistikleri çekilen agent'lar üzerinden hesapla
  const totalRuns = agents.reduce((sum, agent) => sum + (agent.totalRuns || 0), 0);
  const totalPoints = agents.reduce((sum, agent) => sum + (agent.points || 0), 0);
  const totalLikes = agents.reduce((sum, agent) => sum + (agent.likes || 0), 0);

  if (!developerAddress) {
    return (
        <div className="min-h-screen py-8 pt-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <Card className="p-8">
                    <h2 className="text-2xl font-semibold mb-4">Developer Dashboard</h2>
                    <p className="text-muted-foreground">Please connect your wallet to view your agents.</p>
                    {/* `onConnectWallet` prop'u eksik olduğu için `useWallet`'ın `connect`'ini
                        doğrudan çağırmak yerine, `Navigation`'daki butonu kullanmaya teşvik ediyoruz.
                        Veya `AppLogic`'ten `onConnectWallet` prop'unu buraya kadar taşımanız gerekir.
                    */}
                </Card>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pt-24"> {/* Navigasyon için üst padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold">Developer Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage and monitor your published agents
            </p>
          </div>
          <Button onClick={() => onNavigate("new-agent")} className="gap-2">
            <Plus className="w-4 h-4" />
            Upload New Agent
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-semibold">{totalRuns.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points Earned</p>
                <p className="text-2xl font-semibold">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-semibold">{totalLikes.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published Agents</p>
                <p className="text-2xl font-semibold">{agents.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Agent List */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Agents</h2>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : agents.length > 0 ? (
            <div className="space-y-4">
              {agents.map((agent) => (
                <Card key={agent.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{agent.name}</h3>
                        <Badge variant="outline">{agent.categoryName}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {agent.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Runs</p>
                        <p className="text-lg font-semibold">
                          {agent.totalRuns?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Points</p>
                        <p className="text-lg font-semibold text-primary">
                          {agent.points?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Likes</p>
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                          <span className="font-semibold">{agent.likes}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dislikes</p>
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="w-4 h-4 text-red-600" />
                          <span className="font-semibold">{agent.dislikes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold">No agents published yet</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                Start building and monetizing your AI tools
              </p>
              <Button onClick={() => onNavigate("new-agent")} className="gap-2">
                <Plus className="w-4 h-4" />
                Upload Your First Agent
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}