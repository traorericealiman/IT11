import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AuthPage from './login';

export default function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/randonnée" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}