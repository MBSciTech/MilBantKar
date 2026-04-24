from __future__ import annotations

import argparse
import json
import os
import re
from typing import Any, Dict, List, Optional
from datetime import date, datetime

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
import uvicorn

load_dotenv()

MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
MAX_TURNS = int(os.getenv("CHATBOT_MAX_TURNS", "20"))
DEFAULT_SESSION_ID = "default"
BACKEND_API_BASE = os.getenv("MILBANTKAR_BACKEND_API_BASE_URL", "http://localhost:5000")
BACKEND_API_FALLBACK = os.getenv("MILBANTKAR_BACKEND_API_FALLBACK_URL", "https://milbantkar-1.onrender.com")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

APP_REQUIREMENTS = """
You are the official MilBantKar assistant.

Follow these rules in every response:
1. Be accurate and practical for MilBantKar workflows.
2. Prefer short, step-by-step guidance users can follow in-app.
3. If a feature is unclear or unavailable, say so clearly and suggest the closest valid action.
4. Never invent routes, buttons, or data that are not in the MilBantKar knowledge base.
5. Keep tone helpful, concise, and professional.
6. Keep answers concise unless user asks for details.
""".strip()

KNOWLEDGE_BASE = """
MilBantKar product knowledge:

- Purpose: Expense sharing and settlement tracking across users and events.

- Main navigation pages:
  /dashboard, /events, /history, /budget, /profile, /settings,
  /help, /transaction, /visualise, /scanner, /calculate, /admin.

- Events:
  Users can create events, add event details, and share event code with group members.

- Transactions / expenses:
  A transaction includes paidBy, paidTo, amount, description (optional), and date.
  paidBy and paidTo must be different users.

- Settlement:
  Settlement is complete only when both users confirm it.
  Until both confirm, settlement status remains pending.

- History:
  History shows expenses, settlement status, and reminders.
  Users can search by person, item/keyword, or amount-related intent.

- Reminders:
  Pending expenses can trigger reminders from history-related workflows.

- Profile:
  Users can update username, phone, email, and profile picture from profile settings.

- Authentication:
  Session is designed to stay signed in for about 15 days unless user logs out.

- Assistant scope:
  The assistant should help with navigation, events, expenses, settlements, reminders,
  history queries, profile/settings guidance, and general app usage.
""".strip()


def build_system_prompt() -> str:
    return f"{APP_REQUIREMENTS}\n\n{KNOWLEDGE_BASE}"


def build_initial_messages() -> List[Dict[str, str]]:
    return [{"role": "system", "content": build_system_prompt()}]


def trim_messages(messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
    if len(messages) <= (MAX_TURNS * 2) + 1:
        return messages

    # Preserve system prompt and most recent turns.
    return [messages[0], *messages[-(MAX_TURNS * 2):]]


def detect_action_type(message: str) -> str:
    lowered = str(message or "").lower()
    add_intents = [
        "add transaction", "create transaction", "new transaction",
        "make transaction", "add expense", "create expense",
        "record transaction", "log transaction", "mujhe transaction karna hai",
        "transaction karna hai", "transaction add karna hai", "kharcha karna hai", "payment karni hai",
        "paise dene", "paise bhejne", "send money", "expense karna hai",
    ]
    if any(intent in lowered for intent in add_intents):
        return "start_transaction"
    return "chat"


def is_transaction_add_request(message: str) -> bool:
    return detect_action_type(message) == "start_transaction"


def parse_json_payload(raw_text: str) -> dict:
    cleaned = str(raw_text or "").strip()

    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, re.DOTALL | re.IGNORECASE)
    if fence_match:
        cleaned = fence_match.group(1)

    start_index = cleaned.find("{")
    end_index = cleaned.rfind("}")
    if start_index != -1 and end_index != -1 and end_index > start_index:
        cleaned = cleaned[start_index:end_index + 1]

    return json.loads(cleaned)


