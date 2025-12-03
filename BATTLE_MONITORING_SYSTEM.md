# ARMYBATTLES - Battle Monitoring & Anti-Cheat System

## Overview

ARMYBATTLES uses Last.fm scrobble data to track participants' listening activity during streaming battles. The system verifies that users are legitimately listening to playlist tracks and detects cheating patterns.

## Authentication System

### Username-Based Authentication (Current)

Users log in using their Last.fm username only. No OAuth flow required.

**Endpoint:** `POST /api/auth/username-login`

**Flow:**
1. User enters Last.fm username
2. Server validates username exists via Last.fm API (`user.getInfo`)
3. Creates/updates user in database
4. Generates 30-day session token
5. Returns token + user data to client
6. Client stores in localStorage

**Benefits:**
- No complex OAuth flow
- No API rate limits from OAuth
- Instant login/signup
- Fetches public profile data (avatar, display name)

## Battle Monitoring System

### How It Works

The battle verification system runs every **30 seconds** via `/api/battle/verify` endpoint.

### Verification Process

1. **Transition Battles**
   - Move battles from `upcoming` → `active` when `startTime` is reached
   - Move battles from `active` → `ended` when `endTime` is reached

2. **For Each Active Battle & Participant:**
   - Fetch recent tracks from Last.fm (`user.getRecentTracks`)
   - Filter tracks within battle time window
   - Match tracks against battle playlist (normalized artist + title)
   - Count valid scrobbles
   - Detect cheating patterns
   - Update StreamCount record

3. **Emit Real-time Updates**
   - Broadcast leaderboard to all connected clients via Socket.io
   - Update every 30 seconds during active battles

### Last.fm Scrobble Matching

**API Used:** `user.getRecentTracks`

**Parameters:**
- `user`: Last.fm username
- `from`: Battle start timestamp
- `to`: Current timestamp
- `limit`: 200 (max)

**Matching Logic:**
```javascript
// Normalize both scrobble and playlist track
const scrobbleName = normalizeString(scrobble.name);    // "Dynamite"
const scrobbleArtist = normalizeString(scrobble.artist); // "bts"

const trackName = normalizeString(playlistTrack.title);  // "Dynamite"
const trackArtist = normalizeString(playlistTrack.artist); // "BTS"

// Match if both name AND artist match
match = scrobbleName === trackName && scrobbleArtist === trackArtist;
```

**Normalization:**
- Lowercase
- Trim whitespace
- Remove accents/diacritics (NFD normalization)
- Collapse multiple spaces

### Anti-Cheat Detection

The system implements **3 detection rules** based on Last.fm scrobbling guidelines:

#### Rule 1: Impossible Scrobble Rate
**Detects:** 11+ songs scrobbled within 1 minute

**Logic:**
```
If 11 consecutive scrobbles occur within ≤60 seconds:
  → CHEATER (avg <5.5 sec/song - physically impossible)
```

**Example:**
```
11 songs in 58 seconds = FLAGGED
```

#### Rule 2: Suspicious Skip Pattern
**Detects:** 5+ songs scrobbled within 30 seconds

**Logic:**
```
If 5 consecutive scrobbles occur within ≤30 seconds:
  → CHEATER (avg <6 sec/song - obvious skipping)
```

**Example:**
```
5 songs in 28 seconds = FLAGGED
```

#### Rule 3: Unrealistic Average Tempo
**Detects:** Average time between scrobbles <30 seconds over 10+ songs

**Logic:**
```
totalDuration = lastScrobble - firstScrobble
avgTime = totalDuration / (scrobbleCount - 1)

If avgTime < 30 seconds AND scrobbleCount >= 10:
  → CHEATER (unrealistic listening pace)
```

**Example:**
```
20 songs in 8 minutes = avg 24 sec/song = FLAGGED
```

**Why 30 seconds?**
- Last.fm minimum scrobble threshold: 30 seconds OR 50% of track
- Average song length: 3-4 minutes
- Even skipping to 50% requires ~90+ seconds per song minimum
- 30 seconds average = definitely skipping excessively

### Last.fm API Documentation Reference

**Scrobbling Rules (from Last.fm):**
1. Track must play for at least **30 seconds** or **50% of track duration** (whichever comes first)
2. Tracks under 30 seconds total length cannot be scrobbled
3. Scrobbles are timestamped when submitted (after play requirement met)

**API Endpoint:** `user.getRecentTracks`
- Returns up to 200 recent tracks per request
- Includes currently playing track (if any)
- Timestamps in Unix epoch format

**Rate Limits:**
- Standard API: ~5 requests/second
- Our system: 1 verification cycle every 30 seconds per battle

### Flagged Users Display

**In Leaderboard:**
- Flagged users show `isCheater: true`
- UI displays warning badge/indicator
- Counts still appear but marked as suspicious
- Admins can review and take action

**No Automatic Disqualification:**
- System flags suspicious activity
- Human review recommended
- False positives possible (rare edge cases)

