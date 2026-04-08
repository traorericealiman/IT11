# backend/ticket_student.py
import io

from flask import Blueprint, request, jsonify
import os
import jwt
import requests
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
JWT_SECRET   = os.environ["JWT_SECRET"]
BUCKET = os.environ.get("BUCKET", "Tickets")
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


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


# APRÈS
def _signed_url(file_path: str, expires_in: int = 300) -> str | None:
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/sign/{BUCKET}/{file_path}"
        resp = requests.post(
            url,
            json={"expiresIn": expires_in},
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
        )
        print(f"[signed_url] status={resp.status_code} réponse={resp.text}")
        if resp.status_code == 200:
            data = resp.json()
            signed_path = data.get("signedURL") or data.get("signedUrl")
            if signed_path:
                # signed_path est un path relatif, on construit l'URL complète
                if signed_path.startswith("http"):
                    return signed_path
                return f"{SUPABASE_URL}/storage/v1{signed_path}"
        return None
    except Exception as e:
        print(f"[signed_url] ERREUR: {e}")
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
            "ticket_url":  signed or t["ticket_url"],  
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
    from flask import send_file
    import requests as req

    student = _require_student(request)
    if not student:
        return _bad("Accès refusé. Veuillez vous connecter.", 403)

    student_id = student["sub"]

    result = (
        supabase.table("tickets")
        .select("id, ticket_code, ticket_url")
        .eq("id", ticket_id)
        .eq("student_id", student_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        return _bad("Billet introuvable.", 404)

    ticket = result.data[0]
    signed = _signed_url(ticket["ticket_url"], expires_in=60)

    if not signed:
        return _bad("Impossible de générer le lien de téléchargement.", 500)

    # Télécharge le fichier depuis Supabase côté serveur
    file_resp = req.get(signed)
    if file_resp.status_code != 200:
        return _bad("Erreur lors du téléchargement du fichier.", 500)

    # Envoie le fichier directement au client
    ticket_code = ticket["ticket_code"]
    return send_file(
        io.BytesIO(file_resp.content),
        mimetype="image/jpeg",
        as_attachment=True,
        download_name=f"ticket_{ticket_code}.jpg",
    )