def normalize_text(value: str) -> str:
    return (
        str(value or "")
        .lower()
        .replace("/", " ")
        .replace("_", " ")
        .replace("-", " ")
        .translate(str.maketrans({ch: " " for ch in "!@#$%^&*()[]{};:,?.<>\"'`~|\\"}))
        .split()
    )


def normalized_string(value: str) -> str:
    return " ".join(normalize_text(value))


def extract_search_terms(query: str) -> List[str]:
    stop_words = {
        "i", "want", "to", "see", "how", "much", "my", "me", "the", "a", "an",
        "for", "of", "and", "what", "who", "did", "paid", "pay", "spent", "spend",
        "transactions", "transaction", "with", "on", "in", "from", "all", "show",
        "find", "search", "history", "expense", "expenses", "please", "could", "you",
    }
    return [term for term in normalized_string(query).split() if term and term not in stop_words]


def is_history_query(message: str) -> bool:
    lowered = normalized_string(message)
    history_markers = [
        "history", "my transactions", "transactions i made", "what did i spend",
        "who did i pay", "to whom i paid", "for whom i paid", "for whom did i pay",
        "who received", "who got paid", "search transactions", "find transaction",
        "specific transaction", "transaction with", "expense with", "spent on",
        "paid for", "paid to", "paid by", "whom i paid", "whom did i pay",
    ]
    return any(marker in lowered for marker in history_markers)


def expense_matches_query(expense: dict, query: str, current_username: str = "") -> bool:
    normalized_query = normalized_string(query)
    searchable_text = normalized_string(
        " ".join([
            str(expense.get("description") or ""),
            str(expense.get("amount") or ""),
            str(expense.get("date") or ""),
            str(expense.get("paidBy", {}).get("username") if isinstance(expense.get("paidBy"), dict) else getattr(expense.get("paidBy"), "username", "") or ""),
            str(expense.get("paidTo", {}).get("username") if isinstance(expense.get("paidTo"), dict) else getattr(expense.get("paidTo"), "username", "") or ""),
        ])
    )

    search_terms = extract_search_terms(query)
    wants_my_transactions = (
        ("my" in normalized_query or "i" in normalized_query or "me" in normalized_query)
        and any(token in normalized_query for token in ["transaction", "transactions", "spent", "spend", "paid"])
    ) or "transactions i made" in normalized_query

    paid_by_username = ""
    paid_to_username = ""
    paid_by = expense.get("paidBy")
    paid_to = expense.get("paidTo")
    if isinstance(paid_by, dict):
        paid_by_username = str(paid_by.get("username") or "")
    if isinstance(paid_to, dict):
        paid_to_username = str(paid_to.get("username") or "")

    if wants_my_transactions and current_username:
        return paid_by_username == current_username or paid_to_username == current_username

    if "who did i pay" in normalized_query or "to whom i paid" in normalized_query:
        return paid_by_username == current_username

    if not search_terms:
        return bool(searchable_text and normalized_query and normalized_query in searchable_text)

    return any(term in searchable_text for term in search_terms)


def get_transaction_type(expense: dict, current_username: str) -> str:
    paid_by = expense.get("paidBy") or {}
    paid_to = expense.get("paidTo") or {}
    paid_by_username = paid_by.get("username") if isinstance(paid_by, dict) else ""
    paid_to_username = paid_to.get("username") if isinstance(paid_to, dict) else ""

    if paid_by_username == current_username:
        return "paid"
    if paid_to_username == current_username:
        return "received"
    return "pending"


def format_currency(amount: object) -> str:
    try:
        value = float(amount)
    except (TypeError, ValueError):
        value = 0.0
    return f"₹{value:,.2f}"


def format_short_date(date_value: object) -> str:
    if not date_value:
        return "Unknown date"
    try:
        from datetime import datetime

        parsed = datetime.fromisoformat(str(date_value).replace("Z", "+00:00"))
        return parsed.strftime("%d %b %Y")
    except Exception:
        return str(date_value)


