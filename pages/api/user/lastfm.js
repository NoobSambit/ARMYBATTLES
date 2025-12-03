import { createHandler, withCors } from '../../../lib/middleware';

async function handler(req, res) {
  res.status(410).json({ error: 'Endpoint removed. Last.fm username is managed automatically during login.' });
}

export default createHandler(handler, [withCors]);
