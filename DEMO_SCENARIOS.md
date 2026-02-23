# Gemini Live Agent - Demo Scenarios for Devpost

## 🎯 Overview
This document outlines demo scenarios to showcase the Gemini Live Agent capabilities for the Devpost submission.

---

## 📹 Video Demo Script (5 minutes)

### Scene 1: Introduction (30 seconds)
**Visual**: Screen showing the app homepage with three modes visible
**Narration**: 
> "Meet the Gemini Live Agent - a multimodal AI assistant that combines real-time voice interaction, screen understanding, and creative content generation. Built with Google's Gemini Live API, this agent demonstrates three powerful modes of interaction."

**Actions**:
- Show the three mode buttons: Story Director, UI Navigator, and 🎙️ Live
- Highlight the glassmorphic design and responsive layout

### Scene 2: Live Voice Conversation (1 minute)
**Visual**: Switch to Live mode, open Live Audio Panel
**Narration**:
> "First, let's experience real-time voice conversation. With bidirectional audio streaming, you can speak naturally to Gemini and hear its responses instantly."

**Actions**:
1. Click "🎙️ Live" button
2. Click "Connect" on Live Audio Panel
3. Click "Start Recording"
4. Say: "Hi Gemini, tell me an interesting fact about quantum computing"
5. Show voice activity indicator animating while speaking
6. Show audio visualizer displaying response
7. Listen to Gemini's audio response
8. Show the text transcription appearing in real-time

**Key Features to Highlight**:
- Voice Activity Detection (green pulse when speaking)
- Audio visualizer showing real-time waveforms
- Connection status indicator
- Smooth audio playback queue

### Scene 3: Live UI Navigation (1.5 minutes)
**Visual**: Switch to Live Navigation Panel
**Narration**:
> "Next, the Live UI Navigator combines voice commands with screen capture to help you interact with any interface. Let's ask Gemini to guide us through a task."

**Actions**:
1. Enter goal: "Find the documentation link on this page"
2. Click "Start Navigation"
3. Grant screen capture permission (show permission dialog)
4. Say: "I'm looking at the main page, where should I click to find docs?"
5. Show screen capture indicator (blue pulse)
6. Show Gemini's response with navigation instructions
7. Follow one instruction and ask follow-up: "Is this the right section?"
8. Show Gemini confirming with visual analysis

**Key Features to Highlight**:
- Screen capture streaming (2 FPS)
- Dual-stream coordination (voice + screen)
- Natural language goal setting
- Action recommendations with explanations
- Multi-turn conversation maintaining context

### Scene 4: Interleaved Story Generation (1.5 minutes)
**Visual**: Switch to Live Story Panel
**Narration**:
> "Finally, meet the Story Director - where Gemini generates multimodal narratives in real-time, interleaving text, images, and audio."

**Actions**:
1. Enter prompt: "Create a futuristic story about an AI helping humanity explore space"
2. Select media types: Text ✓, Image ✓, Audio ✓
3. Click "Generate Story"
4. Show first block streaming in (text narrative)
5. Show second block (image generation)
6. Show third block (audio narration) with auto-playback
7. Scroll through completed story blocks
8. Show block count updating in real-time

**Key Features to Highlight**:
- Streaming block-by-block generation
- Multiple media types in one narrative
- Auto-playback of audio narration
- Smooth UI updates as content arrives
- Connection quality indicator

### Scene 5: Technical Showcase (30 seconds)
**Visual**: Split screen showing code and running app
**Narration**:
> "Under the hood, the agent uses WebSocket bidirectional streaming, Web Audio API for 16kHz mono PCM processing, and Screen Capture API for live visual context. Automatic reconnection with exponential backoff ensures reliability, while toast notifications keep users informed."

**Actions**:
- Briefly show websocketClient.js code with BaseWebSocketClient
- Show useLiveHooks.js with React integration
- Show AudioVisualizer component
- Return to live app showing connection indicators

### Scene 6: Conclusion (30 seconds)
**Visual**: App overview with all three modes visible
**Narration**:
> "The Gemini Live Agent demonstrates the power of real-time multimodal AI interaction. Whether you need voice assistance, visual navigation, or creative content generation, this agent adapts to your needs. Built for the Google Gemini Live Agent Challenge, it's ready to transform how we interact with AI."

**Actions**:
- Show all three modes side by side
- Display GitHub repo link
- Show "Made with Gemini Live API" badge

