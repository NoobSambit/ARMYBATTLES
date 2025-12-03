import connectDB from '../../../utils/db';
import { createHandler, withCors, withAuth } from '../../../lib/middleware';

async function handler(req, res) {
  await connectDB();

  const user = req.user;

  res.status(200).json({
    user: {
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      lastfmUsername: user.lastfmUsername,
      lastfmProfileUrl: user.lastfmProfileUrl,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin,
    },
  });
}

export default createHandler(handler, [withCors, withAuth()]);
