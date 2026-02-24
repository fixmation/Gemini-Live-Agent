# 🎙️ Gemini Live Agent

<div align="center">

> **📝 Entry for the Google Gemini Live Agent Challenge on Devpost**
> 
> See [DEVPOST_SUBMISSION_CHECKLIST.md](DEVPOST_SUBMISSION_CHECKLIST.md) for submission requirements

**Real-time multimodal AI assistant powered by Google Gemini Live API**

Voice • Vision • Creativity in One Platform

[![Gemini Live API](https://img.shields.io/badge/Gemini-Live%20API-blue?logo=google)](https://ai.google.dev)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## 🌟 Overview

Gemini Live Agent is a next-generation AI assistant that demonstrates the power of Google's Gemini Live API through three distinct modes:

1. **🎙️ Live Voice Conversation** - Natural bidirectional audio streaming with real-time responses
2. **🧭 Live UI Navigator** - Voice commands + screen capture for intelligent UI navigation  
3. **📖 Live Story Director** - Multimodal story generation with text, images, and audio

Built for the **Google Gemini Live Agent Challenge**, this project showcases advanced real-time streaming, multi-modal integration, and beautiful user experience design.

---

## ✨ Features

### Phase 1: Core Infrastructure ✅
- ✅ WebSocket bidirectional streaming (audio + control messages)
- ✅ Gemini Live API client with async/await patterns
- ✅ Web Audio API integration (16kHz mono PCM)
- ✅ Screen Capture API with canvas-based JPEG encoding
- ✅ Voice Activity Detection for turn-taking
- ✅ Audio playback queue with sequential streaming
- ✅ React hooks for Live features
- ✅ Glassmorphic UI components

### Phase 2: UX Enhancements ✅
- ✅ Toast notification system for user feedback
- ✅ Audio visualizer with real-time waveforms
- ✅ Connection quality indicators
- ✅ Automatic reconnection with exponential backoff
- ✅ Mobile-responsive design
- ✅ Error handling with retry logic
- ✅ Status indicators for all streams

### Phase 3: Demo Ready 🚀
- 🎬 Comprehensive demo scenarios for Devpost
- 📹 Video recording guidelines
- 🧪 Testing scenarios and checklists
- 📊 Performance metrics documentation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ LivePanels   │  │ useLiveHooks │  │   Toast   │ │
│  │   (UI)       │←─│   (State)    │←─│(Feedback) │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┘ │
│         │                 │                          │
│  ┌──────▼─────────────────▼───────────────┐         │
│  │   Audio/Screen/WebSocket Utilities     │         │
│  └──────────────────┬──────────────────────┘         │
└─────────────────────┼──────────────────────────────┘
                      │ WebSocket
┌─────────────────────▼──────────────────────────────┐
│              Backend (FastAPI)                      │
│  ┌─────────────────────────────────────────┐       │
│  │  WebSocket Endpoints                    │       │
│  │  • /ws/live/audio                       │       │
│  │  • /ws/live/navigate                    │       │
│  │  • /ws/live/story                       │       │
│  └─────────────┬───────────────────────────┘       │
│                │                                    │
│  ┌─────────────▼───────────────────────────┐       │
│  │     GeminiLiveClient                    │       │
│  │  • stream_audio_input()                 │       │
│  │  • stream_screen_with_voice()           │       │
│  │  • generate_interleaved_story()         │       │
│  └─────────────┬───────────────────────────┘       │
└────────────────┼─────────────────────────────────────┘
                 │
     ┌───────────▼──────────┐
     │  Gemini Live API     │
     │  google.genai.types  │
     └──────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **Google API Key** with Gemini API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gemini-live-agent.git
   cd gemini-live-agent
   ```

2. **Set up environment variables**
   ```powershell
   # Windows PowerShell
   $env:GOOGLE_API_KEY = "your-gemini-api-key-here"
   
   # Or create .env file
   echo "GOOGLE_API_KEY=your-key-here" > .env
   ```

3. **Use the startup script** (Recommended)
   ```powershell
   .\start-dev.ps1
   ```
   
   This script will:
   - Create Python virtual environment
   - Install backend dependencies
   - Install frontend dependencies
   - Start both servers in separate windows

### Manual Setup

**Backend**:
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python server.py
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

### Access the App
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📖 Usage Guide

### 1️⃣ Live Voice Conversation

<img src="docs/images/live-audio-panel.png" width="600" alt="Live Audio Panel">

**Steps**:
1. Click "🎙️ Live" mode in the header
2. Open "Live Voice Conversation" panel
3. Click "Connect" → Grant microphone permission
4. Click "Start Recording" and speak
5. Watch voice activity indicator and audio visualizer
6. Listen to Gemini's audio response

**Best Practices**:
- Speak clearly in a quiet environment
- Wait for VAD indicator to stop pulsing before speaking again
- Check connection quality indicator (green = excellent)

### 2️⃣ Live UI Navigator

<img src="docs/images/live-navigator-panel.png" width="600" alt="Live Navigator Panel">

**Steps**:
1. Set a navigation goal (e.g., "Find the settings page")
2. Click "Start Navigation"
3. Grant microphone AND screen capture permissions
4. Describe what you see or ask for guidance
5. Follow Gemini's navigation instructions
6. Ask follow-up questions as needed

**Best Practices**:
- Be specific with your goal
- Share your entire screen or relevant window
- Describe visible elements if Gemini needs clarification
- Use follow-up questions to refine guidance

### 3️⃣ Live Story Director

<img src="docs/images/live-story-panel.png" width="600" alt="Live Story Panel">

**Steps**:
1. Enter a story prompt (e.g., "A robot learning to paint")
2. Select desired media types (Text, Image, Audio)
3. Click "Generate Story"
4. Watch story blocks stream in real-time
5. Audio narration plays automatically
6. Scroll through completed narrative

**Best Practices**:
- Use descriptive, specific prompts
- Include all 3 media types for richest experience
- Let audio finish before closing panel
- Save favorite stories by exporting JSON

---

## 🔧 Technical Details

### Audio Processing
- **Format**: 16kHz mono PCM (Int16)
- **Buffer**: 4096 samples
- **Latency**: < 200ms one-way
- **VAD Threshold**: -50 dB RMS
- **Supported Browsers**: Chrome 90+, Firefox 88+, Safari 15+

### Screen Capture
- **FPS**: 2 (configurable)
- **Format**: JPEG (quality 0.8)
- **Resolution**: Native (auto-scaled)
- **Encoding**: Base64 for WebSocket transmission

### WebSocket Protocol
- **Reconnection**: 5 attempts with exponential backoff (1s, 2s, 4s, 8s max)
- **Heartbeat**: 30-second ping/pong
- **Binary**: Audio chunks (raw PCM)
- **JSON**: Control messages and responses

### State Management
- **React Hooks**: `useLiveAudio`, `useLiveNavigation`, `useLiveStory`
- **Refs**: Persistent client instances, audio contexts
- **State**: Connection status, error messages, streaming data

---

## 📁 Project Structure

```
gemini-live-agent/
├── backend/
│   ├── server.py              # FastAPI server with WebSocket endpoints
│   ├── gemini_live.py         # Gemini Live API client wrapper
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile             # Container config for deployment
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app with mode switcher
│   │   ├── main.jsx           # Entry point with ToastProvider
│   │   ├── styles.css         # Glassmorphic styles + animations
│   │   ├── components/
│   │   │   ├── LivePanels.jsx      # UI components for Live modes
│   │   │   ├── Toast.jsx           # Notification system
│   │   │   └── AudioVisualizer.jsx # Visualizers and indicators
│   │   └── utils/
│   │       ├── useLiveHooks.js     # React hooks for Live features
│   │       ├── websocketClient.js  # WebSocket clients with reconnection
│   │       ├── audioUtils.js       # Mic capture, playback, VAD
│   │       └── screenCapture.js    # Screen streaming utility
│   ├── package.json           # Node dependencies
│   ├── vite.config.mts        # Vite build config
│   └── Dockerfile             # Container config for deployment
├── scripts/
│   ├── deploy_backend_cloud_run.sh
│   └── deploy_frontend_cloud_run.sh
├── start-dev.ps1              # Quick startup script
├── DEMO_SCENARIOS.md          # Comprehensive demo guide
├── LIVE_FEATURES.md           # Phase 1 implementation docs
└── README.md                  # This file
```

---

## 🧪 Testing

### Local Testing
```powershell
# Run automated tests (future)
cd frontend
npm test

cd backend
pytest
```

### Manual Testing Checklist
- [ ] Voice conversation: 5-turn dialogue without drops
- [ ] Screen capture: Accurate visual analysis
- [ ] Story generation: All 3 media types rendered
- [ ] Reconnection: Auto-recovery within 5 seconds
- [ ] Mobile: All panels work on iOS Safari & Android Chrome
- [ ] Permissions: Mic/camera prompts appear correctly
- [ ] Error handling: Toast notifications for all errors

### Performance Benchmarks
- WebSocket connection: < 500ms
- Audio latency: < 200ms (one-way)
- VAD response: < 300ms
- Screen capture FPS: 2 (configurable)
- Memory usage: < 150MB (frontend)

---

## 🚢 Deployment

### Google Cloud Run (Recommended)

**Backend**:
```bash
cd backend
gcloud run deploy gemini-live-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY \
  --allow-unauthenticated
```

**Frontend**:
```bash
cd frontend
npm run build
vercel --prod
# Set VITE_BACKEND_URL to Cloud Run URL
```

### Docker Compose
```bash
docker-compose up -d
```

### Requirements for Production
- ✅ HTTPS (required for WebRTC APIs)
- ✅ CORS configured for frontend domain
- ✅ API key secured (environment variables)
- ✅ WebSocket timeouts adjusted for cloud
- ✅ CDN for static assets (optional)

---

## 🎯 Roadmap

### Completed ✅
- [x] WebSocket infrastructure
- [x] Gemini Live API integration
- [x] Audio streaming (bidirectional)
- [x] Screen capture streaming
- [x] React UI components
- [x] Toast notifications
- [x] Audio visualizers
- [x] Automatic reconnection
- [x] Mobile responsiveness
- [x] Demo scenarios documentation

### In Progress 🚧
- [ ] Video recording for Devpost
- [ ] Additional error handling edge cases
- [ ] Performance optimization

### Future 🔮
- [ ] Authentication & user profiles
- [ ] Conversation history persistence
- [ ] Multi-language support
- [ ] iOS/Android mobile apps
- [ ] Team collaboration features
- [ ] Analytics dashboard
- [ ] Custom voice models

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed
- Test on multiple browsers/devices

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 Devpost Submission Resources

**For Judges & Reviewers**:
- 📋 [DEVPOST_SUBMISSION_CHECKLIST.md](DEVPOST_SUBMISSION_CHECKLIST.md) - Complete guide for all required/optional submissions
- 🚀 [DEPLOYMENT_PROOF.md](DEPLOYMENT_PROOF.md) - How to verify Google Cloud deployment and gather proof
- 📝 [BLOG_CONTENT_TEMPLATE.md](BLOG_CONTENT_TEMPLATE.md) - Template for optional #GeminiLiveAgentChallenge content

**⚠️ Before Submitting**:  
Update the GitHub repository URL with your actual username (replace `yourusername`):
```bash
https://github.com/your-actual-username/gemini-live-agent
```
Make sure the repository is **public** and contains all source code and documentation.

---

## 🙏 Acknowledgments

- **Google Gemini Team** for the amazing Live API
- **React Community** for excellent tooling and libraries
- **FastAPI** for the high-performance backend framework
- **Devpost** for hosting the Gemini Live Agent Challenge

---

## 📧 Contact

**Project Link**: [https://github.com/yourusername/gemini-live-agent](https://github.com/yourusername/gemini-live-agent) *(Update with your username)*

**Devpost**: [https://devpost.com/software/gemini-live-agent](https://devpost.com/software/gemini-live-agent)

**Built with ❤️ for the Google Gemini Live Agent Challenge**

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

Made with [Gemini Live API](https://ai.google.dev) • [React](https://react.dev) • [FastAPI](https://fastapi.tiangolo.com)

</div>
