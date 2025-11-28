# 🎨 Visual Implementation & Code Flow Guide

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CITIZEN CHAT INTERFACE                      │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
                    ┌─────────────────────────┐
                    │   CitizenChatAI_v2.tsx  │
                    │   (Main Component)      │
                    └─────────────────────────┘
                                 ↓
        ┌────────────────────────┼────────────────────────┐
        ↓                        ↓                        ↓
  ┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
  │ Gemini API   │      │ Document     │      │ Complaint        │
  │ (Chat)       │      │ Upload.tsx   │      │ Service.ts       │
  │              │      │ (UI)         │      │ (Business Logic) │
  └──────────────┘      └──────────────┘      └──────────────────┘
        ↓                        ↓                        ↓
        │                        │              ┌──────────────────┐
        │                        │              │ WhatsApp         │
        │                        │              │ Service.ts       │
        │                        │              │ (Notifications)  │
        │                        │              └──────────────────┘
        └────────────────────────┼─────────────────────────┘
                                 ↓
        ┌────────────────────────────────────────────────┐
        │         Backend APIs (To Implement)             │
        │                                                │
        │ POST /api/complaints/register                  │
        │ POST /api/whatsapp/send                        │
        │ GET  /api/complaints/status/:id                │
        └────────────────────────────────────────────────┘
                                 ↓
        ┌────────────────────────────────────────────────┐
        │              Database / Services                │
        │                                                │
        │ • Store complaints with documents              │
        │ • Generate/track ticket numbers                │
        │ • Send WhatsApp messages                       │
        │ • Log conversation history                     │
        └────────────────────────────────────────────────┘
```

## State Management Flow

```typescript
// Initial State
collectedData = {
  phone: undefined,
  location: undefined,
  category: undefined,
  description: undefined,
  severity: undefined,
  documents: []
}

registrationPhase = "chatting"

// Phase 1: Chatting
User: "Hello, I want to report a pothole"
  → Message sent to Gemini
  → Extract: category = "Pothole"
  → Update collectedData
  → registrationPhase = "chatting"

// Phase 2: Collecting Details
User: "It's near market square, my number is 9876543210"
  → Extract: location = "near market square"
  → Extract: phone = "9876543210"
  → Show DocumentUpload component
  → registrationPhase = "collecting"

// Phase 3: Document Upload
User: Drags 2 photos
  → handleDocumentsChange() called
  → Documents stored in collectedData
  → Base64 encoding done automatically

// Phase 4: Confirmation
AI: "Shall I register this complaint?"
  → showRegistrationConfirm = true
  → User clicks "Register Complaint & Send WhatsApp"
  → registrationPhase = "confirm"

// Phase 5: Registration
handleRegisterComplaint()
  → Call registerComplaint(complaintData)
  → Backend returns ticketNumber
  → Call sendComplaintViaWhatsApp(phone, ticketNumber)
  → registrationPhase = "registered"
  → Show success message with ticket
```

## Message Flow Sequence

```
Time    Actor              Action                          UI Update
────────────────────────────────────────────────────────────────────────
T0      System            Initialize chat                 Welcome message
        ChatAI_v2         Show "What issue to report?"

T1      User              Types: "Pothole on main st"    Message appears
                          Clicks send

T2      ChatAI_v2         Extract category = "Pothole"   Loading indicator
        Gemini API        Call with conversation context

T3      Gemini            Returns response with           Chat message
                          "Can you give me your          appears with
                          phone number?"                  streaming text

T4      User              Types: "9876543210"            Message appears
                          Clicks send

T5      ChatAI_v2         Extract phone number           Loading indicator
                          Show DocumentUpload UI

T6      DocumentUpload    Component renders with          Drag-drop zone
                          drag-drop zone                  appears

T7      User              Drags 2 photos                 Photos uploaded
                          Documents encoded to base64    Progress shown

T8      Gemini            Responds "I have all            Message appears
                          details, register?"            with confirmation
                                                         button

T9      User              Clicks "Register Complaint"    Loading...
                          & Send WhatsApp"

T10     ComplaintService  POST /api/complaints/register  Spinner
                          with all data

T11     Backend           Creates complaint record       Still loading
                          Returns ticketNumber

T12     WhatsAppService   POST /api/whatsapp/send        Still loading
                          with ticket + details

T13     Backend           Sends WhatsApp message

