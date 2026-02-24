# 🚀 Google Cloud Deployment Proof Documentation

> **For Devpost Judges**: This document explains how Gemini Live Agent demonstrates automated Google Cloud deployment and proves use of Google Cloud services.

---

## 📌 Quick Summary

This project includes **infrastructure-as-code** for automated deployment to Google Cloud Run:

- ✅ Backend deployment script: [scripts/deploy_backend_cloud_run.sh](scripts/deploy_backend_cloud_run.sh)
- ✅ Frontend deployment script: [scripts/deploy_frontend_cloud_run.sh](scripts/deploy_frontend_cloud_run.sh)
- ✅ Backend Dockerfile: [backend/Dockerfile](backend/Dockerfile)
- ✅ Frontend Dockerfile: [frontend/Dockerfile](frontend/Dockerfile)
- ✅ Gemini Live API integration: [backend/gemini_live.py](backend/gemini_live.py)

**Proof Type**: Infrastructure-as-Code (IaC) with automated Google Cloud Run deployment

---

## 🔐 Google Cloud Services Used

### 1. **Google Cloud Run**
- Where the FastAPI backend is deployed
- Serverless container runtime
- Auto-scaling based on traffic
- HTTPS by default

### 2. **Artifact Registry**
- Stores Docker container images
- Required for Cloud Run deployments
- Region-specific storage

### 3. **Cloud Build**
- Builds Docker images from source code
- Pushes to Artifact Registry
- Automated CI/CD pipeline

### 4. **Gemini Live API**
- Core AI service powering the application
- Called from [backend/gemini_live.py](backend/gemini_live.py)
- Requires `google-genai` SDK (in [backend/requirements.txt](backend/requirements.txt))

### 5. **Identity & Access Management (IAM)**
- Service account permissions
- API authentication via environment variables
- Secure API key management

---

## 📂 How to Deploy & Gather Proof

### Step 1: Set Up Google Cloud Project

```bash
# 1. Install Google Cloud CLI (gcloud)
# https://cloud.google.com/sdk/docs/install

# 2. Authenticate
gcloud auth login

# 3. Create or select GCP project
gcloud config set project YOUR_PROJECT_ID
gcloud projects create gemini-live-agent --name "Gemini Live Agent"

# 4. Set up region
gcloud config set compute/region us-central1
```

### Step 2: Deploy Backend to Cloud Run

```bash
# Option A: Using the automated script
cd scripts
bash deploy_backend_cloud_run.sh

# Option B: Manual deployment (more control)
cd backend
gcloud run deploy gemini-live-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY \
  --allow-unauthenticated
```

**Output Example**:
```
Service [gemini-live-backend] revision [gemini-live-backend-00001-xyz] 
has been deployed and is serving 100 percent of traffic.
Service URL: https://gemini-live-backend-xyz.a.run.app
```

### Step 3: Deploy Frontend to Cloud Run

```bash
cd frontend
npm run build

gcloud run deploy gemini-live-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars VITE_BACKEND_URL=https://gemini-live-backend-xyz.a.run.app \
  --allow-unauthenticated
```

### Step 4: Gather Proof Screenshots

Take screenshots of:

1. **Cloud Run Services Console**
   ```
   Google Cloud Console → Cloud Run → Services
   Shows both deployed services active
   ```

2. **Service Details**
   - Service name: `gemini-live-backend`
   - URL: `https://gemini-live-backend-xyz.a.run.app`
   - Status: ✅ Active
   - Triggers: Cloud Build

3. **Cloud Build History**
   ```
   Google Cloud Console → Cloud Build → History
   Shows successful builds for both backend and frontend
   ```

4. **Artifact Registry**
   ```
   Google Cloud Console → Artifact Registry
   Shows stored Docker images:
   - us-central1-docker.pkg.dev/[project]/gemini-live/backend:latest
   - us-central1-docker.pkg.dev/[project]/gemini-live/frontend:latest
   ```

