import { createHandler, withCors } from '../../../lib/middleware';

async function handler(req, res) {
  res.status(410).json({ error: 'Endpoint removed. Use Last.fm login instead.' });
}

export default createHandler(handler, [withCors]);
