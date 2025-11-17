import { createHandler, withCors, withRateLimit } from '../../../lib/middleware';
import { createLastfmAuthToken, getLastfmAuthorizeUrl } from '../../../utils/lastfm';
import { setRequestTokenCookie } from '../../../utils/auth';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await createLastfmAuthToken();
    const configuredBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL || '';
    const base = configuredBase || req.headers.origin || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    const callbackUrl = `${base.replace(/\/$/, '')}/auth/callback`;
    const authorizeUrl = getLastfmAuthorizeUrl(token, callbackUrl);

    setRequestTokenCookie(res, token);

    logger.info('Last.fm auth initiated', { authorizeUrl });

    res.status(200).json({ authorizeUrl });
  } catch (error) {
    logger.error('Failed to start Last.fm authentication', { error: error.message });
    res.status(500).json({ error: 'Failed to start Last.fm login' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
]);
