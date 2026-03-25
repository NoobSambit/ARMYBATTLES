export const leaderboardCache = new Map();
export const LEADERBOARD_CACHE_TTL = 30000; // 30 seconds

export function getLeaderboardCacheKey(battleId, filter) {
  return `${battleId}-${filter}`;
}

export function clearBattleLeaderboardCache(battleId) {
  const prefix = `${battleId}-`;

  for (const key of leaderboardCache.keys()) {
    if (key.startsWith(prefix)) {
      leaderboardCache.delete(key);
    }
  }
}

export function pruneLeaderboardCache() {
  if (leaderboardCache.size <= 100) {
    return;
  }

  const oldestKeys = Array.from(leaderboardCache.keys()).slice(0, 50);
  oldestKeys.forEach(key => leaderboardCache.delete(key));
}
