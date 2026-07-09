import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1 className="text-3xl font-bold p-4">Hallo Wok</h1>
  </StrictMode>,
);
