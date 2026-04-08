// src/api/ticket_student.ts
import { API } from './config';
import { getToken } from './session';

export type TicketStatusKind = 'none' | 'pending' | 'rejected' | 'approved';

export type Ticket = {
  id: string;
  ticket_code: string;
  ticket_url: string;
  created_at: string;
};

export type TicketStatusData =
  | { status: 'none' }
  | { status: 'pending'; payment_request_id: string }
  | { status: 'rejected'; support_phone: string; tickets?: Ticket[] }

  | { 
    status: 'approved'; tickets: Ticket[] 
    tickets_ready: number;   
    tickets_total: number; 
    pending_count: number;  
    rejected_count: number; 
  };

export type TicketStatusResponse = {
  message: string;
  data: TicketStatusData;
};

export async function fetchTicketStatus(): Promise<TicketStatusResponse> {
  const token = getToken();

  if (!token) {
    throw new Error('Non authentifié. Veuillez vous connecter.');
  }

  const res = await fetch(API.ticketStatus, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? 'Erreur lors de la récupération du statut.');
  }

  return json as TicketStatusResponse;
}

export async function downloadTicket(ticketId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Non authentifié.');

  const res = await fetch(API.downloadTicket(ticketId), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? 'Erreur téléchargement.');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket_randonnee.jpg`;
  a.click();
  URL.revokeObjectURL(url);
}