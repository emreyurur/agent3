"use client";

import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { AgentCard } from "../components/AgentCard";
import { categories } from "../data/mockData";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

// A unified type to represent an Agent
interface Agent {
  id: string;
  name: string;
  description: string;
  image: string | null;
  creditCost: number;
  category: string;
  developer: string;
  likes: number;
  dislikes: number;
  totalRuns?: number;
}

interface MarketplaceProps {
  onNavigate: (view: string, agentId?: string) => void;
}

const API_BASE_URL = 'https://batuhantekin.icu/agent3/';

export function Marketplace({ onNavigate }: MarketplaceProps) {
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }

    const fetchAgents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/user/agent/full`);
        if (!response.ok) {
          throw new Error("Failed to fetch agents from the server.");
        }
        const data = await response.json();

        if (!data.agents || !Array.isArray(data.agents)) {
            throw new Error("Invalid data format received from server.");
        }

        const fetchedAgents: Agent[] = data.agents.map((apiAgent: any) => ({
          id: apiAgent.id,
          name: apiAgent.name || "Unnamed Agent",
          description: apiAgent.description || "No description provided.",
          // ✅ FIX: Construct the full image URL by prepending the API base URL
          image: apiAgent.image ? `${API_BASE_URL}/${apiAgent.image}` : null,
          creditCost: apiAgent.credit || 0,
          category: apiAgent.categoryName || "Uncategorized",
          developer: apiAgent.owner || apiAgent.walletAddress || "Unknown Developer",
          likes: apiAgent.likes ?? 0,
          dislikes: apiAgent.dislikes ?? 0,
          totalRuns: apiAgent.totalRuns ?? 0,
        }));
        
        setAllAgents(fetchedAgents);

        const uniqueCategories = ["All", ...Array.from(new Set(fetchedAgents.map(agent => agent.category).filter(Boolean)))];
        setCategories(uniqueCategories);

      } catch (error: any) {
        toast.error(error.message || "Could not load agents.");
        setAllAgents([]); // On error, show an empty list
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
    hasFetched.current = true;
    
  }, []);

  const filteredAgents = allAgents.filter((agent) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      agent.name.toLowerCase().includes(searchLower) ||
      (agent.description && agent.description.toLowerCase().includes(searchLower)) ||
      (agent.developer && agent.developer.toLowerCase().includes(searchLower));

    const matchesCategory =
      selectedCategory === "All" || agent.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen py-8 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Explore AI Agents</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Discover {isLoading ? '...' : `${allAgents.length}+`} AI-powered tools to enhance your workflow
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search agents by name, description, or developer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          <div
            className={`flex flex-wrap gap-2 ${showFilters ? "flex" : "hidden sm:flex"}`}
          >
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer text-sm py-1 px-3"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `Showing ${filteredAgents.length} agent${filteredAgents.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : filteredAgents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={(id) => onNavigate("agent-detail", id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold">No Agents Found</h3>
            <p className="text-muted-foreground mt-2">
              There are no agents available at the moment. Try again later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}