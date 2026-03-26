import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, FileSearch, ArrowLeft, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AIParser() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [notes, setNotes] = useState("");
    const [result, setResult] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [copied, setCopied] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

  const handleParse = async () => {
        if (!notes.trim()) {
                toast({ title: "Enter call notes", description: "Paste or type your call notes first.", variant: "destructive" });
                return;
        }
        setResult("");
        setIsStreaming(true);
        abortRef.current = new AbortController();
        try {
                const res = await fetch("/api/ai/parse", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ notes }),
                          signal: abortRef.current.signal,
                });
                if (!res.ok) throw new Error(await res.text());
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                if (!reader) throw new Error("No stream");
                while (true) {
                          const { done, value } = await reader.read();
                          if (done) break;
                          setResult((prev) => prev + decoder.decode(value));
                }
        } catch (err: any) {
                if (err.name !== "AbortError") {
                          toast({ title: "Parse failed", description: err.message, variant: "destructive" });
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
                                <button onClick={() => navigate("/ai")} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
                                            <ArrowLeft className="w-4 h-4" /> AI Features
                                </button>button>
                                <span className="text-muted-foreground">/</span>span>
                                <div className="flex items-center gap-2">
                                            <FileSearch className="w-5 h-5 text-primary" />
                                            <h1 className="text-xl font-bold">Parse Inquiry</h1>h1>
                                </div>div>
                      </div>div>
              </header>header>
              <main className="container mx-auto px-4 py-6 max-w-4xl">
                      <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                          <Sparkles className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                                            </div>div>
                                            <div>
                                                          <h2 className="text-2xl font-bold">AI Intake Parser</h2>h2>
                                                          <p className="text-muted-foreground text-sm">Paste call notes — AI extracts structured intake fields instantly</p>p>
                                            </div>div>
                                </div>div>
                                <Badge variant="secondary" className="text-xs">Streaming · claude-haiku-4-5</Badge>Badge>
                      </div>div>
                      <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                            <CardHeader className="pb-3">
                                                          <CardTitle className="text-base">Call Notes</CardTitle>CardTitle>
                                            </CardHeader>CardHeader>
                                            <CardContent className="space-y-3">
                                                          <Textarea
                                                                            placeholder="Paste your call notes here... e.g. 'Called about a 32 year old male, John Smith. Insurance is BlueCross PPO, policy #BCX123456. Presenting with alcohol dependency, needs residential detox. Referred by Dr. Jane Doe...'"
                                                                            className="min-h-[300px] resize-none font-mono text-sm"
                                                                            value={notes}
                                                                            onChange={(e) => setNotes(e.target.value)}
                                                                          />
                                                          <div className="flex gap-2">
                                                                          <Button onClick={handleParse} disabled={isStreaming} className="flex-1">
                                                                            {isStreaming ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing...</>>
                            ) : (
                              <><Brain className="w-4 h-4 mr-2" /> Parse with AI</>>
                            )}
                                                                          </Button>Button>
                                                            {isStreaming && (
                            <Button variant="outline" onClick={() => abortRef.current?.abort()}>Stop</Button>Button>
                                                                          )}
                                                          </div>div>
                                            </CardContent>CardContent>
                                </Card>Card>
                                <Card>
                                            <CardHeader className="pb-3">
                                                          <div className="flex items-center justify-between">
                                                                          <CardTitle className="text-base">Extracted Fields</CardTitle>CardTitle>
                                                            {result && (
                            <Button variant="ghost" size="sm" onClick={handleCopy}>
                              {copied ? <><Check className="w-4 h-4 mr-1" /> Copied</>> : <><Copy className="w-4 h-4 mr-1" /> Copy</>>}
                            </Button>Button>
                                                                          )}
                                                          </div>div>
                                            </CardHeader>CardHeader>
                                            <CardContent>
                                              {result ? (
                          <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/50 rounded-lg p-4 min-h-[300px] overflow-auto">{result}</pre>pre>
                        ) : (
                          <div className="min-h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                            {isStreaming ? (
                                                <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</div>div>
                                              ) : (
                                                "Extracted fields will appear here"
                                              )}
                          </div>div>
                                                          )}
                                            </CardContent>CardContent>
                                </Card>Card>
                      </div>div>
              </main>main>
        </div>div>
      );
}</></></></></div>
