import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.1,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        // Sanitize sensitive data
        if (event.exception) {
          const values = event.exception.values;
          if (values) {
            values.forEach((value) => {
              if (value.stacktrace) {
                value.stacktrace.frames?.forEach((frame) => {
                  if (frame.vars) {
                    delete frame.vars.password;
                    delete frame.vars.token;
                    delete frame.vars.apiKey;
                  }
                });
              }
            });
          }
        }
        return event;
      },
    });
  }
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}
