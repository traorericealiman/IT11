import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import TicketsPage from './pages/TicketsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/randonnée" element={<HomePage />} />
        <Route path="/mes-billets" element={<TicketsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
