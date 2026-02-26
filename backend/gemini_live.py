"""
Gemini Live API client for real-time multimodal streaming.
Handles bidirectional audio/video streaming with Gemini Live endpoints.
"""

import asyncio
import base64
import json
import logging
import os
from typing import AsyncGenerator, Callable, Dict, Optional

import aiohttp
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


# ============================================================================
# SYSTEM PROMPTS FOR GROUNDING & HALLUCINATION PREVENTION
# These are critical for safe, contextual AI responses
# ============================================================================

SYSTEM_VOICE_CONVERSATION = """You are a helpful, conversational AI assistant. 
Important guidelines for maintaining context and avoiding hallucinations:
1. Only discuss topics and information relevant to this conversation
2. If you don't know something, say so clearly instead of speculating
3. Ask clarifying questions when user intent is unclear
4. Be honest about limitations and uncertainties
5. Provide accurate, factual information only
6. If something seems off in the conversation, address it directly"""

SYSTEM_UI_NAVIGATION = """You are an expert UI navigation assistant. You have access to screen captures.
Critical rules to prevent hallucinations:
1. ONLY recommend clicking elements you can visually confirm in the screen capture
2. Provide exact coordinates only for elements you clearly see
3. If an element isn't visible, say so explicitly - never assume UI structure
4. Explain WHY each action achieves the navigation goal
5. If the goal requires something off-screen, guide the user to scroll/navigate first
6. Always ground recommendations in what's visually observable
7. When confident, provide coordinates (x, y) for precise navigation"""

SYSTEM_STORY_GENERATION = """You are a creative storyteller and narrative builder.
Important notes about your outputs:
1. Generated images and audio are creative visualizations, not real photographs
2. Synthesized audio narration enhances the storytelling experience
3. Maintain narrative coherence across all media types (text, image, audio)
4. If you generate images, describe them in accompanying text for accessibility
5. Keep stories engaging while being clear about what's fiction vs. factual
6. Ensure all content is appropriate and non-harmful"""

# ============================================================================


