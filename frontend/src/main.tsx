import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { EscolaProvider } from './contexts/EscolaContext';
import { ToastProvider } from './contexts/ToastContext';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EscolaProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </EscolaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
