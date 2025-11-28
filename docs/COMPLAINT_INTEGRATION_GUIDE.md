# Complaint Registration Feature - Integration Guide

## Overview

The complaint registration feature allows citizens to:
1. Chat with AI Agent to report civic issues
2. Upload documents/photos of the problem
3. Provide contact details (phone number)
4. Auto-register complaint with ticket generation
5. Receive confirmation via WhatsApp

## Component Architecture

### Core Files Created

```
src/
├── lib/
│   ├── types.ts (110 lines) - Type definitions
│   ├── complaintService.ts (260 lines) - Business logic
│   └── whatsappService.ts (240 lines) - WhatsApp integration
├── components/
│   ├── DocumentUpload.tsx (280 lines) - File upload UI
│   └── CitizenChatAI_v2.tsx (NEW - Integration version)
```

## Feature Workflow

```
┌─────────────────────────────────────────────────┐
│  1. Chat Starts (Welcome Message)               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  2. AI Agent Asks Clarifying Questions          │
│     - Location of issue                         │
│     - Type of issue                             │
│     - Severity                                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  3. AI Requests Contact Details                 │
│     - Phone number                              │
│     - Any additional information                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  4. Document Upload Available                   │
│     - Citizens can attach photos/docs           │
│     - Optional but encouraged                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  5. AI Confirms Details + Registration          │
│     - Shows summary                             │
│     - Asks for confirmation                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  6. Complaint Registration                      │
│     - Calls /api/complaints/register            │
│     - Generates ticket MUM-CIVIC-2025-XXXXX    │
│     - Stores documents + metadata               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  7. WhatsApp Notification                       │
│     - Sends ticket number                       │
│     - Sends complaint summary                   │
│     - Includes next steps                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  8. Chat Shows Success                          │
│     - Displays ticket number                    │
│     - Shows WhatsApp sent confirmation          │
└─────────────────────────────────────────────────┘
```

## Implementation Details

### CitizenChatAI_v2 Component Structure

**State Management:**
```typescript
interface CollectedData {
  phone?: string;
  location?: string;
  category?: string;
  description?: string;
  severity?: string;
  documents: DocumentFile[];
}

type RegistrationPhase = "chatting" | "collecting" | "confirm" | "registered"
```

**Key Functions:**

#### 1. `handleSendMessage()`
- Takes user input
- Extracts phone numbers using regex
- Calls Gemini API for response
- Detects when to show document upload
- Detects when to show confirmation

```typescript
// Triggers document upload if:
// - Response indicates readiness
// - No documents uploaded yet
// - Not in registration phase yet

// Triggers confirmation if:
// - Message count > 5
// - Phone number collected
// - AI response includes registration keywords
```

#### 2. `handleDocumentsChange()`
- Receives DocumentFile[] from DocumentUpload component
- Stores documents in collectedData state
- Documents include base64 content for API transmission

#### 3. `handleRegisterComplaint()`
- Validates phone number exists
- Builds ComplaintData object with all collected info
- Calls `registerComplaint()` service
- Sends WhatsApp via `sendComplaintViaWhatsApp()`
- Displays success message with ticket

### Data Flow

```
User Input (Chat)
        ↓
[Extract: phone, location, category]
        ↓
Call Gemini API → Get Response
        ↓
[Detect: should_register, ready_for_documents]
        ↓
Show DocumentUpload? → Yes → User uploads files
                      No  → Continue chat
        ↓
Ready to register? → Yes → Show confirmation dialog
                   → No  → Wait for more messages
        ↓
User clicks "Register" → Collect all data
        ↓
Call registerComplaint() API
        ↓
Success? → Generate/receive ticket number
        ↓
Call sendComplaintViaWhatsApp()
        ↓
Show success message in chat
```

## API Integration Points

### Required Backend APIs

#### 1. POST /api/complaints/register
**Request:**
```json
{
  "citizenDetails": {
    "phone": "+919876543210",
    "email": "citizen@email.com",
    "name": "John Doe",
    "ward": "Ward 12",
    "locality": "Downtown"
  },
  "location": "Near Market Square",
  "category": "Pothole",
  "description": "Large pothole on Main Street",
  "severity": "High",
  "documents": [
    {
      "name": "photo.jpg",
      "type": "image/jpeg",
      "size": 245678,
      "base64": "data:image/jpeg;base64,..."
    }
  ],
  "status": "Submitted",
  "conversationHistory": "user: hello\nassistant: Hi there..."
}
```

**Response:**
```json
{
  "success": true,
  "ticketNumber": "MUM-CIVIC-2025-001234",
  "complaintId": "uuid-here",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### 2. POST /api/whatsapp/send
**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "ticketNumber": "MUM-CIVIC-2025-001234",
  "complaintDetails": {
    "location": "Near Market Square",
    "category": "Pothole",
    "description": "Large pothole on Main Street",
    "severity": "High",
    "estimatedTime": "24-48 hours"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "wamsg-uuid",
  "status": "sent",
  "timestamp": "2025-01-15T10:30:30Z"
}
```

### Environment Variables

Add to `.env.local`:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

## UI Components Used

### Document Upload Component
```typescript
<DocumentUpload
  onDocumentsChange={handleDocumentsChange}
  maxFiles={5}
  maxFileSize={5 * 1024 * 1024} // 5MB
  acceptedFormats={["image/jpeg", "image/png", "application/pdf"]}
/>
```

