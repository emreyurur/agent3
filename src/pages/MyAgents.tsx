// src/components/MyAgents.tsx
"use client";

import { useState, useEffect } from "react";
// HistoryDetailModal import'unu geri getiriyoruz
import { HistoryDetailModal } from "../components/HistoryDetailModal"; 
import { Heart, Clock, History, Loader2, DatabaseZap, Redo2, Eye } from "lucide-react";
import { AgentCard } from "../components/AgentCard";
import { mockAgents } from "../data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { toast } from "sonner"; // Toast'u import ettiğimizden emin oluyoruz

// AgentHistoryItem tipini export ediyoruz
export interface AgentHistoryItem {
  id: string;
  agentId: string;
  agentName: string;
  agentCategory: string;
  timestamp: string;
  outputSummary: string;
  fullOutput: any; // Çıktı yine any olabilir, çünkü formatOutputText onu işleyecek
  fullInput: any; // Şimdilik modalda gösterilmeyecek ama tutmaya devam
}

interface MyAgentsProps {
  onNavigate: (view: string, agentId?: string) => void;
}

// Tarihi "3s ago", "5m ago" formatlayan yardımcı fonksiyon
const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min ago";
  return Math.floor(seconds) + "s ago";
};

// Mock Agent History Datası (daha çeşitli output formatları ile)
const mockHistoryData: AgentHistoryItem[] = [
  {
    id: "run-1",
    agentId: "1",
    agentName: "Blog Post Generator",
    agentCategory: "Text",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    outputSummary: "Generated a 300-word blog post about Sui blockchain...",
    fullInput: { topic: "Sui blockchain", length: "Short (300 words)", tone: "Professional" },
    fullOutput: "This is the full blog post content talking about the exciting features of Sui blockchain, its low transaction fees, and parallel execution capabilities. It's a game-changer for Web3 development." // DİREKT METİN
  },
  {
    id: "run-2",
    agentId: "3",
    agentName: "Code Reviewer",
    agentCategory: "Developer",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    outputSummary: "Reviewed 80 lines of Rust code...",
    fullInput: { code: "fn main() {\n  // some bad code here\n}" },
    fullOutput: { review: "Critical error on line 10: Potential panic due to unhandled error. Suggest using `unwrap_or_else` or `?` operator. Also, consider adding more descriptive comments for complex logic." } // TEK ANAHTARLI OBJE
  },
  {
    id: "run-3",
    agentId: "2",
    agentName: "Image Style Transfer",
    agentCategory: "Image",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    outputSummary: "Applied Van Gogh style to uploaded image of a cat.",
    fullInput: { style: "Van Gogh", image: "cat.png" },
    fullOutput: { url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop", style_applied: "Van Gogh" } // RESİM URL'Sİ VE EK VERİ
  },
  {
    id: "run-4",
    agentId: "1",
    agentName: "News Summarizer",
    agentCategory: "Text",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    outputSummary: "Summarized top 3 crypto news.",
    fullInput: { query: "Top crypto news" },
    fullOutput: [ // HABER DİZİSİ
      { title: "Bitcoin hits new ATH", summary: "Bitcoin reached an all-time high amidst growing institutional adoption and ETF approvals.", url: "https://example.com/btc-ath" },
      { title: "Ethereum Dencun Upgrade Live", summary: "Ethereum's Dencun upgrade successfully deployed, bringing cheaper L2 transactions with 'blobs'.", url: "https://example.com/eth-dencun" },
      { title: "Sui Network Announces Gaming Grants", summary: "Sui blockchain launches a new grant program to foster Web3 gaming development on its platform.", url: "https://example.com/sui-grants" }
    ]
  }
];

export function MyAgents({ onNavigate }: MyAgentsProps) {
  const favoriteAgents = mockAgents.slice(0, 2);
  const recentAgents = mockAgents.slice(2, 5);

  const [history, setHistory] = useState<AgentHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Modal state'lerini geri getiriyoruz
  const [selectedRun, setSelectedRun] = useState<AgentHistoryItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    setIsLoadingHistory(true);
    const timer = setTimeout(() => {
      setHistory(mockHistoryData);
      setIsLoadingHistory(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Detayları Görüntüle butonu için handler - Modal'ı açacak
  const handleViewDetails = (run: AgentHistoryItem) => {
    setSelectedRun(run);
    setIsHistoryModalOpen(true);
  };

  // Agent'ı tekrar çalıştırmak için AgentDetail'e yönlendir
  const handleRunAgain = (agentId: string) => {
    onNavigate("agent-detail", agentId);
  };

  return (
    <div className="min-h-screen py-8 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1>My Agents</h1>
          <p className="text-muted-foreground mt-2">
            Quick access to your favorite, recent, and historical agent runs
          </p>
        </div>

        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3"> 
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="w-4 h-4" />
              Recently Used
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Run History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent">
            {recentAgents.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onClick={(id) => onNavigate("agent-detail", id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">⏱️</div>
                <h3>No recent agents</h3>
                <p className="text-muted-foreground mt-2">
                  Start exploring the marketplace to find agents
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favoriteAgents.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onClick={(id) => onNavigate("agent-detail", id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">❤️</div>
                <h3>No favorites yet</h3>
                <p className="text-muted-foreground mt-2">
                  Like agents to add them to your favorites
                </p>
              </div>
            )}
          </TabsContent>

          {/* Run History sekmesinin içeriği */}
          <TabsContent value="history">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20">
                <DatabaseZap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3>No Run History</h3>
                <p className="text-muted-foreground mt-2">
                  Run an agent to see your history here.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {history.map((run) => (
                  <Card key={run.id} className="flex flex-col h-full shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold truncate pr-2" title={run.agentName}>
                          {run.agentName}
                        </CardTitle>
                        <Badge variant="secondary" className="flex-shrink-0">{run.agentCategory}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">{timeAgo(run.timestamp)}</p>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between pt-0">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Output Summary:</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {run.outputSummary}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-grow"
                          onClick={() => handleViewDetails(run)} // Modal'ı açacak
                        >
                          <Eye className="w-4 h-4 mr-2" /> View Output
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-grow"
                          onClick={() => handleRunAgain(run.agentId)} // AgentDetail'e git
                        >
                          <Redo2 className="w-4 h-4 mr-2" /> Run Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* HistoryDetailModal bileşenini tekrar buraya ekliyoruz */}
      <HistoryDetailModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        run={selectedRun}
      />
    </div>
  );
}