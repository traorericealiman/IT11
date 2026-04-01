# backend/test_paiement.py
"""
Script de test pour toutes les routes de paiement.
Lance d'abord le serveur : python app.py
Puis dans un autre terminal : python test_paiement.py
"""
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ─────────────────────────────────────────────
BASE_URL     = "http://127.0.0.1:5000"
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")

# Importer encrypt_aes depuis le module crypto
sys.path.insert(0, os.path.dirname(__file__))
from utils.crypto import encrypt_aes, decrypt_aes

# ── Couleurs terminal ──────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def log_title(title: str):
    print(f"\n{BOLD}{BLUE}{'═'*55}{RESET}")
    print(f"{BOLD}{BLUE}  {title}{RESET}")
    print(f"{BOLD}{BLUE}{'═'*55}{RESET}")

def log_ok(label: str, data=None):
    print(f"{GREEN}✔ {label}{RESET}")
    if data:
        print(f"  {data}")

def log_err(label: str, data=None):
    print(f"{RED}✘ {label}{RESET}")
    if data:
        print(f"  {data}")

def log_info(label: str):
    print(f"{YELLOW}ℹ {label}{RESET}")


# ══════════════════════════════════════════════════════════════
#  UTILITAIRES
# ══════════════════════════════════════════════════════════════

def encrypt_payload(data: dict) -> dict:
    """Chiffre toutes les valeurs d'un dictionnaire."""
    return {k: encrypt_aes(str(v)) for k, v in data.items()}


def admin_headers() -> dict:
    return {
        "Content-Type":  "application/json",
        "Authorization": f"Bearer {ADMIN_SECRET}",
    }


def json_headers() -> dict:
    return {"Content-Type": "application/json"}


# ══════════════════════════════════════════════════════════════
#  TEST 0 : Vérification du chiffrement/déchiffrement
# ══════════════════════════════════════════════════════════════

def test_crypto():
    log_title("TEST 0 — Chiffrement / Déchiffrement AES")
    textes = ["hello", "bf568312-7c20-4a44-9a0e-8ff0f5858213", "5050", "+22507000000"]
    tous_ok = True
    for t in textes:
        chiffre  = encrypt_aes(t)
        dechiffre = decrypt_aes(chiffre)
        if dechiffre == t:
            log_ok(f"'{t}' → chiffré → déchiffré OK")
        else:
            log_err(f"'{t}' → ERREUR : obtenu '{dechiffre}'")
            tous_ok = False
    return tous_ok


# ══════════════════════════════════════════════════════════════
#  TEST 1 : POST /payment/request
# ══════════════════════════════════════════════════════════════

def test_payment_request(student_id: str) -> str | None:
    log_title("TEST 1 — POST /payment/request")

    payload = encrypt_payload({
        "student_id":   student_id,
        "quantity":     1,
        "amount":       5050,
        "sender_phone": "+22507000000",
    })

    log_info(f"Envoi vers {BASE_URL}/payment/request")
    r = requests.post(f"{BASE_URL}/payment/request", json=payload, headers=json_headers())
    print(f"  Status : {r.status_code}")
    print(f"  Body   : {r.json()}")

    if r.status_code == 201:
        payment_id = r.json().get("data", {}).get("payment_id")
        log_ok("Paiement créé", f"payment_id = {payment_id}")
        return payment_id
    else:
        log_err("Échec création paiement")
        return None


# ══════════════════════════════════════════════════════════════
#  TEST 2 : POST /payment/approve/<id>
# ══════════════════════════════════════════════════════════════

def test_payment_approve(payment_id: str):
    log_title("TEST 2 — POST /payment/approve/<id>")

    # 2a. Sans token admin → doit retourner 401
    log_info("2a. Sans token admin (doit retourner 401)")
    r = requests.post(f"{BASE_URL}/payment/approve/{payment_id}", headers=json_headers())
    print(f"  Status : {r.status_code}")
    if r.status_code == 401:
        log_ok("401 reçu comme attendu")
    else:
        log_err(f"Attendu 401, reçu {r.status_code}")

    # 2b. Avec token admin → doit retourner 200
    log_info("2b. Avec token admin (doit retourner 200)")
    r = requests.post(f"{BASE_URL}/payment/approve/{payment_id}", headers=admin_headers())
    print(f"  Status : {r.status_code}")
    print(f"  Body   : {r.json()}")
    if r.status_code == 200:
        log_ok("Paiement approuvé", r.json().get("data"))
    else:
        log_err("Échec approbation", r.json())

    # 2c. Double appel → doit retourner 409
    log_info("2c. Double appel (doit retourner 409)")
    r = requests.post(f"{BASE_URL}/payment/approve/{payment_id}", headers=admin_headers())
    print(f"  Status : {r.status_code}")
    if r.status_code == 409:
        log_ok("409 reçu comme attendu (protection double-appel)")
    else:
        log_err(f"Attendu 409, reçu {r.status_code}")


