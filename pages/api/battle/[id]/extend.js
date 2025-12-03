import dbConnect from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import { extendBattleSchema } from '../../../../lib/schemas';
import { logActivity } from '../../../../utils/activityLogger';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../../lib/middleware';

/**
 * API endpoint to extend a battle's end time
 * Only the battle host can extend the battle
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get authenticated user ID from middleware
    const hostId = req.userId;

    const { id: battleId } = req.query;

    // Validate input
    const validation = extendBattleSchema.safeParse({
      battleId,
      newEndTime: req.body.newEndTime,
      reason: req.body.reason,
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const { newEndTime, reason } = validation.data;

    // Find battle
    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    // Check if requester is the host
    if (battle.host.toString() !== hostId) {
      return res.status(403).json({ error: 'Only the battle host can extend the battle' });
    }

    // Check if battle has ended
    if (battle.status === 'ended') {
      return res.status(400).json({ error: 'Cannot extend an ended battle' });
    }

    // Check if new end time is after current end time
    const newEndDate = new Date(newEndTime);
    const currentEndDate = new Date(battle.endTime);

    if (newEndDate <= currentEndDate) {
      return res.status(400).json({
        error: 'New end time must be after the current end time',
      });
    }

    // Store original end time if this is the first extension
    if (!battle.originalEndTime) {
      battle.originalEndTime = battle.endTime;
    }

    // Initialize extensionHistory if it doesn't exist
    if (!battle.extensionHistory) {
      battle.extensionHistory = [];
    }

    // Add to extension history
    battle.extensionHistory.push({
      extendedBy: hostId,
      extendedAt: new Date(),
      previousEndTime: battle.endTime,
      newEndTime: newEndDate,
      reason: reason || 'No reason provided',
    });

    // Update end time
    const previousEndTime = battle.endTime;
    battle.endTime = newEndDate;

    // Save battle
    await battle.save();

    // Calculate extension duration
    const extensionDuration = newEndDate - currentEndDate;
    const extensionHours = Math.round(extensionDuration / (1000 * 60 * 60) * 10) / 10;

    // Log activity
    await logActivity({
      battleId,
      actorId: hostId,
      actorUsername: 'Host', // In production, fetch from User model
      action: 'extended_battle',
      metadata: {
        previousEndTime,
        newEndTime: newEndDate,
        extensionDuration,
        extensionHours,
        reason: reason || 'No reason provided',
      },
    });

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to(`battle-${battleId}`).emit('battle-extended', {
        battleId,
        newEndTime: newEndDate,
        extensionHours,
        reason: reason || 'No reason provided',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Battle extended by ${extensionHours} hours`,
      battle: {
        id: battle._id,
        previousEndTime,
        newEndTime: newEndDate,
        extensionDuration,
        extensionHours,
        totalExtensions: battle.extensionHistory.length,
      },
    });
  } catch (error) {
    console.error('Error extending battle:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(10, 60000),
  withAuth({ requireAdmin: false }),
]);
