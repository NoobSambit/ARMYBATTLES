import bcrypt from 'bcryptjs';
import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { generateToken } from '../../../utils/auth';
import { createHandler, withCors, withRateLimit, withValidation } from '../../../lib/middleware';
import { registerSchema } from '../../../lib/schemas';
import { logger } from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { username, email, password } = req.validatedBody;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      logger.warn('Registration attempt with existing credentials', { email, username });
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      passwordHash,
      isAdmin: false,
    });

    const token = generateToken(user._id.toString(), user.isAdmin);

    logger.info('User registered successfully', { userId: user._id, username: user.username });

    res.status(201).json({
      message: 'User created successfully',
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
    logger.error('Registration error', { error: error.message });
    res.status(500).json({ error: 'Server error during registration' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(5, 60000),
  withValidation(registerSchema),
]);
