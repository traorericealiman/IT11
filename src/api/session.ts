// src/api/session.ts

export function getUserId(): string | null {
  return localStorage.getItem('userId');
}

export function getFirstName(): string | null {
  return localStorage.getItem('firstName');
}

export function getLastName(): string | null {
  return localStorage.getItem('lastName');
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('firstName');
  localStorage.removeItem('lastName');
}