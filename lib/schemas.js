import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(30).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const lastfmSchema = z.object({
  lastfmUsername: z.string().min(1).max(50).trim(),
});

export const createBattleSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  spotifyPlaylist: z.string().min(1),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const joinBattleSchema = z.object({
  battleId: z.string().length(24),
});

export const endBattleSchema = z.object({
  battleId: z.string().length(24),
});
