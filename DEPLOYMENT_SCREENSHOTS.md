# ☁️ Deployment Screenshots & Proof Guide

> **For Devpost Judges**: Instructions to gather visual proof of Google Cloud deployment and Gemini API integration

---

## 📸 Screenshots You Should Capture

### 1. **Cloud Run Service Deployment**

**What to capture**: Your deployed backend service in Google Cloud Console

**Steps**:
1. Go to Google Cloud Console → [Cloud Run](https://console.cloud.google.com/run)
2. Select the `gemini-live-backend` service
3. Take screenshot showing:
   - Service name: `gemini-live-backend`
   - Status: **Green checkmark** (deployed)
   - Region: (e.g., `us-central1`)
   - Service URL: `https://gemini-live-backend-xxx.run.app` (can blur domain if sensitive)
   - Deployed revision with timestamp

**Example**: 
```
Service: gemini-live-backend
Status: ✅ Running
Region: us-central1
Deployed: 2024-02-26 (or whenever)
URL: https://gemini-live-backend-xxx.run.app
```

**Why it matters for judges**: Proves you deployed to Google Cloud, not just local machine

---

### 2. **Cloud Run Logs (Gemini API Calls)**

**What to capture**: Backend logs showing actual Gemini API requests

**Steps**:
1. In Cloud Run service page, click **"Logs"** tab
2. Look for log entries like:
   ```
   INFO: Gemini.stream_audio_input() started
   INFO: WebSocket /ws/live/audio connected
   DEBUG: Audio chunk received: 4096 bytes
   INFO: Gemini response received: 245 tokens
   ```
3. Take screenshot showing:
   - Log entries with timestamps
   - Evidence of WebSocket connections
   - Gemini API calls in action
   - Response times (important for performance claims)

**Example log**:
```
2024-02-26 14:22:30 - INFO - /ws/live/audio: New connection
2024-02-26 14:22:31 - DEBUG - Audio chunk: 4096 bytes received
2024-02-26 14:22:32 - INFO - Gemini.stream_audio_input() sending to model
2024-02-26 14:22:33 - INFO - Streaming response started
2024-02-26 14:22:34 - INFO - Audio response chunk: 2048 bytes
2024-02-26 14:22:35 - INFO - Gemini response completed
```

**Why it matters for judges**: Proves Gemini API integration is real and working

---

### 3. **Cloud Build Deployment History**

**What to capture**: Proof of containerized deployment

**Steps**:
1. Go to Google Cloud Console → [Cloud Build](https://console.cloud.google.com/cloud-build/builds)
2. Look for recent builds with status **✅ SUCCESS**
3. Take screenshot showing:
   - Build name
   - Status: GREEN/SUCCESS
   - Timestamp
   - Deployment to Cloud Run
   - Build logs (click to expand)

**Example**:
```
Build ID: abc123xyz
Status: ✅ SUCCESS
Trigger: main branch push
Duration: 2 minutes 30 seconds
Deployed to: Cloud Run (gemini-live-backend)
```

**Why it matters for judges**: Shows CI/CD pipeline, not just manual deployment

---

### 4. **Docker Container in Artifact Registry**

**What to capture**: Proof of containerization

**Steps**:
1. Go to Google Cloud Console → [Artifact Registry](https://console.cloud.google.com/artifacts)
2. Click your Docker repository (usually `docker` or `us-central1-docker`)
3. Look for image: `gemini-live-backend`
4. Take screenshot showing:
   - Image name: `gemini-live-backend`
   - Tags: `latest`, `v1.0`, etc.
   - Size: (e.g., 450 MB)
   - Creation date
   - Scan results (security)

**Example**:
```
Image: us-central1-docker.pkg.dev/your-project/docker/gemini-live-backend
Tag: latest
Size: 450 MB
Created: 2024-02-26
Vulnerability scan: ✅ 0 critical issues
```

**Why it matters for judges**: Shows containerization best practices

---

### 5. **API Usage/Metrics** (Optional but impressive)

**What to capture**: Evidence of Gemini API being called

**Steps** (if Gemini API has a dashboard):
1. Go to Google Cloud Console → APIs & Services → [Google AI/Gemini Dashboard](https://console.cloud.google.com/apis/api/generativeai.googleapis.com)
2. Click **"Metrics"** or **"Usage"** tab
3. Look for API calls graph
4. Take screenshot showing:
   - API route: `/generateContent`, `/batchGenerateContent`, or similar
   - Request count (over time period)
   - Latency graph
   - Error rate (should be low)

**Example graph**:
```
Requests per minute: ~5-10 (varies with user interaction)
Average latency: ~200-500ms
Error rate: <1%
```

**Why it matters**: Judges see actual usage data, not just claims

---

### 6. **Project Metadata** (For context)

**What to capture**: Your GCP project info

**Steps**:
1. Go to Google Cloud Console → Home
2. Top-left, next to **Google Cloud**
3. Click project name dropdown
4. Take screenshot showing:
   - Project ID: (e.g., `gemini-live-agent-2024`)
   - Project Name
   - Organization (if applicable)

**Why it matters**: Full context for judges reviewing your infrastructure

---

## 📋 Checklist: What to Include

Create a document or image album with these screenshots (in order):

- [ ] **Screenshot 1**: Cloud Run Services (showing `gemini-live-backend` running)
- [ ] **Screenshot 2**: Cloud Run Logs (showing Gemini API calls)
- [ ] **Screenshot 3**: Cloud Build History (showing successful deployments)
- [ ] **Screenshot 4**: Artifact Registry (showing Docker image)
- [ ] **Screenshot 5**: (Optional) API Usage Metrics
- [ ] **Screenshot 6**: (Optional) GCP Project info

---

## 🎬 How to Include in Video Demo

**Option 1: Overlay Screenshots**
- During video recording, open GCP Console
- Show Cloud Run service page
- Show logs with Gemini API calls
- Narrate: "Here's our backend deployed on Cloud Run, and you can see Gemini API calls happening in real-time"

**Option 2: Separate Screenshot Document**
- Compile all screenshots into a **DEPLOYMENT_SCREENSHOTS.md** file
- Include captions explaining each one
- Add timestamps of when you verified deployment
- Submit as supplementary evidence to Devpost

---

## 🛠️ How to Gather Everything

### Quick Script to View All Proof:

```bash
# 1. Make sure you're authenticated to GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. View deployed service
gcloud run services describe gemini-live-backend --region us-central1

# 3. View recent logs
gcloud run services logs read gemini-live-backend --region us-central1 --limit 50

# 4. View Cloud Build history
gcloud builds list --limit 10

# 5. View Docker images in Artifact Registry
gcloud artifacts docker images list us-central1-docker.pkg.dev/YOUR_PROJECT_ID/docker
```

---

## 📝 Sample Deployment Proof Document

You can create a Markdown file documenting everything:

```markdown
# Deployment Proof - Gemini Live Agent

## Project Details
- **GCP Project ID**: gemini-live-agent-20240226
- **Region**: us-central1
- **Deployed Date**: February 26, 2024

## Cloud Run Service
- **Service Name**: gemini-live-backend
- **Status**: ✅ Active
- **URL**: https://gemini-live-backend-abc123.run.app
- **Runtime**: Python (FastAPI)

## Container Image
- **Repository**: us-central1-docker.pkg.dev/.../gemini-live-backend
- **Latest Tag**: latest (sha256: abc123...)
- **Image Size**: 450 MB
- **Built**: February 26, 2024

## Recent Deployment
- **Build ID**: build-abc123
- **Status**: ✅ SUCCESS
- **Duration**: 2 min 30 sec
- **Deployed Revision**: gemini-live-backend-00001
- **Traffic**: 100%

## API Integration Evidence
- **API Service**: Google Generative AI (Gemini)
- **SDK**: google-genai Python client
- **Endpoints Used**: 
  - /generateContent (story generation)
  - /batchGenerateContent (batch processing)
- **Monthly Usage**: X requests
- **Error Rate**: < 1%

## Logs Sample
```
2024-02-26 14:22:30 - WebSocket /ws/live/audio connected
2024-02-26 14:22:35 - Gemini API call succeeded (response time: 250ms)
2024-02-26 14:22:36 - Audio response streamed to client
```

## Monitoring & Metrics
- **Uptime**: 99.5% (last 7 days)
- **Average Latency**: 300ms
- **CPU Usage**: 40-60%
- **Memory Usage**: 512MB per instance

## Verification Steps
1. ✅ Service accessible via HTTPS
2. ✅ Logs show Gemini API integration
3. ✅ Container image automatically built via Cloud Build
4. ✅ Auto-scaling configured (0-10 instances)
5. ✅ Error handling logs show graceful failures
```

---

## 🔐 Privacy & Security Notes

When taking screenshots:
- **Blur or hide** sensitive URLs/domains
- **Remove** any API keys or secrets (should never be visible)
- **Anonymize** user data if visible in logs
- **Check** Cloud Run logs for any sensitive information before sharing

Example redaction:
```
URL: https://gemini-live-backend-[REDACTED].run.app
API Key: [REDACTED]
User email: user@[REDACTED].com
```

---

## ✅ Final Checklist

Before submitting to Devpost, ensure:

- [ ] Cloud Run service is actively running
- [ ] Backend is reachable from frontend (test WebSocket)
- [ ] Logs show recent Gemini API calls (within last 24 hours)
- [ ] Cloud Build shows successful deployments
- [ ] Artifact Registry has Docker image
- [ ] Screenshots are clear and readable
- [ ] No sensitive data visible in screenshots
- [ ] Video or screenshots linked in Devpost submission
- [ ] Timestamp on screenshots is recent (or note when they were taken)

---

## 🎯 What Judges Are Looking For

| Evidence | Why It Matters | Where to Find |
|----------|----------------|---------------|
| **Running Cloud Run service** | Proves deployment is real | GCP Console → Cloud Run |
| **Gemini API in logs** | Proves SDK integration | Cloud Run logs |
| **Containerized Docker image** | Proves scalability approach | Artifact Registry |
| **Cloud Build history** | Proves CI/CD pipeline | Cloud Build page |
| **API usage metrics** | Proves it's been used | Gemini API dashboard |

Judges want to see that you didn't just "hack" something locally—you built production-grade infrastructure on Google Cloud.