5. **Cloud Logs** (Optional but impressive)
   ```
   Google Cloud Console → Cloud Run → Logs
   Shows active requests, response times, and Gemini API calls
   ```

---

## 🔗 Code References for Judges

### Backend WebSocket Endpoints (Gemini Integration)

**File**: [backend/server.py](backend/server.py)

```python
@app.websocket("/ws/live/audio")
async def websocket_live_audio(websocket: WebSocket):
    """Bidirectional audio streaming with Gemini Live API"""
    # Receives audio from frontend
    # Streams back responses from Gemini
    # Uses GeminiLiveClient for API calls
    pass

@app.websocket("/ws/live/navigate")  
async def websocket_live_navigate(websocket: WebSocket):
    """Voice + screen capture for UI navigation"""
    # Integrates with Gemini Vision for screenshot analysis
    # Returns navigation recommendations
    pass
```

### Gemini Live API Integration

**File**: [backend/gemini_live.py](backend/gemini_live.py)

```python
from google.genai import types, liveclient

class GeminiLiveClient:
    async def stream_audio_input(self, audio_generator):
        """Stream audio to Gemini Live API and receive responses"""
        # Uses google.genai.liveclient
        # Calls Vertex AI Gemini Live endpoint
        # Returns streaming text/audio
        
    async def stream_screen_with_voice(self, screen_frames, voice_input):
        """Vision + voice streaming with Gemini"""
        # Sends screenshots for analysis
        # Combines with voice input
        # Returns navigation recommendations
```

### Python Dependencies

**File**: [backend/requirements.txt](backend/requirements.txt)

```
google-genai>=0.1.0      # Official Google Gemini API SDK
google-generativeai>=...  # Alternative Gemini library
fastapi
websockets
python-multipart
```

---

## 📹 How to Record Proof Video

Record a short video (1-2 minutes) showing:

### Section 1: GCP Console (0:00-0:30)
1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Run** → **Services**
3. Show both services running:
   - ✅ gemini-live-backend (Active)
   - ✅ gemini-live-frontend (Active)
