import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, FileSearch, ArrowLeft, Copy, Check, Loader2, Sparkles } from "lucide-react";

export default function AIParser() {
  const [, navigate] = useLocation();
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setIsStreaming(true);
    setResult("");
    abortRef.current = new AbortController();
    try {
      const response = await fetch("/api/ai/parse-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
        signal: abortRef.current.signal,
      });
      const data = await response.json();
      setResult(data.result || JSON.stringify(data, null, 2));
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setResult("Error parsing intake. Please try again.");
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/ai")}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> AI Features
          </button>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Parse Inquiry</h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Intake Parser</h2>
              <p className="text-muted-foreground text-sm">
                Paste call notes  AI extracts structured intake fields instantly
              </p>
            </div>
            <Badge variant="secondary" className="text-xs ml-auto">
              Streaming  claude-haiku-4-5
            </Badge>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Paste call notes or intake information here..."
                className="min-h-[300px] font-mono text-sm"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleParse}
                  disabled={isStreaming}
                  className="flex-1"
                >
                  {isStreaming ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing...</>
                  ) : (
                    <><Brain className="w-4 h-4 mr-2" /> Parse with AI</>
                  )}
                </Button>
                {isStreaming && (
                  <Button
                    variant="outline"
                    onClick={() => abortRef.current?.abort()}
                  >
                    Stop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Extracted Fields</CardTitle>
                {result && (
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <><Check className="w-4 h-4 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-1" /> Copy</>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/50 rounded-lg p-4 min-h-[300px] overflow-auto">{result}</pre>
              ) : (
                <div className="min-h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  Parsed fields will appear here
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
