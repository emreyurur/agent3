import { ArrowRight, Zap, Shield, TrendingUp, Sparkles, Users, Code2, HeartHandshake, Award } from "lucide-react";
import { Button } from "../components/ui/button";
import { AgentCard } from "../components/AgentCard";
import { mockAgents } from "../data/mockData";
import suiLogo from "../assets/sui-logo.png";

interface LandingPageProps {
  onNavigate: (view: string, agentId?: string) => void;
  onConnectWallet: () => void;
  walletConnected: boolean;
}

export function LandingPage({
  onNavigate,
  onConnectWallet,
  walletConnected,
}: LandingPageProps) {
  const featuredAgents = mockAgents.slice(0, 3);

  // Homojen dağınık floating logo pozisyonları
  const floatingLogos = [
    { top: "8%", left: "10%", size: 120, opacity: 0.10, anim: "animate-float" },
    { top: "16%", left: "78%", size: 80, opacity: 0.08, anim: "animate-float-fast" },
    { top: "26%", left: "22%", size: 96, opacity: 0.09, anim: "animate-float-delayed" },
    { top: "48%", left: "6%", size: 64, opacity: 0.06, anim: "animate-float-fast" },
    { top: "60%", left: "84%", size: 72, opacity: 0.07, anim: "animate-float-slow" },
    { top: "72%", left: "30%", size: 112, opacity: 0.10, anim: "animate-float" },
    { top: "38%", left: "50%", size: 56, opacity: 0.06, anim: "animate-float-fast" },
    { top: "12%", left: "44%", size: 48, opacity: 0.05, anim: "animate-float-slow" },
    { top: "84%", left: "62%", size: 88, opacity: 0.08, anim: "animate-float-delayed" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Sui Gradient Theme (Adjusted for better visibility) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-950 dark:via-cyan-950 dark:to-slate-900 py-16 sm:py-20"> {/* Vertical padding reduced from py-24/32 to py-16/20 */}
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Sui Wave Pattern */}
        <div className="absolute inset-0 bg-wave-pattern opacity-5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto space-y-6"> {/* Reduced space-y from 8 to 6 */}
            {/* Sui Logo Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-blue-200 dark:border-blue-800 shadow-lg">
              <img src={suiLogo} alt="Sui" className="w-5 h-5" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Powered by Sui Network
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                AI Agents Marketplace
              </span>
              <br />
              <span className="text-slate-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl mt-2 block">
                On Sui Blockchain
              </span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Discover powerful AI tools, automate your workflow, and monetize your creations
              on the fastest blockchain network.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8"> {/* Reduced mt from 10 to 8 */}
              <Button
                size="lg"
                onClick={() => onNavigate("marketplace")}
                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl shadow-blue-500/25 px-8 py-6 text-lg"
              >
                <Sparkles className="w-5 h-5" />
                Explore Marketplace
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  walletConnected
                    ? onNavigate("new-agent")
                    : onConnectWallet()
                }
                className="gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 px-8 py-6 text-lg"
              >
                <Code2 className="w-5 h-5" />
                Publish an Agent
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-8"> {/* Reduced pt from 12 to 8 */}
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">1000+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Active Agents</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-cyan-600 dark:text-cyan-400">50K+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">1M+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Runs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Other sections remain the same --- */}

      {/* Features Section - Modern Card Design (Updated) */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose Our Platform</h2>
            <p className="text-xl text-muted-foreground">Unlock unparalleled performance, security, and earning potential on Sui.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Lightning Fast */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 p-8 rounded-2xl border border-blue-200 dark:border-blue-800 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-cyan-600/0 group-hover:from-blue-600/5 group-hover:to-cyan-600/5 rounded-2xl transition-all duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Lightning Fast on Sui</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Experience sub-second finality with Sui's parallel execution engine.
                  Run AI agents at unprecedented speeds, leveraging the power of Web3.
                </p>
              </div>
            </div>

            {/* Feature 2: Secure & Trustless */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 p-8 rounded-2xl border border-purple-200 dark:border-purple-800 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/5 group-hover:to-pink-600/5 rounded-2xl transition-all duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Secure & Transparent</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your assets, your control. Built on Sui's secure Move language
                  with transparent on-chain verification for every transaction and agent run.
                </p>
              </div>
            </div>

            {/* Feature 3: Monetize Your Work (Developers) */}
            <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/0 to-teal-600/0 group-hover:from-emerald-600/5 group-hover:to-teal-600/5 rounded-2xl transition-all duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Earn as a Developer</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Publish your AI agents to the marketplace and earn points for every run.
                  Leverage Sui's low fees to maximize your passive income streams.
                </p>
              </div>
            </div>

            {/* Yeni Özellik 4: Kullanıcılar İçin Ödüller */}
            <div className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 p-8 rounded-2xl border border-indigo-200 dark:border-indigo-800 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-purple-600/0 group-hover:from-indigo-600/5 group-hover:to-purple-600/5 rounded-2xl transition-all duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Rewards for Users</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Earn valuable points by actively using AI agents and participating in agent voting and reviews.
                  Your contributions directly shape the marketplace.
                </p>
              </div>
            </div>

            {/* Yeni Özellik 5: Topluluk Gücü */}
            <div className="group relative bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 p-8 rounded-2xl border border-orange-200 dark:border-orange-800 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 to-amber-600/0 group-hover:from-orange-600/5 group-hover:to-amber-600/5 rounded-2xl transition-all duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Community-Driven</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A vibrant ecosystem where developers and users collaborate.
                  Discover, create, and refine AI agents together, fostered by transparent on-chain interactions.
                </p>
              </div>
            </div>

            {/* Yeni Özellik 6: Blockchain'in Avantajları */}
            <div className="group relative bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-950/50 dark:to-lime-950/50 p-8 rounded-2xl border border-green-200 dark:border-green-800 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-lime-600/0 group-hover:from-green-600/5 group-hover:to-lime-600/5 rounded-2xl transition-all duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-lime-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                  <HeartHandshake className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">True Ownership & Trust</h3>
                <p className="text-muted-foreground leading-relaxed">
                  With agents deployed on Sui, you get true digital ownership and verifiable execution.
                  Blockchain ensures fairness, transparency, and censorship resistance for all.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Agents Section (No Change) */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Featured Agents</h2>
              <p className="text-lg text-muted-foreground">
                Popular AI tools trusted by the community
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => onNavigate("marketplace")}
              className="gap-2 border-2"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={(id) => onNavigate("agent-detail", id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Sui Themed (No Change) */}
      <section className="relative py-24 overflow-hidden">
        {/* Background with Sui colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700"></div>
        <div className="absolute inset-0 bg-wave-pattern opacity-10"></div>

        {/* Homojen dağılmış floating logolar (array ile) */}
        <div className="absolute inset-0 pointer-events-none">
          {floatingLogos.map((p, i) => (
            <img
              key={i}
              src={suiLogo}
              alt=""
              className={`${p.anim} absolute`}
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            <Users className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">
              Join 50,000+ users already on the platform
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-50 max-w-2xl mx-auto leading-relaxed">
            Connect your Sui wallet to start using AI agents or publish your own
            and earn rewards from the community.
          </p>

          {!walletConnected && (
            <Button
              size="lg"
              onClick={onConnectWallet}
              className="gap-2 bg-white text-blue-600 hover:bg-blue-50 shadow-2xl shadow-black/20 px-8 py-6 text-lg"
            >
              <img src={suiLogo} alt="Sui" className="w-5 h-5" />
              Connect Wallet
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </section>

      <style>{`
        .bg-wave-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-8.284 0-15-6.716-15-15C15 6.716 21.716 0 30 0zm0 30c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-8.284 0-15-6.716-15-15 0-8.284 6.716-15 15-15z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }

        /* Additional animation speed variants */
        .animate-float-slow {
          animation: float 10s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float 4.5s ease-in-out infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}