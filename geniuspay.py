import os
import requests

BASE_URL = "https://pay.genius.ci/api/v1/merchant"


def _headers() -> dict:
    return {
        "X-API-Key":    os.environ.get("GENIUSPAY_API_KEY"),
        "X-API-Secret": os.environ.get("GENIUSPAY_API_SECRET"),
        "Content-Type": "application/json",
    }


def create_payment(
    amount: int,
    phone: str,
    payment_method: str = "wave",
    description: str = "",
    success_url: str = "",
    error_url: str = "",
    callback_url: str = "",
) -> dict:
    """Crée un paiement et retourne la réponse GeniusPay."""

    payload = {
        "amount":         amount,
        "payment_method": payment_method,   # "wave" | "orange_money" | "mtn_money"
        "customer":       {"phone": phone},
    }

    if description:  payload["description"]  = description
    if success_url:  payload["success_url"]  = success_url
    if error_url:    payload["error_url"]    = error_url
    if callback_url: payload["callback_url"] = callback_url

    response = requests.post(
        f"{BASE_URL}/payments",
        headers=_headers(),
        json=payload,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def get_payment(reference: str) -> dict:
    """Récupère un paiement par sa référence."""

    response = requests.get(
        f"{BASE_URL}/payments/{reference}",
        headers=_headers(),
        timeout=10,
    )
    response.raise_for_status()
    return response.json()