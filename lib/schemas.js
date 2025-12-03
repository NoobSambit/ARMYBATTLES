import { z } from 'zod';

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

export const createTeamSchema = z.object({
  battleId: z.string().length(24),
  teamName: z.string().min(1).max(50).trim(),
});

export const joinTeamSchema = z.object({
  inviteCode: z.string().length(8).regex(/^[A-Z0-9]+$/, {
    message: 'Invalid invite code format',
  }),
});

export const leaveTeamSchema = z.object({
  teamId: z.string().length(24),
});

export const kickParticipantSchema = z.object({
  battleId: z.string().length(24),
  userId: z.string().length(24),
  reason: z.string().min(1).max(200).trim().optional(),
});

export const extendBattleSchema = z.object({
  battleId: z.string().length(24),
  newEndTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  reason: z.string().min(1).max(200).trim().optional(),
}).refine((data) => new Date(data.newEndTime) > new Date(), {
  message: 'New end time must be in the future',
  path: ['newEndTime'],
});
