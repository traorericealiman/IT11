# backend/ticket_student.py
from flask import Blueprint, request, jsonify
import os
import jwt
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
JWT_SECRET   = os.environ["JWT_SECRET"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ticket_student_bp = Blueprint("ticket_student", __name__)

SUPPORT_PHONE = "0707406906"
TICKET_BUCKET = "tickets"  # ← nom de ton bucket Supabase Storage


def _bad(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _ok(message: str, data=None, status: int = 200):
    payload = {"message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def _require_student(req) -> dict | None:
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if not payload.get("sub"):
            return None
        return payload
    except jwt.PyJWTError:
        return None


def _signed_url(file_path: str, expires_in: int = 300) -> str | None:
    """Génère une URL signée valable `expires_in` secondes."""
    try:
        res = supabase.storage.from_(TICKET_BUCKET).create_signed_url(
            file_path, expires_in
        )
        return res.get("signedURL") or res.get("signed_url")
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────
#  GET /student/ticket-status
# ──────────────────────────────────────────────────────────────
@ticket_student_bp.route("/student/ticket-status", methods=["GET"])
def get_ticket_status():
    student = _require_student(request)
    if not student:
        return _bad("Accès refusé. Veuillez vous connecter.", 403)

    student_id = student["sub"]

    # 1. Toutes les demandes de paiement de l'étudiant
    payment_result = (
        supabase
        .table("payment_requests")
        .select("id, status, quantity, created_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )

    if not payment_result.data:
        return _ok("Aucune demande de paiement trouvée.", data={"status": "none"})

    # Dernière demande = référence pour le statut global
    latest = payment_result.data[0]
    latest_status = latest["status"]

    # Nombre total de tickets attendus (somme des quantity approuvées)
    total_expected = sum(
        p["quantity"] for p in payment_result.data if p["status"] == "approved"
    )

    # 2. Pending : aucune demande approuvée
    if latest_status == "pending" and total_expected == 0:
        return _ok(
            "Vous avez une demande de paiement en cours.",
            data={"status": "pending", "payment_request_id": latest["id"]}
        )

    # 3. Rejeté : dernière demande refusée et aucun ticket approuvé
    if latest_status == "rejected" and total_expected == 0:
        return _ok(
            f"Votre demande a été refusée. En cas d'erreur, contactez le {SUPPORT_PHONE}.",
            data={"status": "rejected", "support_phone": SUPPORT_PHONE}
        )

    # 4. Au moins une demande approuvée → récupérer les tickets disponibles
    tickets_result = (
        supabase
        .table("tickets")
        .select("id, ticket_code, ticket_url, created_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )

    tickets_ready = tickets_result.data or []

    # Générer une URL signée pour chaque ticket
    tickets = []
    for t in tickets_ready:
        # ticket_url contient le path dans le bucket, ex: "tickets/mon-fichier.pdf"
        signed = _signed_url(t["ticket_url"])
        tickets.append({
            "id":          t["id"],
            "ticket_code": t["ticket_code"],
            "ticket_url":  signed or t["ticket_url"],  # fallback si erreur
            "created_at":  t["created_at"],
        })

    return _ok(
        f"{len(tickets_ready)} billet(s) disponible(s) sur {total_expected} attendu(s).",
        data={
            "status":         "approved",
            "tickets":        tickets,
            "tickets_ready":  len(tickets_ready),
            "tickets_total":  total_expected,
        }
    )


# ──────────────────────────────────────────────────────────────
#  GET /student/ticket/<ticket_id>/download
#  Régénère une URL signée fraîche à la demande
# ──────────────────────────────────────────────────────────────
@ticket_student_bp.route("/student/ticket/<string:ticket_id>/download", methods=["GET"])
def download_ticket(ticket_id: str):
    student = _require_student(request)
    if not student:
        return _bad("Accès refusé. Veuillez vous connecter.", 403)

    student_id = student["sub"]

    result = (
        supabase
        .table("tickets")
        .select("id, ticket_code, ticket_url")
        .eq("id", ticket_id)
        .eq("student_id", student_id)   # sécurité : le ticket doit appartenir à l'étudiant
        .limit(1)
        .execute()
    )

    if not result.data:
        return _bad("Billet introuvable.", 404)

    ticket = result.data[0]
    signed = _signed_url(ticket["ticket_url"], expires_in=60)  # 60s, usage unique

    if not signed:
        return _bad("Impossible de générer le lien de téléchargement.", 500)

    return _ok("URL de téléchargement générée.", data={"download_url": signed})