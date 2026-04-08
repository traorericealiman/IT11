// src/config.ts
const BASE_URL = 'https://it11-ajlp.onrender.com';

export const API = {
  register:       `${BASE_URL}/register`,
  login:          `${BASE_URL}/login`,
  requestPayment: `${BASE_URL}/payment/request`,
  approvePayment: (requestId: string) => `${BASE_URL}/payment/approve/${requestId}`,
  ticketStatus:   `${BASE_URL}/student/ticket-status`,
  downloadTicket: (ticketId: string) => `${BASE_URL}/student/ticket/${ticketId}/download`,
};

export const WAVE_LINKS: Record<number, string> = {
  1: "https://pay.wave.com/m/M_ci_swf_QaCJI6w_/c/ci/?amount=5050",
  2: "https://pay.wave.com/m/M_ci_swf_QaCJI6w_/c/ci/?amount=10100",
  3: "https://pay.wave.com/m/M_ci_swf_QaCJI6w_/c/ci/?amount=15150",
};

export const AMOUNTS: Record<number, { total: number }> = {
  1: { total: 5050 },
  2: { total: 10100 },
  3: { total: 15150 },
};