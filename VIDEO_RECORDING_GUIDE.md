# 🎬 Video Recording & Demo Guide

> **For Devpost Judges**: Step-by-step instructions to create a compelling 5-10 minute demo video showcasing all judging criteria

---

## 📋 Quick Overview

| Criteria | Duration | What to Show |
|----------|----------|--------------|
| Innovation & UX (40%) | 2-3 min | All 3 modes, multimodal interactions |
| Technical Implementation (30%) | 2-3 min | Cloud deployment, error handling, live API calls |
| Demo & Presentation (30%) | 1-2 min | Problem/solution statement + cloud proof |

**Total Duration**: 5-10 minutes  
**Format**: Screen recording + narration (YouTube/Loom linkable)

---

## 🎯 Before You Record

### 1. **Set Up Environment**

```bash
# Ensure everything is running and tested
cd frontend && npm run dev    # Frontend on localhost:5173
cd backend && python server.py # Backend on localhost:8000

# Test all three modes for stability
# Have demo content/screenshots ready
```

### 2. **Prepare System**

- Close unnecessary tabs/notifications
- Increase font size for readability (Devpost judges may watch on smaller screens)
- Test microphone before recording
- Use screen recording tool:
  - **Windows**: OBS Studio (free, high quality)
  - **Mac**: QuickTime + ffmpeg
  - **Web**: Loom.com (easiest, cloud storage)

### 3. **Prepare Demo Scenarios**

- Have test websites ready for Live Navigator
- Write out a story prompt for Live Story Director
- Prepare 2-3 interesting things to say for Live Voice

---

## 🎬 Recording Script (Timestamp-Based)

### **[0:00-0:20] Title Card**

**Narration**:
> "Gemini Live Agent: Multimodal AI that breaks the text box paradigm"

**Visual**:
- Static title slide (can create in any tool)
- Show Devpost challenge badge (optional)

---

### **[0:20-0:50] Problem Statement (30 seconds)**

**Narration**:
> "Today's AI is stuck in a text box. You type → it responds → you type again. But real interaction is multimodal: seeing, hearing, and speaking naturally. Gemini Live Agent solves this by combining real-time voice, screen understanding, and creative content generation in one seamless experience."

**Visual**:
- Show the three mode buttons:
  1. Story Director (purple)
  2. Navigator (green)
  3. Live (blue)
- Highlight glassmorphic UI design
- Pan across responsive mobile layout

---

### **[0:50-1:50] Demo: Live Voice Conversation (1 minute)**

**Narration**:
> "First, real-time audio conversation. Press Connect, and you can speak naturally to Gemini with no latency, hearing responses instantly."

**Actions** (do these on screen):

1. **[0:50-0:55]** Click "🎙️ Live" button
2. **[0:55-1:00]** Click "Connect" on Live Audio Panel
   - Show connection status changing from gray → green
   - Show audio visualizer component
3. **[1:00-1:05]** Click "Start Recording"
   - **Narration**: "Notice the voice activity detector pulsing green when I speak"
4. **[1:05-1:15]** Say: "Hi Gemini, tell me an interesting fact about quantum computing"
   - Show real-time audio waveform visualization
   - Show "Speaking" indicator pulsing
5. **[1:15-1:40]** Let Gemini respond (audio + text)
   - Narrate what's happening: "Gemini's responding in real-time with audio and text"
   - Show response text appearing in the message area
   - Show audio playing (if available)
   - Show connection quality indicator
6. **[1:40-1:50]** Click "Stop Recording" → show response transcript
   - **Narration**: "All while maintaining real context and natural conversation flow"

**Key Features to Highlight**:
- ✅ Bidirectional audio streaming (no turn-taking delays)
- ✅ Voice Activity Detection (green pulse when speaking)
- ✅ Audio visualizer (live waveform)
- ✅ Text transcription alongside audio
- ✅ Connection quality indicator

---

### **[1:50-3:50] Demo: Live UI Navigator (2 minutes)**

**Narration**:
> "Second, the Live UI Navigator combines voice commands with screen understanding. Ask Gemini to help you interact with any interface."

**Setup** (beforehand):
- Have a moderately complex website loaded (e.g., news site, documentation, etc.)

**Actions**:

1. **[1:50-1:55]** Click "Live Navigation Panel"
   - Show panel components and input areas
