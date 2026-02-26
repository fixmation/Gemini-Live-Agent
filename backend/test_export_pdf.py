import base64
import json
from pathlib import Path
from fastapi.testclient import TestClient
from server import app

def test_export_pdf():
    client = TestClient(app)
    # Use a small PNG as a test image (1x1 pixel)
    img_path = Path(__file__).parent / "testdata" / "dot.png"
    img_b64 = None
    if img_path.exists():
        img_b64 = "data:image/png;base64," + base64.b64encode(img_path.read_bytes()).decode()
    payload = {
        "session_id": "test-session-123",
        "global_goal": "Demo PDF export",
        "generated_at": "2026-02-26T12:00:00Z",
        "screenshots": ([{"step": 1, "image_base64": img_b64}] if img_b64 else []),
        "context": {
            "recent_history": [
                {"step": 1, "action": "CLICK", "target": "Login Button", "status": "SUCCESS", "plan": "Click login", "coords": {"x": 500, "y": 200}},
                {"step": 2, "action": "TYPE", "target": "Username Field", "status": "IN_PROGRESS", "plan": "Type username", "coords": {"x": 300, "y": 150}}
            ]
        }
    }
    resp = client.post("/export/pdf", json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:4] == b"%PDF"
    print("PDF export endpoint test passed.")

if __name__ == "__main__":
    test_export_pdf()
    print("Done.")