**Features:**
- Drag-and-drop upload
- File validation (size, type, count)
- Image preview thumbnails
- Progress tracking per file
- Error messages with reasons
- Base64 encoding for API transmission

### Ticket Display
```typescript
{message.ticketNumber && (
  <Card className="border-green-200 bg-green-50">
    {/* Displays ticket, severity, copy button */}
  </Card>
)}
```

### Registration Confirmation
```typescript
{message.showRegistrationConfirm && (
  <Card>
    <CardHeader>
      <CardTitle>Confirm Complaint Details</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Phone, documents count, register button */}
    </CardContent>
  </Card>
)}
```

## Usage Instructions

### 1. Import Component
```typescript
import CitizenChatAI_v2 from "@/components/CitizenChatAI_v2";

// In your page
<CitizenChatAI_v2
  locationContext="Ward 12, Downtown"
  categoryContext="Infrastructure"
  caseContext="Pothole on Main Street"
  onCaseCreated={(caseData) => {
    console.log("Case created:", caseData);
    // Update parent component
  }}
/>
```

### 2. Props
| Prop | Type | Description |
|------|------|-------------|
| `locationContext` | string | Pre-fill location |
| `categoryContext` | string | Pre-fill category |
| `caseContext` | string | Pre-fill case description |
| `onCaseCreated` | function | Callback when complaint registered |

### 3. Extracted Data
All data is automatically extracted from conversation:
- **Phone Number**: Regex pattern `(\+?91\|0)?[6-9]\d{9}`
- **Location**: Any phrase containing "near", "at", or provided context
- **Category**: Keywords (pothole, garbage, water, etc.)
- **Severity**: AI-based analysis (Critical, High, Medium, Low)

## Error Handling

### Common Scenarios

**Missing Phone Number:**
```typescript
if (!collectedData.phone) {
  setApiError("Phone number is required");
  return;
}
```

**API Failure:**
```typescript
try {
  const response = await registerComplaint(complaintData);
  if (!response.success) {
    throw new Error(response.error);
  }
} catch (error) {
  setApiError(error.message);
}
```

**WhatsApp Send Failure:**
- Component shows error but doesn't block
- Complaint still registered in system
- User can retry sending WhatsApp

## Testing Checklist

- [ ] Chat loads with welcome message
- [ ] User can type and send messages
- [ ] AI Agent responds contextually
- [ ] Document upload UI appears at right time
- [ ] Documents can be dragged/dropped and selected
- [ ] Phone number is extracted from conversation
- [ ] Confirmation dialog shows collected data
- [ ] Register button calls API
- [ ] Ticket number displays in green card
- [ ] Copy button works on ticket number
- [ ] Ticket number sent to phone via WhatsApp
- [ ] Success message shows all details
- [ ] Chat can be downloaded as text file

## Integration with SubmitCase

To use from SubmitCase page:

```typescript
// In SubmitCase.tsx
import CitizenChatAI_v2 from "@/components/CitizenChatAI_v2";

export default function SubmitCase() {
  return (
    <div>
      <CitizenChatAI_v2
        categoryContext={selectedCategory}
        locationContext={selectedLocation}
        onCaseCreated={(caseData) => {
          // Redirect or show success
          navigate(`/case/${caseData.ticketNumber}`);
        }}
      />
    </div>
  );
}
```

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Features Used:**
- FileReader API (for base64 encoding)
- Blob API (for file downloads)
- Clipboard API (for copying ticket)
- Fetch API (for HTTP requests)

## Performance Considerations

### Optimizations
1. **Lazy Loading**: Messages stream in as they're received
2. **Auto-scroll**: Only on new messages, not during parsing
3. **Debounced Extraction**: Phone/location extraction on send only
4. **Streaming Response**: Gemini response streams character-by-character

### Bundle Impact
- CitizenChatAI_v2: ~15KB
- DocumentUpload: ~8KB
- Services (complaint + whatsapp): ~12KB
- **Total**: ~35KB (gzipped ~9KB)

## Troubleshooting

### Issue: Phone number not detected
**Solution:** Ensure phone number is in message without special characters before digits

### Issue: Documents not uploading
**Solution:** Check file size limits (default 5MB), file type (JPEG/PNG/PDF)

### Issue: WhatsApp not sending
**Solution:** Verify backend /api/whatsapp/send endpoint is implemented and accessible

### Issue: Ticket not generating
**Solution:** Check /api/complaints/register returns `ticketNumber` in response

## Next Steps

1. **Implement Backend APIs**
   - POST /api/complaints/register
   - POST /api/whatsapp/send
   - Database schema for complaints

2. **Add WhatsApp Integration**
   - Set up Twilio account
   - Configure WhatsApp business account
   - Implement WhatsApp message templates

3. **Add Case Status Tracking**
   - GET /api/complaints/status/:ticketNumber
   - Real-time updates via WebSocket or polling
   - Status history in chat

4. **Enhance AI Agent**
   - Multi-language support
   - Image recognition for categories
   - Automatic photo classification

## Documentation Files

Related documentation:
- `AI_AGENT_FIX_SUMMARY.md` - AI Agent fixes
- `types.ts` - Type definitions
- `complaintService.ts` - Service layer
- `whatsappService.ts` - WhatsApp integration
- `DocumentUpload.tsx` - File upload component
