# 🤖 AI Agent Behavior Guide

## Conversation Flow Summary

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  USER VISITS /citizen-chat                              │
│                    ↓                                     │
│  [MESSAGE 1] BOT GREETS                                 │
│  "Hello! I'm the Municipal Services AI Agent..."       │
│  "What issue would you like to report today?"          │
│                    ↓                                     │
│  [MESSAGE 2] USER DESCRIBES ISSUE                       │
│  "There's a pothole on my street"                       │
│                    ↓                                     │
│  [MESSAGE 3] BOT ASKS CLARIFYING QUESTIONS              │
│  ❌ NO TICKET YET                                        │
│  "How long has it been there?"                          │
│  "Is it affecting traffic?"                            │
│  "Any specific location?"                              │
│                    ↓                                     │
│  [MESSAGE 4-5] USER PROVIDES DETAILS                    │
│  User answers questions with more info                 │
│                    ↓                                     │
│  [MESSAGE 5-6] BOT CONFIRMS & GENERATES TICKET          │
│  "Your issue has been REGISTERED"                      │
│  ✅ TICKET: MUM-CIVIC-2025-XXXXX                        │
│  "Expected Resolution: 24-48 hours"                    │
│  "A field officer will be assigned..."                 │
│                    ↓                                     │
│  CASE HISTORY TAB UPDATED                              │
│  User can see ticket + tracking info                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## What Bot Does (NEW)

### ✅ **DOES:**
- Greets user warmly on first message
- Asks 2-3 clarifying questions about the issue
- Listens and acknowledges concerns
- Assesses severity (Low/Medium/High/Critical)
- Generates ticket ONLY after gathering info
- Explains next steps clearly
- Redirects off-topic questions politely

### ❌ **DOES NOT:**
- Generate ticket immediately
- Skip asking clarifying questions
- Show issue details without understanding
- Create multiple tickets for one issue
- Answer non-civic questions in detail
- Make promises about timeline without understanding issue

---

## Ticket Generation Rules

**Ticket is generated when ALL these conditions are met:**

```
1. Bot response contains keywords:
   ✓ "ticket"
   ✓ "registration"
   ✓ "registered"
   ✓ "ticket number"
   
   AND

2. Conversation has at least 5 messages:
   Message 1: Bot greeting
   Message 2: User description
   Message 3: Bot questions
   Message 4: User details
   Message 5: Bot confirmation/summary
```

**Examples:**

❌ NOT Generated (too early):
```
User: "Pothole on my street"
Bot: "Tell me more about it..."
→ No ticket yet
```

✅ Generated (sufficient info):
```
User: "Pothole on Andheri West, near SBI bank, 2 weeks old, affecting traffic"
Bot: "I've registered your complaint. Ticket: MUM-CIVIC-2025-12345. Expected resolution: 24-48 hours."
→ Ticket generated!
```

---

## Out-of-Scope Handling

**When user asks non-civic question:**

```
User: "What's the weather?"
      OR "Tell me about politics"
      OR "How old are you?"

Bot Response Pattern:
1. Brief acknowledgment
2. Redirect to civic services
3. Offer help with civic issue

Example:
"I don't have weather information, but I'm specifically designed 
to help with civic issues like potholes, garbage, water, electricity, etc. 
Is there a civic issue I can help you with?"

→ NO TICKET generated
→ Conversation continues on civic issues
```

---

## Response Examples

### Example 1: Good Conversation Flow

```
USER (Message 2):
"There's garbage piling up on my street"

BOT (Message 3):
"I understand your concern about the garbage pile-up. This is important 
for neighborhood cleanliness.

Let me ask a few questions:
1. How long has the garbage been accumulating?
2. Is it near a residential area or commercial area?
3. Is it blocking the street or affecting traffic?"

[NO TICKET]

---

USER (Message 4):
"It's been there for a week, near the park, yes it's blocking pedestrians"

BOT (Message 5):
"Thank you for those details. This is a safety hazard that needs 
immediate attention. Given the location and duration, I'm marking 
this as HIGH priority.

Your complaint has been REGISTERED:
📋 Ticket Number: MUM-CIVIC-2025-45678
🚨 Priority: HIGH
⏱️ Expected Resolution: 12-24 hours
👤 Action: Sanitation team will visit within 24 hours

You can track your complaint using your ticket number."

[TICKET GENERATED]
```