4. Click into backend service
5. Show the **Service URL** (https://...)
6. Show **Metrics** tab with recent requests

### Section 2: Cloud Build History (0:30-1:00)
1. Navigate to **Cloud Build** → **Build History**
2. Show recent successful builds
3. Click into one build
4. Show build steps:
   ```
   1. Build Docker image
   2. Push to Artifact Registry
   3. Deploy to Cloud Run
   ```
5. Show build logs with SUCCESS stamp

### Section 3: Live Backend Test (1:00-1:30)
1. Open terminal
2. Test backend endpoint:
   ```bash
   curl https://gemini-live-backend-xyz.a.run.app/docs
   ```
3. Show API documentation loading
4. Show WebSocket endpoint list:
   - /ws/live/audio
   - /ws/live/navigate
   - /ws/live/story

### Section 4: Artifact Registry (1:30-2:00) [Optional]
1. Navigate to **Artifact Registry** → **Repositories**
2. Show stored images with tags and dates
3. Demonstrates repeatable deployments

**Recording Tools**:
- OBS Studio (free)
- Loom (browser-based, easiest)
- ScreenFlow (Mac)
- ShareX (Windows)

---

## 🔍 What Judges Are Looking For

✅ **Automated Deployment**
- Your shell scripts use `gcloud run deploy`
- Demonstrates Infrastructure-as-Code approach
- Repeatable from source code

✅ **Google Cloud Integration**
- Uses official GCP services (Cloud Run, Artifact Registry, Cloud Build)
- Shows understanding of containerization and deployment
- Follows GCP best practices

✅ **Gemini API Usage**
- Backend code clearly uses `google-genai` SDK
- WebSocket endpoints demonstrate real-time API calls
- Shows integration of Gemini Live, Vision, and Text models

✅ **Proof of Execution**
- Screenshots or video showing deployed services running
- Service URLs that judges can visit
- Active logs showing requests/responses

---

## 🚨 Troubleshooting Deployment

### Issue: "gcloud: command not found"
**Solution**: Install Google Cloud SDK
```bash
# Install gcloud CLI
https://cloud.google.com/sdk/docs/install

# Then initialize
gcloud init
```

### Issue: "Permission denied" on script
**Solution**: Make script executable
```bash
chmod +x scripts/deploy_backend_cloud_run.sh
chmod +x scripts/deploy_frontend_cloud_run.sh
```

### Issue: "Artifact Registry repository already exists"
**Solution**: That's fine! The `|| true` at the end ignores this error

### Issue: Docker build fails
**Solution**: Check that Dockerfiles exist
```bash
ls backend/Dockerfile
ls frontend/Dockerfile
```

### Issue: "API not enabled" error
**Solution**: Enable required APIs (script does this automatically)
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

---

## 📊 Example Screenshots to Include in Devpost

### Screenshot 1: Cloud Run Services
```
[GCP Console] Cloud Run → Services
┌─────────────────────────────────────────┐
│ Services                                │
│ ✅ gemini-live-backend  DEPLOYED        │
│    Region: us-central1                  │
│    URL: https://gemini-live-backend-... │
│    Revisions: 2                         │
│                                         │
│ ✅ gemini-live-frontend DEPLOYED        │
│    Region: us-central1                  │
│    URL: https://gemini-live-frontend-..│
│    Revisions: 1                         │
└─────────────────────────────────────────┘
```

### Screenshot 2: Cloud Build Success
```
[GCP Console] Cloud Build → Build History
┌─────────────────────────────────────────┐
│ Build ID        Status      Timestamp   │
│ abc123def456    ✅ SUCCESS  2024-02-20  │
│ xyz789uvw012    ✅ SUCCESS  2024-02-19  │
│ mno456pqr789    ✅ SUCCESS  2024-02-18  │
└─────────────────────────────────────────┘
```

### Screenshot 3: Artifact Registry
```
[GCP Console] Artifact Registry
┌──────────────────────────────────────┐
│ Image: gemini-live/backend           │
│ Latest Tag: latest                   │
│ Created: 2024-02-20 14:32:15 UTC     │
│ Size: 847 MB                         │
│                                      │
│ Image: gemini-live/frontend          │
│ Latest Tag: latest                   │
│ Created: 2024-02-20 14:25:03 UTC     │
│ Size: 256 MB                         │
└──────────────────────────────────────┘
```

---

## 📝 What to Write in Devpost Description

> "This project demonstrates **automated Google Cloud deployment** using infrastructure-as-code. The backend is powered by **Google Gemini Live API** for real-time multimodal interactions.
>
> **Deployment Proof**:
> - Automated deployment scripts in `scripts/deploy_*.sh`
> - Infrastructure-as-Code with Docker containers
> - Deployed on **Google Cloud Run** with automatic scaling
> - Uses **Artifact Registry** for image storage
> - **Cloud Build** for CI/CD automation
>
> **Gemini Integration**:
> - Real-time audio streaming via Gemini Live API
> - Vision-based UI analysis with Gemini Vision
> - Multimodal story generation
> - See `backend/gemini_live.py` for details
>
> **Proof**:
> - [Screenshot 1: Cloud Run Services]
> - [Screenshot 2: Build History]
> - [Video: Backend running on Cloud Run]
> - Code: github.com/[your-username]/gemini-live-agent"

---

## ✅ Verification Checklist

- [ ] Deployment scripts exist and are executable
- [ ] Dockerfiles are properly configured
- [ ] GCP project is created and active
- [ ] Services deployed and running on Cloud Run
- [ ] Service URLs are accessible
- [ ] Screenshots collected from GCP Console
- [ ] Backend logs show Gemini API calls
- [ ] Video recording complete
- [ ] Proof documented and uploaded to Devpost

---

**You've got this! 🚀 Your deployment is production-ready and demonstrates enterprise-level cloud engineering.**