## Real-time Updates

### Socket.io Events

**Client Subscribes:**
```javascript
socket.emit('join-battle', { battleId });
```

**Server Emits (every 30 sec):**
```javascript
socket.to(`battle-${battleId}`).emit('leaderboard-update', {
  battleId,
  leaderboard: [
    { userId, username, count, isCheater },
    ...
  ],
  updatedAt: ISO_timestamp
});
```

**Battle Ends:**
```javascript
socket.to(`battle-${battleId}`).emit('battle-ended', {
  battleId,
  leaderboard: finalLeaderboard
});
```

## Starting the Verification System

**Automatic Start:**
The verification system should be triggered automatically when the server starts or when the first active battle is detected.

**Manual Start:**
```bash
curl -X POST http://localhost:3000/api/battle/verify
```

**Response:**
```json
{
  "message": "Verification process started"
}
```

**Note:** Only needs to be called once. The 30-second interval continues until server restart.

## Database Schema

### StreamCount Collection

```javascript
{
  battleId: ObjectId,           // Reference to Battle
  userId: ObjectId,             // Reference to User
  count: Number,                // Total valid scrobbles
  isCheater: Boolean,           // Flagged by anti-cheat
  scrobbleTimestamps: [Number], // Unix timestamps of all scrobbles
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ battleId: 1, userId: 1 }` (unique)

### Battle Status Transitions

```
upcoming → active → ended
```

- `upcoming`: Battle created, start time not reached
- `active`: Currently running, verification active
- `ended`: Past end time, final leaderboard frozen

## Monitoring & Logs

**Log Events:**
- Battle transitions (upcoming → active → ended)
- Scrobble verification per user
- Cheating detection with details
- Leaderboard updates
- API errors

**Example Log:**
```json
{
  "level": "info",
  "message": "Scrobbles verified",
  "battleId": "...",
  "username": "jungkook",
  "scrobblesCounted": 15,
  "isCheater": false,
  "avgTimeBetweenScrobbles": "185.3",
  "suspiciousScrobbles": 2,
  "totalRecentTracks": 20
}
```

**Cheating Alert:**
```json
{
  "level": "warn",
  "message": "Cheating detected: 5+ scrobbles in 30 seconds",
  "windowDuration": 28,
  "scrobbleCount": 5
}
```

## Testing Checklist

### Authentication
- [x] Login with valid Last.fm username
- [x] Navbar updates after login (shows username/avatar)
- [x] Logout clears session
- [x] Session persists on page refresh

### Battle Creation
- [ ] Create battle with Spotify playlist URL
- [ ] Playlist tracks fetched correctly
- [ ] Battle appears in battles list
- [ ] Join battle as another user

### Battle Monitoring
- [ ] Verify endpoint starts successfully
- [ ] Active battles transition from upcoming
- [ ] Scrobbles counted correctly
- [ ] Leaderboard updates every 30 seconds
- [ ] Socket.io real-time updates work
- [ ] Battle ends and freezes leaderboard

### Anti-Cheat
- [ ] Legitimate listening: NOT flagged
- [ ] Rapid skipping: FLAGGED
- [ ] Impossible scrobble rate: FLAGGED
- [ ] Flagged users show indicator in UI

## Future Enhancements

1. **Admin Dashboard**
   - Review flagged users
   - Manual unflag/ban
   - View scrobble timelines

2. **Enhanced Detection**
   - Detect repeat pattern abuse
   - Track skip percentage per user
   - Machine learning-based anomaly detection

3. **User Appeals**
   - Allow users to dispute flags
   - Provide evidence of legitimate listening

4. **Battle Moderation**
   - Pause/resume battles
   - Kick participants
   - Adjust rules mid-battle

## Troubleshooting

### Scrobbles Not Counting

**Check:**
1. Last.fm username set correctly
2. User has scrobbles in time window (`user.getRecentTracks`)
3. Track names/artists match playlist exactly (check normalization)
4. Scrobbles within battle start/end time

### Verification Not Running

**Check:**
1. `/api/battle/verify` called with POST
2. Check server logs for errors
3. Ensure MongoDB connection established
4. Socket.io initialized properly

### False Positive Flags

**Causes:**
- Very short songs in playlist (<2 min)
- User legitimately listening at 2x speed (rare)
- Multiple devices scrobbling simultaneously

**Solution:**
- Review scrobble timestamps manually
- Check avg time between scrobbles
- Verify against Last.fm listening history

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/username-login` | POST | No | Login/signup with Last.fm username |
| `/api/auth/logout` | POST | Yes | Clear session |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/battle/create` | POST | Yes | Create new battle |
| `/api/battle/join` | POST | Yes | Join existing battle |
| `/api/battle/list` | GET | No | List all battles |
| `/api/battle/[id]/leaderboard` | GET | No | Get battle leaderboard |
| `/api/battle/verify` | POST | No | Start verification process |

---

**Last Updated:** 2025-12-01
**System Version:** 2.0 (Username-based Auth)
