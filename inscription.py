from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import bcrypt
import os

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    phone = data.get("phone")
    password = data.get("password")
    confirm = data.get("confirm")

    # Vérifications
    if not all([first_name, last_name, phone, password, confirm]):
        return jsonify({"error": "Tous les champs sont obligatoires."}), 400
    if len(password) < 8:
        return jsonify({"error": "Le mot de passe doit contenir au moins 8 caractères."}), 400
    if password != confirm:
        return jsonify({"error": "Les mots de passe ne correspondent pas."}), 400

    # Vérifier si le numéro existe déjà
    existing = supabase.table("students").select("*").eq("phone", phone).execute()
    if existing.data and len(existing.data) > 0:
        return jsonify({"error": "Ce numéro de téléphone est déjà utilisé."}), 400

    # Hachage du mot de passe
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    student = {
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone,
        "password": hashed_password
    }

    result = supabase.table("students").insert(student).execute()
    return jsonify({"message": "Inscription réussie !", "data": result.data})
    
if __name__ == "__main__":
    app.run(debug=True)