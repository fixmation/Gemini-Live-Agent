import json
import os
import tempfile
import uuid
from enum import Enum
from typing import Literal

from dotenv import load_dotenv
from emergentintegrations.llm.chat import FileContentWithMimeType, ImageContent, LlmChat, UserMessage
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError, field_validator


load_dotenv()

EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")
if not EMERGENT_LLM_KEY:
    raise RuntimeError("EMERGENT_LLM_KEY is not set. Please configure it in backend/.env or environment.")

GEMINI_MODEL_NAVIGATION = "gemini-2.5-pro"


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

Operational Protocol:
1. Carefully inspect the provided screenshot. Identify all interactive elements such as buttons, input fields, links, toggles, and close icons.
2. Work toward the user's goal with a single best next step.
3. If any popup, modal, dialog, cookie banner, or overlay blocks the main content, your FIRST action must be to close or dismiss it.
4. Use a normalized coordinate system for the screenshot:
   - The top-left corner of the image is (0, 0).
   - The bottom-right corner of the image is (1000, 1000).
   - All coordinates must be integers in the range [0, 1000].
5. Decide on exactly ONE next action per response.

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


def build_chat() -> LlmChat:
    session_id = f"nav-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("gemini", GEMINI_MODEL_NAVIGATION)
    return chat


async def call_navigation_agent(image_path: str, mime_type: str, goal: str, session_id: str | None = None, context: str | None = None) -> NavigationAction:
    chat = build_chat()

    file_content = FileContentWithMimeType(
        file_path=image_path,
        mime_type=mime_type,
    )

    # Build rich user instruction including optional session and context for better reasoning
    parts = [f"User Goal: {goal.strip()}"]
    if session_id:
        parts.append(f"Session ID: {session_id}")
    if context:
        parts.append(f"Context: {context}")

    parts.append("Remember: respond with ONLY the JSON object, nothing else.")


async def call_navigation_agent_base64(
    image_base64: str,
    mime_type: str | None,
    goal: str,
    session_id: str | None = None,
    context: str | None = None,
) -> NavigationAction:
    chat = build_chat()

    # Support optional data URL prefix, but prefer raw base64 for performance
    base64_str = image_base64.strip()
    if base64_str.startswith("data:") and "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]

    image_content = ImageContent(image_base64=base64_str)

    parts = [f"User Goal: {goal.strip()}"]
    if session_id:
        parts.append(f"Session ID: {session_id}")
    if context:
        parts.append(f"Context: {context}")

    parts.append("Remember: respond with ONLY the JSON object, nothing else.")
    user_text = "\n".join(parts)

    response_text = await chat.send_message(
        UserMessage(text=user_text, file_contents=[image_content])
    )

    try:
        if isinstance(response_text, str):
            raw = response_text.strip()
        else:
            raw = str(response_text).strip()

        if raw.startswith("```"):


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

    user_text = "\n".join(parts)

    response_text = await chat.send_message(
        UserMessage(text=user_text, file_contents=[file_content])
    )

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
