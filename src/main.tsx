import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { VerifiedTimeProvider } from './hooks/useVerifiedTime';
import './index.css';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <VerifiedTimeProvider>
        <App />
      </VerifiedTimeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
