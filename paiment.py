import os
import random
import json
import base64
from flask import Blueprint, request, jsonify
from supabase import create_client, Client

# Importation de cryptography (Hazmat)
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend

payment_bp = Blueprint("payment", __name__)

# CONFIGURATION
# La clé doit faire exactement 32 caractères pour AES-256
AES_KEY = "TaCleSecreteSuperRobusteDesIT11!".encode('utf-8') 
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

# ── FONCTION DE DÉCHIFFREMENT (Mode ECB pour matcher ton CryptoJS) ────────
def decrypt_data(encrypted_data_b64):
    try:
        # 1. Décodage Base64
        encrypted_data = base64.b64decode(encrypted_data_b64)
        
        # 2. Configuration du Cipher AES en mode ECB
        cipher = Cipher(algorithms.AES(AES_KEY), modes.ECB(), backend=default_backend())
        decryptor = cipher.decryptor()
        
        # 3. Déchiffrement
        padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
        
        # 4. Suppression du Padding PKCS7
        unpadder = padding.PKCS7(128).unpadder()
        data = unpadder.update(padded_data) + unpadder.finalize()
        
        return data.decode('utf-8')
    except Exception as e:
        print(f"❌ Erreur de déchiffrement : {e}")
        return None

# ── 1. RÉCEPTION DE LA DEMANDE (ÉTUDIANT) ──────────────────
@payment_bp.route("/payment/request", methods=["POST"])
def request_payment():
    data = request.get_json()
    
    try:
        # Déchiffrement des champs reçus du Frontend
        student_id   = decrypt_data(data.get("student_id"))
        quantity_str = decrypt_data(data.get("quantity"))
        amount_str   = decrypt_data(data.get("amount"))
        sender_phone = decrypt_data(data.get("sender_phone"))

        # Validation simple
        if not student_id or not quantity_str:
            return jsonify({"error": "Données corrompues ou invalides"}), 400

        quantity = int(quantity_str)
        amount_paid = int(amount_str)

        # Insertion dans Supabase (Table de validation manuelle)
        supabase.table("payment_requests").insert({
            "student_id": student_id,
            "quantity": quantity,
            "amount_paid": amount_paid,
            "sender_phone": sender_phone,
            "status": "pending"
        }).execute()

        return jsonify({"success": True, "message": "Demande enregistrée"}), 201

    except Exception as e:
        print(f"⚠️ Erreur Backend : {str(e)}")
        return jsonify({"error": "Erreur lors du traitement de la demande"}), 500

# ── 2. APPROBATION (ADMIN) ────────────────────────────────
@payment_bp.route("/payment/approve/<request_id>", methods=["POST"])
def approve_payment(request_id):
    try:
        # Récupérer la demande correspondante
        req_res = supabase.table("payment_requests").select("*").eq("id", request_id).single().execute()
        req = req_res.data
        
        if not req or req['status'] != 'pending':
            return jsonify({"error": "Demande introuvable ou déjà traitée"}), 404

        qty = req['quantity']
        sid = req['student_id']

        # Générer les codes à 6 chiffres
        tickets_to_insert = []
        for _ in range(qty):
            code = str(random.randint(100000, 999999))
            tickets_to_insert.append({
                "student_id": sid, 
                "ticket_code": code
            })

        # Insérer les tickets finaux
        supabase.table("tickets").insert(tickets_to_insert).execute()
        
        # Marquer la demande comme approuvée
        supabase.table("payment_requests").update({"status": "approved"}).eq("id", request_id).execute()

        return jsonify({"success": True, "message": f"{qty} tickets générés"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500