from agents.planner import planner
from orchestrator import process_request

if(__name__ == "__main__"):

    while True:
        user_query = input("User: ")
        if user_query.lower() in {"exit", "quit"}:
            break
        result = planner.invoke({
    "messages": [
        {
            "role": "user",
            "content": f"{user_query}"
        }]
        })
        messages = result["messages"]

        final_response = messages[-1].content
        process_request(final_response,user_query)