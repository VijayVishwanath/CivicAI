# 🚀 Quick Start - Municipality AI Agent

**Time to test:** ~2 minutes

## Step 1: Start Dev Server
```powershell
npm run dev
```
Wait for message: `ready in XXX ms`

## Step 2: Open Application
```
http://localhost:8080/
```

## Step 3: Navigate to Chat
Click **"Citizen Chat"** in the sidebar (left panel)

## Step 4: Test with AI Agent

### Tab: "AI Agent"
You should see:
- 💬 Welcome message from the agent
- 📝 Input field at bottom: "Describe your issue..."
- ℹ️ Info panels on the right

### Try typing one of these:

**Example 1 - Pothole:**
```
There's a big pothole on Andheri West road that's blocking traffic for 2 days
```

**Example 2 - Garbage:**
```
Garbage is overflowing near my apartment in Malad, it's been 3 days
```

**Example 3 - Streetlight:**
```
The streetlight near Market Lane is broken and it's very dark at night
```

## Step 5: Watch the Magic ✨

You should see:
1. ⏳ **Loading spinner** ("Agent is thinking...")
2. 💭 **AI response** appears gradually
3. 🎫 **Ticket number** shown (e.g., "MUM-CIVIC-2025-00123")
4. 🏷️ **Severity badge** (Low/Medium/High/Critical)

### Example Response:
```
I understand your concern. A pothole on Andheri West is indeed a traffic hazard...

🎫 Ticket: MUM-CIVIC-2025-00123
🏷️ Severity: High

Expected Resolution: 24-48 hours
Next Steps:
- Officer will inspect within 24 hours
- You'll receive updates via SMS
- Track using ticket number above
```

## Step 6: Continue Conversation

Type follow-up questions:
- "How long will it take to fix?"
- "Can you escalate this?"
- "What's the current status?"

The agent will respond contextually!

## Step 7: View Case Details

Click **"Case History"** tab:
- See your generated ticket number
- View issue description
- Check severity level
- See next steps

## Step 8: Download Chat

Click **download icon** in chat header to save conversation as `.txt` file

---

## 🎯 What You're Testing

✅ **Gemini API Integration** - Real AI responses  
✅ **Auto Ticket Generation** - MUM-CIVIC-2025-XXXXX format  
✅ **Severity Assessment** - Automatic priority detection  
✅ **Chat History** - Full conversation tracking  
✅ **Error Handling** - Graceful failure management  
✅ **UI/UX** - Responsive, user-friendly interface  

---

## 🐛 If Something Goes Wrong

### No response from AI?
1. Check browser console: `F12 → Console`
2. Look for error message
3. Verify `.env.local` has `VITE_GEMINI_API_KEY`
4. Refresh page: `Ctrl+R` or `Cmd+R`

### Chat input frozen?
- Refresh the page
- Clear browser cache
- Restart dev server: `npm run dev`

### Ticket not showing?
- Make sure response contains issue description
- Try a more detailed complaint
- Check browser console for errors

---

## 📱 Feature Checklist

During your testing, verify these work:

- [ ] Welcome message displays
- [ ] Can type in input field
- [ ] Send button works (on Enter or click)
- [ ] AI responds with relevant text
- [ ] Ticket number is generated
- [ ] Severity badge appears (colored)
- [ ] Loading spinner shows while waiting
- [ ] Multiple messages can be sent
- [ ] Conversation history shows all messages
- [ ] Can copy ticket number (button)
- [ ] Can download chat as text file
- [ ] Case History tab works
- [ ] Can switch between tabs

---

## 💡 Pro Tips

- **Be specific:** "Pothole near McDonald's on Marine Drive" → Better response
- **Describe impact:** "Blocking traffic, causing accidents" → Higher priority
- **Mention duration:** "For 3 days" → Faster response
- **Save your ticket:** Screenshot or download for tracking
- **Ask follow-ups:** "What's the update?" → Agent remembers context

---

## 📊 Expected Behavior

| Action | Expected Result |
|--------|-----------------|
| Type complaint | Immediate update in input |
| Press Enter/Send | Message appears on left (blue) |
| AI response | Message appears on right (gray) |
| Scroll | Auto-scrolls to latest message |
| Tab switch | State preserved (can go back) |
| Refresh page | New session, clean chat |

---

## 🔗 Links

- **Chat Page:** `http://localhost:8080/citizen-chat`
- **Documentation:** `GEMINI_AI_AGENT_README.md`
- **Environment:** `.env.local`

---

## ✨ Success Indicators

You'll know it's working when:

✅ AI responds to your complaint within 3 seconds  
✅ Ticket number format: `MUM-CIVIC-2025-XXXXX`  
✅ Severity badge appears (colors: red/orange/yellow/blue)  
✅ No errors in browser console  
✅ Can have multi-turn conversation  
✅ Chat history shows all messages  
✅ Download button works  

---

**Status: 🟢 READY TO TEST**

All systems operational! Start typing your complaint and the AI agent will help! 🤖
