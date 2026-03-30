import hmac
import hashlib
import json
import time
import os
import random
import requests

from flask import Blueprint, request, jsonify
from supabase import create_client, Client

payment_bp = Blueprint("payment", __name__)

# ── Configuration (Variables d'environnement Render) ──────────
GENIUSPAY_BASE   = "https://pay.genius.ci/api/v1/merchant"
API_KEY          = os.environ.get("GENIUSPAY_API_KEY")
API_SECRET       = os.environ.get("GENIUSPAY_API_SECRET")
WEBHOOK_SECRET   = os.environ.get("GENIUSPAY_WEBHOOK_SECRET")

SUPABASE_URL     = os.environ.get("SUPABASE_URL")
SUPABASE_KEY     = os.environ.get("SUPABASE_KEY")

# Initialisation Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {
    "X-API-Key":     API_KEY,
    "X-API-Secret":  API_SECRET,
    "Content-Type": "application/json",
}

# ══════════════════════════════════════════════════════════════
#  1. INITIER LE PAIEMENT (Appelé par ton React)
# ══════════════════════════════════════════════════════════════

@payment_bp.route("/payment/initiate", methods=["POST"])
def initiate_payment():
    data = request.get_json()

    amount      = data.get("amount")
    phone       = data.get("phone")
    student_id  = data.get("student_id") # UUID de l'étudiant
    description = data.get("description", "Achat de Ticket")

    if not amount or not phone or not student_id:
        return jsonify({"error": "Données manquantes (amount, phone, student_id)"}), 400

    payload = {
        "amount": amount,
        "payment_method": "wave", # Ou "orange_money", "mtn_money"
        "description": description,
        "customer": { "phone": phone },
        "metadata": { "student_id": student_id } # On stocke l'ID ici pour le Webhook
    }

    try:
        resp = requests.post(f"{GENIUSPAY_BASE}/payments", headers=HEADERS, json=payload, timeout=15)
        resp.raise_for_status()
        result = resp.json()

        if not result.get("success"):
            return jsonify({"error": "Erreur GeniusPay", "details": result}), 502

        return jsonify({
            "reference":   result["data"]["reference"],
            "payment_url": result["data"].get("payment_url") or result["data"].get("checkout_url"),
            "status":      result["data"]["status"]
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 502

# ══════════════════════════════════════════════════════════════
#  2. WEBHOOK (Confirmation de paiement & Création Ticket)
# ══════════════════════════════════════════════════════════════

def _verify_signature(payload_bytes, timestamp, signature):
    if not WEBHOOK_SECRET: return False
    data_to_sign = f"{timestamp}.{payload_bytes.decode('utf-8')}"
    expected = hmac.new(WEBHOOK_SECRET.encode(), data_to_sign.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

@payment_bp.route("/payment/webhook", methods=["POST"])
def payment_webhook():
    # Récupération des headers de sécurité
    signature  = request.headers.get("X-Webhook-Signature", "")
    timestamp  = request.headers.get("X-Webhook-Timestamp", "")
    event_type = request.headers.get("X-Webhook-Event", "")
    raw_body   = request.get_data()

    # 1. Vérification de la sécurité
    if not _verify_signature(raw_body, timestamp, signature):
        return jsonify({"error": "Signature invalide"}), 401

    payload = json.loads(raw_body)
    data    = payload.get("data", {})
    metadata = data.get("metadata", {})
    student_id = metadata.get("student_id")
    reference  = data.get("reference")

    # 2. Si le paiement est un succès -> On crée le ticket immédiatement
    if event_type == "payment.success":
        if student_id:
            try:
                # GÉNÉRATION DU CODE À 6 CHIFFRES
                ticket_code = str(random.randint(100000, 999999))
                
                # INSERTION DANS SUPABASE
                new_ticket = {
                    "student_id": student_id,
                    "ticket_code": ticket_code
                }
                
                supabase.table("tickets").insert(new_ticket).execute()
                print(f"✅ SUCCÈS : Ticket {ticket_code} créé pour l'étudiant {student_id}")
                
            except Exception as e:
                print(f"⚠️ ERREUR BD : Impossible de créer le ticket | Ref: {reference} | Error: {str(e)}")
                # On ne bloque pas la réponse 200 pour éviter que GeniusPay boucle
        else:
            print(f"⚠️ ATTENTION : Succès reçu sans student_id | Ref: {reference}")

    # Log pour les autres états (optionnel)
    elif event_type == "payment.failed":
        print(f"❌ ÉCHEC : Le paiement {reference} a échoué.")

    return jsonify({"received": True}), 200

# ══════════════════════════════════════════════════════════════
#  3. ROUTES DE STATUT ET REDIRECTION (Pour le Frontend)
# ══════════════════════════════════════════════════════════════

@payment_bp.route("/payment/status/<reference>", methods=["GET"])
def check_status(reference):
    try:
        resp = requests.get(f"{GENIUSPAY_BASE}/payments/{reference}", headers=HEADERS, timeout=10)
        return jsonify(resp.json()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 502

@payment_bp.route("/payment/success", methods=["GET"])
def ui_success():
    return "<h1>Paiement Réussi !</h1><p>Votre ticket est en cours de génération.</p>", 200

@payment_bp.route("/payment/error", methods=["GET"])
def ui_error():
    return "<h1>Erreur</h1><p>Le paiement n'a pas pu être finalisé.</p>", 200