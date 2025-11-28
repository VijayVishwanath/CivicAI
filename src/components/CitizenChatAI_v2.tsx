import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  MessageCircle,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  FileUp,
} from "lucide-react";
import { sendMessageToGemini, generateTicketNumber, extractSeverity } from "@/lib/gemini";
import {
  registerComplaint,
  extractSeverityFromText,
  identifyCategory,
  formatPhoneNumber,
} from "@/lib/complaintService";
import { sendComplaintViaWhatsApp } from "@/lib/whatsappService";
import DocumentUpload from "./DocumentUpload";
import { ComplaintData, DocumentFile, CitizenDetails } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  severity?: string;
  ticketNumber?: string;
  showDocumentUpload?: boolean;
  showRegistrationConfirm?: boolean;
}

interface CitizenChatAIProps {
  locationContext?: string;
  caseContext?: string;
  categoryContext?: string;
  onCaseCreated?: (caseData: any) => void;
}

interface CollectedData {
  phone?: string;
  location?: string;
  category?: string;
  description?: string;
  severity?: string;
  documents: DocumentFile[];
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
  const [collectedData, setCollectedData] = useState<CollectedData>({
    documents: [],
  });
  const [registrationPhase, setRegistrationPhase] = useState<
    "chatting" | "collecting" | "confirm" | "registered"
  >("chatting");

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract data from conversation
  const extractPhoneNumber = (text: string): string | null => {
    const phoneRegex = /(\+?91|0)?[6-9]\d{9}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : null;
  };

