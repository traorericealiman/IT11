// ─── Inscription ────────────────────────────────────────────────────────────

export interface RegisterPayload {
  firstName: string;
  lastName:  string;
  phone:     string;
  password:  string;
  confirm:   string;
}

export interface ValidationError {
  field:   string;
  message: string;
}

// ─── Connexion ───────────────────────────────────────────────────────────────

export interface LoginPayload {
  phone:    string;
  password: string;
}

export interface LoginResponse {
  token:      string;
  id:         string;
  first_name: string;
  last_name:  string;
}

// ─── Paiement ────────────────────────────────────────────────────────────────

export interface PaymentPayload {
  student_id:   string;
  quantity:     number;
  sender_phone: string;
}
