import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { registerSW } from './services/notification';
import './styles/globals.css';

registerSW();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
