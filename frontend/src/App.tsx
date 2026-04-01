import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/randonnée" element={<HomePage />} />
        <Route path="/mes-billets" element={<TicketsPage />} />
        <Route path="/mes-billets/:ticketCode" element={<TicketDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}