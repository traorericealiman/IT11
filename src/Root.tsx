import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AuthPage from './components/login';

export default function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}