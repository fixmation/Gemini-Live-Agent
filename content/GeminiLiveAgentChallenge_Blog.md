# Building a Visual UI Navigation Agent with Google Gemini & Google Cloud

> This piece of content was created **for the purposes of entering the _Gemini Live Agent Challenge_ hackathon on Devpost**.
>
> Hashtag: **#GeminiLiveAgentChallenge**

## Overview

This project, **UI Navigator Studio**, is a visual agent that becomes your hands on screen. It "looks" at screenshots of a browser or app, understands a high-level goal in natural language, and returns the **next UI action** as structured JSON: what to click, where to click, or what to type.

The agent is powered by **Google Gemini (gemini-2.5-pro)** via the **Google GenAI SDK** and is deployed on **Google Cloud**, making it a good fit for the Gemini Live Agent Challenge.

In this post, I’ll walk through:

- How the agent is architected (backend, frontend, and agent loop)
- How it uses **Google Gemini** and the **Google GenAI SDK**
- How it is prepared for deployment on **Google Cloud Run** using automation scripts

---

## Architecture at a Glance

The project has two main parts:

1. **Backend (FastAPI) - Visual Agent Core**
   - Receives a **screenshot** and a **navigation goal**.
   - Calls **Google Gemini** (via the Google GenAI SDK) with the screenshot and goal.
   - Returns a normalized action JSON:
     - `plan`, `action`, `target`, `coords`, `text_input`, `status`.

2. **Frontend (React + Vite) - UI Navigator Studio**
   - Lets users upload screenshots and set goals.
   - Visualizes the agent’s chosen click point on top of the screenshot.
   - Provides a **timeline** of actions, **multi-step workflow planning**, and **exportable JSON workflows** for automation.

The agent can be used manually (through the UI Navigator Studio) or integrated into automation scripts (Selenium, PyAutoGUI, etc.), which is where the power of Google Cloud comes in.

---

## Using Google Gemini via the Google GenAI SDK

The backend uses a small integration library (`emergentintegrations`) that builds on top of the official **Google GenAI SDK** (`google-genai`, `google-generativeai`). From a development perspective, the integration looks like this (simplified):

```python
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

chat = LlmChat(
    api_key=os.environ["EMERGENT_LLM_KEY"],
    session_id="nav-...",
    system_message=SYSTEM_PROMPT,
).with_model("gemini", "gemini-2.5-pro")

response = await chat.send_message(
    UserMessage(
        text="User Goal: Click the blue Login button",
        file_contents=[FileContentWithMimeType(file_path=image_path, mime_type="image/png")],
    )
)
```

### Why Google Gemini?

The agent needs to:

- **See**: Understand raw screenshots (no DOM/API access).
- **Reason**: Map a natural-language goal to a concrete UI element.
- **Act**: Choose one best next action with precise coordinates.

Gemini’s multimodal capabilities (vision + text) make it a natural fit. I can send both the image and a structured prompt that:

- Describes the UI navigation contract (JSON schema).
- Defines rules for popups, scrolls, and coordinate normalization.
- Requests a strict JSON-only response so it can be fed directly into automation code.

The backend then validates the returned JSON with Pydantic and streams it to the frontend.

---

## Agent Design: From Screenshot to Action

The agent loop is:

1. **Input**
   - `screenshot`: PNG/JPEG/WEBP screenshot of the current viewport.
   - `goal`: natural language like "Click the blue 'Login' button".
   - Optional `context` JSON with:
     - Session ID
     - Previous actions
     - Error state (retries, last error)
     - Environment info (browser, OS, locale)

2. **Reasoning (Gemini)**
   - The FastAPI service calls Gemini with a rich system prompt describing:
     - Normalized coordinate system: `(0,0)` top-left to `(1000,1000)` bottom-right.
     - Strict JSON output format.
     - Rules for dealing with popups and missing elements.
   - The user message contains:
     - `User Goal: ...`
     - `Session ID: ...` (if present)
     - `Context: {...}` (JSON string).

