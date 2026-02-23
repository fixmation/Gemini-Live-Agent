"""
Gemini Live API client for real-time multimodal streaming.
Handles bidirectional audio/video streaming with Gemini Live endpoints.
"""

import asyncio
import base64
import json
import os
from typing import AsyncGenerator, Callable, Dict, Optional

import aiohttp
from google import genai
from google.genai import types


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
    ):
        """
        Stream audio input to Gemini Live and receive responses.
        
        Args:
            audio_chunks: Async generator yielding PCM audio bytes
            callback: Function called with each response chunk
        """
        try:
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO", "TEXT"],
            )
            
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
    ):
        """
        Stream both screen capture and voice input for live UI navigation.
        
        Args:
            audio_chunks: Voice commands from microphone
            screen_chunks: Screen capture frames
            goal: High-level navigation goal
            callback: Response handler
        """
        try:
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO", "TEXT"],
            )
            
            async with self.client.aio.live.connect(
                model=self.model,
                config=config
            ) as session:
                
                # Send initial goal
                await session.send({
                    "client_content": {
                        "turns": [{
                            "role": "user",
                            "parts": [{"text": f"Navigation Goal: {goal}"}]
                        }],
                        "turn_complete": False
                    }
                })
                
                # Stream audio and screen concurrently
                async def send_multimodal():
                    # Interleave audio and screen frames
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
                    
                    # Note: screen_chunks would be sent similarly but with image mime_type
                    # async for screen_chunk in screen_chunks:
                    #     screen_data = base64.b64encode(screen_chunk).decode('utf-8')
                    #     await session.send(...)
                
                async def receive_navigation_responses():
                    async for response in session.receive():
                        if hasattr(response, 'server_content'):
                            content = response.server_content
                            
                            # Parse navigation action from response
                            result = {
                                "type": "navigation",
                                "timestamp": asyncio.get_event_loop().time(),
                                "parts": []
                            }
                            
                            if hasattr(content, 'model_turn') and content.model_turn:
                                for part in content.model_turn.parts:
                                    if hasattr(part, 'text'):
                                        # Try to parse JSON action from text
                                        try:
                                            action = json.loads(part.text)
                                            result["action"] = action
                                        except json.JSONDecodeError:
                                            result["parts"].append({
                                                "type": "text",
                                                "content": part.text
                                            })
                                    elif hasattr(part, 'inline_data'):
                                        result["parts"].append({
                                            "type": "audio",
                                            "data": part.inline_data.data
                                        })
                            
                            callback(result)
                
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
            # Construct generation request with multiple modalities
            config = types.LiveConnectConfig(
                response_modalities=["TEXT", "AUDIO"],  # Add more as supported
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