T14     ChatAI_v2         Success message with           ✅ Green card
                          ticket displays                with ticket#

T15     System            Fire onCaseCreated callback    Parent updated
```

## Code Implementation Flow

### 1. Component Initialization
```typescript
export default function CitizenChatAI_v2({
  locationContext = "",
  caseContext = "",
  categoryContext = "",
  onCaseCreated,
}: CitizenChatAIProps) {
  // ✅ Initialize state
  const [messages, setMessages] = useState<ChatMessage[]>([...]);
  const [collectedData, setCollectedData] = useState<CollectedData>({
    documents: [],
  });
  const [registrationPhase, setRegistrationPhase] = useState("chatting");

  // ✅ Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ... rest of component
}
```

### 2. Message Sending Handler
```typescript
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();

  // Step 1: Create user message
  const userMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: "user",
    content: inputMessage,
    timestamp: new Date(),
  };
  setMessages((prev) => [...prev, userMessage]);

  // Step 2: Extract data from message
  const extractedPhone = extractPhoneNumber(inputMessage);
  const extractedLocation = extractLocation(inputMessage);
  
  if (extractedPhone) {
    setCollectedData((prev) => ({
      ...prev,
      phone: extractedPhone,
    }));
  }

  // Step 3: Call Gemini API
  const response = await sendMessageToGemini(
    inputMessage,
    messages,
    (chunk) => { /* stream handler */ }
  );

  // Step 4: Analyze response
  const severity = extractSeverity(response);
  const category = identifyCategory(response);

  // Step 5: Check if ready to register
  const shouldRegister =
    (response.includes("registered") || response.includes("confirm")) &&
    collectedData.phone &&
    messages.length > 5;

  // Step 6: Add AI message
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

  setMessages((prev) => [...prev, assistantMessage]);

  // Step 7: Update phase if registering
  if (shouldRegister && !hasTicket) {
    setRegistrationPhase("collecting");
    setHasTicket(true);
  }
};
```

### 3. Document Handling
```typescript
const handleDocumentsChange = (documents: DocumentFile[]) => {
  // Called by DocumentUpload component
  setCollectedData((prev) => ({
    ...prev,
    documents: documents,  // Array with base64 encoded content
  }));
};

