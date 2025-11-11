import bcrypt from 'bcryptjs';
import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { generateToken } from '../../../utils/auth';
import { createHandler, withCors, withRateLimit, withValidation } from '../../../lib/middleware';
import { loginSchema } from '../../../lib/schemas';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, password } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id.toString(), user.isAdmin);

    logger.info('User logged in successfully', { userId: user._id, username: user.username });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastfmUsername: user.lastfmUsername,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'Server error during login' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withValidation(loginSchema),
]);
