import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, Button, Input } from "@/components/ui-elements";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What's the best bank for a savings account in Bhutan?",
  "How can I improve my financial health score?",
  "Should I invest in stocks or fixed deposits?",
  "How much emergency fund do I need?",
  "What's the best housing loan option in Thimphu?",
  "How does NPPF work for retirement?",
];

export default function AskAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader");

      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) continue;
            if (data.content) {
              accumulated += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: accumulated };
                return updated;
              });
            }
            if (data.error) {
              accumulated = "I'm sorry, I had trouble generating a response. Please try again.";
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: accumulated };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I'm sorry, I couldn't connect right now. Please try again in a moment.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-display font-bold text-foreground">Ask Money Saathi AI</h1>
          </div>
          <p className="text-muted-foreground text-sm">Your personal financial advisor with deep knowledge of Bhutan's financial ecosystem.</p>
        </div>

        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="p-4 bg-primary/10 rounded-2xl mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-1">Kuzu Zangpo La!</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md">
                  I'm your Money Saathi AI assistant. Ask me anything about loans, savings, investments, or financial planning in Bhutan. I can also provide personalized advice based on your financial data.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-left px-3 py-2.5 bg-muted/30 hover:bg-muted/50 rounded-xl text-sm text-foreground/80 transition-colors border border-border/30"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="p-2 bg-primary/10 rounded-xl h-fit shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-foreground"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" && msg.content === "" && isStreaming && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Thinking...</span>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="p-2 bg-primary/20 rounded-xl h-fit shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/50 p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about loans, savings, investments..."
                disabled={isStreaming}
                className="flex-1"
              />
              <Button type="submit" disabled={isStreaming || !input.trim()} className="shrink-0 gap-2">
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