### Example 2: Off-Topic Handling

```
USER (Message 2):
"Are you an AI?"

BOT (Message 3):
"Yes, I'm an AI Agent designed to help with civic issues. 

I specialize in helping with complaints like:
• Potholes and road damage
• Garbage disposal
• Streetlights
• Water supply issues
• Electricity problems
• And more...

Is there a civic issue in your area I can help you report?"

[NO TICKET]
```

### Example 3: Multiple Issues

```
USER (Message 2):
"There's a pothole AND a broken streetlight on my street"

BOT (Message 3):
"I see you have two issues. Let me help you with both.

To prioritize and create separate tickets:
1. Which is more urgent - the pothole (safety hazard) or streetlight (evening safety)?
2. Are they at the same location or different locations?

Let's address them one by one for better tracking."

[NO TICKET YET]
```

---

## Configuration (For Developers)

**To change bot behavior, edit `src/lib/gemini.ts`:**

```typescript
const SYSTEM_PROMPT = `
  // Change greeting style here
  // Change number of clarifying questions
  // Change issue categories
  // Change severity assessment
`;

// Rebuild:
// npm run build
// npm run dev
```

**To change ticket generation timing, edit `src/components/CitizenChatAI.tsx`:**

```typescript
const shouldGenerateTicket = 
  (responseText.includes("ticket") || ...) &&
  messages.length > 5;  // ← Change 5 to different number
```

---

## Testing Checklist

- [ ] Bot greets with friendly message
- [ ] Bot asks clarifying questions (not immediate ticket)
- [ ] After 5+ messages, ticket appears
- [ ] Ticket shows in "Case History" tab
- [ ] Out-of-topic question gets redirected
- [ ] No duplicate messages in chat
- [ ] Severity badge appears with ticket
- [ ] Can copy ticket number
- [ ] Can download chat history

---

## Expected Timeline

1. **Message 1:** Bot loads with greeting (instant)
2. **Message 2:** User types and submits issue
3. **Message 3:** Bot responds with questions (2-3 sec)
4. **Message 4:** User provides details
5. **Message 5:** Bot asks 1-2 more questions (2-3 sec)
6. **Message 6:** User confirms/adds info
7. **Message 7:** Bot generates ticket! (2-3 sec)

**Total time:** ~15-30 seconds of actual responses (+ user thinking time)

---

## Troubleshooting

### Problem: Bot showing ticket immediately
**Solution:** Clear cache, restart dev server
```
Ctrl+Shift+Delete  → Clear cache
npm run dev        → Restart
```

### Problem: Bot not asking questions
**Solution:** Check system prompt in gemini.ts
```
Should include: "Ask 2-3 clarifying questions"
Rebuild: npm run build
```

### Problem: Off-topic questions not redirected
**Solution:** System prompt needs update
```
Add: "If user asks about non-civic topics, redirect..."
Rebuild: npm run build
```

### Problem: Duplicate messages
**Solution:** Already fixed! Message appending is now simple.
```
Current: setMessages(prev => [...prev, assistantMessage])
(Clean and reliable)
```

---

## Key Files Modified

1. **`src/lib/gemini.ts`**
   - Updated system prompt (conversation flow)
   - Handles API communication

2. **`src/components/CitizenChatAI.tsx`**
   - Smart ticket generation logic
   - Simplified message appending
   - Updated welcome message

3. **`.env.local`**
   - Contains VITE_GEMINI_API_KEY (unchanged)

---

## Status: ✅ READY FOR TESTING

Build successful | 0 errors | Production ready

**Start testing:** `npm run dev` → `http://localhost:8080/citizen-chat`

