import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  FileSearch,
  Search,
  BarChart3,
  FileBarChart,
  FileText,
  Users,
  Zap,
  Phone,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const AI_FEATURES = [
  {
    title: "Parse Inquiry",
    description: "Paste call notes or upload a document — AI extracts structured intake fields instantly.",
    icon: FileSearch,
    path: "/ai/parser",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    badge: "Streaming",
  },
  {
    title: "Smart Search",
    description: "Search inquiries using natural language. Ask anything about your pipeline.",
    icon: Search,
    path: "/ai/search",
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    badge: null,
  },
  {
    title: "AI Insights",
    description: "Pipeline analytics powered by Claude. See trends, conversion gaps, and opportunities.",
    icon: BarChart3,
    path: "/ai/insights",
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    badge: null,
  },
  {
    title: "Report Builder",
    description: "Describe the report you want in plain English. AI runs it safely against your data.",
    icon: FileBarChart,
    path: "/ai/reports",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    badge: "SELECT only",
  },
  {
    title: "Admissions Reports",
    description: "Generate clinical PDF reports with insurance summary, assessment, and recommendations.",
    icon: FileText,
    path: "/ai/admissions-reports",
    color: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
    badge: "PDF · Streaming",
  },
  {
    title: "Referral Insights",
    description: "Analyze top referral sources, conversion rates by account, and BD opportunities.",
    icon: Users,
    path: "/ai/referrals",
    color: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
    badge: null,
  },
  {
    title: "Pipeline Optimizer",
    description: "AI reviews your current pipeline and suggests specific actions to close more admits.",
    icon: Zap,
    path: "/ai/pipeline",
    color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    badge: null,
  },
  {
    title: "Call Intake (Beta)",
    description: "Voice pipeline integration — coming soon for automated call transcription and intake.",
    icon: Phone,
    path: "/ai/call-intake",
    color: "bg-gray-100 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400",
    badge: "Coming Soon",
    disabled: true,
  },
];

export default function AIHub() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ← Dashboard
          </button>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">AI Features</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">AI Command Center</h2>
              <p className="text-muted-foreground">Powered by Claude Sonnet 4.5</p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            All AI features are HIPAA-conscious: patient data is de-identified before reaching the AI model.
            Prompts are rate-limited and every call is logged.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {AI_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.path}
                className={`overflow-visible transition-all ${
                  feature.disabled
                    ? "opacity-60 cursor-not-allowed"
                    : "hover-elevate cursor-pointer"
                }`}
                onClick={() => !feature.disabled && navigate(feature.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {feature.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium whitespace-nowrap">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base mt-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  {!feature.disabled && (
                    <div className="flex items-center gap-1 mt-3 text-primary text-sm font-medium">
                      Open <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
