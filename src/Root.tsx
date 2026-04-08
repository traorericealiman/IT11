import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './api/session';
import App from './App';
import AuthPage from './components/login';
import RecupererMonTicket from './components/ticket';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/tickets" element={
          <ProtectedRoute>
            <RecupererMonTicket />
          </ProtectedRoute>
        } />
        <Route path="/randonnée" element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}