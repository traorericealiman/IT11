import { API } from './config';

export interface PaymentRequest {
  id:           string;
  student_id:   string;
  first_name:   string;
  last_name:    string;
  phone:        string;
  quantity:     number;
  amount_paid:  number;
  sender_phone: string;
  status:       'pending' | 'approved' | 'rejected';
  created_at:   string;
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

// Récupère toutes les demandes (optionnel: filtrer par status)
export async function getPaymentRequests(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<PaymentRequest[]> {
  const url = new URL(API.paymentRequests);
  if (status) url.searchParams.set('status', status);

  const response = await fetch(url.toString(), {
    method:  'GET',
    headers: authHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erreur lors de la récupération des demandes.');
  }

  return data.data as PaymentRequest[];
}

// Approuver une demande
export async function approvePaymentRequest(id: string): Promise<PaymentRequest> {
  const response = await fetch(`${API.paymentRequests}/${id}/approve`, {
    method:  'PATCH',
    headers: authHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erreur lors de l'approbation.");
  }

  return data.data as PaymentRequest;
}

// Refuser une demande
export async function rejectPaymentRequest(id: string): Promise<PaymentRequest> {
  const response = await fetch(`${API.paymentRequests}/${id}/reject`, {
    method:  'PATCH',
    headers: authHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erreur lors du refus de la demande.');
  }

  return data.data as PaymentRequest;
}