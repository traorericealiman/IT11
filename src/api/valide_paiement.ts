// src/api/valide_paiement.ts

import { API } from './config';

interface ValidatePaymentPayload {
  student_id: string;
  payment_id: string;
}

interface ValidatePaymentResponse {
  success: boolean;
  ticket_code: string;
  ticket_url: string;
  ticket_id: string;
}

export async function validatePayment(payload: ValidatePaymentPayload): Promise<ValidatePaymentResponse> {
  const token = localStorage.getItem('token'); // ou le nom exact de la clé que tu utilises
  const response = await fetch(API.validatePayment, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || 'Erreur lors de la validation du paiement');
  }

  return response.json();
}