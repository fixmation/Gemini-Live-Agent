# Google GenAI (Gemini) Integration & Agent Architecture

This document explains how this project uses **Google GenAI (Gemini)** and how it qualifies as an **agent** for the Devpost hackathon.

---

## Google GenAI Integration (Gemini)

This project’s navigation agent is powered by **Google Gemini** via the Google GenAI SDK.

- **Model**: `gemini-2.5-pro` (for critical reasoning on screenshots)
- **Provider**: Google GenAI (Gemini API)
- **Usage**: The backend (`backend/server.py`) calls Gemini with both:
  - A screenshot (as an image attachment)
  - A textual navigation goal
- **Output**: The model returns a strict JSON action:
  - `plan`, `action`, `target`, `coords`, `text_input`, `status`

The integration is implemented through the `emergentintegrations` library, which wraps the official Google GenAI SDKs. Under the hood, it uses:

- `google-genai`
- `google-generativeai`

These packages are visible in `backend/requirements.txt` and are used to call the Gemini API.

### Example Call (Backend)

From `backend/server.py` (simplified):

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

This call goes through the Google GenAI SDK and hits the Gemini endpoint.

---

## Agent Architecture

This project implements a **visual UI Navigation Agent**:

### Inputs

- Screenshot of the current screen (browser or app)
- Natural-language goal (e.g., "Click the blue 'Login' button")
- Optional JSON context describing the ongoing episode:
  - `session_id`, `loop_step`
  - `global_goal`, `current_subgoal`
  - `last_screenshot`, `last_action`, `recent_history`
  - `environment`, `error_state`

### Brain (Agent Logic)

- The backend sends the screenshot + goal + context to **Google Gemini (`gemini-2.5-pro`)** using the Google GenAI SDK.
- A strict system prompt instructs Gemini to:
  - Detect interactive elements (buttons, fields, toggles, close icons).
  - Decide the **single best next action** toward the goal.
  - Use a normalized 0–1000 coordinate system over the screenshot.
  - Output **only** a JSON object with this schema:

```json
{
  "plan": "Briefly state what you see and what you will do",
  "action": "CLICK" | "TYPE" | "SCROLL" | "WAIT" | "COMPLETE",
  "target": "description of the element",
  "coords": { "x": 0, "y": 0 },
  "text_input": "string (if action is TYPE, otherwise empty string)",
  "status": "IN_PROGRESS" | "SUCCESS"
}
```

### Outputs (Actions)

- Normalized coordinates (0–1000) pointing to the target element.
- Action type (`CLICK`, `TYPE`, `SCROLL`, `WAIT`, `COMPLETE`).
- Text to type (for `TYPE` actions).
- Status (`IN_PROGRESS` or `SUCCESS`).

The frontend converts normalized coords into pixel coordinates and produces ready-to-use code snippets for:

- **PyAutoGUI** (`pyautogui.click(x, y)`)
- **Selenium** (offset-based `ActionChains`).

### Agent Loop & Orchestration

The **UI Navigator Studio** (React frontend) provides a control surface for orchestrating the agent:

- Upload successive screenshots from your browser automation.
- Set a **Global Goal** and per-step **Current Step Goals**.
- Maintain a list of **Planned Workflow Steps** (multi-step run plan).
- For each step:
  - Select the next planned step as the goal.
  - Call the backend agent (`/api/navigate` or `/api/navigate/base64`).
  - Visualize the chosen coordinates on the screenshot.
  - Mark execution as **Success** or **Failure**.
- The app maintains a detailed **Step Timeline** and **Context JSON**, and supports exporting the entire workflow as JSON for downstream tools.

This closes the loop between **visual perception (Gemini)**, **decision-making (agent prompt + JSON policy)**, and **action execution** (via automation tools).

---

## Google GenAI SDK Dependencies

The backend depends on Google’s GenAI libraries via `emergentintegrations`:

- `google-genai`
- `google-generativeai`

These come in through `emergentintegrations` and are visible in `backend/requirements.txt`. They are the official Google GenAI SDKs used to call Gemini models.

---

## Optional Verification Endpoint for Judges

For easy verification that this project is configured to use Gemini, you can expose a simple info endpoint from the backend (example):

```python
@app.get("/api/genai-info")
async def genai_info() -> dict:
    return {
        "provider": "google-genai",
        "model": GEMINI_MODEL_NAVIGATION,
        "type": "vision+text agent for UI navigation",
    }
```

When the app is running, calling:

```http
GET /api/genai-info
```

would return something like:

```json
{
  "provider": "google-genai",
  "model": "gemini-2.5-pro",
  "type": "vision+text agent for UI navigation"
}
```

This gives Devpost judges a trivial way to confirm the configured model and provider.

---

## Suggested Devpost Submission Language

You can use wording like this in your Devpost submission:

> **Which Google GenAI product or SDK did you use?**  
> We use **Google Gemini (gemini-2.5-pro)** via the **Google GenAI SDK** (`google-genai` / `google-generativeai`), wrapped by a small integration layer (`emergentintegrations`). The backend sends screenshots and text goals to Gemini, which returns structured JSON actions for our UI navigation agent.
>
> **How is it used in your project?**  
> Gemini acts as the agent’s "brain":
> - It visually parses browser screenshots.
> - Understands high-level goals.
> - Decides the next UI action and returns normalized click coordinates, target descriptions, and status.  
> The React **UI Navigator Studio** lets users orchestrate multi-step workflows, visualize clicks overlaid on screenshots, and export full workflows as JSON.

This clearly demonstrates that:

- The project is an **agent** (automatic reasoning and action selection loop).
- It is powered by **Google GenAI / Gemini** via the official SDK stack.