def serialize_expense_for_chat(expense: dict, current_username: str) -> dict:
    paid_by = expense.get("paidBy") or {}
    paid_to = expense.get("paidTo") or {}
    return {
        "_id": str(expense.get("_id") or ""),
        "paidBy": paid_by,
        "paidTo": paid_to,
        "amount": expense.get("amount"),
        "description": expense.get("description"),
        "date": expense.get("date"),
        "status": bool(expense.get("status")),
        "direction": get_transaction_type(expense, current_username),
        "settlementConfirmation": expense.get("settlementConfirmation") or {},
    }


def summarize_search_results(results: List[dict], query: str, current_username: str) -> str:
    normalized_query = normalized_string(query)
    total_amount = 0.0
    for expense in results:
        try:
            total_amount += float(expense.get("amount") or 0)
        except (TypeError, ValueError):
            continue

    paid_count = sum(1 for expense in results if (expense.get("paidBy") or {}).get("username") == current_username)
    received_count = sum(1 for expense in results if (expense.get("paidTo") or {}).get("username") == current_username)

    if not results:
        return "I could not find any matching transactions. Try a different person, amount, or keyword."

    if "how much" in normalized_query or "total" in normalized_query:
        return f"I found {len(results)} matching transactions worth {format_currency(total_amount)}."

    if "who did i pay" in normalized_query or "to whom i paid" in normalized_query:
        return f"I found {len(results)} payment{'s' if len(results) != 1 else ''} made by you."

    return f"I found {len(results)} matching transaction{'s' if len(results) != 1 else ''}. {paid_count} sent, {received_count} received."


async def fetch_json(url: str) -> object:
    async with httpx.AsyncClient(timeout=20.0) as client_http:
        response = await client_http.get(url)
        response.raise_for_status()
        return response.json()


async def fetch_json_with_fallback(paths: List[str]) -> object:
    last_error: Optional[Exception] = None

    for base_url in [BACKEND_API_BASE, BACKEND_API_FALLBACK]:
        for path in paths:
            try:
                return await fetch_json(f"{base_url}{path}")
            except Exception as exc:
                last_error = exc

    if last_error:
        raise last_error

    raise RuntimeError("Unable to fetch JSON from any backend source")


async def fetch_current_username(user_id: Optional[str]) -> str:
    if not user_id:
        return ""

    try:
        users = await fetch_json_with_fallback(["/api/users"])
    except Exception:
        return ""

    if not isinstance(users, list):
        return ""

    for user in users:
        if str(user.get("_id")) == str(user_id):
            return str(user.get("username") or "")

    return ""


async def fetch_users_with_fallback() -> List[Dict[str, Any]]:
    users = await fetch_json_with_fallback(["/api/users"])
    return users if isinstance(users, list) else []

def get_expense_user_ref(expense_user: Any) -> Dict[str, str]:
    if isinstance(expense_user, dict):
        return {
            "id": str(expense_user.get("_id") or ""),
            "username": str(expense_user.get("username") or ""),
        }

    return {
        "id": str(getattr(expense_user, "_id", "") or ""),
        "username": str(getattr(expense_user, "username", "") or ""),
    }

def expense_belongs_to_user(expense: Dict[str, Any], user_id: Optional[str], current_username: str) -> bool:
    paid_by = get_expense_user_ref(expense.get("paidBy"))
    paid_to = get_expense_user_ref(expense.get("paidTo"))

    user_id_str = str(user_id or "")
    current_username_norm = normalized_string(current_username)

    return any([
        bool(user_id_str and paid_by["id"] == user_id_str),
        bool(user_id_str and paid_to["id"] == user_id_str),
        bool(current_username_norm and normalized_string(paid_by["username"]) == current_username_norm),
        bool(current_username_norm and normalized_string(paid_to["username"]) == current_username_norm),
    ])

