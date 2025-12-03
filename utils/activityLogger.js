import BattleActivityLog from '../models/BattleActivityLog';

export async function logActivity({
  battleId,
  actorId,
  actorUsername,
  action,
  targetUserId = null,
  targetUsername = null,
  metadata = {}
}) {
  try {
    await BattleActivityLog.create({
      battleId,
      actorId,
      actorUsername,
      action,
      targetUserId,
      targetUsername,
      metadata,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Activity log error:', error);
  }
}
