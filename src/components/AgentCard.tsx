import { ThumbsUp, ThumbsDown, Coins } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { useCallback } from "react"; // Import useCallback

export interface Agent {
  id: string;
  name: string;
  description: string;
  developer: string;
  category: string;
  likes: number;
  dislikes: number;
  creditCost: number;
  image: string | null;
  totalRuns?: number;
}

interface AgentCardProps {
  agent: Agent;
  onClick: (id: string) => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const totalVotes = agent.likes + agent.dislikes;
  const likePercentage = totalVotes > 0 ? (agent.likes / totalVotes) * 100 : 0;

  // Helper function to shorten the wallet address
  const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Construct the SuiScan URL for the developer's address
  const suiScanUrl = `https://suiscan.xyz/account/${agent.developer}`;

  // Prevent the card's onClick from firing when the link is clicked
  const handleAddressClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border border-border hover:border-primary group"
      onClick={() => onClick(agent.id)}
    >
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
        {agent.image ? (
          <img
            src={agent.image}
            alt={agent.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl opacity-50">🤖</div>
        )}
        <Badge className="absolute top-2 right-2 bg-card/90 text-foreground border-border">
          {agent.category}
        </Badge>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="group-hover:text-primary transition-colors line-clamp-1">
            {agent.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            by{' '}
            <a
              href={suiScanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 hover:text-primary hover:underline transition-colors"
              onClick={handleAddressClick}
            >
              {truncateAddress(agent.developer)}
            </a>
          </p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {agent.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span>{agent.likes}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <span>{agent.dislikes}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {likePercentage.toFixed(0)}% positive
            </div>
          </div>

          <div className="flex items-center gap-1 text-primary">
            <Coins className="w-4 h-4" />
            <span>{agent.creditCost}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}