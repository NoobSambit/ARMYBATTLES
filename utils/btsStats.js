/**
 * BTS Member categorization utility
 * Normalizes artist names and categorizes them by member
 */

// Normalize string for comparison (remove spaces, lowercase, remove special chars)
function normalizeArtist(artist) {
  if (!artist) return '';
  return artist
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\w가-힣]/g, ''); // Keep alphanumeric and Korean characters
}

// BTS member name variations
const MEMBER_VARIATIONS = {
  RM: [
    'rm', 'rapmonster', 'rap monster', 'namjoon', 'kimnamjoon', 'kim namjoon'
  ],
  Jin: [
    'jin', 'seokjin', 'kimseokjin', 'kim seokjin'
  ],
  Suga: [
    'suga', 'agustd', 'agust d', 'yoongi', 'minyoongi', 'min yoongi'
  ],
  'J-Hope': [
    'jhope', 'j-hope', 'hobi', 'hoseok', 'junghoseok', 'jung hoseok'
  ],
  Jimin: [
    'jimin', 'parkjimin', 'park jimin'
  ],
  V: [
    'v', 'taehyung', 'kimtaehyung', 'kim taehyung'
  ],
  'Jung Kook': [
    'jungkook', 'jung kook', 'jeongjungkook', 'jeon jungkook', 'jk'
  ]
};

// BTS group variations
const BTS_GROUP_VARIATIONS = [
  'bts', '방탄소년단', 'bangtan', 'bangtanboys', 'bangtan boys',
  'beyond the scene', 'bulletproof boy scouts'
];

/**
 * Categorize an artist into BTS member or group
 * @param {string} artist - The artist name from a scrobble
 * @returns {string|null} - Member name, 'BTS', or null if not BTS-related
 */
export function categorizeBTSArtist(artist) {
  const normalized = normalizeArtist(artist);

  if (!normalized) return null;

  // Check if it's a BTS group track
  const isBTSGroup = BTS_GROUP_VARIATIONS.some(variation =>
    normalizeArtist(variation) === normalized ||
    normalized.includes(normalizeArtist(variation))
  );

  if (isBTSGroup) return 'BTS';

  // Check each member's variations
  for (const [member, variations] of Object.entries(MEMBER_VARIATIONS)) {
    const isMatch = variations.some(variation => {
      const normalizedVariation = normalizeArtist(variation);
      return normalized === normalizedVariation || normalized.includes(normalizedVariation);
    });

    if (isMatch) return member;
  }

  return null;
}

/**
 * Check if an artist is BTS-related (group or member)
 * @param {string} artist - The artist name from a scrobble
 * @returns {boolean}
 */
export function isBTSRelated(artist) {
  return categorizeBTSArtist(artist) !== null;
}

/**
 * Update battle stats with a scrobble
 * @param {Object} stats - BattleStats document
 * @param {Object} scrobble - Scrobble object with artist and name
 */
export function updateStatsWithScrobble(stats, scrobble) {
  const category = categorizeBTSArtist(scrobble.artist);

  if (!category) return; // Not BTS-related

  // Increment total BTS streams
  stats.totalBTSStreams = (stats.totalBTSStreams || 0) + 1;

  // If it's a group track, increment all members equally
  if (category === 'BTS') {
    // For BTS group tracks, we don't attribute to individual members
    // Only count towards total
  } else {
    // Individual member track
    if (!stats.memberStats) {
      stats.memberStats = {
        RM: 0,
        Jin: 0,
        Suga: 0,
        'J-Hope': 0,
        Jimin: 0,
        V: 0,
        'Jung Kook': 0
      };
    }
    stats.memberStats[category] = (stats.memberStats[category] || 0) + 1;
  }

  // Track top tracks
  if (!stats.topTracks) {
    stats.topTracks = [];
  }

  const existingTrack = stats.topTracks.find(
    t => normalizeArtist(t.artist) === normalizeArtist(scrobble.artist) &&
         t.title.toLowerCase() === scrobble.name.toLowerCase()
  );

  if (existingTrack) {
    existingTrack.count += 1;
  } else {
    stats.topTracks.push({
      title: scrobble.name,
      artist: scrobble.artist,
      count: 1
    });
  }

  // Sort top tracks and keep top 10
  stats.topTracks.sort((a, b) => b.count - a.count);
  stats.topTracks = stats.topTracks.slice(0, 10);

  stats.lastUpdated = new Date();
}
