# 🎨 AI Agent Conversation Flow - Visual Guide

---

## 📊 Complete Conversation Flowchart

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║                    USER VISITS /citizen-chat                               ║
║                            ↓                                                ║
║                                                                             ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │ PHASE 1: GREETING (Message 1)                                       │   ║
║  ├─────────────────────────────────────────────────────────────────────┤   ║
║  │ BOT MESSAGE:                                                         │   ║
║  │ "👋 Hello! I'm the Municipal Services AI Agent.                     │   ║
║  │  I'm here to help you report and track civic issues in your area.   │   ║
║  │  Whether it's a pothole, garbage problem, streetlight issue...      │   ║
║  │  What issue would you like to report today?"                        │   ║
║  │                                                                      │   ║
║  │ TICKET STATUS: ❌ NONE                                              │   ║
║  │ ACTION: Waiting for user to describe issue                          │   ║
║  └─────────────────────────────────────────────────────────────────────┘   ║
║                            ↓                                                ║
║                    USER TYPES ISSUE                                        ║
║                            ↓                                                ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │ PHASE 2: INITIAL DESCRIPTION (Message 2)                           │   ║
║  ├─────────────────────────────────────────────────────────────────────┤   ║
║  │ USER MESSAGE:                                                        │   ║
║  │ "There's a big pothole on Andheri West road blocking traffic"       │   ║
║  │                                                                      │   ║
║  │ TICKET STATUS: ❌ NONE                                              │   ║
║  │ ACTION: Bot will ask clarifying questions                           │   ║
║  └─────────────────────────────────────────────────────────────────────┘   ║
║                            ↓                                                ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │ PHASE 3: CLARIFYING QUESTIONS (Message 3)                          │   ║
║  ├─────────────────────────────────────────────────────────────────────┤   ║
║  │ BOT MESSAGE:                                                         │   ║
║  │ "Thank you for reporting this. I understand traffic safety is       │   ║
║  │  important. Let me gather a few more details:                       │   ║
║  │                                                                      │   ║
║  │  1. How long has this pothole been there?                           │   ║
║  │  2. Is it affecting multiple vehicles or just occasionally?         │   ║
║  │  3. Any specific location markers (near shop, intersection, etc)?"   │   ║
║  │                                                                      │   ║
║  │ TICKET STATUS: ❌ NONE                                              │   ║
║  │ ACTION: Waiting for user answers                                    │   ║
║  └─────────────────────────────────────────────────────────────────────┘   ║
║                            ↓                                                ║
║                    USER PROVIDES DETAILS                                   ║
║                            ↓                                                ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │ PHASE 4: INFO GATHERING (Message 4)                                │   ║
║  ├─────────────────────────────────────────────────────────────────────┤   ║
║  │ USER MESSAGE:                                                        │   ║
║  │ "It's been there about 3 weeks. Many cars slow down and swerve.    │   ║
║  │  It's near the SBI bank on Andheri West."                           │   ║
║  │                                                                      │   ║
║  │ TICKET STATUS: ❌ NONE                                              │   ║
║  │ ACTION: Bot will acknowledge and may ask final clarification        │   ║
║  └─────────────────────────────────────────────────────────────────────┘   ║
║                            ↓                                                ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │ PHASE 5: SUMMARY & TICKET (Message 5-6)                            │   ║
║  ├─────────────────────────────────────────────────────────────────────┤   ║
║  │ BOT MESSAGE:                                                         │   ║
║  │ "Perfect. I've documented the following:                            │   ║
║  │                                                                      │   ║
║  │  📍 LOCATION: Andheri West, near SBI bank                           │   ║
║  │  ⏰ DURATION: 3 weeks                                               │   ║
║  │  🚗 IMPACT: Multiple vehicles affected daily                        │   ║
║  │  🔴 SEVERITY: HIGH                                                  │   ║
║  │                                                                      │   ║
║  │  Your complaint has been REGISTERED.                                │   ║
║  │                                                                      │   ║
║  │  🎫 TICKET NUMBER: MUM-CIVIC-2025-47391                             │   ║
║  │  ⏱️  EXPECTED RESOLUTION: 24-48 hours                              │   ║
║  │  👤 NEXT ACTION: A field officer will be assigned within 24 hours   │   ║
║  │  📱 UPDATE: You'll receive an SMS update at each stage              │   ║
║  │                                                                      │   ║
║  │  Thank you for keeping Mumbai safe!"                                │   ║
║  │                                                                      │   ║
║  │ TICKET STATUS: ✅ GENERATED!                                        │   ║
║  │ TICKET NUMBER: MUM-CIVIC-2025-47391                                 │   ║
║  │ SEVERITY: HIGH (🔴 Red Badge)                                       │   ║
║  │ ACTION: Case History tab updated                                    │   ║
║  └─────────────────────────────────────────────────────────────────────┘   ║
║                            ↓                                                ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │ CASE HISTORY TAB NOW SHOWS:                                         │   ║
║  ├─────────────────────────────────────────────────────────────────────┤   ║
║  │ ✓ Your Case Report                                                  │   ║
║  │ ✓ Ticket: MUM-CIVIC-2025-47391                                      │   ║
║  │ ✓ Location: Not specified (user didn't fill form)                   │   ║
║  │ ✓ Category: (auto-detected from issue)                              │   ║
║  │ ✓ Issue Description: Pothole details from chat                      │   ║
║  │ ✓ Severity Badge: HIGH 🔴                                           │   ║
║  │ ✓ Next Steps listed                                                 │   ║
║  │ ✓ Tracking Information visible                                      │   ║
║  │ ✓ Status: Registered                                                │   ║
║  │ ✓ Priority: High                                                    │   ║
║  └─────────────────────────────────────────────────────────────────────┘   ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 Message Count vs Ticket Generation

```
Message #  | Sender | Content                      | Ticket Status
-----------|--------|------------------------------|---------------
1          | BOT    | Greeting                     | ❌ None
2          | USER   | Describes issue              | ❌ None
3          | BOT    | Asks clarifying questions    | ❌ None
4          | USER   | Provides details             | ❌ None
5          | BOT    | Acknowledges, asks more      | ❌ None (at 5)
6          | USER   | Additional info or confirms  | ✅ GENERATED!
           |        |                              | (when bot says
           |        |                              |  "registered")
```

**Key:** Ticket only generates when:
- Message count ≥ 5 AND
- Bot response contains "ticket" / "registered" / "ticket number"

---

## 🔄 Different Scenarios

### Scenario 1: Normal Civic Issue ✅

```
┌─ USER: "Pothole on my street"
│  ↓
├─ BOT: "Tell me more... how long? affecting traffic?"
│  ↓
├─ USER: "3 weeks, blocking traffic near market"
│  ↓
├─ BOT: "Got it... your complaint is registered"
│  ↓
└─ ✅ TICKET GENERATED: MUM-CIVIC-2025-XXXXX
```

### Scenario 2: Out-of-Scope Question ❌

```
┌─ USER: "What's your favorite food?"
│  ↓
├─ BOT: "I don't have food preferences, but I'm here
│         to help with civic issues like potholes,
│         garbage, water problems. Do you have one?"
│  ↓
├─ USER: "Actually, my water pipe burst"
│  ↓
├─ BOT: (starts gathering info on water issue)
│  ↓
└─ ✅ TICKET GENERATED (after sufficient info)
```

### Scenario 3: Multiple Issues 📋

```
┌─ USER: "Pothole AND broken streetlight on my street"
│  ↓
├─ BOT: "I can help with both. Which is more urgent
│         for your safety?"
│  ↓
├─ USER: "The pothole, it's blocking traffic"
│  ↓
├─ BOT: (gathers details on pothole first)
│  ↓
├─ BOT: "Pothole registered. Want to report the 
│         streetlight now?"
│  ↓
└─ ✅ TICKET GENERATED: MUM-CIVIC-2025-XXXXX (pothole)
   ✅ TICKET GENERATED: MUM-CIVIC-2025-XXXXY (light)
```

---

## 🧠 Bot Decision Tree

```
                    USER SENDS MESSAGE
                           │
                           ↓
                    [Count Messages]
                           │
                    ┌──────┴──────┐
                    │             │
                < 5 msgs      ≥ 5 msgs
                    │             │
              [No Ticket]    [Check Response]
              [Ask Questions]     │
                    │      ┌──────┴──────────────┐
                    │      │                     │
              Return   Contains "ticket",   Doesn't contain
              Message   "registered",          keywords
                        "ticket number"?        │
                        │                    [No Ticket]
                        ├─ YES                  │
                        │  ↓                 Return Message
                    [GENERATE TICKET]
                    [Show Ticket #]
                    [Update Case History]
                    [Return Message + Ticket]
```

---

## 📱 UI Changes During Conversation

### Initial State (Page Load)
```
┌─────────────────────────────────┐
│ AI Agent        Case History    │
├─────────────────────────────────┤
│                                 │
│ 👋 Hello! I'm Municipal...      │
│                                 │
│ What issue would you like...    │
│                                 │
│ [________________]  [Send]      │
│                                 │
└─────────────────────────────────┘
```

### After Issue Description
```
┌─────────────────────────────────┐
│ AI Agent        Case History    │
├─────────────────────────────────┤
│                                 │
│ 👋 Hello! I'm Municipal...      │
│                                 │
│ YOU: There's a pothole...       │
│                                 │
│ BOT: Thank you! Tell me more... │
│ 1. How long?                    │
│ 2. Affecting traffic?           │
│                                 │
│ [________________]  [Send]      │
│                                 │
└─────────────────────────────────┘
```

### After Ticket Generated ✅
```
┌─────────────────────────────────┐
│ AI Agent        Case History    │
├─────────────────────────────────┤
│                                 │
│ BOT: ...registered...           │
│ 🎫 Ticket: MUM-CIVIC-2025-###   │
│ 🔴 Priority: HIGH               │
│                                 │
│ [Case History Button Highlighted]
│                                 │
│ [________________]  [Send]      │
│                                 │
└─────────────────────────────────┘
      ↓ Click Case History
┌─────────────────────────────────┐
│ AI Agent        Case History ✓  │
├─────────────────────────────────┤
│                                 │
│ Your Case Report                │
│ Ticket: MUM-CIVIC-2025-###      │
│ 🔴 Priority: HIGH               │
│ Status: Registered              │
│ Location: Not specified         │
│ Description: Pothole details    │
│ Next Steps: Officer will be...  │
│                                 │
└─────────────────────────────────┘
```

---

## 📊 Ticket Generation Timeline

```
Timeline:  0s        5s        10s       15s       20s
           │         │         │         │         │
Message 1: BOT GREETS
Message 2:           USER TYPES & SENDS
           │                          
Response:                             BOT RESPONDS (2-3s)
                                       │
Message 3:                             ✅ RECEIVED
                                       ❌ NO TICKET
           │                  │
Message 4:                    USER TYPES DETAILS
           │                            │
Response:                               BOT RESPONDS (2-3s)
                                        │
Message 5:                              ✅ RECEIVED
                                        ❌ STILL NO TICKET
           │         │         │        │         │
Message 6:          USER PROVIDES FINAL INFO
           │                            │
Response:                               BOT RESPONDS (2-3s)
                                        │
Message 7:                              ✅ RECEIVED
           │         │         │        │         │ ✅ TICKET!
           ├──────────────────────────────────────┤
           Total time: ~20-30 seconds (+ user thinking)
```

---

## 🎫 Ticket Generation Conditions

```
CONDITION 1: Response Keywords
─────────────────────────────
BOT Response must contain ONE of:
  • "ticket"
  • "registration"
  • "registered"
  • "ticket number"
  • "your reference"

Example responses that trigger:
✅ "Your complaint has been registered"
✅ "Ticket number: MUM-CIVIC-2025-XXXXX"
✅ "Your issue is now registered in our system"
✅ "Here's your reference number"

Example responses that DON'T trigger:
❌ "Tell me more about this..."
❌ "Thank you for reporting. How long has this...?"
❌ "I understand your concern..."


CONDITION 2: Conversation Length
──────────────────────────────────
Total messages in chat must be ≥ 5:

Message 1: BOT greeting
Message 2: USER description
Message 3: BOT questions
Message 4: USER details
Message 5: BOT response (might not trigger yet)
Message 6: USER more info
Message 7: BOT with "registered" → ✅ TRIGGER!

Both conditions must be TRUE:
  Keyword Match AND Message Count ≥ 5
```

---

## 🎯 Expected Behavior Matrix

```
User Input              | Bot Should Do              | Ticket?
─────────────────────────────────────────────────────────────────
"Hi"                   | Greet back, ask issue      | ❌
"Pothole on street"    | Acknowledge, ask questions | ❌
"Near market, 2 weeks" | Ask about impact           | ❌
"Yes, affecting cars"  | Summarize, assess severity | ❌
"Fix it please"        | Register + provide ticket  | ✅
─────────────────────────────────────────────────────────────────
"What's the weather"   | Brief answer, redirect     | ❌
"How old are you"      | Redirect to civic issues   | ❌
"Tell me a joke"       | Redirect to civic issues   | ❌
─────────────────────────────────────────────────────────────────
"Two potholes"         | Ask which is urgent        | ❌
"The first one"        | Gather info on first       | ✅ (1st)
"Report second too"    | Gather info on second      | ✅ (2nd)
─────────────────────────────────────────────────────────────────
```

---

## 🔍 Code Flow Diagram

```
USER SENDS MESSAGE
        │
        ↓
ADD TO CHAT DISPLAY
        │
        ↓
SET LOADING = TRUE
        │
        ↓
CALL sendMessageToGemini()
        │
        ├─ SEND: Message + History
        ├─ SEND: System Prompt (conversation flow)
        ├─ RECEIVE: AI Response (2-3s)
        │
        ↓
EXTRACT SEVERITY (if ticket)
        │
        ↓
CHECK: "ticket"/"registered" in response
        AND messages.length ≥ 5
        │
        ├─ YES: shouldGenerateTicket = TRUE
        │  ├─ generateTicketNumber()
        │  ├─ onCaseCreated callback
        │  ├─ Update Case History
        │  └─ Display ticket in message
        │
        └─ NO: shouldGenerateTicket = FALSE
           └─ Display response without ticket
        │
        ↓
APPEND MESSAGE TO CHAT
        │
        ↓
AUTO-SCROLL TO LATEST
        │
        ↓
SET LOADING = FALSE
        │
        ↓
READY FOR NEXT MESSAGE
```

---

## ✨ Summary

**Old Flow (Broken):**
```
User → Greeting → Ticket (wrong!)
```

**New Flow (Fixed):**
```
User → Greet → Ask Questions → Gather Info → Generate Ticket
```

**Key Improvement:**
- Conversation flows naturally
- Bot asks clarifying questions
- Ticket generated at right time
- Better issue resolution
- More professional experience

---

**Ready to Test!** 🚀

`npm run dev` → `http://localhost:8080/citizen-chat`