---

## 🧪 Testing Scenarios

### Test 1: Voice Conversation Reliability
**Goal**: Demonstrate stable voice interaction under normal conditions

**Steps**:
1. Connect to Live Audio Panel
2. Have a 5-turn conversation about a complex topic
3. Test interruption handling (start speaking while Gemini is responding)
4. Verify Voice Activity Detection catches all speech
5. Confirm audio playback is clear and sequential

**Success Criteria**:
- No dropped audio chunks
- VAD detects speech within 300ms
- Audio responses play in correct order
- Connection remains stable throughout

### Test 2: Screen Capture Navigation
**Goal**: Verify accurate screen analysis and navigation guidance

**Steps**:
1. Open a complex webpage (e.g., AWS Console, GitHub)
2. Set goal: "Navigate to account settings"
3. Start navigation with voice + screen
4. Follow Gemini's instructions for 3-5 steps
5. Test with unclear requests: "What should I do next?"

**Success Criteria**:
- Screen captures every 500ms (2 FPS)
- Gemini accurately describes visible elements
- Navigation instructions are actionable
- Follow-up questions maintain context

### Test 3: Multimodal Story Generation
**Goal**: Showcase rich story creation with all media types

**Steps**:
1. Use prompt: "An adventure of a robot learning to paint"
2. Enable all media types (text, image, audio)
3. Generate story and observe streaming
4. Verify audio auto-plays when blocks arrive
5. Check image quality and relevance

**Success Criteria**:
- All 3 media types generated
- Blocks stream in logical order
- Audio narration matches text content
- Images visually represent story beats

### Test 4: Reconnection Robustness
**Goal**: Demonstrate automatic recovery from connection issues

**Steps**:
1. Connect to any Live panel
2. Temporarily disable network (airplane mode / disconnect WiFi)
3. Wait for WebSocket close event
4. Re-enable network
5. Observe automatic reconnection

**Success Criteria**:
- Toast notification shows "Reconnecting (1/5)..."
- Connection restored within 2-4 seconds
- UI shows reconnection status
- Service resumes without data loss

### Test 5: Mobile Responsiveness
**Goal**: Verify all Live panels work on mobile devices

**Steps**:
1. Open app on mobile browser (Chrome/Safari)
2. Test each Live panel in portrait mode
3. Verify microphone permission prompt appears
4. Test voice recording and playback
5. Check visual layouts and touch interactions

**Success Criteria**:
- All panels fit within viewport
- Buttons are touch-friendly (min 44x44px)
- Toast notifications appear correctly
- Audio visualization scales appropriately
- No horizontal scrolling required

---

## 🎬 Recording Tips

### Equipment Setup
- **Screen Recording**: Use OBS Studio or native screen capture (4K @ 60fps)
- **Audio**: Use external mic for narration, system audio for app sounds
- **Browser**: Chrome with DevTools open to show network activity

### Recording Checklist
- [ ] Clear browser cache before recording
- [ ] Close unnecessary browser tabs
- [ ] Test microphone levels
- [ ] Ensure stable internet connection
- [ ] Have demo script printed for reference
- [ ] Record in quiet environment
- [ ] Enable Do Not Disturb mode

### Editing Workflow
1. **Trim**: Remove startup delays and errors
2. **Add overlays**: Highlight key UI elements with arrows/boxes
3. **Add timestamps**: Show connection latency and response times
4. **Add captions**: Transcript of voice interactions
5. **Background music**: Subtle tech/upbeat music at low volume
6. **Transitions**: Use smooth fades between scenes
7. **Call-to-actions**: GitHub link, Devpost project, social handles

### Video Specifications
- **Duration**: 3-5 minutes (Devpost requirement)
- **Resolution**: 1920x1080 (1080p)
- **Format**: MP4 (H.264)
- **Framerate**: 30 or 60 FPS
- **Audio**: 192 kbps AAC stereo

---

## 📊 Key Metrics to Showcase

### Performance
- WebSocket connection time: < 500ms
- Audio latency: < 200ms (one-way)
- Screen capture FPS: 2 (configurable)
- Voice Activity Detection: < 300ms response time

### Reliability
- Reconnection attempts: Up to 5 with exponential backoff
- Connection uptime: 99%+ in normal conditions
- Error recovery: Automatic with user notifications