2. **[1:55-2:00]** Enter goal: "Help me find the latest news article"
3. **[2:00-2:05]** Click "Start Navigation"
   - Show status changing to "Awaiting input"
4. **[2:05-2:10]** Grant microphone permission (if first time)
5. **[2:10-2:15]** Wait for screen capture prompt / show screen capture permissions
   - **Narration**: "Granting screen capture shows Gemini what you're looking at"
6. **[2:15-2:25]** Say: "I'm looking at the homepage. Where should I click to find the latest news?"
   - Show screen capture indicator (blue pulse)
   - Show microphone waveform
7. **[2:25-2:45]** Display Gemini's response:
   - Recommended actions with coordinates (e.g., "Click at coordinates X: 245, Y: 178")
   - Explanation of why that action helps the goal
   - Show confidence score (if available)
8. **[2:45-3:00]** Follow the recommendation:
   - Click the recommended element
   - Show results (navigated to new page)
   - **Narration**: "Gemini correctly understood screen context and guided me to the solution"
9. **[3:00-3:50]** Repeat once more with different goal
   - Shows reliability and context-awareness

**Key Features to Highlight**:
- ✅ Voice + screen integration (not just text)
- ✅ Contextual understanding (reasons for recommendations)
- ✅ Accurate element location (coordinates)
- ✅ Goal-driven interaction (maintains state)
- ✅ Real-time processing

---

### **[3:50-5:30] Demo: Live Story Director (1m 40s)**

**Narration**:
> "Finally, the Live Story Director generates multimodal stories: text, images, and audio narration, all happening in real-time."

**Actions**:

1. **[3:50-3:55]** Click "Live Story Panel"
2. **[3:55-4:00]** In prompt field, enter: "A robot learning to paint in a futuristic city"
3. **[4:00-4:10]** Click media type options:
   - ✅ Text (enabled)
   - ✅ Image (enabled)
   - ✅ Audio (enabled - show narration toggle)
4. **[4:10-4:15]** Click "Generate Story"
   - Show loading state
5. **[4:15-5:15]** Watch story generation unfold
   - **[4:15-4:35]** First block of text appears (narrate: "Real-time text streaming")
   - **[4:35-4:55]** Image block loads (narrate: "AI-generated visuals appearing")
   - **[4:55-5:15]** Audio narration plays (narrate: "With synthesized voice narration for full immersion")
6. **[5:15-5:30]** Pan through generated story blocks
   - Show interleaved text/image/audio layout
   - **Narration**: "All streamed in real-time, breaking the text-box paradigm completely"

**Key Features to Highlight**:
- ✅ Multimodal output (text + images + audio)
- ✅ Real-time streaming (not waiting for full generation)
- ✅ Interleaved narrative (human-readable flow)
- ✅ Creative content (full story, not fragments)

---

### **[5:30-6:30] Technical Proof (1 minute)**

**Narration**:
> "Behind the scenes, this is powered by Google's Gemini Live API, running on Google Cloud Run with robust error handling and grounding mechanisms."

**Visual**: Show (via screenshots/screen share):

1. **[5:30-5:50]** Show Google Cloud Console
   - Cloud Run service page showing deployed backend
   - Service URL (can truncate for privacy)
   - Active deployment with revision info
   - **Narration**: "Backend is deployed on Google Cloud Run, auto-scaling with demand"

2. **[5:50-6:10]** Show backend logs
   - WebSocket connections
   - Gemini API calls
   - Response times
   - **Narration**: "Real logs showing Gemini API integration in action"

3. **[6:10-6:30]** Show code snippet (optional)
   - [backend/gemini_live.py](backend/gemini_live.py) with `stream_audio_input()` highlighted
   - **Narration**: "Code uses google-genai SDK with async streaming for real-time responsiveness"

---

### **[6:30-7:00] Architecture Overview (30 seconds)**

**Narration**:
> "The architecture connects frontend React app to FastAPI backend via WebSocket, which streams to Gemini Live API. Error handling, reconnection logic, and grounding mechanisms ensure reliability.

**Visual**:
- Show ASCII architecture diagram from README.md
- Or create a simple flow diagram showing:
  ```
  Browser (React)
       ↓ WebSocket bidirectional
  FastAPI Backend
       ↓ Streaming
  Gemini Live API
  ```

---

### **[7:00-7:30] Closing Statement (30 seconds)**

