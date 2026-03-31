# backend/routes/paiement.py
from flask import Blueprint, request, jsonify
from supabase import create_client, Client
import os
import datetime
import secrets
from utils.crypto import decrypt_aes

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

payment_bp = Blueprint("payment", __name__)

VALID_AMOUNTS = {1: 5050, 2: 10100, 3: 15150}


def _bad(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _ok(message: str, data=None, status: int = 200):
    payload = {"message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def _now_iso() -> str:
    """Retourne l'heure UTC actuelle en ISO 8601 (compatible Python 3.12+)."""
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _check_admin(req) -> bool:
    """Vérifie que la requête provient d'un admin via le header Authorization."""
    auth_header = req.headers.get("Authorization", "")
    admin_token = os.environ.get("ADMIN_SECRET", "")
    return bool(admin_token) and auth_header == f"Bearer {admin_token}"


def _generate_unique_ticket_code(existing_codes: set) -> str:
    """Génère un code à 6 chiffres unique par rapport aux codes déjà générés."""
    for _ in range(100):  # 100 tentatives max pour éviter une boucle infinie
        code = str(secrets.randbelow(900000) + 100000)
        if code not in existing_codes:
            existing_codes.add(code)
            return code
    raise RuntimeError("Impossible de générer un code unique après 100 tentatives.")


# ══════════════════════════════════════════════════════════════
#  ROUTE  POST /payment/request
# ══════════════════════════════════════════════════════════════

@payment_bp.route("/payment/request", methods=["POST"])
def request_payment():
    body = request.get_json(silent=True)
    if not body:
        return _bad("Corps JSON manquant ou invalide.")

    student_id   = decrypt_aes(body.get("student_id",   ""))
    quantity_str = decrypt_aes(body.get("quantity",     ""))
    amount_str   = decrypt_aes(body.get("amount",       ""))
    sender_phone = decrypt_aes(body.get("sender_phone", ""))

    if not all([student_id, quantity_str, amount_str, sender_phone]):
        return _bad("Déchiffrement échoué : données corrompues ou clé invalide.")

    try:
        quantity = int(quantity_str)
        amount   = int(amount_str)
    except ValueError:
        return _bad("Format de quantité ou de montant invalide.")

    if quantity not in VALID_AMOUNTS:
        return _bad(f"Quantité invalide. Valeurs acceptées : {list(VALID_AMOUNTS.keys())}.")

    if amount != VALID_AMOUNTS[quantity]:
        return _bad("Montant incohérent avec la quantité.")

    student_result = (
        supabase
        .table("students")
        .select("id, first_name, last_name")
        .eq("id", student_id)
        .limit(1)
        .execute()
    )
    if not student_result.data:
        return _bad("Étudiant introuvable.", 404)

    payment_data = {
        "student_id":   student_id,
        "quantity":     quantity,
        "amount_paid":  amount,
        "sender_phone": sender_phone,
        "status":       "pending",
        "created_at":   _now_iso(),
    }

    insert_result = supabase.table("payment_requests").insert(payment_data).execute()

    if not insert_result.data:
        return _bad("Erreur lors de l'enregistrement en base de données.", 500)

    payment_id = insert_result.data[0]["id"]

    return _ok(
        "Paiement enregistré. Redirection Wave en cours.",
        data={"payment_id": payment_id},
        status=201,
    )


# ══════════════════════════════════════════════════════════════
#  ROUTE  POST /payment/approve/<request_id>
# ══════════════════════════════════════════════════════════════

@payment_bp.route("/payment/approve/<request_id>", methods=["POST"])
def approve_payment(request_id: str):

    # 1. Vérification admin
    if not _check_admin(request):
        return _bad("Non autorisé. Token admin requis.", 401)

    # 2. Obtenir les détails de la requête de paiement
    payment_result = (
        supabase
        .table("payment_requests")
        .select("*")
        .eq("id", request_id)
        .limit(1)
        .execute()
    )

    if not payment_result.data:
        return _bad("Paiement introuvable.", 404)

    payment = payment_result.data[0]

    # 3. Vérifier que le statut est bien "pending"
    if payment.get("status") != "pending":
        return _bad(
            f"Ce paiement ne peut pas être approuvé (statut actuel : {payment.get('status')}).",
            409,
        )

    # 4. Vérifier qu'aucun ticket n'a déjà été généré pour ce paiement (protection double-appel)
    existing_tickets = (
        supabase
        .table("tickets")
        .select("id")
        .eq("payment_id", request_id)
        .execute()
    )
    if existing_tickets.data:
        return _bad("Des tickets ont déjà été générés pour ce paiement.", 409)

    # 5. Mettre à jour le statut du paiement
    update_result = (
        supabase
        .table("payment_requests")
        .update({
            "status":     "approved",
            "updated_at": _now_iso(),
        })
        .eq("id", request_id)
        .execute()
    )

    if not update_result.data:
        return _bad("Erreur lors de l'approbation du paiement.", 500)

    # 6. Générer les tickets avec des codes uniques
    quantity   = payment.get("quantity", 1)
    student_id = payment.get("student_id")
    now        = _now_iso()

    try:
        existing_codes: set = set()
        tickets_to_insert = [
            {
                "student_id":  student_id,
                "payment_id":  request_id,
                "ticket_code": _generate_unique_ticket_code(existing_codes),
                "created_at":  now,
            }
            for _ in range(quantity)
        ]
    except RuntimeError as e:
        return _bad(str(e), 500)

    tickets_insert = supabase.table("tickets").insert(tickets_to_insert).execute()

    if not tickets_insert.data:
        return _bad("Paiement approuvé mais erreur lors de la génération des tickets.", 500)

    return _ok(
        f"Paiement approuvé et {quantity} ticket(s) généré(s).",
        data={
            "payment_id":        request_id,
            "generated_tickets": len(tickets_insert.data),
        },
    )


# ══════════════════════════════════════════════════════════════
#  ROUTE  POST /tickets
# ══════════════════════════════════════════════════════════════

@payment_bp.route("/tickets", methods=["POST"])
def get_user_tickets():
    """
    Récupère la liste des tickets d'un étudiant.
    Utilise POST pour passer l'ID chiffré dans le corps,
    comme pour la requête de paiement, afin de garder la même politique de sécurité.
    """
    body = request.get_json(silent=True)
    if not body:
        return _bad("Corps JSON manquant ou invalide.")

    student_id = decrypt_aes(body.get("student_id", ""))

    if not student_id:
        return _bad("ID étudiant introuvable ou déchiffrement échoué.", 401)

    tickets_result = (
        supabase
        .table("tickets")
        .select("*")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )

    tickets = tickets_result.data if tickets_result.data else []

    return _ok("Tickets récupérés.", data={"tickets": tickets})