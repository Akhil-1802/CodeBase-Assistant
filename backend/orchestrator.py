from helper.utils import find_relevant_files, build_context, get_codebase_structure, get_all_repo_files
from helper.Session import session
from agents.general_agent import general_agent
from agents.Modify_agent import modify_agent
from agents.explain_agent import explain_agent
from agents.document_agent import document_agent
from agents.analyze_agent import analyze_agent
import json, re


def _parse_plan(raw: str) -> dict:
    """Parse planner output, stripping markdown fences if present."""
    cleaned = re.sub(r"^```[\w]*\n|\n```$", "", raw.strip())
    return json.loads(cleaned)


def route_request(plan: dict, user_query: str) -> str:
    intent = plan.get("intent", "general")

    repo_required = intent in {"explain", "search", "analyze", "document", "suggest_changes"}
    if repo_required and not session.active_repo:
        return "No repository loaded. Please provide a GitHub URL first.\n\nExample: `Load https://github.com/user/repo`"

    # --- repo_load ---
    if intent == "repo_load":
        return get_codebase_structure(plan["repo_url"])

    # --- explain ---
    elif intent == "explain":
        # Use targeted search for specific file/function queries,
        # fall back to all files for broad queries
        files = find_relevant_files(user_query, k=5)
        if not files:
            files = get_all_repo_files()
        context = build_context(files)
        response = explain_agent.invoke({
            "messages": [{
                "role": "user",
                "content": (
                    f"User Query: {user_query}\n\n"
                    f"Repository Context:\n{context}"
                ),
            }]
        })
        return response["messages"][-1].content

    # --- analyze ---
    elif intent == "analyze":
        # Analyze needs the full codebase for meaningful insights
        files = get_all_repo_files()
        context = build_context(files)
        response = analyze_agent.invoke({
            "messages": [{
                "role": "user",
                "content": (
                    f"User Request: {user_query}\n\n"
                    f"Repository Context:\n{context}"
                ),
            }]
        })
        return response["messages"][-1].content

    # --- document ---
    elif intent == "document":
        files = get_all_repo_files()
        context = build_context(files)
        response = document_agent.invoke({
            "messages": [{
                "role": "user",
                "content": (
                    f"User Request: {user_query}\n\n"
                    f"Repository Context:\n{context}"
                ),
            }]
        })
        return response["messages"][-1].content

    # --- suggest_changes ---
    elif intent == "suggest_changes":
        files = find_relevant_files(user_query, k=5)
        if not files:
            files = get_all_repo_files()
        context = build_context(files)
        response = modify_agent.invoke({
            "messages": [{
                "role": "user",
                "content": (
                    f"User Request: {user_query}\n\n"
                    f"Repository Context:\n{context}"
                ),
            }]
        })
        return response["messages"][-1].content

    # --- search ---
    elif intent == "search":
        files = find_relevant_files(user_query, k=8)
        if not files:
            return "No relevant files found for your query."
        file_list = "\n".join(f"- `{f}`" for f in files)
        return f"**Relevant files for:** _{user_query}_\n\n{file_list}"

    # --- general ---
    else:
        result = general_agent.invoke({
            "messages": [{"role": "user", "content": user_query}]
        })
        return result["messages"][-1].content


def process_request(plan_str: str, user_query: str):
    """CLI entry point."""
    print("Processing Request...", plan_str)
    plan = _parse_plan(plan_str)
    response = route_request(plan, user_query)
    print("Agent:", response)