**Narration**:
> "Gemini Live Agent demonstrates three things: first, it breaks the text-box paradigm with true multimodal interaction. Second, it's technically sound—robust error handling, grounding mechanisms, and production-grade cloud deployment. Third, it's ready to go: code is open-source, fully documented, and can be deployed in minutes. Check out [GitHub URL] for more."

**Visual**:
- Show GitHub repository link on screen
- Show Devpost project page link
- Final title: "Gemini Live Agent on Devpost"

---

## 🎥 Recording Tools Comparison

| Tool | Cost | Quality | Ease | Best For |
|------|------|---------|------|----------|
| **OBS Studio** | Free | Excellent | Medium | Windows/detailed control |
| **Loom** | Free tier | Good | Easy | Quick, cloud-stored |
| **QuickTime** | Free | Good | Easy | macOS native |
| **Camtasia** | $$$  | Excellent | Medium | Professional editing |

**Recommendation**: **Loom** for fastest submission (records + links automatically)

---

## 🎙️ Audio Setup Tips

1. **Use headphones** while recording to avoid echo
2. **Speak clearly**, calm pace (judges watch many submissions)
3. **Skip umms/ahs** - edit or re-record section
4. **Background noise**: Record in quiet room
5. **Microphone**: Built-in is fine, USB headset is better

---

## ✂️ Post-Recording Editing (Optional)

**Minimal Edits**:
- Cut long pauses (keep < 10 min total)
- Add captions for accessibility (auto-captions in most tools)
- Add title cards between sections (0:00 title, 0:20 problem, etc.)

**Tools**:
- Loom (built-in editing)
- DaVinci Resolve (free, powerful)
- ffmpeg (command-line, fastest)

---

## ✅ Quality Checklist Before Submitting

- [ ] Video is 5-10 minutes (sweet spot for attention)
- [ ] Audio is clear and audible
- [ ] All three modes demonstrated working live
- [ ] Cloud deployment visible (GCP Console or logs)
- [ ] Problem statement explained in first 30 seconds
- [ ] Solution clearly demonstrated
- [ ] No sensitive data on screen (API keys, personal info)
- [ ] GitHub link visible/mentioned
- [ ] Video is uploaded to public platform (YouTube/Loom)
- [ ] Link is included in Devpost submission

---

## 🚀 Submission Checklist

**Before uploading to Devpost**:

- [ ] Video recorded and uploaded to YouTube/Loom
- [ ] Video link obtained and ready to paste
- [ ] README.md has correct GitHub URL
- [ ] DEPLOYMENT_PROOF.md has screenshots (optional but helpful)
- [ ] All three modes work and tested
- [ ] Backend can handle concurrent connections (test with 2-3 tabs)
- [ ] No console errors in browser (Ctrl+Shift+J)
- [ ] No backend 500 errors (check server logs)
- [ ] Written description emphasizes:
  - Multimodal innovation (See, Hear, Speak)
  - Technical soundness (GenAI SDK, Cloud, error handling)
  - Demo evidence (link to video)

---

## 🎯 Judging Criteria Alignment in Video

**Judges will be looking for**:

| Criteria (Weight) | What They'll See |
|------------------|-----------------|
| **Innovation & UX (40%)** | All 3 modes working smoothly, natural interactions, no awkward pauses |
| **Technical Impl. (30%)** | Cloud Console visible, API calls happening, robust behavior |
| **Demo & Presentation (30%)** | Clear problem/solution statement, working software, professional presentation |

Your video hits all three when it:
1. Opens with problem statement ✅
2. Shows each mode working live ✅
3. Demonstrates Cloud deployment ✅
4. Closes with GitHub/Devpost call-to-action ✅

---

## 💡 Pro Tips

1. **Do multiple takes**: Record once, watch, redo if needed
2. **Leave pauses**: Give judges time to see features (don't speed-run)
3. **Narrate clearly**: Assume judges have no context
4. **Show errors gracefully**: If something goes wrong, explain how you'd handle it
5. **Mention the challenge**: Say "Google Gemini Live Agent Challenge" at least once
6. **End with a call-to-action**: "Check out our GitHub for deployment instructions"

---

## 🤔 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend takes too long | Pre-test locally, have Gemini API key ready |
| Audio seems truncated | Check microphone levels before recording |
| Screen recording is blurry | Increase resolution to 1920x1080 minimum |
| Loom won't upload | Check file size (YouTube has no limit) |
| Can't show GCP Console | Take screenshots beforehand, include as overlay/explanation |

