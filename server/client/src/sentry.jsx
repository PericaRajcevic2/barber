import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN || '';
  if (!dsn) {
    // Sentry disabled if DSN not provided
    return;
  }

  Sentry.init({
    dsn,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.0,
    environment: import.meta.env.MODE || 'development',
  });
}

export const withSentryErrorBoundary = (Component) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: <div style={{padding: 20}}>
      <h2>Došlo je do greške.</h2>
      <p>Molimo pokušajte osvježiti stranicu.</p>
      <button onClick={() => window.location.reload()}>Osvježi</button>
    </div>,
  });
};
