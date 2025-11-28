import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import CitizenChatAI from "@/components/CitizenChatAI";

interface CaseData {
  ticketNumber?: string;
  severity?: string;
  description: string;
  location: string;
  category: string;
}

export default function CitizenChat() {
  const [activeTab, setActiveTab] = useState("ai-agent");
  const [createdCase, setCreatedCase] = useState<CaseData | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Citizen Services Chat</h1>
        <p className="text-muted-foreground">
          Chat with our AI agent to report civic issues and get real-time assistance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai-agent" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            AI Agent
          </TabsTrigger>
          <TabsTrigger value="case-history" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Case History
          </TabsTrigger>
        </TabsList>

        {/* AI Agent Tab */}
        <TabsContent value="ai-agent" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Chat */}
            <div className="lg:col-span-2">
              <CitizenChatAI
                onCaseCreated={(caseData) => {
                  setCreatedCase(caseData);
                  setActiveTab("case-history");
                }}
              />
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    About this Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    🤖 Our AI Agent is a trained representative of the Municipal
                    Corporation.
                  </p>
                  <p>
                    📋 It can handle complaints about:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Potholes & Road Damage</li>
                    <li>Garbage & Waste</li>
                    <li>Streetlights</li>
                    <li>Water & Sewage</li>
                    <li>Public Facilities</li>
                  </ul>
                  <p>
                    ✅ You'll receive a ticket number for tracking your complaint.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    💡 Be specific about your location for faster resolution.
                  </p>
                  <p>
                    📸 Include details like how long the issue has existed.
                  </p>
                  <p>
                    🎯 Describe the impact on you or your community.
                  </p>
                  <p>
                    📞 Keep your ticket number for future reference.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Case History Tab */}
        <TabsContent value="case-history" className="space-y-4">
          {createdCase ? (
            <div className="grid gap-4">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Case Report</span>
                    <Badge variant="default">{createdCase.severity}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Ticket: {createdCase.ticketNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-sm font-semibold">{createdCase.location || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <p className="text-sm font-semibold">{createdCase.category}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Issue Description</p>
                    <p className="text-sm mt-1">{createdCase.description}</p>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium">Next Steps:</p>
                    <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                      <li>Your case has been registered in the system</li>
                      <li>A field officer will be assigned within 24 hours</li>
                      <li>You can track status using your ticket number</li>
                      <li>Expected resolution time will be shared via SMS</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tracking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">TICKET NUMBER (Save this!)</p>
                    <p className="text-lg font-mono font-bold">{createdCase.ticketNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">STATUS</p>
                    <Badge>Registered</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">PRIORITY</p>
                    <Badge
                      variant={
                        createdCase.severity === "Critical"
                          ? "destructive"
                          : createdCase.severity === "High"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {createdCase.severity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No case history yet. Start a conversation with the AI Agent to create your first case report.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
