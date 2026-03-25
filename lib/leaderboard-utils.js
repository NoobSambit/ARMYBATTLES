function getUserId(user) {
  if (!user) return null;
  if (typeof user.toString === 'function' && !user._id) {
    return user.toString();
  }
  return user._id?.toString?.() || user.id?.toString?.() || null;
}

export function buildBattleLeaderboard({
  streamCounts,
  battleTeams = [],
  participantFallbacks = [],
  includeTeamMembers = false,
}) {
  const teamScoresMap = new Map();
  const soloPlayers = [];
  const processedUsers = new Set();

  for (const sc of streamCounts) {
    const userId = getUserId(sc.userId);
    if (userId) {
      processedUsers.add(userId);
    }

    if (sc.teamId) {
      const teamIdStr = sc.teamId._id.toString();

      if (!teamScoresMap.has(teamIdStr)) {
        teamScoresMap.set(teamIdStr, {
          type: 'team',
          teamId: sc.teamId._id,
          teamName: sc.teamId.name,
          memberCount: sc.teamId.members?.length || 0,
          totalScore: 0,
          isCheater: false,
          ...(includeTeamMembers ? { members: [] } : {}),
        });
      }

      const teamData = teamScoresMap.get(teamIdStr);
      teamData.totalScore += sc.count || 0;

      if (sc.isCheater) {
        teamData.isCheater = true;
      }

      if (includeTeamMembers) {
        teamData.members.push({
          userId: sc.userId._id,
          username: sc.userId.username,
          displayName: sc.userId.displayName,
          count: sc.count || 0,
          isCheater: sc.isCheater || false,
        });
      }
    } else {
      soloPlayers.push({
        type: 'solo',
        userId: sc.userId._id,
        username: sc.userId.username,
        displayName: sc.userId.displayName,
        avatarUrl: sc.userId.avatarUrl,
        count: sc.count || 0,
        isCheater: sc.isCheater || false,
      });
    }
  }

  for (const team of battleTeams) {
    const teamIdStr = team._id.toString();

    if (!teamScoresMap.has(teamIdStr)) {
      teamScoresMap.set(teamIdStr, {
        type: 'team',
        teamId: team._id,
        teamName: team.name,
        memberCount: team.members?.length || 0,
        totalScore: 0,
        isCheater: false,
        ...(includeTeamMembers ? { members: [] } : {}),
      });
    }
  }

  for (const participant of participantFallbacks) {
    const participantId = getUserId(participant);

    if (!participantId || processedUsers.has(participantId)) {
      continue;
    }

    soloPlayers.push({
      type: 'solo',
      userId: participant._id,
      username: participant.username,
      displayName: participant.displayName,
      avatarUrl: participant.avatarUrl,
      count: 0,
      isCheater: false,
    });
  }

  return {
    teams: Array.from(teamScoresMap.values()),
    soloPlayers,
  };
}

export function sortBattleLeaderboard(entries) {
  return entries.sort((a, b) => {
    const scoreA = a.type === 'team' ? a.totalScore : a.count;
    const scoreB = b.type === 'team' ? b.totalScore : b.count;
    return scoreB - scoreA;
  });
}
