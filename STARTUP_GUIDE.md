# ARMYBATTLES - Quick Startup Guide

## Prerequisites

1. **MongoDB** - Running and accessible via `MONGO_URI`
2. **Last.fm API Key** - Get from https://www.last.fm/api/account/create
3. **Spotify API Credentials** (for playlist fetching)

## Environment Setup

Edit `.env.local`:

```env
MONGO_URI=mongodb://localhost:27017/armybattles
LASTFM_API_KEY=your_lastfm_api_key_here
LASTFM_SHARED_SECRET=your_lastfm_shared_secret_here
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## Start the Application

### 1. Install Dependencies (first time only)

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5000**

### 3. Start Battle Verification System

In a new terminal, run:

```bash
curl -X POST http://localhost:5000/api/battle/verify
```

Or visit the dashboard after creating a battle - it will auto-trigger.

**Note:** This starts a 30-second background job that monitors all active battles.

## Using the Application

### For Users

1. **Sign Up / Login**
   - Go to http://localhost:5000/login
   - Enter your Last.fm username
   - That's it! No password needed

2. **Create a Battle**
   - Go to Dashboard
   - Click "Create Battle"
   - Enter battle name, Spotify playlist URL, start/end times
   - Submit

3. **Join a Battle**
   - Go to Battles page
   - Click on a battle
   - Click "Join Battle"

4. **Participate**
   - Listen to the playlist tracks on Spotify
   - Make sure your Spotify is connected to Last.fm
   - Scrobbles will be tracked automatically
   - View real-time leaderboard on the battle page

### How Scrobbling Works

1. Connect your Spotify to Last.fm:
   - Go to https://www.last.fm/settings/applications
   - Connect Spotify account
   - Play music on Spotify

2. Last.fm will scrobble tracks after:
   - 30 seconds of play time, OR
   - 50% of track duration (whichever comes first)

3. ARMYBATTLES checks every 30 seconds:
   - Fetches your recent scrobbles
   - Matches them against battle playlist
   - Updates leaderboard in real-time

### Anti-Cheat Rules

The system automatically detects and flags:

- **11+ songs in 1 minute** - Impossible listening rate
- **5+ songs in 30 seconds** - Obvious skipping
- **Average <30 sec/song over 10+ tracks** - Unrealistic tempo

Flagged users will show a warning indicator on the leaderboard.

## Admin Features

### Make a User Admin

Connect to MongoDB and update the user:

```javascript
db.users.updateOne(
  { username: "your_username" },
  { $set: { isAdmin: true } }
)
```

### Admin Endpoints

**Manually End a Battle:**
```bash
curl -X POST http://localhost:5000/api/admin/end-battle-manually \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"battleId": "BATTLE_ID"}'
```

**Cleanup Old Battles (>7 days):**
```bash
curl -X GET http://localhost:5000/api/admin/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Monitoring

### Check Server Logs

Look for these log messages:

```
[INFO] Verification cycle started
[INFO] Scrobbles verified
[WARN] Cheating detected: ...
[INFO] Battle frozen
```

### View Real-time Updates

Open browser console on battle detail page:

```javascript
// Socket.io events will log:
leaderboard-update
battle-ended
```

## Troubleshooting

### "Missing Last.fm API configuration" error

**Solution:** Check that `.env.local` has `LASTFM_API_KEY` set correctly. Restart the server after changing environment variables.

### Navbar doesn't show logged-in user

**Solution:** This should now be fixed. The navbar checks localStorage on every route change. If issue persists:
1. Clear browser localStorage
2. Log out and log back in
3. Check browser console for errors

### Scrobbles not counting

**Checklist:**
1. Is your Spotify connected to Last.fm?
2. Did you play tracks for at least 30 seconds?
3. Are track names exactly matching playlist? (Check normalization)
4. Is the battle currently active?
5. Did you join the battle before playing?

### Verification not running

**Solution:**
```bash
# Check if verification is already running
curl -X POST http://localhost:5000/api/battle/verify

# Should return either:
# "Verification process started" OR
# "Verification process already running"
```

### False positive cheating flags

**Review:**
1. Check user's scrobble timestamps in database
2. Calculate average time between scrobbles
3. Compare with Last.fm listening history
4. Admin can manually review and unflag

## Development Tips

### Reset Database

```javascript
// In MongoDB shell
db.battles.deleteMany({});
db.streamcounts.deleteMany({});
db.users.deleteMany({});
```

### Test Cheating Detection

Create a test battle with very short songs, or manually insert scrobble timestamps:

```javascript
db.streamcounts.insertOne({
  battleId: ObjectId("..."),
  userId: ObjectId("..."),
  count: 15,
  isCheater: false,
  scrobbleTimestamps: [
    1638360000000, 1638360005000, 1638360010000, // 5 sec apart
    1638360015000, 1638360020000, 1638360025000,
    // ... more timestamps
  ]
});

// Run verification - should flag as cheater
```

### Debug Socket.io

```javascript
// In browser console on battle page
socket.on('connect', () => console.log('Connected'));
socket.on('leaderboard-update', (data) => console.log('Update:', data));
socket.on('disconnect', () => console.log('Disconnected'));
```

## Production Deployment

### Environment Variables

Set these in your production environment:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/armybattles
LASTFM_API_KEY=...
LASTFM_SHARED_SECRET=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

### Build for Production

```bash
npm run build
npm start
```

### Start Verification on Boot

Add to your server startup script:

```bash
#!/bin/bash
npm start &
sleep 5
curl -X POST http://localhost:5000/api/battle/verify
```

Or create a cron job:

```cron
@reboot sleep 30 && curl -X POST http://localhost:5000/api/battle/verify
```

## Architecture Summary

```
┌─────────────────┐
│   User Browser  │
│  (React/Next)   │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│   Next.js API   │
│   + Socket.io   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────┐
│MongoDB │  │ Last.fm  │
│        │  │ API      │
└────────┘  └──────────┘

Background Job (30s interval):
verify.js → Last.fm API → MongoDB → Socket.io → Clients
```

## Files Modified

### Fixed
- `components/Navbar.js` - Fixed auth state detection (checks localStorage on route change)

### Enhanced
- `pages/api/battle/verify.js` - Enhanced anti-cheat with 3 detection rules + detailed logging

### Created
- `BATTLE_MONITORING_SYSTEM.md` - Complete system documentation
- `STARTUP_GUIDE.md` - This file

### Already Configured (No Changes Needed)
- `pages/api/auth/username-login.js` - Username-based auth
- `pages/api/auth/login.js` - Disabled (returns 410)
- `pages/api/auth/register.js` - Disabled (returns 410)
- All battle endpoints working correctly

## Next Steps

1. Test login flow ✅
2. Create a test battle with a Spotify playlist
3. Join battle with multiple accounts
4. Play playlist tracks on Spotify (with Last.fm connected)
5. Watch leaderboard update every 30 seconds
6. Verify anti-cheat detection works

## Support

For issues or questions:
1. Check `BATTLE_MONITORING_SYSTEM.md` for detailed explanations
2. Review server logs for error messages
3. Check browser console for client-side errors
4. Verify environment variables are set correctly

---

**Version:** 2.0 (Username-based Auth + Enhanced Anti-Cheat)
**Last Updated:** 2025-12-01
