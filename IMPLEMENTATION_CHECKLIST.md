# 🚀 QUICK REFERENCE CHECKLIST FOR JUDGES

## What We've Implemented ✅

### Backend (Gemini Live Integration)
- ✅ Logging infrastructure added (import + logger setup)
- ✅ System prompts defined & actively injected into Gemini config
- ✅ Context history tracking (conversation_history, action_history)
- ✅ Confidence scoring in responses (parsed from Gemini output)
- ✅ Screen-first streaming (screen sent BEFORE audio to Gemini)
- ✅ Real-time response handling (no turn-taking delays)
- ✅ Coordinate validation (checks bounds against screen dimensions)
- ✅ Logger calls added throughout streaming lifecycle

### Frontend (React Components)
- ⏳ NEXT: Receive & display confidence scores in LivePanels  
- ⏳ NEXT: Show explanations & visual evidence to user
- ⏳ NEXT: Display alternatives when Gemini is uncertain (<70% confidence)
- ⏳ NEXT: Send screen dimensions with screen_frame messages

---

## How to Test This Locally

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```

**Look for logs like:**
```
2026-02-26 14:22:30 INFO - 🎤 Starting Gemini Live Audio Stream with 2 prior turns
2026-02-26 14:22:31 DEBUG - 📝 System instruction injected with conversation history
2026-02-26 14:22:32 INFO - ✅ Gemini Live Audio Stream Completed
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Test the Three Modes

**Audio Mode**: Speak to Gemini, verify it responds naturally and references prior conversation

**Navigator Mode**:
1. Set a goal (e.g., "Find the login button and click it")
2. Capture your screen with the UI visible
3. Give voice commands (e.g., "Click the blue button in the top right")
4. Verify Gemini:
   - SEES the screen (suggests correct coordinates)
   - REMEMBERS the goal (references it in explanation)
   - SHOWS confidence (displays % or confidence badge)

**Story Mode**: Generate a narrative based on real-time inputs

---

## What Judges Can Test

