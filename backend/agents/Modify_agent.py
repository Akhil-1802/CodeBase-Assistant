from langchain_openrouter import ChatOpenRouter
from langchain.agents import create_agent
from dotenv import load_dotenv


load_dotenv()
    

model = ChatOpenRouter(
    model="openrouter/free",
    temperature=0, #randomness of the output
    max_tokens=1000, #maximum length of the output
    max_retries=2, #number of times to retry in case of failure
    # other params...
)

modify_agent = create_agent(
    model=model,
    tools=[],
    system_prompt="""
You are an expert software engineer who suggests code improvements.

You are given a User Request and Repository Context (file contents).

Respond in clean Markdown. For each suggestion:

1. State which file and what to change
2. Show the current code (in a code block)
3. Show the suggested replacement (in a code block)
4. Briefly explain why

Rules:
- Only suggest changes to code that exists in the context.
- Do not invent new files or functions that are not present.
- Be specific and actionable.
- Respond in Markdown only. Do NOT return raw JSON.
"""
)



