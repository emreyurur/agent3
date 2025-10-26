import { Agent } from "../components/AgentCard";

export const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Content Generator Pro",
    description: "Generate high-quality blog posts, articles, and marketing copy with advanced AI",
    developer: "AILab.sui",
    category: "Text",
    likes: 1245,
    dislikes: 43,
    creditCost: 5,
    totalRuns: 15420,
    image: null
  },
  {
    id: "2",
    name: "Image Style Transfer",
    description: "Transform your images with artistic styles using neural networks",
    developer: "WalAI.sui",
    category: "Image",
    likes: 892,
    dislikes: 28,
    creditCost: 8,
    totalRuns: 8934,
    image: null
  },
  {
    id: "3",
    name: "Code Reviewer",
    description: "Automated code review and optimization suggestions for multiple programming languages",
    developer: "DevTools Inc",
    category: "Code",
    likes: 2103,
    dislikes: 87,
    creditCost: 3,
    totalRuns: 23456,
    image: null
  },
  {
    id: "4",
    name: "Data Analyzer",
    description: "Upload CSV files and get instant insights, visualizations, and statistical analysis",
    developer: "DataSci Solutions",
    category: "Data",
    likes: 567,
    dislikes: 12,
    creditCost: 6,
    totalRuns: 5623,
    image: null
  },
  {
    id: "5",
    name: "SEO Optimizer",
    description: "Analyze and optimize your content for search engines with actionable recommendations",
    developer: "Marketing AI",
    category: "Text",
    likes: 734,
    dislikes: 31,
    creditCost: 4,
    totalRuns: 7234,
    image: null
  },
  {
    id: "6",
    name: "Voice Transcriber",
    description: "Convert audio files to text with high accuracy and speaker identification",
    developer: "Audio Tech",
    category: "Audio",
    likes: 1456,
    dislikes: 56,
    creditCost: 7,
    totalRuns: 12456,
    image: null
  },
  {
    id: "7",
    name: "Logo Designer",
    description: "Create professional logos based on your brand description and preferences",
    developer: "Creative Tech",
    category: "Image",
    likes: 923,
    dislikes: 45,
    creditCost: 10,
    totalRuns: 6745,
    image: null
  },
  {
    id: "8",
    name: "SQL Query Builder",
    description: "Generate optimized SQL queries from natural language descriptions",
    developer: "DevTools Inc",
    category: "Code",
    likes: 1876,
    dislikes: 67,
    creditCost: 2,
    totalRuns: 19876,
    image: null
  },
  {
    id: "9",
    name: "Sentiment Analyzer",
    description: "Analyze customer feedback and social media posts for sentiment and insights",
    developer: "DataSci Solutions",
    category: "Data",
    likes: 645,
    dislikes: 23,
    creditCost: 3,
    totalRuns: 8234,
    image: null
  },
  {
    id: "10",
    name: "X Space Editor",
    description: "Collaborative Markdown editor with AI-assisted suggestions, smart formatting and real-time publishing.",
    developer: "XSpace Labs",
    category: "Editor",
    likes: 412,
    dislikes: 9,
    creditCost: 6,
    totalRuns: 2345,
    image: null
  },
  {
    id: "11",
    name: "Translation Guru",
    description: "High-quality multilingual translation with context-aware phrasing and tone preservation.",
    developer: "LinguaAI",
    category: "Text",
    likes: 678,
    dislikes: 12,
    creditCost: 4,
    totalRuns: 7845,
    image: null
  },
  {
    id: "12",
    name: "Video Summarizer",
    description: "Summarize long videos into short highlights with timestamps and keyframe thumbnails.",
    developer: "ClipAI",
    category: "Video",
    likes: 521,
    dislikes: 18,
    creditCost: 9,
    totalRuns: 4521,
    image: null
  },
  {
    id: "13",
    name: "Prompt Tuner",
    description: "Interactive tool to optimize prompts for better agent outputs with A/B testing.",
    developer: "PromptWorks",
    category: "Tooling",
    likes: 305,
    dislikes: 5,
    creditCost: 3,
    totalRuns: 1204,
    image: null
  }
];

export const categories = ["All", "Text", "Image", "Code", "Data", "Audio", "Editor", "Video", "Tooling"];

export interface DeveloperAgent extends Agent {
  points: number;
}

export const mockDeveloperAgents: DeveloperAgent[] = [
  {
    id: "3",
    name: "Code Reviewer",
    description: "Automated code review and optimization suggestions for multiple programming languages",
    developer: "DevTools Inc",
    category: "Code",
    likes: 2103,
    dislikes: 87,
    creditCost: 3,
    totalRuns: 23456,
    points: 70368,
    image: null
  },
  {
    id: "8",
    name: "SQL Query Builder",
    description: "Generate optimized SQL queries from natural language descriptions",
    developer: "DevTools Inc",
    category: "Code",
    likes: 1876,
    dislikes: 67,
    creditCost: 2,
    totalRuns: 19876,
    points: 39752,
    image: null
  },
];
