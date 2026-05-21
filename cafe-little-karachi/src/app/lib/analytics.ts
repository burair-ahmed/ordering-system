// src/app/lib/analytics.ts

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getDistinctId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('custom_distinct_id');
  if (!id) {
    id = 'usr_' + generateUUID();
    localStorage.setItem('custom_distinct_id', id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('custom_session_id');
  if (!id) {
    id = 'ses_' + generateUUID();
    sessionStorage.setItem('custom_session_id', id);
  }
  return id;
}

export function trackEvent(eventType: string, properties: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();
  const distinctId = getDistinctId();
  const path = window.location.pathname + window.location.search;

  const payload = {
    sessionId,
    distinctId,
    eventType,
    path,
    properties,
    timestamp: new Date().toISOString()
  };

  // Execute track asynchronously to be completely non-blocking for user actions
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).catch((err) => {
    // Silently handle errors so tracking never disrupts customer checkout flows
    console.warn('[Analytics] tracking log failed:', err);
  });
}
