import connectDB from '../../../../utils/db';
import Battle from '../../../../models/Battle';
import StreamCount from '../../../../models/StreamCount';
import User from '../../../../models/User';
import { createHandler, withCors, withRateLimit, withAuth } from '../../../../lib/middleware';
import { logger } from '../../../../utils/logger';
import mongoose from 'mongoose';
import { Octokit } from '@octokit/rest';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { battleId } = req.body;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(battleId)) {
      return res.status(400).json({ error: 'Invalid battle ID' });
    }

    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status !== 'active') {
      return res.status(400).json({
        error: 'Battle is not active',
        status: battle.status
      });
    }

    const user = await User.findById(req.userId);
    if (!user.lastfmUsername) {
      return res.status(400).json({ error: 'Last.fm username not set' });
    }

    if (!battle.participants.some(p => p.toString() === req.userId)) {
      return res.status(400).json({ error: 'You are not a participant in this battle' });
    }

    // Get or create StreamCount
    let streamCount = await StreamCount.findOne({
      battleId: battle._id,
      userId: req.userId
    });

    if (!streamCount) {
      streamCount = await StreamCount.create({
        battleId: battle._id,
        userId: req.userId,
        count: 0,
        isCheater: false,
        scrobbleTimestamps: [],
        teamId: null,
        lastSyncedAt: null,
        lastSyncType: null,
        lastSyncedBy: null
      });
    }

    // Check 5-minute cooldown
    const RATE_LIMIT_MS = 5 * 60 * 1000;
    if (streamCount.lastSyncedAt) {
      const timeSinceLastSync = Date.now() - streamCount.lastSyncedAt.getTime();
      if (timeSinceLastSync < RATE_LIMIT_MS) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastSync) / 1000);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Please wait ${remainingSeconds} seconds before syncing again`,
          retryAfter: remainingSeconds,
          lastSyncedAt: streamCount.lastSyncedAt
        });
      }
    }

    // Trigger GitHub Actions workflow
    const GITHUB_PAT = process.env.GITHUB_PAT;
    if (!GITHUB_PAT) {
      logger.error('GITHUB_PAT environment variable not set');
      return res.status(500).json({
        error: 'Full sync unavailable',
        message: 'Server configuration error. Please contact support.'
      });
    }

    const GITHUB_OWNER = process.env.GITHUB_OWNER || 'hairyfairy';
    const GITHUB_REPO = process.env.GITHUB_REPO || 'ARMYBATTLES-main';

    const octokit = new Octokit({ auth: GITHUB_PAT });

    const workflowResponse = await octokit.rest.actions.createWorkflowDispatch({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      workflow_id: 'full-sync.yml',
      ref: 'main',
      inputs: {
        battleId: battleId,
        userId: req.userId
      }
    });

    logger.info('Full sync triggered', {
      userId: req.userId,
      battleId,
      username: user.username,
      workflowDispatchStatus: workflowResponse.status
    });

    // Update lastSyncedAt to enforce rate limit (actual sync happens in GH Actions)
    await StreamCount.findOneAndUpdate(
      { battleId: battle._id, userId: req.userId },
      {
        lastSyncedAt: new Date(),
        lastSyncType: 'full',
        lastSyncedBy: req.userId
      }
    );

    res.status(202).json({
      success: true,
      message: 'Full sync initiated. This may take a few minutes.',
      syncType: 'full',
      note: 'Refresh the page in 2-3 minutes to see updated counts'
    });

  } catch (error) {
    logger.error('Full sync trigger error', {
      error: error.message,
      userId: req.userId,
      battleId: req.body.battleId
    });
    res.status(500).json({ error: 'Failed to trigger full sync', message: error.message });
  }
}

export default createHandler(handler, [
  withCors,
  withRateLimit(3, 60000), // 3 requests per minute (more restrictive)
  withAuth()
]);
