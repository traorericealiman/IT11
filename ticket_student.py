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


def _bad(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _ok(message: str, data=None, status: int = 200):
    payload = {"message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def _require_student(req) -> dict | None:
    """Vérifie le JWT et retourne le payload (doit contenir student_id)."""
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if not payload.get("student_id"):
            return None
        return payload
    except jwt.PyJWTError:
        return None


# ──────────────────────────────────────────────────────────────
#  GET /student/ticket-status
#  Vérifie l'état de la demande de paiement et renvoie
#  le(s) ticket(s) si la demande est approuvée.
# ──────────────────────────────────────────────────────────────
@ticket_student_bp.route("/student/ticket-status", methods=["GET"])
def get_ticket_status():
    student = _require_student(request)
    if not student:
        return _bad("Accès refusé. Veuillez vous connecter.", 403)

    student_id = student["student_id"]

    # 1. Chercher la dernière demande de paiement de l'étudiant
    payment_result = (
        supabase
        .table("payment_requests")
        .select("id, status, created_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    # Aucune demande trouvée
    if not payment_result.data:
        return _ok(
            "Aucune demande de paiement trouvée.",
            data={"status": "none"}
        )

    payment = payment_result.data[0]
    status  = payment["status"]

    # 2. Demande en attente
    if status == "pending":
        return _ok(
            "Vous avez une demande de paiement en cours. "
            "Veuillez patienter pendant que nous vérifions votre paiement.",
            data={"status": "pending", "payment_request_id": payment["id"]}
        )

    # 3. Demande rejetée
    if status == "rejected":
        return _ok(
            f"Votre demande de paiement a été refusée. "
            f"Si vous pensez qu'il s'agit d'une erreur, "
            f"veuillez contacter le {SUPPORT_PHONE}.",
            data={"status": "rejected", "support_phone": SUPPORT_PHONE}
        )

    # 4. Demande approuvée → récupérer le(s) ticket(s)
    if status == "approved":
        tickets_result = (
            supabase
            .table("tickets")
            .select("id, ticket_code, ticket_url, created_at")
            .eq("student_id", student_id)
            .order("created_at", desc=True)
            .execute()
        )

        if not tickets_result.data:
            # Cas rare : approuvé mais pas encore de ticket généré
            return _ok(
                "Votre paiement a été approuvé. "
                "Votre billet est en cours de génération, réessayez dans quelques instants.",
                data={"status": "approved", "tickets": []}
            )

        tickets = [
            {
                "id":          t["id"],
                "ticket_code": t["ticket_code"],
                "ticket_url":  t["ticket_url"],
                "created_at":  t["created_at"],
            }
            for t in tickets_result.data
        ]

        return _ok(
            "Votre paiement a été approuvé. Voici votre billet.",
            data={"status": "approved", "tickets": tickets}
        )

    # Statut inconnu
    return _bad("Statut de demande inconnu.", 500)