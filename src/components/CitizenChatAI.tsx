import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  MessageCircle,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { sendMessageToGemini, generateTicketNumber, extractSeverity } from "@/lib/gemini";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  severity?: string;
  ticketNumber?: string;
}

interface CitizenChatAIProps {
  locationContext?: string;
  caseContext?: string;
  categoryContext?: string;
  onCaseCreated?: (caseData: any) => void;
}

export default function CitizenChatAI({
  locationContext = "",
  caseContext = "",
  categoryContext = "",
  onCaseCreated,
}: CitizenChatAIProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 Hello! I'm the Municipal Services AI Agent. 

I'm here to help you report and track civic issues in your area. Whether it's a pothole, garbage problem, streetlight issue, water supply, or any other civic concern, I'm ready to assist.

What issue would you like to report today?`,
      timestamp: new Date(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasTicket, setHasTicket] = useState(false);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Build context message with available data
  const buildContextMessage = (): string => {
    let context = "";
    if (locationContext) context += `Location: ${locationContext}\n`;
    if (categoryContext) context += `Category: ${categoryContext}\n`;
    if (caseContext) context += `Initial Description: ${caseContext}\n`;
    return context ? `[Context: ${context}]\n` : "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setApiError(null);

    try {
      // Prepare context-aware message
      let messageToSend = inputMessage;
      if (locationContext && messages.length <= 2) {
        // Add context only in early messages
        messageToSend = `${buildContextMessage()}\nUser Message: ${inputMessage}`;
      }

      // Call Gemini API
      const response = await sendMessageToGemini(
        messageToSend,
        messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        (chunk) => {
          // Streaming effect
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + chunk },
              ];
            }
            return prev;
          });
        }
      );

      // Extract severity and check if ticket should be generated
      const severity = extractSeverity(response);
      
      // Only generate ticket if:
      // 1. Response mentions ticket/registration/number (agent ready to create ticket)
      // 2. Response contains summary keywords (issue understood)
      // 3. Multiple exchanges have happened (sufficient info gathered)
      const responseText = response.toLowerCase();
      const shouldGenerateTicket = 
        (responseText.includes("ticket") || 
         responseText.includes("registration") || 
         responseText.includes("registered") ||
         responseText.includes("ticket number") ||
         responseText.includes("your reference")) &&
        messages.length > 5; // Ensure sufficient conversation

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
        severity: shouldGenerateTicket ? severity : undefined,
        ticketNumber: shouldGenerateTicket ? generateTicketNumber() : undefined,
      };

      if (shouldGenerateTicket && !hasTicket) {
        setHasTicket(true);
        if (onCaseCreated) {
          onCaseCreated({
            ticketNumber: assistantMessage.ticketNumber,
            severity: severity,
            description: inputMessage,
            location: locationContext,
            category: categoryContext,
          });
        }
      }

      // Append assistant message
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[CitizenChatAI] Error:", errorMsg);
      setApiError(errorMsg);

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `❌ Sorry, I encountered an error: ${errorMsg}\n\nPlease try again or contact support.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadChat = () => {
    const chatContent = messages
      .map(
        (m) =>
          `[${m.timestamp.toLocaleTimeString()}] ${m.role.toUpperCase()}:\n${m.content}\n`
      )
      .join("\n---\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(chatContent)}`
    );
    element.setAttribute("download", `civic-complaint-${Date.now()}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card className="border-primary/20 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Municipality AI Agent
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadChat}
              title="Download chat"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Chat with our AI agent to report and track civic issues
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>

                {/* Message metadata */}
                {message.role === "assistant" && (
                  <div className="mt-2 space-y-2">
                    {message.ticketNumber && (
                      <div className="flex items-center gap-2 text-xs bg-black/10 dark:bg-white/10 p-2 rounded">
                        <span className="font-mono">
                          🎫 Ticket: {message.ticketNumber}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(message.ticketNumber || "")
                          }
                          className="h-4 w-4 p-0 hover:bg-black/20"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {message.severity && (
                      <Badge
                        variant={
                          message.severity === "Critical"
                            ? "destructive"
                            : message.severity === "High"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        Severity: {message.severity}
                      </Badge>
                    )}

                    {hasTicket && message.id === messages[messages.length - 1].id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => console.log("Helpful")}
                          title="Mark as helpful"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => console.log("Not helpful")}
                          title="Mark as not helpful"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Agent is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {apiError && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs">{apiError}</p>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Describe your issue..."
            disabled={isLoading}
            autoComplete="off"
            className="text-sm"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
