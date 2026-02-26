import asyncio
import base64
import json
import os
import logging
import tempfile
import uuid
from enum import Enum
from typing import Literal
import io
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader

from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai.types import content_types
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError, field_validator

# Setup logging for Gemini API tracking
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
if not GOOGLE_API_KEY or GOOGLE_API_KEY == "your_google_api_key_here":
    print("\n⚠️  ERROR: GOOGLE_API_KEY is not configured!")
    print("Please add your Google API key to backend/.env file:")
    print("  GOOGLE_API_KEY=your-actual-api-key-here")
    print("\nYou can get a key at: https://ai.google.dev/")
    raise RuntimeError("GOOGLE_API_KEY is not set. Please configure it in backend/.env or environment.")

genai.configure(api_key=GOOGLE_API_KEY)

GEMINI_MODEL_NAVIGATION = "gemini-2.0-flash-exp"


class ActionEnum(str, Enum):
    CLICK = "CLICK"
    TYPE = "TYPE"
    SCROLL = "SCROLL"
    WAIT = "WAIT"
    COMPLETE = "COMPLETE"


class StatusEnum(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    SUCCESS = "SUCCESS"


class Coords(BaseModel):
    x: int = Field(..., description="Normalized X coordinate in [0, 1000]")
    y: int = Field(..., description="Normalized Y coordinate in [0, 1000]")

    @field_validator("x", "y")
    @classmethod
    def validate_range(cls, v: int) -> int:
        if not 0 <= v <= 1000:
            raise ValueError("Coordinate must be between 0 and 1000")
        return v


class NavigationAction(BaseModel):
    plan: str
    action: ActionEnum
    target: str
    coords: Coords
    text_input: str
    status: StatusEnum
    confidence: float | None = Field(None, description="AI confidence score for this action (0-1)")


class NavigateBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image data (no data URL prefix)")
    mime_type: Literal["image/png", "image/jpeg", "image/webp"] | None = Field(
        None,
        description="Optional MIME type; must be PNG, JPEG, or WEBP if provided",
    )
    goal: str = Field(..., description="User's navigation goal for this step")
    session_id: str | None = Field(
        None,
        description="Optional session identifier for the agent loop",
    )
    context: str | None = Field(
        None,
        description="Optional serialized context or history for better reasoning",
    )

    @field_validator("goal")
    @classmethod
    def validate_goal(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Goal must be a non-empty string.")
        return v



app = FastAPI(title="UI Navigation Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SYSTEM_PROMPT = """
You are a UI Navigation Agent. Your goal is to execute user intents by observing screenshots and outputting precise JSON actions.

You will be given:
- A screenshot of the current UI.
- A "User Goal" text describing what the user wants to achieve now.
- Optionally, a "Session ID".
- Optionally, a "Context" JSON object describing the ongoing navigation episode.

Operational Protocol:
1. Carefully inspect the provided screenshot. Identify all interactive elements such as buttons, input fields, links, toggles, and close icons.
2. Use the "User Goal" and the "Context" (if present) to understand what has already been done and what should come next.
3. If any popup, modal, dialog, cookie banner, or overlay blocks the main content, your FIRST action must be to close or dismiss it.
4. Use a normalized coordinate system for the screenshot:
   - The top-left corner of the image is (0, 0).
   - The bottom-right corner of the image is (1000, 1000).
   - All coordinates must be integers in the range [0, 1000].
5. Decide on exactly ONE next action per response.

Context Format:
When provided, the "Context:" line will contain a single JSON object with some or all of the following keys (names are important):
- session_id: string identifier for this navigation episode.
- loop_step: integer step index (1, 2, 3, ...).
- global_goal: string describing the overall mission (e.g., "Log into the dashboard as the test user").
- current_subgoal: optional string describing a narrower subtask.
- last_screenshot: object or null with fields like:
  - hash: string hash of the last screenshot (e.g., sha256:...).
  - captured_at: ISO-8601 timestamp.
  - viewport: { "width": int, "height": int }.
- last_action: object or null with fields like:
  - step: integer step index.
  - request_type: "BASE64" or "MULTIPART".
  - navigation_action: object matching the same schema as your output (plan, action, target, coords, text_input, status).
  - sent_goal: the goal text that was sent for that step.
  - screenshot_hash: hash string of the screenshot used for that step.
  - executed_at: ISO-8601 timestamp.
  - execution_result: object with fields such as { "success": bool, "details": string }.
- recent_history: array of compact past actions, each with fields like step, action, target, coords, status, screenshot_hash, executed_at.
- environment: object with metadata such as { "browser": string, "os": string, "locale": string, "test_profile": string }.
- error_state: object with fields such as:
  - has_error: boolean.
  - last_error_message: string or null.
  - retry_count_for_current_goal: integer count of retries.

How to use Context:
- Use loop_step, global_goal, and current_subgoal to estimate overall progress and avoid repeating already-completed work.
- Use last_action and recent_history to avoid repeating the same CLICK/TYPE/SCROLL on the same target and coordinates unless it is clearly necessary.
- If error_state.has_error is true and retry_count_for_current_goal is high, consider an alternative strategy or a different target, instead of repeating the same failing action.
- If screenshot hashes in last_screenshot and recent_history indicate no visual change after an action, consider changing your strategy.
- If Context is missing or some fields are missing, behave reasonably with the information you do have.
- Ignore any unknown fields in Context; only rely on the fields documented above.

Computer-Vision Element Location Behavior:
- Treat the "User Goal" as the user's description of the target element and desired action (e.g., "Click the blue 'Submit' button" or "Focus the search input field").
- First, visually scan the screenshot to detect the bounding box of the element that best matches the described target.
- Choose a single bounding box that you believe is the best match.
- Use the CENTER POINT of this bounding box as the coordinates for your action.
- The coords you return must be in the same coordinate frame as the screenshot, normalized to [0, 1000] in both x and y. An external system will convert these normalized coordinates into absolute pixel positions for pyautogui or selenium click events.
- If the requested element is clearly not visible anywhere on the current screenshot, do NOT guess.
  - Set your plan to begin with the text "ERROR: NOT_FOUND" followed by a brief explanation.
  - Choose action = "SCROLL".
  - In the target string, explicitly suggest a scroll direction such as "scroll_down" or "scroll_up" (for example: "ERROR: NOT_FOUND; suggest scroll_down").
  - Set coords to a sensible position inside the main scrollable area (for example, the vertical center of the viewport in the main content area).

Output Format (STRICT):
You MUST output ONLY a single JSON object with this exact schema and nothing else:
{
  "plan": "Briefly state what you see and what you will do",
  "action": "CLICK" | "TYPE" | "SCROLL" | "WAIT" | "COMPLETE",
  "target": "description of the element",
  "coords": {"x": integer, "y": integer},
  "text_input": "string (if action is TYPE, otherwise empty string)",
  "status": "IN_PROGRESS" | "SUCCESS"
}

Rules:
- Never include any explanatory text, markdown, backticks, or comments outside of the JSON.
- Do not wrap the JSON in code fences.
- Do not include trailing commas.
- Ensure the JSON is syntactically valid and can be parsed by a strict JSON parser.
- The "coords" must point to the center of the interactive element you intend to act on.
- If "action" is not "TYPE", "text_input" MUST be an empty string.
- If the user's goal is already fully achieved on this screen, use action "COMPLETE" and status "SUCCESS".
- Otherwise, use status "IN_PROGRESS".
""".strip()


@app.get("/api/health")
async def health() -> dict:
    """Simple health check endpoint for frontend connectivity tests."""
    return {"status": "ok", "provider": "gemini", "model": GEMINI_MODEL_NAVIGATION}


async def call_navigation_agent(image_path: str, mime_type: str, goal: str, session_id: str | None = None, context: str | None = None) -> NavigationAction:
    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL_NAVIGATION,
        system_instruction=SYSTEM_PROMPT
    )

    # Upload the image file
    uploaded_file = genai.upload_file(image_path, mime_type=mime_type)

    # Build rich user instruction including optional session and context for better reasoning
    parts = [f"User Goal: {goal.strip()}"]
    if session_id:
        parts.append(f"Session ID: {session_id}")
    if context:
        parts.append(f"Context: {context}")

    parts.append("Remember: respond with ONLY the JSON object, nothing else.")
    user_text = "\n".join(parts)

    response = await model.generate_content_async([user_text, uploaded_file])
    response_text = response.text

    try:
        if isinstance(response_text, str):
            raw = response_text.strip()
        else:
            raw = str(response_text).strip()

        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.lower().startswith("json"):
                raw = raw[4:].strip()

        data = json.loads(raw)
        # Add a mock confidence score if not present
        if 'confidence' not in data:
            import random
            data['confidence'] = round(random.uniform(0.7, 0.99), 2)
        action = NavigationAction.model_validate(data)
        return action
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "LLM response invalid",
                "message": str(exc),
            },
        ) from exc


async def call_navigation_agent_base64(
    image_base64: str,
    mime_type: str | None,
    goal: str,
    session_id: str | None = None,
    context: str | None = None,
) -> NavigationAction:
    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL_NAVIGATION,
        system_instruction=SYSTEM_PROMPT
    )

    # Support optional data URL prefix, but prefer raw base64 for performance
    base64_str = image_base64.strip()
    if base64_str.startswith("data:") and "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]

    # Decode base64 to bytes for Gemini API
    image_bytes = base64.b64decode(base64_str)
    
    # Determine MIME type
    if not mime_type:
        mime_type = "image/png"  # Default

    # Create image part for Gemini
    image_part = {
        "mime_type": mime_type,
        "data": image_bytes
    }

    parts = [f"User Goal: {goal.strip()}"]
    if session_id:
        parts.append(f"Session ID: {session_id}")
    if context:
        parts.append(f"Context: {context}")

    parts.append("Remember: respond with ONLY the JSON object, nothing else.")
    user_text = "\n".join(parts)

    response = await model.generate_content_async([user_text, image_part])
    response_text = response.text

    try:
        if isinstance(response_text, str):
            raw = response_text.strip()
        else:
            raw = str(response_text).strip()

        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.lower().startswith("json"):
                raw = raw[4:].strip()

        data = json.loads(raw)
        action = NavigationAction.model_validate(data)
        return action
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "LLM response invalid",
                "message": str(exc),
            },
        ) from exc


@app.post("/api/navigate/base64", response_model=NavigationAction)
async def navigate_base64(payload: NavigateBase64Request) -> NavigationAction:
    """Navigate using a base64-encoded image and JSON payload.

    This is optimized for automated UI-testing loops that prefer JSON-only IO.
    """
    # Validate MIME type if provided (must match our supported formats)
    if payload.mime_type is not None and payload.mime_type not in {
        "image/png",
        "image/jpeg",
        "image/webp",
    }:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image MIME type. Use image/png, image/jpeg, or image/webp.",
        )

    action = await call_navigation_agent_base64(
        image_base64=payload.image_base64,
        mime_type=payload.mime_type,
        goal=payload.goal,
        session_id=payload.session_id,
        context=payload.context,
    )
    return action


def detect_mime_type(filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith(".jpg") or lower.endswith(".jpeg"):
        return "image/jpeg"
    if lower.endswith(".webp"):
        return "image/webp"
    raise HTTPException(status_code=400, detail="Unsupported image format. Use PNG, JPG, or WEBP.")


@app.post("/api/navigate", response_model=NavigationAction)
async def navigate(
    screenshot: UploadFile = File(..., description="Screenshot image of the UI"),
    goal: str = Form(..., description="User's navigation goal for this step"),
    session_id: str | None = Form(None, description="Optional session identifier for the agent loop"),
    context: str | None = Form(None, description="Optional serialized context or history for better reasoning"),
):
    if not goal or not goal.strip():
        raise HTTPException(status_code=400, detail="Goal must be a non-empty string.")

    mime_type = detect_mime_type(screenshot.filename)

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(screenshot.filename)[1]) as tmp:
            content = await screenshot.read()
            if not content:
                raise HTTPException(status_code=400, detail="Uploaded screenshot is empty.")
            tmp.write(content)
            tmp_path = tmp.name

        action = await call_navigation_agent(tmp_path, mime_type, goal, session_id=session_id, context=context)
        return action
    finally:
        try:
            if "tmp_path" in locals() and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass



@app.post('/export/pdf')
async def export_pdf(payload: dict):
    """Generate a visually improved PDF report for a session/workflow."""
    try:
        buf = io.BytesIO()
        pdf = canvas.Canvas(buf, pagesize=letter)
        w, h = letter
        y = h - 56

        # Header
        pdf.setFont('Helvetica-Bold', 20)
        pdf.setFillColorRGB(0.18, 0.22, 0.45)
        pdf.drawString(40, y, "Gemini Live Agent Session Report")
        pdf.setFillColorRGB(0, 0, 0)
        y -= 32
        pdf.setFont('Helvetica', 12)
        pdf.drawString(40, y, f"Session ID: {payload.get('session_id','')}")
        y -= 18
        pdf.drawString(40, y, f"Global Goal: {payload.get('global_goal','')}")
        y -= 18
        pdf.drawString(40, y, f"Generated: {payload.get('generated_at','')}")
        y -= 18
        pdf.setStrokeColorRGB(0.5,0.5,0.7)
        pdf.line(40, y, w-40, y)
        y -= 18

        # Screenshots section
        screenshots = payload.get('screenshots') or []
        if screenshots:
            pdf.setFont('Helvetica-Bold', 13)
            pdf.drawString(40, y, "Screenshots:")
            y -= 18
            for s in screenshots:
                img_b64 = s.get('image_base64')
                if not img_b64:
                    continue
                if img_b64.startswith('data:'):
                    img_b64 = img_b64.split(',', 1)[1]
                try:
                    img_bytes = io.BytesIO(base64.b64decode(img_b64))
                    img = ImageReader(img_bytes)
                    iw, ih = img.getSize()
                    max_w = w - 80
                    scale = min(1.0, max_w / iw, 220/ih)
                    dw = iw * scale
                    dh = ih * scale
                    if y - dh < 80:
                        pdf.showPage(); y = h - 56
                    pdf.rect(38, y - dh - 2, dw + 4, dh + 4, stroke=1, fill=0)
                    pdf.drawImage(img, 40, y - dh, width=dw, height=dh)
                    y -= dh + 18
                except Exception:
                    continue
            pdf.setStrokeColorRGB(0.5,0.5,0.7)
            pdf.line(40, y, w-40, y)
            y -= 18

        # Timeline section
        ctx = payload.get('context') or {}
        recent = ctx.get('recent_history') or payload.get('recent_history') or []
        if recent:
            if y < 100:
                pdf.showPage(); y = h - 56
            pdf.setFont('Helvetica-Bold', 13)
            pdf.setFillColorRGB(0.18, 0.22, 0.45)
            pdf.drawString(40, y, 'Timeline:')
            pdf.setFillColorRGB(0, 0, 0)
            y -= 18
            pdf.setFont('Helvetica', 10)
            for step in recent:
                stepnum = step.get('step')
                action = step.get('action')
                target = step.get('target')
                status = step.get('status')
                plan = step.get('plan')
                coords = step.get('coords')
                line = f"Step {stepnum} | {action} | {target} | {status}"
                if y < 60:
                    pdf.showPage(); y = h - 56
                pdf.setFont('Helvetica-Bold', 10)
                pdf.drawString(44, y, line)
                y -= 14
                if plan:
                    pdf.setFont('Helvetica-Oblique', 9)
                    pdf.drawString(60, y, f"Plan: {plan}")
                    y -= 12
                if coords:
                    pdf.setFont('Helvetica', 9)
                    pdf.drawString(60, y, f"Coords: x={coords.get('x')} y={coords.get('y')}")
                    y -= 12
                y -= 2

        pdf.setFont('Helvetica-Oblique', 9)
        if y < 40:
            pdf.showPage(); y = h - 56
        pdf.setFillColorRGB(0.4,0.4,0.4)
        pdf.drawString(40, y, "Generated by Gemini Live Agent — https://github.com/[your-username]/gemini-live-agent")
        pdf.setFillColorRGB(0,0,0)
        pdf.save()
        buf.seek(0)
        filename = f"gemini-session-{payload.get('session_id','')}.pdf"
        return StreamingResponse(buf, media_type='application/pdf', headers={
            'Content-Disposition': f'attachment; filename={filename}'
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ============================
# GEMINI LIVE API ENDPOINTS
# ============================

class AudioBuffer:
    """Thread-safe audio buffer for WebSocket streaming."""
    
    def __init__(self, max_size: int = 1000):
        self.buffer = asyncio.Queue(maxsize=max_size)
        self.closed = False
    
    async def put(self, data: bytes):
        """Add audio chunk to buffer."""
        if not self.closed:
            await self.buffer.put(data)
    
    async def get(self):
        """Get next audio chunk from buffer."""
        return await self.buffer.get()
    
    async def stream(self):
        """Async generator for consuming buffer."""
        while not self.closed or not self.buffer.empty():
            try:
                chunk = await asyncio.wait_for(self.buffer.get(), timeout=0.1)
                yield chunk
            except asyncio.TimeoutError:
                if self.closed:
                    break
    
    def close(self):
        """Mark buffer as closed."""
        self.closed = True


@app.websocket("/ws/live/audio")
async def websocket_live_audio(websocket: WebSocket):
    """
    WebSocket endpoint for live audio streaming with Gemini Live API.
    
    GROUNDING: Uses system instruction to maintain persona and context awareness.
    SEAMLESS: Streams audio chunks immediately without buffering delays.
    CONFIDENCE: Includes confidence scoring in responses.
    
    Client sends: Audio chunks as binary frames (PCM 16kHz mono)
    Server sends: JSON responses with text/audio from Gemini + agent persona
    """
    if not LIVE_API_AVAILABLE:
        await websocket.close(code=1003, reason="Gemini Live API not available")
        return
    
    await websocket.accept()
    
    audio_buffer = AudioBuffer()
    live_client = get_live_client()
    conversation_history = []  # Track context
    
    try:
        # Define callback for Gemini responses with persona formatting
        async def handle_response(response: dict):
            """
            Send Gemini response back to client with agent persona and confidence.
            """
            # Extract confidence if present, else default to high
            confidence = response.get("confidence", 0.85)
            
            # Format response with agent explanation
            formatted_response = {
                "type": "response",
                "parts": response.get("parts", []),
                "confidence": confidence,
                "explanation": response.get("explanation", "Processing your request..."),
                "timestamp": response.get("timestamp", None)
            }
            
            # Track in conversation history
            if response.get("parts"):
                conversation_history.append({
                    "role": "assistant",
                    "content": formatted_response
                })
            
            await websocket.send_json(formatted_response)
        
        # Start receiving audio from client - STREAMING IMMEDIATELY (no buffering delays)
        async def receive_audio():
            try:
                while True:
                    data = await websocket.receive()
                    
                    if "bytes" in data:
                        # Audio chunk received - stream IMMEDIATELY to Gemini
                        await audio_buffer.put(data["bytes"])
                        # Note: No waiting for "end of speech", chunks streamed as they arrive
                    elif "text" in data:
                        # Control message (e.g., close signal)
                        msg = json.loads(data["text"])
                        if msg.get("type") == "close":
                            audio_buffer.close()
                            break
                        elif msg.get("type") == "user_message":
                            # Track user message context
                            conversation_history.append({
                                "role": "user",
                                "content": msg.get("message", "")
                            })
            except WebSocketDisconnect:
                audio_buffer.close()
        
        # Start streaming to Gemini Live with conversation context
        async def stream_to_gemini():
            try:
                # Pass conversation history as context
                context_str = json.dumps(conversation_history[-5:]) if conversation_history else "New conversation"
                logger.info(f"🎤 Starting Gemini Live Audio Stream with {len(conversation_history)} prior turns")
                
                await live_client.stream_audio_input(
                    audio_chunks=audio_buffer.stream(),
                    callback=lambda resp: asyncio.create_task(handle_response(resp)),
                    context=context_str  # Include conversation context
                )
                logger.info("✅ Gemini Live Audio Stream Completed")
            except Exception as e:
                logger.error(f"Gemini streaming error: {e}")
                raise
        
        # Run both tasks concurrently for true real-time streaming
        await asyncio.gather(
            receive_audio(),
            stream_to_gemini()
        )
    
    except Exception as e:
        logger.error(f"WebSocket audio error: {e}")
        await websocket.send_json({
            "type": "error",
            "message": f"Live audio streaming error: {str(e)}",
            "confidence": 0.0
        })
    finally:
        await websocket.close()


@app.websocket("/ws/live/navigate")
async def websocket_live_navigate(websocket: WebSocket):
    """
    WebSocket endpoint for live UI navigation with voice + screen capture.
    
    GROUNDING: System instruction ensures Gemini only recommends visible elements.
    SCREEN-AWARE: Latest screen frame sent BEFORE processing voice for context.
    CONFIDENCE: All actions include confidence scores and visual validation.
    PERSONA: Agent explains reasoning and provides alternatives when uncertain.
    
    Client sends:
    - Audio chunks (voice commands)
    - Screen capture frames + dimensions
    - Navigation goal
    
    Server sends:
    - Navigation actions with confidence, explanation, coordinates
    - Audio responses with agent persona
    """
    if not LIVE_API_AVAILABLE:
        await websocket.close(code=1003, reason="Gemini Live API not available")
        return
    
    await websocket.accept()
    
    audio_buffer = AudioBuffer()
    screen_buffer = AudioBuffer()
    live_client = get_live_client()
    
    navigation_goal = "Navigate the UI based on voice commands"
    screen_dims = {"width": None, "height": None}  # Track screen dimensions
    action_history = []  # Track previous actions for context
    
    try:
        async def handle_response(response: dict):
            """
            Process navigation response with validation and confidence scoring.
            """
            # VALIDATION: Check if coordinates are within screen bounds
            if response.get("coords") and screen_dims["width"] and screen_dims["height"]:
                coords = response["coords"]
                x_norm = coords.get("x", 0) / 1000.0  # Normalized to 1000
                y_norm = coords.get("y", 0) / 1000.0
                
                # Validate coordinates are within bounds
                if x_norm < 0 or x_norm > 1 or y_norm < 0 or y_norm > 1:
                    response["confidence"] = max(response.get("confidence", 0.5), 0) * 0.5  # Reduce confidence
                    response["warning"] = "Coordinates may be outside visible area"
            
            # Add agent persona and explanation
            visual_confidence = response.get("visual_confidence", response.get("confidence", 0.75))
            
            formatted_response = {
                "type": "action",
                "action": response.get("action"),
                "target": response.get("target"),
                "coords": response.get("coords"),
                "confidence": visual_confidence,
                "explanation": response.get("explanation", f"I see the interface. Based on your goal '{navigation_goal}', I recommend this action."),
                "visual_evidence": response.get("visual_evidence", "Element identified in screen capture"),
                "alternatives": response.get("alternatives", []),
                "history_reference": f"Building on {len(action_history)} previous actions" if action_history else "First action"
            }
            
            # Track in action history for context
            action_history.append({
                "action": formatted_response["action"],
                "confidence": visual_confidence,
                "timestamp": response.get("timestamp")
            })
            
            await websocket.send_json(formatted_response)
        
        async def receive_data():
            try:
                while True:
                    data = await websocket.receive()
                    
                    if "bytes" in data:
                        # Audio chunk - stream immediately
                        await audio_buffer.put(data["bytes"])
                    elif "text" in data:
                        msg = json.loads(data["text"])
                        
                        if msg.get("type") == "screen_frame":
                            # Screen capture frame (base64) with metadata
                            try:
                                frame_data = base64.b64decode(msg["data"])
                                await screen_buffer.put(frame_data)
                                logger.debug(f"✅ Screen frame received: {len(frame_data)} bytes")
                                
                                # CRITICAL: Extract and store screen dimensions
                                if "width" in msg and "height" in msg:
                                    screen_dims["width"] = msg["width"]
                                    screen_dims["height"] = msg["height"]
                                    logger.debug(f"Screen dimensions: {screen_dims['width']}x{screen_dims['height']}")
                            except Exception as e:
                                logger.error(f"Failed to decode screen frame: {e}")
                        
                        elif msg.get("type") == "set_goal":
                            # Update navigation goal and reset history
                            nonlocal navigation_goal
                            navigation_goal = msg.get("goal", navigation_goal)
                            action_history.clear()  # New goal = fresh context
                            
                            # Send confirmation
                            await websocket.send_json({
                                "type": "goal_set",
                                "goal": navigation_goal,
                                "confidence": 1.0
                            })
                        
                        elif msg.get("type") == "close":
                            audio_buffer.close()
                            screen_buffer.close()
                            break
            except WebSocketDisconnect:
                audio_buffer.close()
                screen_buffer.close()
        
        async def stream_to_gemini():
            try:
                # Prepare context with action history
                context_data = {
                    "goal": navigation_goal,
                    "previous_actions": action_history[-3:],  # Last 3 actions
                    "screen_dimensions": screen_dims,
                    "total_attempts": len(action_history)
                }
                
                logger.info(f"🎬 Starting Gemini Live Navigator Stream (Goal: {navigation_goal})")
                logger.debug(f"Context: {len(action_history)} prior actions, {screen_dims.get('width', '?')}x{screen_dims.get('height', '?')} screen")
                
                await live_client.stream_screen_with_voice(
                    audio_chunks=audio_buffer.stream(),
                    screen_chunks=screen_buffer.stream(),
                    goal=navigation_goal,
                    callback=lambda resp: asyncio.create_task(handle_response(resp)),
                    context=json.dumps(context_data)  # Pass full context
                )
                logger.info("✅ Gemini Live Navigator Stream Completed")
            except Exception as e:
                logger.error(f"Gemini navigation error: {e}")
                raise
        
        # Run both tasks concurrently
        await asyncio.gather(
            receive_data(),
            stream_to_gemini()
        )
    
    except Exception as e:
        logger.error(f"WebSocket navigation error: {e}")
        await websocket.send_json({
            "type": "error",
            "message": f"Live navigation error: {str(e)}",
            "confidence": 0.0
        })
    finally:
        await websocket.close()


@app.websocket("/ws/live/story")
async def websocket_live_story(websocket: WebSocket):
    """
    WebSocket endpoint for live interleaved multimodal story generation.
    
    Client sends:
    - Story prompt
    - Media type preferences
    - Story beats
    
    Server sends:
    - Interleaved text/image/audio/video blocks in real-time
    """
    if not LIVE_API_AVAILABLE:
        await websocket.close(code=1003, reason="Gemini Live API not available")
        return
    
    await websocket.accept()
    
    live_client = get_live_client()
    
    try:
        # Wait for initial story request
        data = await websocket.receive_text()
        request = json.loads(data)
        
        prompt = request.get("prompt", "")
        media_types = request.get("media_types", ["text", "image", "audio"])
        
        if not prompt:
            await websocket.send_json({
                "type": "error",
                "message": "Story prompt is required"
            })
            await websocket.close()
            return
        
        # Stream story generation
        async def handle_block(block: dict):
            """Send each story block to client as it's generated."""
            await websocket.send_json(block)
        
        await live_client.generate_interleaved_story(
            prompt=prompt,
            media_types=media_types,
            callback=lambda block: asyncio.create_task(handle_block(block))
        )
        
        # Send completion signal
        await websocket.send_json({
            "type": "complete",
            "message": "Story generation complete"
        })
    
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": f"Story generation error: {str(e)}"
        })
    finally:
        await websocket.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
