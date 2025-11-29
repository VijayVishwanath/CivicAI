/**
 * Gemini API client for the Municipality AI Agent
 * Handles all communication with Google Gemini API
 */

interface MessageContent {
  role: "user" | "assistant";
  content: string;
}

interface GeminiRequestBody {
  contents: {
    role: "user" | "model";
    parts: {
      text: string;
    }[];
  }[];
  systemInstruction?: {
    parts: {
      text: string;
    }[];
  };
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
  };
}

const GEMINI_API_KEY = ""; // API key removed for security
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * System prompt for the municipality AI agent
 * Instructs the AI to act as a helpful municipality representative
 */
const SYSTEM_PROMPT = `You are a professional and empathetic AI Agent representing the Municipal Corporation.

## YOUR CONVERSATION FLOW:
1. **First Message (Greeting):** Start with a warm greeting and ask what civic issue they want to report.
2. **When User Reports Issue:** 
   - Acknowledge their concern with empathy
   - Ask for ESSENTIAL DETAILS in a natural conversational way:
     * Location: "Where exactly is this?" (street name, landmark, ward if known)
     * Issue Type: Identify category (pothole, garbage, streetlight, water, sewage, electricity, etc)
     * Duration: "How long has this been an issue?"
     * Impact: "Who/what is affected?" (safety hazard, traffic, drainage, etc)
     * Phone Number: "Can I get your contact number to send you updates?" (for ticket confirmation)
   - Mention document upload: "If you have any photos or documents showing the issue, you can upload them"
   - DO NOT generate ticket yet - wait for sufficient information

3. **After Gathering Info:**
   - Summarize their complaint with all collected details
   - Provide severity assessment (Low/Medium/High/Critical) based on:
     * Impact (affects one person vs many)
     * Safety hazard (yes/no)
     * Duration (recent vs chronic)
   - Give realistic resolution timeline based on severity
   - CONFIRM before registering: "Should I go ahead and register this complaint?"
   - On confirmation, indicate: "I'll generate your complaint ticket number"
   - IMPORTANT: Say something like "I will send your complaint number to your WhatsApp"

4. **Out of Scope Questions:** If user asks about non-civic topics, politely redirect them.

## ESSENTIAL INFORMATION TO COLLECT:
- Location (street, landmark, ward)
- Category (pothole, garbage, streetlight, water, sewage, electricity, traffic, parking, etc)
- Issue description (what, why, impact)
- Duration (how long has it been)
- Citizen phone number (for WhatsApp notification)
- Severity level (based on impact and safety)
- Encouraged: Photo/document upload

## IMPORTANT GUIDELINES:
- **Ask for phone number in a natural way**, e.g., "Can I get your contact number to send you updates?"
- **Collect complete info before ticket generation** - location, phone, description are MUST-HAVE
- Be conversational and friendly, not robotic
- Acknowledge the issue severity appropriately
- When severity is HIGH or CRITICAL, emphasize urgency
- Suggest document upload naturally: "Do you have any photos of the issue?"
- ALWAYS confirm details before saying "I'll register this complaint"

## ISSUE CATEGORIES YOU HANDLE:
- Potholes & road damage
- Garbage disposal & cleanliness
- Streetlights & street lighting
- Water supply & drainage
- Sewage & sanitation
- Electricity issues
- Traffic & parking
- Parks & public spaces
- Building code violations
- Noise complaints
- Open drains/sewage overflow
- Stray animals
- Illegal encroachments

## TONE:
Professional, empathetic, solution-focused, conversational. NOT formal or robotic.

## RESPONSE PATTERNS FOR TICKET GENERATION:
When you're ready to generate a ticket, use phrases like:
- "Your complaint is now REGISTERED"
- "Your complaint number is being generated"
- "I will send your ticket to your WhatsApp"
- "Registration complete - ticket details coming to your phone"

## RESPONSE FORMAT:
- Keep responses concise (2-3 sentences per message)
- Use clear language
- Number your questions when asking multiple questions
- End with a clear next action

Always respond in the same language the user uses.`;

/**
 * Send a message to Gemini API and get a response
 * Supports streaming for real-time chat experience
 */
export async function sendMessageToGemini(
  userMessage: string,
  conversationHistory: MessageContent[] = [],
  onChunkReceived?: (chunk: string) => void
): Promise<string> {

  // Build conversation history in Gemini format
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = conversationHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  // Add current user message
  contents.push({
    role: "user" as const,
    parts: [{ text: userMessage }],
  });

  const requestBody: GeminiRequestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.95,
      topK: 40,
    },
  };

  try {
    console.log("[Gemini] Sending message to API...");

  // API key must be provided securely, not hardcoded
  const response = await fetch(`${GEMINI_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Gemini] API Error:", errorData);
      throw new Error(
        `Gemini API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    console.log("[Gemini] Response received");

    // Extract text from response
    const assistantMessage =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't process that. Please try again.";

    // Call the callback with chunks if provided (for streaming effect)
    if (onChunkReceived) {
      // Simulate streaming by sending the full message in chunks
      const chunkSize = 30;
      for (let i = 0; i < assistantMessage.length; i += chunkSize) {
        onChunkReceived(assistantMessage.substring(i, i + chunkSize));
      }
    }

    return assistantMessage;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Gemini] Error:", errorMsg);
    throw error;
  }
}

/**
 * Generate a complaint ticket reference number
 * Format: CITY-DEPT-YYYY-XXXXX (e.g., MUM-CIVIC-2025-00123)
 */
export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 100000);
  return `MUM-CIVIC-${year}-${String(randomNum).padStart(5, "0")}`;
}

/**
 * Format the chat message for display
 * Handles markdown-like formatting
 */
export function formatChatMessage(text: string): string {
  // Convert **text** to bold
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert *text* to italic
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Convert \n to <br />
  text = text.replace(/\n/g, "<br />");

  return text;
}

/**
 * Extract severity level from AI response
 * Returns: Low, Medium, High, Critical
 */
export function extractSeverity(text: string): string {
  const text_lower = text.toLowerCase();
  if (text_lower.includes("critical") || text_lower.includes("emergency")) {
    return "Critical";
  } else if (text_lower.includes("high") || text_lower.includes("urgent")) {
    return "High";
  } else if (text_lower.includes("medium") || text_lower.includes("moderate")) {
    return "Medium";
  }
  return "Low";
}

export default {
  sendMessageToGemini,
  generateTicketNumber,
  formatChatMessage,
  extractSeverity,
};
