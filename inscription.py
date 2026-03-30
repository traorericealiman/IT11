from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import bcrypt
import os

# ── CONFIGURATION SUPABASE ──
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
CORS(app)  # pour permettre les requêtes depuis ton front

def register_student(first_name, last_name, phone, password, confirm):
    if not all([first_name, last_name, phone, password, confirm]):
        return {"error": "Tous les champs sont obligatoires."}

    if len(password) < 8:
        return {"error": "Le mot de passe doit contenir au moins 8 caractères."}

    if password != confirm:
        return {"error": "Les mots de passe ne correspondent pas."}

    existing = supabase.table("students").select("*").eq("phone", phone).execute()
    if existing.data and len(existing.data) > 0:
        return {"error": "Ce numéro de téléphone est déjà utilisé."}

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    student = {
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone,
        "password": hashed_password
    }

    result = supabase.table("students").insert(student).execute()
    return {"message": "Inscription réussie !", "data": result.data}

# ── ROUTE /register ──
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    response = register_student(
        data.get("first_name"),
        data.get("last_name"),
        data.get("phone"),
        data.get("password"),
        data.get("confirm")
    )
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)