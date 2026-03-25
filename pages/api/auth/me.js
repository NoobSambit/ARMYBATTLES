import connectDB from '../../../utils/db';
import { createHandler, withCors, withAuth } from '../../../lib/middleware';
import { serializeUserForClient } from '../../../utils/tracking';

async function handler(req, res) {
  await connectDB();

  res.status(200).json({
    user: serializeUserForClient(req.user),
  });
}

export default createHandler(handler, [withCors, withAuth()]);
