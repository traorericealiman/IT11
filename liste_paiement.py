# backend/paiement_admin.py
from flask import Blueprint, request, jsonify
import os
import jwt
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
JWT_SECRET   = os.environ["JWT_SECRET"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

payment_admin_bp = Blueprint("payment_admin", __name__)


def _bad(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _ok(message: str, data=None, status: int = 200):
    payload = {"message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def _require_admin(req) -> dict | None:
    """Vérifie le JWT et s'assure que is_admin = True. Retourne le payload ou None."""
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if not payload.get("is_admin"):
            return None
        return payload
    except jwt.PyJWTError:
        return None

@payment_admin_bp.route("/admin/payment-requests", methods=["GET"])
def get_payment_requests():
    admin = _require_admin(request)
    if not admin:
        return _bad("Accès refusé. Token admin invalide ou manquant.", 403)

    status_filter = request.args.get("status")

    query = (
        supabase
        .table("payment_requests")
        .select(
            "id, quantity, amount_paid, sender_phone, status, created_at, "
            "students(id, first_name, last_name, phone)"
        )
        .order("created_at", desc=True)
    )

    if status_filter in ("pending", "approved", "rejected"):
        query = query.eq("status", status_filter)

    result = query.execute()

    if result.data is None:
        return _bad("Erreur lors de la récupération des données.", 500)

    rows = []
    for r in result.data:
        student = r.get("students") or {}
        rows.append({
            "id":           r["id"],
            "student_id":   student.get("id"),
            "first_name":   student.get("first_name"),
            "last_name":    student.get("last_name"),
            "phone":        student.get("phone"),
            "quantity":     r["quantity"],
            "amount_paid":  r["amount_paid"],
            "sender_phone": r["sender_phone"],
            "status":       r["status"],
            "created_at":   r["created_at"],
        })

    return _ok("Liste des demandes de paiement.", data=rows)



@payment_admin_bp.route("/admin/payment-requests/<string:request_id>/approve", methods=["PATCH"])
def approve_payment_request(request_id: str):
    admin = _require_admin(request)
    if not admin:
        return _bad("Accès refusé. Token admin invalide ou manquant.", 403)

    result = (
        supabase
        .table("payment_requests")
        .update({"status": "approved"})
        .eq("id", request_id)
        .execute()
    )

    if not result.data:
        return _bad("Demande introuvable.", 404)

    return _ok("Demande approuvée avec succès.", data=result.data[0])


@payment_admin_bp.route("/admin/payment-requests/<string:request_id>/reject", methods=["PATCH"])
def reject_payment_request(request_id: str):
    admin = _require_admin(request)
    if not admin:
        return _bad("Accès refusé. Token admin invalide ou manquant.", 403)

    check = (
        supabase
        .table("payment_requests")
        .select("id, status")
        .eq("id", request_id)
        .limit(1)
        .execute()
    )

    if not check.data:
        return _bad("Demande introuvable.", 404)

    if check.data[0]["status"] != "pending":
        return _bad("Seules les demandes en attente peuvent être refusées.", 400)

    result = (
        supabase
        .table("payment_requests")
        .update({"status": "rejected"})
        .eq("id", request_id)
        .execute()
    )

    if not result.data:
        return _bad("Erreur lors du refus de la demande.", 500)

    return _ok("Demande refusée.", data=result.data[0])