def simplify_expense_for_ai(expense: Dict[str, Any], current_username: str) -> Dict[str, Any]:
    paid_by = get_expense_user_ref(expense.get("paidBy"))
    paid_to = get_expense_user_ref(expense.get("paidTo"))

    return {
        "_id": str(expense.get("_id") or ""),
        "paidByUsername": paid_by["username"],
        "paidToUsername": paid_to["username"],
        "amount": str(expense.get("amount") or ""),
        "description": str(expense.get("description") or ""),
        "date": str(expense.get("date") or ""),
        "status": bool(expense.get("status")),
        "direction": get_transaction_type(expense, current_username),
    }

def build_history_prompt(query: str, current_username: str, transactions: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    prompt = f"""
You are the MilBantKar history assistant.

The user wants to search ONLY their own transactions.
Use the provided transaction list to identify the most relevant matches.
Return JSON only with this exact shape:
{{
  "reply": "string",
  "selectedIds": ["transactionId1", "transactionId2"],
  "summary": "string"
}}

Rules:
- Match by description, person names, amount, date, or intent.
- If the query is specific, prefer the closest exact matches.
- If no matches are found, selectedIds must be an empty array and reply should say no matching transaction was found.
- Keep reply short and user-facing.
- Do not invent ids.

Current user: {current_username}
User query: {query}
Transactions: {json.dumps(transactions, ensure_ascii=True)}
""".strip()

    return [
        {"role": "system", "content": build_system_prompt()},
        {"role": "user", "content": prompt},
    ]

async def build_history_ai_selection(query: str, current_username: str, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    prompt_messages = build_history_prompt(query, current_username, transactions)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=prompt_messages,
        temperature=0.2,
    )

    raw_text = response.choices[0].message.content or "{}"
    return parse_json_payload(raw_text)


def safe_lookup_user(user_value: Any, users: List[Dict[str, Any]], current_user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not user_value:
        return None

    normalized_value = normalized_string(str(user_value))
    if normalized_value in {"me", "i", "myself"}:
        return current_user

    exact_match = next((user for user in users if normalized_string(str(user.get("username") or "")) == normalized_value), None)
    if exact_match:
        return exact_match

    return next(
        (
            user
            for user in users
            if normalized_value in normalized_string(str(user.get("username") or ""))
            or normalized_string(str(user.get("username") or "")) in normalized_value
        ),
        None,
    )


def build_transaction_prompt(message: str, user_id: Optional[str], step: Optional[str], draft: Optional[Dict[str, Any]], users: List[Dict[str, Any]], current_user: Dict[str, Any]) -> List[Dict[str, str]]:
    roster = [
        {"_id": str(user.get("_id") or ""), "username": str(user.get("username") or "")}
        for user in users
    ]

    current_draft = draft or {}
    prompt = f"""
You are the MilBantKar transaction assistant.

Your job is to understand a free-form transaction request and continue a step-by-step draft.

Rules:
- Current user is represented by the word me / i / myself.
- Use only users from the roster below.
- Resolve names and partial names to the best matching roster user.
- If the user message contains enough information, move the draft forward.
- Ask only one clear next question when information is missing or ambiguous.
- When the draft is complete, set nextStep to confirm and include a concise confirmation reply.
- Never invent a user that is not in the roster.
- Return JSON only. No markdown, no explanation.

Return this exact JSON shape:
{{
  "reply": "string",
  "nextStep": "paidBy|paidTo|amount|description|date|confirm",
  "complete": true or false,
  "missingFields": ["paidBy", "paidTo", "amount", "description", "date"],
  "draft": {{
    "paidById": "string",
    "paidByUsername": "string",
    "paidToId": "string",
    "paidToUsername": "string",
    "amount": "string",
    "description": "string",
    "date": "YYYY-MM-DD"
  }}
}}

Current step: {step or "paidBy"}
Current draft: {json.dumps(current_draft, ensure_ascii=True)}
Current user: {json.dumps({"_id": str(current_user.get("_id") or ""), "username": str(current_user.get("username") or "")}, ensure_ascii=True)}
Roster: {json.dumps(roster, ensure_ascii=True)}
Latest message: {message}
""".strip()

    return [
        {"role": "system", "content": build_system_prompt()},
        {"role": "user", "content": prompt},
    ]


def normalize_transaction_draft(raw_draft: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    draft = raw_draft or {}
    return {
        "paidById": str(draft.get("paidById") or ""),
        "paidByUsername": str(draft.get("paidByUsername") or ""),
        "paidToId": str(draft.get("paidToId") or ""),
        "paidToUsername": str(draft.get("paidToUsername") or ""),
        "amount": str(draft.get("amount") or ""),
        "description": str(draft.get("description") or ""),
        "date": str(draft.get("date") or ""),
    }


def extract_amount_from_text(message: str) -> str:
    amount_match = re.search(r"(\d+(?:\.\d{1,2})?)", str(message or ""))
    if not amount_match:
        return ""
    return amount_match.group(1)


def parse_date_input(value: str) -> str:
    raw_value = str(value or "").strip()
    normalized = normalized_string(raw_value)

    if any(token in normalized.split() for token in ["today", "aaj"]):
        return date.today().isoformat()

    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%Y/%m/%d"):
        try:
            parsed = datetime.strptime(raw_value, fmt)
            return parsed.date().isoformat()
        except ValueError:
            continue

    try:
        parsed = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
        return parsed.date().isoformat()
    except ValueError:
        return ""


def wants_to_skip_description(message: str) -> bool:
    normalized = normalized_string(message)
    skip_markers = [
        "skip", "skip it", "no description", "dont know", "do not know", "nahi pata",
        "mat likho", "none", "na", "kuch nahi", "leave blank",
    ]
    return any(marker in normalized for marker in skip_markers)


def find_user_in_message(message: str, users: List[Dict[str, Any]], current_user: Dict[str, Any], exclude_user_id: str = "", allow_current_user_ref: bool = True) -> Optional[Dict[str, Any]]:
    normalized_message = normalized_string(message)

    if allow_current_user_ref and any(token in normalized_message.split() for token in ["me", "i", "myself", "mai", "mein"]):
        if current_user.get("_id") and str(current_user.get("_id")) != str(exclude_user_id or ""):
            return current_user

    sorted_users = sorted(users, key=lambda item: len(str(item.get("username") or "")), reverse=True)

    for user in sorted_users:
        user_id = str(user.get("_id") or "")
        if exclude_user_id and user_id == str(exclude_user_id):
            continue

        username_norm = normalized_string(str(user.get("username") or ""))
        if not username_norm:
            continue

        if re.search(rf"\b{re.escape(username_norm)}\b", normalized_message):
            return user

    for user in sorted_users:
        user_id = str(user.get("_id") or "")
        if exclude_user_id and user_id == str(exclude_user_id):
            continue

        username_norm = normalized_string(str(user.get("username") or ""))
        if username_norm and username_norm in normalized_message:
            return user

    return None


async def build_transaction_flow_payload(message: str, user_id: Optional[str], step: Optional[str], draft: Optional[Dict[str, Any]]) -> ChatResponse:
    current_user = {"_id": "", "username": ""}
    users = await fetch_users_with_fallback()

    if user_id:
        current_user = next((user for user in users if str(user.get("_id")) == str(user_id)), current_user)

    if not current_user.get("_id") and user_id:
        current_user = {"_id": str(user_id), "username": await fetch_current_username(user_id)}

    prompt_messages = build_transaction_prompt(message, user_id, step, draft, users, current_user)

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=prompt_messages,
            temperature=0.2,
        )
        raw_text = response.choices[0].message.content or "{}"
        parsed = parse_json_payload(raw_text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to build transaction draft: {exc}") from exc

    normalized_draft = normalize_transaction_draft(parsed.get("draft"))
    normalized_message = normalized_string(message)
    current_step = str(step or parsed.get("nextStep") or "paidBy").strip() or "paidBy"

    if current_user.get("_id"):
        if current_step == "paidBy" and normalized_message in {"me", "i", "myself", "mai", "mein"}:
            normalized_draft["paidById"] = str(current_user.get("_id") or normalized_draft["paidById"])
            normalized_draft["paidByUsername"] = str(current_user.get("username") or normalized_draft["paidByUsername"])

        if any(phrase in normalized_message for phrase in ["me paid", "i paid", "my paid", "paid by me", "from me", "i sent", "i gave", "maine", "mene"]):
            normalized_draft["paidById"] = str(current_user.get("_id") or normalized_draft["paidById"])
            normalized_draft["paidByUsername"] = str(current_user.get("username") or normalized_draft["paidByUsername"])

        if any(phrase in normalized_message for phrase in ["paid to me", "paid me", "to me", "for me"]):
            normalized_draft["paidToId"] = str(current_user.get("_id") or normalized_draft["paidToId"])
            normalized_draft["paidToUsername"] = str(current_user.get("username") or normalized_draft["paidToUsername"])

    if not normalized_draft.get("paidById"):
        if current_step == "paidBy":
            matched_payer = find_user_in_message(message, users, current_user, allow_current_user_ref=True)
            if matched_payer:
                normalized_draft["paidById"] = str(matched_payer.get("_id") or "")
                normalized_draft["paidByUsername"] = str(matched_payer.get("username") or "")

    if not normalized_draft.get("paidToId"):
        if current_step == "paidTo" or any(token in normalized_message for token in ["paid to", "ko", "to "]):
            matched_receiver = find_user_in_message(
                message,
                users,
                current_user,
                exclude_user_id=str(normalized_draft.get("paidById") or ""),
                allow_current_user_ref=any(token in normalized_message for token in ["to me", "for me", "paid me"]),
            )
            if matched_receiver:
                normalized_draft["paidToId"] = str(matched_receiver.get("_id") or "")
                normalized_draft["paidToUsername"] = str(matched_receiver.get("username") or "")

    if not normalized_draft.get("amount"):
        extracted_amount = extract_amount_from_text(message)
        if extracted_amount:
            normalized_draft["amount"] = extracted_amount

    if current_step == "description" and not normalized_draft.get("description"):
        if wants_to_skip_description(message):
            normalized_draft["description"] = "No description"
        elif normalized_message not in {"description", "desc"}:
            cleaned_description = str(message or "").strip()
            if cleaned_description:
                normalized_draft["description"] = cleaned_description

    if current_step == "date" and not normalized_draft.get("date"):
        parsed_date = parse_date_input(message)
        if parsed_date:
            normalized_draft["date"] = parsed_date

    resolved_paid_by = safe_lookup_user(normalized_draft.get("paidById") or normalized_draft.get("paidByUsername"), users, current_user)
    if resolved_paid_by:
        normalized_draft["paidById"] = str(resolved_paid_by.get("_id") or normalized_draft["paidById"])
        normalized_draft["paidByUsername"] = str(resolved_paid_by.get("username") or normalized_draft["paidByUsername"])

    resolved_paid_to = safe_lookup_user(normalized_draft.get("paidToId") or normalized_draft.get("paidToUsername"), users, current_user)
    if resolved_paid_to:
        normalized_draft["paidToId"] = str(resolved_paid_to.get("_id") or normalized_draft["paidToId"])
        normalized_draft["paidToUsername"] = str(resolved_paid_to.get("username") or normalized_draft["paidToUsername"])

    same_user_on_both_sides = bool(normalized_draft.get("paidById") and normalized_draft.get("paidById") == normalized_draft.get("paidToId"))
    if same_user_on_both_sides:
        normalized_draft["paidToId"] = ""
        normalized_draft["paidToUsername"] = ""

    next_step = "paidBy"
    if not normalized_draft.get("paidById"):
        next_step = "paidBy"
    elif not normalized_draft.get("paidToId"):
        next_step = "paidTo"
    elif not normalized_draft.get("amount"):
        next_step = "amount"
    elif not normalized_draft.get("description") and "skip description" not in normalized_message:
        next_step = "description"
    elif not normalized_draft.get("date"):
        next_step = "date"
    else:
        next_step = "confirm"

    if next_step == "confirm":
        complete = True
    else:
        complete = False

    prompt_map = {
        "paidBy": "Who paid for this transaction? Type a username or say \"me\".",
        "paidTo": "Who received the money?",
        "amount": "How much was it?",
        "description": "What was it for? You can type skip if you want to leave it blank.",
        "date": "What date should I use? Type YYYY-MM-DD or say today.",
        "confirm": "Transaction draft is ready. Review below, then click Confirm Transaction.",
    }

    parsed_reply = str(parsed.get("reply") or prompt_map[next_step]).strip()
    if same_user_on_both_sides:
        parsed_reply = "Paid by and paid to cannot be the same person. Who received the money?"
    elif current_step == "description" and wants_to_skip_description(message):
        parsed_reply = prompt_map["date"]
    if next_step != "confirm":
        if not same_user_on_both_sides and not (current_step == "description" and wants_to_skip_description(message)):
            parsed_reply = prompt_map[next_step]

    rich_type = "transactionDraft" if complete else "transactionFlow"
    rich_data = {
        "draft": normalized_draft,
        "nextStep": next_step,
        "complete": complete,
        "missingFields": (
            (["paidBy"] if not normalized_draft.get("paidById") else [])
            + (["paidTo"] if not normalized_draft.get("paidToId") else [])
            + (["amount"] if not normalized_draft.get("amount") else [])
            + (["description"] if not normalized_draft.get("description") else [])
            + (["date"] if not normalized_draft.get("date") else [])
        ),
        "currentUsername": str(current_user.get("username") or ""),
    }

    return ChatResponse(
        reply=parsed_reply,
        actionType="start_transaction",
        cta=None,
        richType=rich_type,
        richData=rich_data,
    )


async def build_search_payload(message: str, user_id: Optional[str], session_messages: List[Dict[str, str]]) -> ChatResponse:
    try:
        expenses = await fetch_json_with_fallback(["/api/expense"])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to load expenses: {exc}") from exc

    if not isinstance(expenses, list):
        raise HTTPException(status_code=502, detail="Expense API returned an invalid payload")

    current_username = await fetch_current_username(user_id)
    current_user_expenses = [
        expense for expense in expenses
        if expense_belongs_to_user(expense, user_id, current_username)
    ]

    simplified_transactions = [
        simplify_expense_for_ai(expense, current_username)
        for expense in current_user_expenses[:80]
    ]

    ai_selected_ids: List[str] = []
    ai_reply = ""

    try:
        ai_result = await build_history_ai_selection(message, current_username, simplified_transactions)
        ai_selected_ids = [str(item) for item in (ai_result.get("selectedIds") or []) if str(item).strip()]
        ai_reply = str(ai_result.get("reply") or "").strip()
    except Exception:
        ai_selected_ids = []
        ai_reply = ""

    if ai_selected_ids:
        lookup = {str(expense.get("_id") or ""): expense for expense in current_user_expenses}
        relevant_expenses = [lookup[item_id] for item_id in ai_selected_ids if item_id in lookup]
    else:
        relevant_expenses = [expense for expense in current_user_expenses if expense_matches_query(expense, message, current_username)]

    serialized_results = [serialize_expense_for_chat(expense, current_username) for expense in relevant_expenses[:5]]
    reply = ai_reply or summarize_search_results(relevant_expenses, message, current_username)
    if not reply:
        reply = summarize_search_results(relevant_expenses, message, current_username)

    session_messages.append({"role": "assistant", "content": reply})
    session_messages[:] = trim_messages(session_messages)

    return ChatResponse(
        reply=reply,
        actionType="chat",
        cta=None,
        richType="searchResults",
        richData={
            "query": message,
            "results": serialized_results,
            "totalCount": len(relevant_expenses),
            "currentUsername": current_username,
        },
    )


def model_reply(messages: List[Dict[str, str]]) -> str:
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
    )
    return response.choices[0].message.content or "I can help with that."


class ChatRequest(BaseModel):
    message: str
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    conversationType: Optional[str] = None
    transactionStep: Optional[str] = None
    transactionDraft: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str
    actionType: str = "chat"
    cta: Optional[dict] = None
    richType: Optional[str] = None
    richData: Optional[dict] = None


session_store: Dict[str, List[Dict[str, str]]] = {}


def get_session_messages(session_id: str) -> List[Dict[str, str]]:
    if session_id not in session_store:
        session_store[session_id] = build_initial_messages()
    return session_store[session_id]


app = FastAPI(title="MilBantKar Chatbot API", version="1.0.0")

cors_origins = [origin.strip() for origin in os.getenv("CHATBOT_CORS_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/api/chatbot", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    user_message = str(payload.message or "").strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="message is required")

    session_id = (payload.sessionId or payload.userId or DEFAULT_SESSION_ID).strip() or DEFAULT_SESSION_ID
    messages = get_session_messages(session_id)

    is_transaction_context = str(payload.conversationType or "").lower() == "transaction" or bool(payload.transactionStep or payload.transactionDraft)

    if is_transaction_context or is_transaction_add_request(user_message):
        messages.append({"role": "user", "content": user_message})
        messages[:] = trim_messages(messages)
        return await build_transaction_flow_payload(
            user_message,
            payload.userId,
            payload.transactionStep,
            payload.transactionDraft,
        )

    if is_history_query(user_message):
        messages.append({"role": "user", "content": user_message})
        messages[:] = trim_messages(messages)
        return await build_search_payload(user_message, payload.userId, messages)

    messages.append({"role": "user", "content": user_message})
    messages[:] = trim_messages(messages)

    try:
        reply = model_reply(messages)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Chat model request failed: {exc}") from exc

    messages.append({"role": "assistant", "content": reply})
    messages[:] = trim_messages(messages)

    return ChatResponse(
        reply=reply,
        actionType=detect_action_type(user_message),
        cta=None,
        richType=None,
        richData=None,
    )


def run_cli() -> None:
    session_id = "cli"
    messages = get_session_messages(session_id)
    print("MilBantKar Chatbot is running... (type 'exit' to stop)\n")

    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Bot: Goodbye.")
            break

        messages.append({"role": "user", "content": user_input})
        messages[:] = trim_messages(messages)

        try:
            reply = model_reply(messages)
        except Exception as exc:
            print(f"Bot: I could not reach the model service right now. ({exc})")
            continue

        print("Bot:", reply)
        messages.append({"role": "assistant", "content": reply})
        messages[:] = trim_messages(messages)


def run_api(host: str, port: int) -> None:
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MilBantKar Chatbot (CLI + API)")
    parser.add_argument("--mode", choices=["cli", "api"], default="cli", help="Run chatbot in CLI or API mode")
    parser.add_argument("--host", default=os.getenv("CHATBOT_HOST", "0.0.0.0"), help="API host")
    parser.add_argument("--port", type=int, default=int(os.getenv("CHATBOT_PORT", "8000")), help="API port")
    args = parser.parse_args()

    if args.mode == "api":
        run_api(args.host, args.port)
    else:
        run_cli()