### Criterion 1: Innovation & Seamlessness 🎯
- **Test**: Speak continuously in Audio mode - Gemini should respond while you're still speaking (no wait for "end of speech")
- **Evidence**: Check backend logs - should see audio chunks being streamed to Gemini IMMEDIATELY
- **Location**: [server.py](server.py#L615-L625) - concurrent `receive_audio()` + `stream_to_gemini()`

### Criterion 2: Context Awareness 🎯  
- **Test**: In Audio mode, ask "Remember what we just talked about?" 
- **Expected**: Gemini references the conversation history
- **Evidence**: Check logs for "conversation_history" tracking
- **Location**: [server.py](server.py#L585-L605) - conversation_history list maintained

### Criterion 3: Visual Grounding (Navigator) 🎯
- **Test**: Say "Click the button in the middle of the screen"
- **Expected**: Gemini provides coordinates in the right location
- **Evidence**: 
  - Logs show "✅ Screen frame sent for visual grounding" BEFORE audio processing
  - Response includes visual_confidence score
- **Locations**:
  - [gemini_live.py](gemini_live.py#L265-L270) - Screen sent first
  - [server.py](server.py#L715-L730) - Screen dims extracted & validated

### Criterion 4: Real-Time API Integration with Confidence 🎯
- **Test**: Check responses include confidence scores  
- **Expected**: JSON responses show `"confidence": 0.85` or similar
- **Evidence**: Logs show system prompts being injected
- **Location**: [server.py](server.py#L643-L660) - formatted_response with confidence

---

## Code Evidence for Judges

### Point 1: System Prompts Active
```python
# backend/gemini_live.py lines 53-74
SYSTEM_VOICE_CONVERSATION = """You are a helpful AI assistant...
Provide confidence scores in all responses."""

SYSTEM_UI_NAVIGATION = """Analyze the screen capture and understand...
Provide coordinates optimized for the user's goal."""

# These are now passed to Gemini config (line 237)
config = types.LiveConnectConfig(
    system_instruction=system_instruction,  # ← Active grounding
)
```

### Point 2: Screen-First Grounding
```python
# backend/gemini_live.py lines 265-280
# SCREEN IS SENT FIRST
screen_data = base64.b64encode(screen_chunk).decode('utf-8')
await session.send({
    "realtime_input": {
        "media_chunks": [{"mime_type": "image/jpeg", "data": screen_data}]
    }
})
logger.debug("✅ Screen frame sent for visual grounding")

# THEN audio is streamed
await session.send({
    "realtime_input": {
        "media_chunks": [{"mime_type": "audio/pcm", "data": audio_data}]
    }
})
```

### Point 3: Context Awareness
```python
# backend/server.py lines 585-605
conversation_history = []  # Tracks all prior turns

# Each response:
conversation_history.append({"role": "user", "content": ...})
conversation_history.append({"role": "assistant", "content": ...})

# Passed to Gemini:
context_str = json.dumps(conversation_history[-5:])  # Last 5 turns
await live_client.stream_audio_input(
    context=context_str  # ← Grounding context
)
```

### Point 4: Confidence Scoring
```python
# backend/server.py lines 720-735
formatted_response = {
    "type": "action",
    "action": response.get("action"),
    "coords": response.get("coords"),
    "confidence": visual_confidence,  # ← Confidence score
    "explanation": response.get("explanation"),  # ← Why this action
    "visual_evidence": response.get("visual_evidence"),
    "alternatives": response.get("alternatives")  # ← Fallbacks
}
```

---

## Next Steps (Frontend)

1. **Update [frontend/src/components/LivePanels.jsx](frontend/src/components/LivePanels.jsx)**
   - Import confidence badge/indicator component
   - Display `response.confidence` as percentage
   - Show `response.explanation` in panel
   - Display `response.alternatives` when confidence < 0.7

2. **Update [frontend/src/utils/useLiveHooks.js](frontend/src/utils/useLiveHooks.js)**
   - Modify screen capture to include dimensions
   - Format screen message as: `{type: "screen_frame", data: base64, width: w, height: h}`
   - Store response.confidence in state

3. **Test End-to-End**
   - Run backend with `python server.py`
   - Run frontend with `npm run dev`
   - Check logs for evidence of grounding
   - Record demo video showing:
     - Real-time voice response (seamless)
     - Screen understanding (correct coords)
     - Confidence display (transparency)
     - Context awareness (references prior turns)

4. **Deploy**
   - Push to repo
   - Deploy backend to Cloud Run
   - Deploy frontend to Vercel/static host
   - Submit to Devpost with demo link

---

## Judge Evaluation Scorecard

| Criterion | Implementation Status | Evidence Location | Demo Evidence |
|-----------|----------------------|-------------------|----------------|
| Real-time streaming | ✅ Implemented | [server.py L615](server.py#L615-L625) | Logs show immediate streaming |
| Context awareness | ✅ Implemented | [server.py L585](server.py#L585-L605) | Conversation history in logs |
| Visual grounding | ✅ Implemented | [gemini_live.py L265](gemini_live.py#L265-L280) | Screen sent before audio |
| Confidence scoring | ✅ Implemented | [server.py L720](server.py#L720-L735) | Confidence in JSON responses |
| System prompts | ✅ Implemented | [gemini_live.py L53](gemini_live.py#L53-L74) | Logger shows injection |
| **Frontend display** | ⏳ IN PROGRESS | TBD | TBD |
| **Deployment** | ⏳ PENDING | TBD | TBD |
| **Demo video** | ⏳ PENDING | TBD | TBD |

---

## Quick Debug Commands

### Check if system prompts are being sent:
```bash
# Look for these log lines
grep -i "system instruction" server.log
```

### Verify screen-first approach:
```bash
# Check that "Screen frame sent" appears BEFORE "Audio data" in logs
grep -i "screen\|audio" server.log | head -20
```

### Validate confidence parsing:
```bash
# Search for confidence values in responses
grep -o '"confidence":[0-9.]*' server.log
```

### Monitor WebSocket messages:
```bash
# Browser DevTools → Network → WS → Messages tab
# Should see:
# 1. {"type": "screen_frame", "data": "...", "width": ..., "height": ...}
# 2. {"confidence": 0.85, "explanation": "...", ...}
```

---

## File Changes Summary

| File | Lines Changed | Type | Status |
|------|---------------|------|--------|
| [server.py](server.py) | 1-30, 615-625, 670-710, 767-785 | Backend logging & WebSocket | ✅ DONE |
| [gemini_live.py](gemini_live.py) | 1-18, 100-135, 215-280, 290-325 | Logging, system prompts, screen-first | ✅ DONE |
| [LivePanels.jsx](frontend/src/components/LivePanels.jsx) | TBD | Frontend display | ⏳ TODO |
| [useLiveHooks.js](frontend/src/utils/useLiveHooks.js) | TBD | Screen dimensions, response handling | ⏳ TODO |

---

## Questions for Users / Next Phase

1. **Frontend Display**: Should confidence be shown as:
   - [ ] Percentage (e.g., "95% confident")
   - [ ] Bar chart (confidence meter)
   - [ ] Color badge (green=high, yellow=medium, red=low)
   - [ ] All of the above

2. **Deployment**: Ready to deploy to Cloud Run / Vercel?

3. **Demo**: Want to record the demo video now or after frontend updates?