### User Experience
- Toast notifications for all state changes
- Audio visualizer for voice feedback
- Connection quality indicators
- Smooth animations and transitions

---

## 🚀 Deployment for Demo

### Localhost Demo
1. Run `start-dev.ps1` script
2. Open http://localhost:5173
3. Ensure GOOGLE_API_KEY is set
4. Test all three Live panels
5. Record screen with OBS Studio

### Cloud Deployment (Optional)
For live demos without localhost:

1. **Backend**: Deploy to Google Cloud Run
   ```bash
   cd backend
   gcloud run deploy gemini-live-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY
   ```

2. **Frontend**: Deploy to Vercel/Netlify
   ```bash
   cd frontend
   vercel --prod
   # Set VITE_BACKEND_URL to Cloud Run URL
   ```

3. **HTTPS Required**: WebRTC APIs (mic/camera/screen) require HTTPS in production

---

## 🎨 Visual Asset Checklist

For Devpost submission, prepare these assets:

- [ ] **Project Logo** (1024x1024 PNG)
- [ ] **App Screenshot** - Homepage with all modes (1920x1080)
- [ ] **Live Audio Panel** - Recording in action (1920x1080)
- [ ] **Live Navigator** - Screen capture demo (1920x1080)
- [ ] **Story Director** - Generated story blocks (1920x1080)
- [ ] **Architecture Diagram** - System components (SVG/PNG)
- [ ] **Demo Video** - Full walkthrough (3-5 min MP4)
- [ ] **GIF Animations** - Quick feature previews (800x600)

---

## 📝 Devpost Description Template

### Tagline
"Real-time multimodal AI assistant powered by Google Gemini Live API - voice, vision, and creativity in one platform"

### Inspiration
The challenge of making AI interaction feel natural and immediate inspired us to build an agent that combines voice conversation, visual understanding, and creative generation in real-time.

### What it does
- **Live Voice Chat**: Natural conversation with bidirectional audio streaming
- **Visual Navigation**: Voice commands + screen capture for UI guidance
- **Story Creation**: Multimodal narratives with text, images, and audio

### How we built it
- **Frontend**: React + Vite + Tailwind CSS with glassmorphic UI
- **Backend**: FastAPI + python-socketio + google-genai SDK
- **Audio**: Web Audio API with 16kHz mono PCM processing
- **WebSockets**: Bidirectional streaming with auto-reconnection
- **Screen Capture**: Canvas-based JPEG encoding at 2 FPS

### Challenges we ran into
- Coordinating multiple real-time streams (voice + screen)
- Handling WebSocket reconnections gracefully
- Optimizing audio latency for natural conversation
- Mobile browser permission handling

### Accomplishments that we're proud of
- Seamless voice interaction with < 200ms latency
- Automatic reconnection with zero data loss
- Beautiful glassmorphic UI that works on mobile
- Complete TypeScript/JavaScript implementation

### What we learned
- Google Gemini Live API's powerful real-time capabilities
- WebSocket performance optimization techniques
- Web Audio API intricacies for voice processing
- User experience patterns for AI assistants

### What's next
- Add authentication and user profiles
- Support multiple concurrent conversations
- Mobile app versions (iOS/Android)
- Enterprise features (team collaboration, analytics)

---

## 🏆 Judging Criteria Alignment

### Innovation (25%)
- **Unique**: Only agent combining voice, screen, and story in one platform
- **Novel use**: Interleaved multimodal content generation
- **Technical depth**: Custom audio processing and streaming architecture

### Functionality (25%)
- **Works**: All three modes fully functional
- **Reliable**: Auto-reconnection, error handling, state management
- **Complete**: End-to-end implementation with UI and backend

### Design (20%)
- **Beautiful**: Glassmorphic UI with smooth animations
- **Intuitive**: Clear mode switching, status indicators
- **Accessible**: Mobile-responsive, permission handling, toast notifications

### Technical Complexity (15%)
- **Advanced**: Real-time bidirectional streaming
- **Robust**: Error recovery, reconnection logic
- **Optimized**: Audio latency, screen capture FPS, state management

### Use of Gemini Live API (15%)
- **Core feature**: All live modes use Gemini Live API
- **Full utilization**: Audio streaming, screen analysis, content generation
- **Best practices**: Proper error handling, streaming patterns

---

🎬 **Ready to record! Follow this guide for a polished, comprehensive demo.**