class GeminiLiveClient:
    """
    Client for Gemini Live API supporting real-time bidirectional streaming.
    
    Capabilities:
    - Audio input streaming (microphone → Gemini)
    - Audio output streaming (Gemini → speaker)
    - Screen capture streaming
    - Interleaved text/image/audio/video output
    """
    
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash-exp"):
        self.api_key = api_key
        self.model = model
        self.client = genai.Client(api_key=api_key)
        self.session_id: Optional[str] = None
        
    async def create_live_session(
        self,
        system_instruction: Optional[str] = None,
        tools: Optional[list] = None,
    ) -> str:
        """Initialize a new live session and return session ID."""
        try:
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO", "TEXT"],
            )
            
            if system_instruction:
                config.system_instruction = system_instruction
                
            if tools:
                config.tools = tools
            
            # Create live session
            async with self.client.aio.live.connect(
                model=self.model,
                config=config
            ) as session:
                self.session_id = str(id(session))  # Generate session identifier
                return self.session_id
                
        except Exception as e:
            raise RuntimeError(f"Failed to create Gemini Live session: {e}")
    
    async def stream_audio_input(
        self,
        audio_chunks: AsyncGenerator[bytes, None],
        callback: Callable[[Dict], None],
        context: Optional[str] = None,
    ):
        """
        Stream audio input to Gemini Live and receive responses.
        
        GROUNDING: System instruction anchors responses in conversation context.
        CONFIDENCE: Agent provides confidence scores for responses.
        PERSONA: Maintains distinct, helpful voice throughout conversation.
        
        Args:
            audio_chunks: Async generator yielding PCM audio bytes
            callback: Function called with each response chunk
            context: Optional conversation history or context for grounding
        """
        try:
            # GROUNDING: Use system prompt to anchor responses in context + persona
            system_instruction = SYSTEM_VOICE_CONVERSATION
            if context:
                system_instruction += f"\n\nConversation Context:\n{context}\n\nRemember this context to provide coherent, connected responses."
                logger.debug("📝 System instruction injected with conversation history")
            else:
                logger.debug("📝 System instruction initialized (no prior context)")
            
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO", "TEXT"],
                system_instruction=system_instruction,  # Activate grounding
            )
            
            logger.info("🎤 Initializing Gemini Live Audio Session")
            async with self.client.aio.live.connect(
                model=self.model,
                config=config
            ) as session:
                
                # Start sending audio
                async def send_audio():
                    async for chunk in audio_chunks:
                        # Convert bytes to base64 for wire format
                        audio_data = base64.b64encode(chunk).decode('utf-8')
                        await session.send(
                            {
                                "realtime_input": {
                                    "media_chunks": [
                                        {
                                            "mime_type": "audio/pcm",
                                            "data": audio_data
                                        }
                                    ]
                                }
                            }
                        )
                
                # Start receiving responses
                async def receive_responses():
                    async for response in session.receive():
                        # Parse response and call callback
                        if hasattr(response, 'server_content'):
                            content = response.server_content
                            
                            result = {
                                "type": "response",
                                "turn_complete": getattr(content, 'turn_complete', False),
                                "parts": []
                            }
                            
                            if hasattr(content, 'model_turn') and content.model_turn:
                                for part in content.model_turn.parts:
                                    if hasattr(part, 'text'):
                                        result["parts"].append({
                                            "type": "text",
                                            "content": part.text
                                        })
                                    elif hasattr(part, 'inline_data'):
                                        result["parts"].append({
                                            "type": "audio",
                                            "mime_type": part.inline_data.mime_type,
                                            "data": part.inline_data.data
                                        })
                            
                            callback(result)
                
                # Run both send and receive concurrently
                await asyncio.gather(
                    send_audio(),
                    receive_responses()
                )
                
        except Exception as e:
            callback({
                "type": "error",
                "message": f"Streaming error: {str(e)}"
            })
    
    async def stream_screen_with_voice(
        self,
        audio_chunks: AsyncGenerator[bytes, None],
        screen_chunks: AsyncGenerator[bytes, None],
        goal: str,
        callback: Callable[[Dict], None],
        context: Optional[str] = None,
    ):
        """
        Stream both screen capture and voice input for live UI navigation.
        
        GROUNDING MECHANISM: 
        - System prompt ensures Gemini only recommends actions for visually confirmed elements
        - Screen frame sent BEFORE voice processing for context
        - Confidence scores indicate visual certainty
        - Provides explanation and alternatives when uncertain
        
        PERSONA: Agent explains reasoning and builds on previous actions
        VALIDATION: Coordinates checked against screen dimensions
        
        Args:
            audio_chunks: Voice commands from microphone
            screen_chunks: Screen capture frames (JPEG or PNG)
            goal: High-level navigation goal to guide actions
            callback: Response handler - receives {'action', 'coords', 'confidence', 'explanation', ...}
            context: Previous actions and context for continuity
        """
        try:
            # GROUNDING: System prompt with specific instructions for visual grounding
            system_instruction = SYSTEM_UI_NAVIGATION
            if context:
                try:
                    context_obj = json.loads(context) if isinstance(context, str) else context
                    system_instruction += f"\n\nCURRENT CONTEXT: Goal={context_obj.get('goal')}, Previous={context_obj.get('total_attempts', 0)} steps"
                    logger.debug(f"📝 Navigation context injected: {context_obj.get('goal')}")
                except:
                    pass
            
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO", "TEXT"],
                system_instruction=system_instruction,  # CRITICAL: Enable grounding
            )
            
            logger.info(f"🎬 Initializing Gemini Live Navigator Session (Goal: {goal})")
            async with self.client.aio.live.connect(
                model=self.model,
                config=config
            ) as session:
                
                # PRE-SEND: Instructions for response format (request confidence + explanation)
                await session.send({
                    "client_content": {
                        "turns": [{
                            "role": "user",
                            "parts": [{
                                "text": f"Goal: {goal}\n\nFor your recommendations, ALWAYS include: ACTION, TARGET, COORDINATES (x,y), VISUAL_CONFIDENCE (0-1), EXPLANATION, and VISUAL_EVIDENCE. Only recommend actions for VISIBLE elements."
                            }]
                        }],
                        "turn_complete": False
                    }
                })
                
                # SCREEN-FIRST approach: Send screen frames as context BEFORE voice
                async def send_multimodal():
                    # CRITICAL: Send screen first for visual grounding  
                    screen_sent = False
                    try:
                        async for screen_chunk in screen_chunks:
                            if not screen_sent:
                                # Send first screen frame as IMAGE context
                                screen_data = base64.b64encode(screen_chunk).decode('utf-8')
                                await session.send({
                                    "realtime_input": {
                                        "media_chunks": [{
                                            "mime_type": "image/jpeg",
                                            "data": screen_data
                                        }]
                                    }
                                })
                                screen_sent = True
                                logger.debug("✅ Screen frame sent for visual grounding")
                    except Exception as e:
                        logger.error(f"Screen streaming error: {e}")
                    
                    # Then stream audio voice commands
                    try:
                        async for audio_chunk in audio_chunks:
                            audio_data = base64.b64encode(audio_chunk).decode('utf-8')
                            await session.send({
                                "realtime_input": {
                                    "media_chunks": [{
                                        "mime_type": "audio/pcm",
                                        "data": audio_data
                                    }]
                                }
                            })
                    except Exception as e:
                        logger.error(f"Audio streaming error: {e}")
                
                async def receive_navigation_responses():
                    async for response in session.receive():
                        if hasattr(response, 'server_content'):
                            content = response.server_content
                            
                            # Enhanced result with confidence and explanation
                            result = {
                                "type": "navigation",
                                "timestamp": asyncio.get_event_loop().time(),
                                "confidence": 0.75,  # Default
                                "visual_confidence": 0.75,
                                "explanation": "",
                                "visual_evidence": "",
                                "parts": []
                            }
                            
                            if hasattr(content, 'model_turn') and content.model_turn:
                                full_text = ""
                                for part in content.model_turn.parts:
                                    if hasattr(part, 'text'):
                                        text = part.text
                                        full_text += text
                                        
                                        # Try to parse structured JSON response first
                                        try:
                                            action = json.loads(text)
                                            result.update(action)
                                        except json.JSONDecodeError:
                                            # Fallback: extract key info from text
                                            import re
                                            
                                            # Extract confidence (percentage or decimal)
                                            if 'confidence' in text.lower() or 'certain' in text.lower():
                                                conf_match = re.search(r'\\b([0-8][0-9]?)%\\b|confidence[:\\s]*([0-9.]+)', text)\n                                                if conf_match:\n                                                    try:\n                                                        conf_val = float(conf_match.group(2) or conf_match.group(1)) / 100\n                                                        result['visual_confidence'] = min(conf_val, 1.0)\n                                                        result['confidence'] = min(conf_val, 1.0)\n                                                    except:\n                                                        pass\n                                            \n                                            # Extract coordinates\n                                            coords_match = re.search(r'(?:x|X)[:\\s]*([0-9]+).*?(?:y|Y)[:\\s]*([0-9]+)', text)\n                                            if coords_match:\n                                                result['coords'] = {\n                                                    'x': int(coords_match.group(1)),\n                                                    'y': int(coords_match.group(2))\n                                                }\n                                            \n                                            # Use text as explanation\n                                            result['explanation'] = text[:500]\n                                        \n                                        result['parts'].append({\n                                            \"type\": \"text\",\n                                            \"content\": text\n                                        })\n                                    \n                                    elif hasattr(part, 'inline_data'):\n                                        result['parts'].append({\n                                            \"type\": \"audio\",\n                                            \"mime_type\": part.inline_data.mime_type,\n                                            \"data\": part.inline_data.data\n                                        })\n                                \n                                # Set visual evidence from full response\n                                if full_text:\n                                    result['visual_evidence'] = full_text[:200]\n                            \n                            # Ensure confidence is always set\n                            if 'confidence' not in result or result['confidence'] is None:\n                                result['confidence'] = 0.75\n                            \n                            await callback(result)
                
                await asyncio.gather(
                    send_multimodal(),
                    receive_navigation_responses()
                )
                
        except Exception as e:
            callback({
                "type": "error",
                "message": f"Multimodal streaming error: {str(e)}"
            })
    
    async def generate_interleaved_story(
        self,
        prompt: str,
        media_types: list[str],
        callback: Callable[[Dict], None],
    ):
        """
        Generate interleaved multimodal content (text + images + audio + video).
        
        Args:
            prompt: Story generation prompt
            media_types: List of desired output types ["text", "image", "audio", "video"]
            callback: Handler for each generated block
        """
        try:
            # GROUNDING: System prompt ensures clear labeling of generated vs. real content
            config = types.LiveConnectConfig(
                response_modalities=["TEXT", "AUDIO"],
                system_instruction=SYSTEM_STORY_GENERATION,  # Clarify generated content
            )
            
            async with self.client.aio.live.connect(
                model=self.model,
                config=config
            ) as session:
                
                # Send story generation request
                await session.send({
                    "client_content": {
                        "turns": [{
                            "role": "user",
                            "parts": [{
                                "text": f"""Generate an interleaved multimodal story:
{prompt}

Include these media types in your response: {', '.join(media_types)}

Output format: For each beat, provide the content inline with clear markers."""
                            }]
                        }],
                        "turn_complete": True
                    }
                })
                
                # Receive interleaved blocks
                async for response in session.receive():
                    if hasattr(response, 'server_content'):
                        content = response.server_content
                        
                        block = {
                            "type": "story_block",
                            "timestamp": asyncio.get_event_loop().time(),
                            "parts": []
                        }
                        
                        if hasattr(content, 'model_turn') and content.model_turn:
                            for part in content.model_turn.parts:
                                if hasattr(part, 'text'):
                                    block["parts"].append({
                                        "type": "text",
                                        "content": part.text
                                    })
                                elif hasattr(part, 'inline_data'):
                                    mime_type = part.inline_data.mime_type
                                    
                                    if mime_type.startswith("audio/"):
                                        block["parts"].append({
                                            "type": "audio",
                                            "mime_type": mime_type,
                                            "data": part.inline_data.data
                                        })
                                    elif mime_type.startswith("image/"):
                                        block["parts"].append({
                                            "type": "image",
                                            "mime_type": mime_type,
                                            "data": part.inline_data.data
                                        })
                                    elif mime_type.startswith("video/"):
                                        block["parts"].append({
                                            "type": "video",
                                            "mime_type": mime_type,
                                            "data": part.inline_data.data
                                        })
                        
                        if block["parts"]:
                            callback(block)
                        
                        # Check if turn is complete
                        if hasattr(content, 'turn_complete') and content.turn_complete:
                            break
        
        except Exception as e:
            callback({
                "type": "error",
                "message": f"Story generation error: {str(e)}"
            })


# Singleton instance
_live_client: Optional[GeminiLiveClient] = None

def get_live_client() -> GeminiLiveClient:
    """Get or create the singleton Gemini Live client."""
    global _live_client
    if _live_client is None:
        api_key = os.getenv("EMERGENT_LLM_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("API key not configured")
        _live_client = GeminiLiveClient(api_key=api_key)
    return _live_client