3. **Output (Action JSON)**

Gemini responds with a single JSON object like:

```json
{
  "plan": "I see a login form; I will click the blue 'Login' button at the bottom.",
  "action": "CLICK",
  "target": "blue 'Login' button",
  "coords": { "x": 512, "y": 920 },
  "text_input": "",
  "status": "IN_PROGRESS"
}
```

4. **Execution**

- The frontend:
  - Draws a marker at the normalized coords on the screenshot.
  - Converts the normalized coords into pixel coords based on the configured viewport (e.g., 1920x1080).
  - Presents **PyAutoGUI** and **Selenium** code snippets using those pixel coordinates.

- An external automation harness can:
  - Execute the click.
  - Capture a new screenshot.
  - Call the agent again for the next step.

---

## Orchestration UI: Multi-Step Workflows

To make this a real **agent console**, I built **UI Navigator Studio**:

- **Planned Workflow Steps**:
  - You can define a sequence of natural-language steps (e.g., open login, fill fields, click submit).
  - You can click **Use Next Planned Step** to automatically set the next goal.

- **Auto-advance on Success**:
  - When you mark a step as **Success**, the UI advances the planned step pointer and sets the next goal.

- **Step Timeline**:
  - A reverse-chronological list of the agent’s chosen actions.
  - You can click a past step to reload its plan, action, and coords, and see them overlaid on the screenshot.

- **Exportable Workflows**:
  - The UI can export a complete JSON containing:
    - Session metadata
    - Global goal
    - Viewport settings
    - Planned steps
    - Context
    - Action history
  - This JSON is ready to be consumed by an external automation or evaluation pipeline.

All of this is still driven by Google Gemini’s reasoning on each screenshot.

---

## Deploying on Google Cloud (Automated)

For the hackathon, I prepared **deployment automation** targeting **Google Cloud Run**:

- Dockerfiles for both backend and frontend.
- Shell scripts in the `scripts/` directory that:
  - Build container images.
  - Push them to Google Artifact Registry.
  - Deploy them to Cloud Run with appropriate environment variables (including the Gemini API key / EMERGENT_LLM_KEY managed via secrets).

Example concept (simplified):

```bash
#!/usr/bin/env bash

PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
SERVICE_NAME="ui-navigator-backend"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/ui-navigator/ui-navigator-backend:latest"

# Build and push image
gcloud builds submit --tag "$IMAGE" ./backend

# Deploy to Cloud Run
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars EMERGENT_LLM_KEY=projects/.../secrets/... \
  --port 8001
```

The actual scripts in the repository are more detailed and parameterized, but this pattern allows me to **automate deployment** end-to-end, which is also a requirement for the challenge.

---

## Why This Fits the Gemini Live Agent Challenge

This project aligns closely with the challenge’s goals:

- **Agent behavior**:
  - The system closes the loop from visual perception → reasoning → action.
  - It supports multi-step workflows and persistent context.

- **Google GenAI / Gemini usage**:
  - Gemini `gemini-2.5-pro` is used as the central brain.
  - The project uses the **Google GenAI SDK** via `google-genai` / `google-generativeai`.

- **Google Cloud deployment**:
  - Scripts and configuration are included to build and deploy to Google Cloud Run.
  - The repository demonstrates automated cloud deployment.

- **Public content for the hackathon**:
  - This write-up itself is published **specifically for the purposes of entering the _Gemini Live Agent Challenge_ on Devpost**, and uses the required hashtag **#GeminiLiveAgentChallenge**.

---

## Next Steps

From here, the project can grow to:

- Accept **audio instructions** and transcribe them into goals ("hear").
- Respond with **spoken explanations** using text-to-speech ("speak").
- Support more advanced action types (keyboard shortcuts, drag-and-drop, multi-element selection).

But the core is already in place: a Gemini-powered agent that can **see** a screen, understand a goal, and act.

#GeminiLiveAgentChallenge
