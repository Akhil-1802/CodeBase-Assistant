from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json, asyncio
from functools import partial

from agents.planner import planner
from orchestrator import _parse_plan, route_request
from helper.Session import session

app = FastAPI(title="Codebase Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://codebase-assistant.netlify.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


def _run_chat(user_query: str) -> dict:
    """Blocking LLM calls — runs in a thread pool."""
    result = planner.invoke({
        "messages": [{"role": "user", "content": user_query}]
    })
    raw_plan = result["messages"][-1].content

    try:
        plan = _parse_plan(raw_plan)
    except (json.JSONDecodeError, ValueError):
        return {"response": "Sorry, I couldn't classify that request. Please try rephrasing.", "intent": "error"}

    intent = plan.get("intent", "general")
    response = route_request(plan, user_query)

    return {
        "response": response,
        "intent": intent,
        "active_repo": session.active_repo,
    }


@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, partial(_run_chat, req.message))
        return result
    except Exception as e:
        err = str(e)
        if "TooManyRequests" in err or "429" in err or "rate" in err.lower():
            msg = "The AI model is rate-limited right now. Please wait a few seconds and try again."
        elif "timeout" in err.lower() or "Timeout" in err:
            msg = "The request timed out. Please try again."
        elif "API" in err or "auth" in err.lower():
            msg = "API authentication error. Please check your API key in the `.env` file."
        else:
            msg = f"An unexpected error occurred: {err}"

        return JSONResponse(
            status_code=200,
            content={"response": msg, "intent": "error", "active_repo": session.active_repo},
        )