// DocumentUpload component returns:
// [
//   {
//     name: "photo.jpg",
//     type: "image/jpeg",
//     size: 245678,
//     base64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
//     preview: "blob:http://localhost:8080/..." (for preview)
//   },
//   { ... }
// ]
```

### 4. Complaint Registration
```typescript
const handleRegisterComplaint = async () => {
  // Step 1: Validate data
  if (!collectedData.phone) {
    setApiError("Phone number is required");
    return;
  }

  setIsLoading(true);

  try {
    // Step 2: Build complaint data
    const complaintData: ComplaintData = {
      citizenDetails: {
        phone: collectedData.phone,
      },
      location: collectedData.location || locationContext,
      category: collectedData.category || categoryContext,
      description: collectedData.description || caseContext,
      severity: collectedData.severity || "Medium",
      documents: collectedData.documents,  // Already base64 encoded
      status: "Submitted",
      createdAt: new Date(),
      conversationHistory: messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n"),
    };

    // Step 3: Call complaint service
    const response = await registerComplaint(complaintData);

    if (!response.success) {
      throw new Error(response.error);
    }

    const ticketNumber = response.ticketNumber || generateTicketNumber();

    // Step 4: Send WhatsApp notification
    await sendComplaintViaWhatsApp(collectedData.phone, ticketNumber, {
      location: complaintData.location,
      category: complaintData.category,
      description: complaintData.description,
      severity: complaintData.severity,
      estimatedTime: "24-48 hours",
    });

    // Step 5: Show success message
    const successMessage: ChatMessage = {
      id: `msg-${Date.now()}-success`,
      role: "assistant",
      content: `✅ *Complaint Successfully Registered!*\n\n🎫 *Ticket Number:* ${ticketNumber}\n...`,
      timestamp: new Date(),
      ticketNumber: ticketNumber,
    };

    setMessages((prev) => [...prev, successMessage]);
    setRegistrationPhase("registered");

    // Step 6: Callback to parent
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
    setApiError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

## Component Hierarchy

```
CitizenChatAI_v2 (Main Container)
│
├─ Header (Gradient blue)
│  ├─ Title: "Municipal Services AI Agent"
│  └─ Subtitle: "Report civic issues and track complaints"
│
├─ Error Alert (if apiError)
│  └─ AlertIcon + error message
│
├─ Messages Area (Scrollable)
│  │
│  └─ ChatMessage (repeats for each message)
│     ├─ User Message (Right aligned, blue)
│     │  └─ Message content + timestamp
│     │
│     └─ Assistant Message (Left aligned, gray)
│        ├─ Message content + timestamp
│        │
│        ├─ Ticket Info Card (if ticketNumber)
│        │  ├─ CheckCircle icon + "Ticket Generated"
│        │  ├─ Ticket number with copy button
│        │  └─ Severity badge
│        │
│        ├─ DocumentUpload Component (if showDocumentUpload)
│        │  ├─ Drag-drop zone
│        │  ├─ File list with previews
│        │  └─ Progress bars
│        │
│        └─ Confirmation Card (if showRegistrationConfirm)
│           ├─ "Confirm Complaint Details" title
│           ├─ Phone number display
│           ├─ Documents count
│           └─ "Register Complaint & Send WhatsApp" button
│
└─ Input Area (Fixed bottom)
   ├─ Input field (flex-1)
   ├─ Send button (blue)
   └─ Download button
```

## UI States Visualization

### State 1: Welcome Message
```
╔════════════════════════════════════════════════════╗
║  Municipal Services AI Agent                       ║
║  Report civic issues and track complaints          ║
╚════════════════════════════════════════════════════╝

┌─ Assistant Message (Left, Gray) ─────────────────┐
│ 👋 Hello! I'm the Municipal Services AI Agent.   │
│                                                   │
│ I'm here to help you report and track civic      │
│ issues in your area.                             │
│                                                   │
│ What issue would you like to report today?       │
│ 2:30 PM                                          │
└───────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ [Input field] [Send] [Download]                  │
└──────────────────────────────────────────────────┘
```

### State 2: With Document Upload
```
┌─ User Message (Right, Blue) ──────────────────────┐
│                                  I want to report  │
│                                  a pothole near    │
│                                  market square     │
│                                           2:31 PM │
└───────────────────────────────────────────────────┘

┌─ Assistant Message (Left, Gray) ─────────────────┐
│ I can help you report this pothole. Do you have   │
│ any photos of the issue?                          │
│ 2:31 PM                                           │
└───────────────────────────────────────────────────┘

┌─ DocumentUpload Component ────────────────────────┐
│                                                   │
│   📁 Drag files here or click to select            │
│                                                   │
│   [Click to browse]                               │
│                                                   │
│   Max 5 files • Max 5MB each                       │
│   Accepted: JPG, PNG, PDF                         │
│                                                   │
│   Files: (none uploaded yet)                      │
│                                                   │
└───────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ [Input field] [Send] [Download]                  │
└──────────────────────────────────────────────────┘
```

### State 3: With Ticket Confirmation
```
┌─ User Message (Right, Blue) ──────────────────────┐
│                            Yes, please register    │
│                            my complaint            │
│                                           2:33 PM │
└───────────────────────────────────────────────────┘

┌─ Assistant Message (Left, Gray) ─────────────────┐
│ Perfect! I have all the information needed.       │
│ Should I go ahead and register this complaint?    │
│ 2:33 PM                                           │
└───────────────────────────────────────────────────┘

┌─ Confirmation Card ───────────────────────────────┐
│ ✅ Confirm Complaint Details                      │
│                                                   │
│ Phone: 9876543210                                 │
│ Documents: 2 files attached                       │
│                                                   │
│ [Register Complaint & Send WhatsApp]              │
│                (green button)                     │
└───────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ [Input field] [Send] [Download]                  │
└──────────────────────────────────────────────────┘
```

### State 4: Success with Ticket
```
┌─ Assistant Message (Left, Green) ───────────────┐
│ ✅ *Complaint Successfully Registered!*          │
│                                                  │
│ 🎫 *Ticket Number:* MUM-CIVIC-2025-001234       │
│ 📱 *Confirmation sent to:* 9876543210           │
│ 📤 *You'll receive WhatsApp updates*            │
│                                                  │
│ Thank you for helping!                           │
│ 2:34 PM                                          │
└──────────────────────────────────────────────────┘

┌─ Ticket Card (Green Border) ───────────────────┐
│ ✅ Ticket Generated                             │
│                                                 │
│ Ticket: [MUM-CIVIC-2025-001234] [Copy]         │
│ Severity: [High]                                │
└─────────────────────────────────────────────────┘
```

## Service Layer Interaction Diagram

```
CitizenChatAI_v2.tsx
    │
    ├─────► complaintService.ts
    │       ├─ registerComplaint()
    │       │  ├─ Validates phone
    │       │  ├─ Formats data
    │       │  ├─ POST /api/complaints/register
    │       │  ├─ Returns { ticketNumber, success }
    │       │  └─ Error handling
    │       │
    │       ├─ validatePhoneNumber()
    │       │  └─ Checks Indian phone format
    │       │
    │       ├─ formatPhoneNumber()
    │       │  └─ Converts to E.164 (+91...)
    │       │
    │       ├─ extractSeverityFromText()
    │       │  └─ Keywords: critical, high, medium, low
    │       │
    │       └─ identifyCategory()
    │           └─ Keywords: pothole, garbage, water, etc.
    │
    ├─────► whatsappService.ts
    │       ├─ sendComplaintViaWhatsApp()
    │       │  ├─ Format phone number
    │       │  ├─ Build message template
    │       │  ├─ POST /api/whatsapp/send
    │       │  └─ Return { success, messageId }
    │       │
    │       ├─ buildComplaintMessage()
    │       │  └─ Template with emoji, formatting
    │       │
    │       └─ sendWhatsAppMessage()
    │           └─ Generic message sender
    │
    ├─────► DocumentUpload.tsx
    │       ├─ File selection (click/drag)
    │       ├─ File validation
    │       ├─ Base64 encoding
    │       ├─ Preview generation
    │       └─ onDocumentsChange callback
    │
    ├─────► gemini.ts
    │       ├─ sendMessageToGemini()
    │       │  ├─ Call Google Gemini API
    │       │  ├─ Stream response
    │       │  └─ Return text
    │       │
    │       ├─ extractSeverity()
    │       │  └─ Parse AI response
    │       │
    │       └─ generateTicketNumber()
    │           └─ Create MUM-CIVIC-2025-XXXXX
    │
    └─────► API (Backend to Implement)
            ├─ POST /api/complaints/register
            ├─ POST /api/whatsapp/send
            └─ GET /api/complaints/status/:id
```

## Type Definitions Used

```typescript
// ComplaintData - sent to backend
{
  citizenDetails: {
    phone: string;
    email?: string;
    name?: string;
    ward?: string;
    locality?: string;
  };
  location: string;
  category: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  documents: DocumentFile[];  // Base64 encoded
  status: "Submitted" | "Assigned" | "In-Progress" | "Resolved";
  createdAt: Date;
  conversationHistory?: string;
}

// DocumentFile - from file upload
{
  name: string;
  type: string;
  size: number;
  base64: string;  // "data:image/jpeg;base64,..."
  preview?: string;  // Blob URL for preview
}

// ChatMessage - internal state
{
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  severity?: string;
  ticketNumber?: string;
  showDocumentUpload?: boolean;
  showRegistrationConfirm?: boolean;
}
```

## Error Handling Flow

```
try {
  registerComplaint(data)
    ↓
  Catch: Phone validation error
    → Show: "Phone number is required"
    → State: Continue chat
    ↓
  Catch: API error
    → Show: "Failed to register complaint: [error]"
    → State: Allow retry
    ↓
  Catch: WhatsApp error
    → Log: Error message
    → Show: "Complaint registered but WhatsApp failed"
    → State: Allow manual WhatsApp sharing
}
catch (error) {
  setApiError(error.message)
}
finally {
  setIsLoading(false)
}
```

## Integration Points Summary

| Component | Input | Output | Status |
|-----------|-------|--------|--------|
| CitizenChatAI_v2 | User text | Chat message, ticket | ✅ Ready |
| DocumentUpload | Files | DocumentFile[] (base64) | ✅ Ready |
| complaintService | Complaint data | Registration response | ✅ Ready |
| whatsappService | Phone + ticket | Send status | ✅ Ready |
| Gemini API | Chat messages | AI response | ✅ Ready |
| Backend APIs | ComplaintData | Ticket number | ⏳ To implement |

---

This visual guide maps out exactly how all components interact and what happens at each step of the complaint registration process.
