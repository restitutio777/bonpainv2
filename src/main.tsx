import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// First: catches the browser's install event before React mounts.
import './lib/pwaInstall';
import { inject } from '@vercel/analytics';
import App from './App.tsx';
import './fonts/fonts.css';
import './index.css';

inject();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
