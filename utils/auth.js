import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function getSessionExpiryDate() {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

export function setSessionCookie(res, token, expiresAt) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/'
  ];

  if (expiresAt) {
    parts.push(`Expires=${expiresAt.toUTCString()}`);
    parts.push(`Max-Age=${Math.floor((expiresAt.getTime() - Date.now()) / 1000)}`);
  }

  parts.push('HttpOnly');
  parts.push('SameSite=Lax');

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax'
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

export function getSessionTokenFromRequest(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.substring(7);
  }

  if (!req.headers.cookie) {
    return null;
  }

  const cookies = req.headers.cookie.split(';').map(cookie => cookie.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      return cookie.substring(SESSION_COOKIE_NAME.length + 1);
    }
  }

  return null;
}

export function getRequestTokenFromRequest(req) {
  if (!req.headers.cookie) {
    return null;
  }

  const cookies = req.headers.cookie.split(';').map(cookie => cookie.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith('lastfm_request_token=')) {
      return cookie.substring('lastfm_request_token='.length);
    }
  }

  return null;
}

export function setRequestTokenCookie(res, token) {
  const parts = [
    `lastfm_request_token=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax'
  ];

  // Short-lived token (10 minutes)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  parts.push(`Expires=${expiresAt.toUTCString()}`);
  parts.push('Max-Age=600');

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearRequestTokenCookie(res) {
  const parts = [
    'lastfm_request_token=',
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax'
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}