  const extractLocation = (text: string): string | null => {
    if (text.toLowerCase().includes("near") || text.toLowerCase().includes("at")) {
      return text;
    }
    return null;
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
      // Extract data from user message
      const extractedPhone = extractPhoneNumber(inputMessage);
      const extractedLocation = extractLocation(inputMessage);

      if (extractedPhone) {
        setCollectedData((prev) => ({
          ...prev,
          phone: extractedPhone,
        }));
      }

      if (extractedLocation) {
        setCollectedData((prev) => ({
          ...prev,
          location: extractedLocation,
        }));
      }

      // Call Gemini API
      const response = await sendMessageToGemini(
        inputMessage,
        messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        (chunk) => {
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

      // Extract severity and category
      const severity = extractSeverity(response);
      const category = identifyCategory(response);

      // Check if response indicates registration should happen
      const responseText = response.toLowerCase();
      const shouldRegister =
        (responseText.includes("registered") ||
          responseText.includes("register") ||
          responseText.includes("ticket") ||
          responseText.includes("confirmation") ||
          responseText.includes("confirm")) &&
        collectedData.phone &&
        messages.length > 5;

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
        severity: shouldRegister ? severity : undefined,
        ticketNumber: shouldRegister ? generateTicketNumber() : undefined,
        showDocumentUpload: !collectedData.documents.length && !shouldRegister,
        showRegistrationConfirm: shouldRegister,
      };

      // If ready to register, collect documents and proceed
      if (shouldRegister && !hasTicket) {
        setRegistrationPhase("collecting");
        setHasTicket(true);

        // Auto-proceed with registration after user confirms
        // Will show document upload + confirm dialog
      }

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

  const handleDocumentsChange = (documents: DocumentFile[]) => {
    setCollectedData((prev) => ({
      ...prev,
      documents: documents,
    }));
  };

  const handleRegisterComplaint = async () => {
    if (!collectedData.phone) {
      setApiError("Phone number is required");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // Prepare complaint data
      const complaintData: ComplaintData = {
        citizenDetails: {
          phone: collectedData.phone,
        },
        location: collectedData.location || locationContext || "Not specified",
        category: collectedData.category || categoryContext || identifyCategory(caseContext),
        description:
          collectedData.description || caseContext || inputMessage,
        severity: (collectedData.severity as any) || "Medium",
        documents: collectedData.documents,
        status: "Submitted",
        createdAt: new Date(),
        conversationHistory: messages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n"),
      };

      // Register complaint
      const response = await registerComplaint(complaintData);

      if (!response.success) {
        throw new Error(response.error || "Failed to register complaint");
      }

      const ticketNumber = response.ticketNumber || generateTicketNumber();

      // Send WhatsApp notification
      console.log("[CitizenChatAI] Sending WhatsApp notification...");
      await sendComplaintViaWhatsApp(collectedData.phone, ticketNumber, {
        location: complaintData.location,
        category: complaintData.category,
        description: complaintData.description,
        severity: complaintData.severity,
        estimatedTime: "24-48 hours",
      });

      // Add success message
      const successMessage: ChatMessage = {
        id: `msg-${Date.now()}-success`,
        role: "assistant",
        content: `✅ *Complaint Successfully Registered!*

🎫 *Ticket Number:* ${ticketNumber}
📱 *Confirmation sent to:* ${collectedData.phone}
📤 *You'll receive WhatsApp updates* at each stage

Thank you for helping us keep your city clean and safe! 🙏

**Next Steps:**
1. You'll receive confirmation via WhatsApp
2. A field officer will be assigned within 24 hours
3. Track your complaint status anytime using your ticket number
4. Updates will be sent via WhatsApp`,
        timestamp: new Date(),
        ticketNumber: ticketNumber,
        severity: complaintData.severity,
      };

      setMessages((prev) => [...prev, successMessage]);
      setRegistrationPhase("registered");

      if (onCaseCreated) {
        onCaseCreated({
          ticketNumber: ticketNumber,
          severity: complaintData.severity,
          description: complaintData.description,
          location: complaintData.location,
          category: complaintData.category,
          phone: collectedData.phone,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[CitizenChatAI] Registration error:", errorMsg);
      setApiError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadChat = () => {
    const chatContent = messages
      .map(
        (m) =>
          `[${m.timestamp.toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`
      )
      .join("\n\n");

    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `citizen-chat-${new Date().getTime()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Municipal Services AI Agent
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Report civic issues and track complaints
        </p>
      </div>

      {/* Error Alert */}
      {apiError && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {/* Message */}
            <div
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xl px-4 py-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === "user"
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Ticket Info */}
            {message.ticketNumber && (
              <div className="flex justify-start mt-2">
                <Card className="max-w-xl border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        Ticket Generated
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <strong>Ticket:</strong>
                        <code className="ml-2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-green-700 dark:text-green-300 font-mono">
                          {message.ticketNumber}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.ticketNumber!)}
                          className="ml-2 h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </p>
                      {message.severity && (
                        <p className="text-sm">
                          <strong>Severity:</strong>
                          <Badge
                            className="ml-2"
                            variant={
                              message.severity === "Critical"
                                ? "destructive"
                                : message.severity === "High"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {message.severity}
                          </Badge>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Document Upload UI */}
            {message.showDocumentUpload && registrationPhase === "collecting" && (
              <div className="flex justify-start mt-2 max-w-xl">
                <div className="w-full">
                  <DocumentUpload
                    onDocumentsChange={handleDocumentsChange}
                    maxFiles={5}
                  />
                </div>
              </div>
            )}

            {/* Registration Confirmation */}
            {message.showRegistrationConfirm && registrationPhase === "collecting" && (
              <div className="flex justify-start mt-2 max-w-xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Confirm Complaint Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Phone:</strong> {collectedData.phone}
                      </p>
                      <p>
                        <strong>Documents:</strong>{" "}
                        {collectedData.documents.length > 0
                          ? `${collectedData.documents.length} file(s) attached`
                          : "None"}
                      </p>
                    </div>
                    <Button
                      onClick={handleRegisterComplaint}
                      disabled={isLoading || !collectedData.phone}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Register Complaint & Send WhatsApp
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Agent is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Describe your civic issue or type your response..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            onClick={downloadChat}
            variant="outline"
            size="icon"
            title="Download chat"
          >
            <Download className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