# ══════════════════════════════════════════════════════════════
#  TEST 3 : POST /tickets
# ══════════════════════════════════════════════════════════════

def test_get_tickets(student_id: str):
    log_title("TEST 3 — POST /tickets")

    payload = {"student_id": encrypt_aes(student_id)}

    r = requests.post(f"{BASE_URL}/tickets", json=payload, headers=json_headers())
    print(f"  Status : {r.status_code}")
    print(f"  Body   : {r.json()}")

    if r.status_code == 200:
        tickets = r.json().get("data", {}).get("tickets", [])
        log_ok(f"{len(tickets)} ticket(s) récupéré(s)")
        for t in tickets:
            print(f"    → code: {t.get('ticket_code')}  |  créé: {t.get('created_at')}")
    else:
        log_err("Échec récupération tickets", r.json())


# ══════════════════════════════════════════════════════════════
#  TEST 4 : POST /payment/history
# ══════════════════════════════════════════════════════════════

def test_payment_history(student_id: str):
    log_title("TEST 4 — POST /payment/history")

    payload = {"student_id": encrypt_aes(student_id)}

    r = requests.post(f"{BASE_URL}/payment/history", json=payload, headers=json_headers())
    print(f"  Status : {r.status_code}")
    print(f"  Body   : {r.json()}")

    if r.status_code == 200:
        data     = r.json().get("data", {})
        total    = data.get("total", 0)
        payments = data.get("payments", [])
        log_ok(f"{total} paiement(s) récupéré(s)")
        for p in payments:
            print(f"    → id: {p.get('id')}  |  status: {p.get('status')}  |  montant: {p.get('amount_paid')}")
    else:
        log_err("Échec récupération historique", r.json())


# ══════════════════════════════════════════════════════════════
#  TEST 5 : Cas d'erreur
# ══════════════════════════════════════════════════════════════

def test_erreurs(student_id: str):
    log_title("TEST 5 — Cas d'erreur")

    # Montant incohérent
    log_info("5a. Montant incohérent (doit retourner 400)")
    payload = encrypt_payload({
        "student_id":   student_id,
        "quantity":     1,
        "amount":       9999,   # ❌ mauvais montant
        "sender_phone": "+22507000000",
    })
    r = requests.post(f"{BASE_URL}/payment/request", json=payload, headers=json_headers())
    print(f"  Status : {r.status_code} | {r.json()}")
    if r.status_code == 400:
        log_ok("400 reçu comme attendu")
    else:
        log_err(f"Attendu 400, reçu {r.status_code}")

    # Quantité invalide
    log_info("5b. Quantité invalide (doit retourner 400)")
    payload = encrypt_payload({
        "student_id":   student_id,
        "quantity":     99,    # ❌ quantité invalide
        "amount":       5050,
        "sender_phone": "+22507000000",
    })
    r = requests.post(f"{BASE_URL}/payment/request", json=payload, headers=json_headers())
    print(f"  Status : {r.status_code} | {r.json()}")
    if r.status_code == 400:
        log_ok("400 reçu comme attendu")
    else:
        log_err(f"Attendu 400, reçu {r.status_code}")

    # ID paiement inexistant
    log_info("5c. Approbation ID inexistant (doit retourner 404)")
    r = requests.post(f"{BASE_URL}/payment/approve/00000000-0000-0000-0000-000000000000", headers=admin_headers())
    print(f"  Status : {r.status_code} | {r.json()}")
    if r.status_code == 404:
        log_ok("404 reçu comme attendu")
    else:
        log_err(f"Attendu 404, reçu {r.status_code}")


# ══════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # ⚠️ Remplace par un vrai student_id présent dans ta base Supabase
    STUDENT_ID = "2e93f74a-9d2c-4d4a-941f-4e278f116749"

    # Lancer les tests
    test_crypto()
    payment_id = test_payment_request(STUDENT_ID)

    if payment_id:
        test_payment_approve(payment_id)
        test_get_tickets(STUDENT_ID)
        test_payment_history(STUDENT_ID)

    test_erreurs(STUDENT_ID)

    print(f"\n{BOLD}{GREEN}{'═'*55}{RESET}")
    print(f"{BOLD}{GREEN}  Tests terminés !{RESET}")
    print(f"{BOLD}{GREEN}{'═'*55}{RESET}\n")