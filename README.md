# ARMYBATTLES

A production-ready real-time music streaming battle platform where users compete by listening to Spotify playlists. The platform tracks plays through Last.fm scrobbles and displays live leaderboards with automatic cheat detection and battle lifecycle management.

## Features

### Core Features
- **User Authentication**: Simple username-only authentication using Last.fm usernames with secure session tokens
- **Last.fm Integration**: Automatically ingest scrobbles using Last.fm's public API
- **Battle Creation**: Create battles with Spotify playlists and custom time windows
- **Real-time Leaderboards**: Live updates via Socket.io every 30 seconds
- **Scrobble Verification**: Automatic verification of plays matching playlist tracks with normalized matching
- **Battle Lifecycle Management**: Automatic transitions between upcoming → active → ended states

### Production Enhancements
- **Input Validation**: Zod validation on all API endpoints
- **Rate Limiting**: Protection against API abuse on all POST endpoints
- **Comprehensive Error Handling**: Structured error responses across all routes
- **Cheat Detection**: Automatic flagging of users with >10 scrobbles per minute
- **Frozen Results**: Battle results are frozen and saved when battles end
- **Enhanced Logging**: Structured logging for all verification cycles and API operations
- **MongoDB Retry Logic**: Automatic reconnection with exponential backoff
- **Security**: Query sanitization, ObjectId validation, admin-only endpoints

### Admin Features
- **Manual Battle Control**: Admin-only endpoint to end battles manually
- **Data Cleanup**: Automated cleanup of battles older than 7 days
- **Admin Dashboard**: Special admin privileges for battle management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Socket.io-client, Tailwind CSS 3.x
- **Backend**: Next.js API Routes with middleware architecture
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io for live updates
- **APIs**: Spotify Web API (client credentials), Last.fm API
- **Authentication**: Stateless Last.fm session tokens with MongoDB session storage
- **Validation**: Zod for input validation
- **Logging**: Structured logging with context

## UI Design

The platform features a modern, responsive interface with a **BTS/ARMY inspired aesthetic**:

### Design Theme
- **BTS-Inspired Dark Mode**: Luxurious dark surfaces (`surface`, `panel`) with BTS accents (`bts.purple`, `bts.pink`, `bts.deep`)
- **Premium Typography**: Space Grotesk for display headings and Inter for body copy
- **Minimal Motion**: Subtle transitions; no heavy animations or emoji noise
- **Mobile-First**: Clean, readable layout optimized for small screens first

### Reusable Components
- **Navbar**: Responsive navigation with mobile hamburger menu and profile dropdown
- **Hero Section**: Eye-catching landing page with call-to-action buttons
- **BattleCard**: Displays battle information with status badges (active, upcoming, ended)
- **Modal**: Clean modal dialogs for creating and joining battles
- **Badge**: Status indicators with color-coded labels
- **LoadingSpinner**: Animated loading indicator

### Pages
- **Landing Page** (`/`): Hero section with featured battles and platform features
- **Login/Signup** (`/login`, `/signup`): Clean card-based authentication forms
- **Battles** (`/battles`): Browse all battles with filter options
- **Dashboard** (`/dashboard`): User dashboard with quick actions and battle management
- **Battle Detail** (`/battle/[id]`): Live leaderboard with real-time updates and animated indicators

### Tailwind CSS Configuration
The project uses Tailwind CSS 3.x with custom theme configuration:
- Custom purple color palette for BTS/ARMY branding
- Extended font families and spacing
- Responsive breakpoints for mobile, tablet, and desktop
- Forms plugin for beautiful form inputs

## Prerequisites

Before running this application, you need:

1. **MongoDB Database**: A MongoDB instance (MongoDB Atlas recommended)
2. **Spotify API Credentials**: 
   - Register at https://developer.spotify.com/dashboard
   - Create an app to get Client ID and Client Secret
3. **Last.fm API Key**:
   - Register at https://www.last.fm/api/account/create
   - Get your API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/army-stream-battles?retryWrites=true&w=majority
LASTFM_API_KEY=your-lastfm-api-key
LASTFM_SHARED_SECRET=your-lastfm-shared-secret
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
# Optional
LOG_LEVEL=INFO
```

### How to Get API Keys

**MongoDB URI:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string and replace `<password>` with your database password

**Spotify Credentials:**
1. Go to https://developer.spotify.com/dashboard
2. Log in and create a new app
3. Copy the Client ID and Client Secret

**Last.fm API Key:**
1. Go to https://www.last.fm/api/account/create
2. Fill in the application details
3. Copy the API Key (not the shared secret)

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in all required values

## Running Locally

1. **Development mode:**
```bash
npm run dev
```

2. **Production build:**
```bash
npm run build
npm start
```

The application will run on http://localhost:5000

## Running on Replit

1. **Import this repository** to Replit

2. **Add environment variables:**
   - Click on "Tools" → "Secrets" in the Replit sidebar
   - Add each environment variable from the `.env.example` file

3. **The application will start automatically**
   - Replit will run `npm install` and `npm run dev`
   - Access your app via the provided Replit URL

4. **To deploy on Replit:**
   - Click the "Deploy" button
   - Follow the deployment wizard
   - Your app will be live with a public URL

## How to Use

1. **Sign Up / Login**: Enter your Last.fm username. Your profile is created automatically using your public Last.fm data.
2. **Create a Battle**: 
   - Enter battle name
   - Paste a Spotify playlist URL (supports playlists with 100+ songs)
   - Set start and end times
3. **Join Battles**: Browse available battles and join (requires you to be logged in with your Last.fm username)
4. **Listen and Compete**: 
   - Listen to tracks from the playlist on any platform (Spotify, Apple Music, YouTube Music, etc.)
   - Make sure you're scrobbling to Last.fm
   - Watch the live leaderboard update every 30 seconds
   - Check for the "Flagged" status if suspicious activity is detected

## How Stream Verification Works

### Verification Process

Every 30 seconds, the system performs the following steps:

1. **Battle Lifecycle Check**:
   - Transitions battles from "upcoming" to "active" when start time is reached
   - Identifies battles that have ended

2. **Scrobble Fetching** (Only for Active Battles):
   - Queries Last.fm API for each participant's recent tracks
   - Fetches tracks played between battle start time and current time

3. **Track Matching**:
   - Normalizes track names and artists (lowercase, removes diacritics, trims whitespace)
   - Matches scrobbles against the playlist tracks
   - Filters scrobbles that fall within the battle time window

4. **Cheat Detection**:
   - Analyzes scrobble timestamps for suspicious patterns
   - Flags users with more than 10 scrobbles within any 1-minute window
   - Marked participants show a "⚠️ Flagged" indicator on the leaderboard

5. **Result Freezing** (When Battle Ends):
   - Saves final leaderboard to database
   - Stops querying Last.fm API for that battle
   - Broadcasts "battle-ended" event via Socket.io

6. **Real-time Updates**:
   - Emits leaderboard updates via Socket.io
   - Shows all participants (including those with 0 counts)
   - Displays last updated timestamp

### Cheat Prevention and Fair Play Rules

**Automatic Cheat Detection:**
- Users who log more than 10 scrobbles per minute are automatically flagged
- Flagged users are highlighted on the leaderboard with a warning icon
- Manual review by admins can override false positives

**Fair Play Guidelines:**
- Only tracks from the specified playlist count toward your score
- Scrobbles must occur within the battle time window (start to end time)
- Each scrobble is counted only once
- Track must be scrobbled to Last.fm (any music platform works)

**What Counts:**
- ✅ Listening to playlist tracks on any platform (Spotify, Apple Music, etc.)
- ✅ Scrobbles within the battle time window
- ✅ Exact track and artist matches (normalized for comparison)

**What Doesn't Count:**
- ❌ Tracks not in the playlist
- ❌ Scrobbles before battle start or after battle end
- ❌ Artificially accelerated scrobbling (>10/minute)
- ❌ Duplicate scrobbles (already handled by Last.fm)

## Project Structure

```
/app                       # Next.js App Router pages
  /battle/[id]/           # Battle detail page with live leaderboard
  /dashboard/             # User dashboard
  /login/                 # Login page
  /signup/                # Sign up page
/pages/api                # API routes with middleware
  /admin/                 # Admin-only endpoints
    cleanup.js            # Data cleanup endpoint
    end-battle-manually.js # Manual battle end
  /auth/                  # Authentication endpoints
    username-login.js     # Login with Last.fm username
    logout.js             # Destroy current session
    me.js                 # Retrieve current user profile
  /battle/                # Battle management
    create.js             # Create battle
    join.js               # Join battle
    list.js               # List battles
    verify.js             # Verification process
    /[id]/leaderboard.js  # Get leaderboard
  /user/                  # User management (deprecated endpoints)
  socket.js               # Socket.io server
/models                   # Mongoose schemas
  User.js                 # User model (with isAdmin)
  Battle.js               # Battle model (with lifecycle fields)
  StreamCount.js          # Stream count model (with cheat detection)
/lib                      # Shared libraries
  middleware.js           # Reusable middleware (auth, validation, rate limiting)
  schemas.js              # Zod validation schemas
/utils                    # Utility functions
  auth.js                 # Session + cookie utilities
  db.js                   # MongoDB connection with retry logic
  spotify.js              # Spotify API integration with normalization
  lastfm.js               # Last.fm API integration
  logger.js               # Structured logging
/scripts                  # Utility scripts
  cleanupOldBattles.js    # Cleanup script for old battles
```

## API Reference

### Authentication Endpoints

#### POST /api/auth/username-login
Login or sign up using a Last.fm username. Validates the username exists on Last.fm, creates or updates the user profile, and issues a session token.

**Request:**
```json
{
  "username": "string (Last.fm username)"
}
```

**Response:**
```json
{
  "success": true,
  "token": "session_token",
  "user": {
    "id": "user_id",
    "username": "lastfm_username",
    "displayName": "display name or null",
    "lastfmUsername": "lastfm_username",
    "avatarUrl": "https://...",
    "isAdmin": false
  }
}
```

**Errors:**
- 404: Last.fm user not found
- 500: Server error

**Rate Limit:** 10 requests per minute

#### POST /api/auth/logout
Clear the active session for the authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### GET /api/auth/me
Fetch the currently authenticated user's profile.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "username": "lastfm_username",
    "displayName": "display name or null",
    "lastfmUsername": "lastfm_username",
    "avatarUrl": "https://...",
    "isAdmin": false
  }
}
```

### Battle Endpoints

#### POST /api/battle/create
Create a new battle (requires authentication).

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "string (1-100 chars)",
  "spotifyPlaylist": "string (playlist URL or ID)",
  "startTime": "ISO 8601 datetime string",
  "endTime": "ISO 8601 datetime string (must be after startTime)"
}
```

**Response:**
```json
{
  "message": "Battle created successfully",
  "battle": {
    "id": "battle_id",
    "name": "battle_name",
    "spotifyPlaylist": "playlist_id",
    "startTime": "2025-01-01T12:00:00Z",
    "endTime": "2025-01-01T18:00:00Z",
    "trackCount": 50,
    "status": "upcoming"
  }
}
```

**Rate Limit:** 5 requests per minute

#### POST /api/battle/join
Join an existing battle (requires authentication).

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "battleId": "string (24-char ObjectId)"
}
```

**Response:**
```json
{
  "message": "Successfully joined battle",
  "battle": {
    "id": "battle_id",
    "name": "battle_name",
    "participantCount": 5
  }
}
```

**Rate Limit:** 10 requests per minute

#### GET /api/battle/list
Get list of all battles (no authentication required).

**Response:**
```json
{
  "battles": [
    {
      "id": "battle_id",
      "name": "battle_name",
      "host": "hostname",
      "startTime": "2025-01-01T12:00:00Z",
      "endTime": "2025-01-01T18:00:00Z",
      "status": "active",
      "participantCount": 10,
      "trackCount": 50
    }
  ]
}
```

#### GET /api/battle/[id]/leaderboard
Get battle leaderboard (no authentication required).

**Response:**
```json
{
  "battleId": "battle_id",
  "battleName": "battle_name",
  "status": "active",
  "startTime": "2025-01-01T12:00:00Z",
  "endTime": "2025-01-01T18:00:00Z",
  "participantCount": 10,
  "leaderboard": [
    {
      "userId": "user_id",
      "username": "username",
      "count": 42,
      "isCheater": false
    }
  ],
  "updatedAt": "2025-01-01T15:30:00Z"
}
```

#### POST /api/battle/verify
Start the scrobble verification process (no authentication required).

**Response:**
```json
{
  "message": "Verification process started"
}
```

**Note:** This endpoint is automatically called by the dashboard on load.

### Admin Endpoints

#### POST /api/admin/end-battle-manually
Manually end a battle (requires admin authentication).

**Headers:** `Authorization: Bearer {admin_token}`

**Request:**
```json
{
  "battleId": "string (24-char ObjectId)"
}
```

**Response:**
```json
{
  "message": "Battle ended successfully",
  "battle": {
    "id": "battle_id",
    "name": "battle_name",
    "status": "ended",
    "finalLeaderboard": [...]
  }
}
```

**Rate Limit:** 10 requests per minute

#### GET /api/admin/cleanup
Clean up battles older than 7 days (requires admin authentication).

**Headers:** `Authorization: Bearer {admin_token}`

**Response:**
```json
{
  "message": "Cleanup completed successfully",
  "summary": {
    "battlesDeleted": 5,
    "streamCountsDeleted": 50,
    "orphanedStreamCountsDeleted": 3
  }
}
```

**Rate Limit:** 2 requests per minute

## Testing Admin Endpoints

### Creating an Admin User

Admin users must be created manually in the database. To create an admin user:

1. **Log in with your Last.fm username** to create the base user account
2. **Access your MongoDB database** (via MongoDB Compass or Atlas)
3. **Find the user** in the `users` collection
4. **Update the user document:**
   ```javascript
   db.users.updateOne(
     { username: "your_lastfm_username" },
     { $set: { isAdmin: true } }
   )
   ```
5. **Log in again** with your Last.fm username so the new session token includes admin privileges

### Testing Admin Endpoints

**Using curl:**
```bash
# Get admin token by logging in through the UI, then copy the token from localStorage
TOKEN="your_admin_session_token"

# Manually end a battle
curl -X POST http://localhost:5000/api/admin/end-battle-manually \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"battleId": "battle_id_here"}'

# Run cleanup
curl -X GET http://localhost:5000/api/admin/cleanup \
  -H "Authorization: Bearer $TOKEN"
```

**Using JavaScript:**
```javascript
const token = localStorage.getItem('token'); // Admin session token

// End battle manually
await fetch('/api/admin/end-battle-manually', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ battleId: 'battle_id_here' }),
});

// Run cleanup
await fetch('/api/admin/cleanup', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## Confirming Battle Lifecycle Functionality

### Manual Testing

1. **Create a Test Battle:**
   - Create a battle that starts in 1 minute and ends in 3 minutes
   - Check the database - status should be "upcoming"

2. **Wait for Start Time:**
   - After 1 minute, check the database or battle page
   - Status should automatically change to "active"
   - Check server logs for: `Battles transitioned to active`

3. **During Active Battle:**
   - Join the battle
   - Listen to playlist tracks and scrobble to Last.fm
   - Watch the leaderboard update every 30 seconds
   - Check logs for: `Verification cycle started` and `Scrobbles verified`

4. **Wait for End Time:**
   - After 3 minutes total, the battle should end automatically
   - Status changes to "ended"
   - Final leaderboard is frozen in the database
   - Check logs for: `Battle frozen`
   - Socket.io emits `battle-ended` event

5. **After Battle Ends:**
   - Leaderboard shows frozen results
   - No more Last.fm queries for this battle
   - Results persist even after server restart

### Database Verification

Check the `battles` collection for these fields:
```javascript
{
  status: "ended",           // Changed from "active"
  finalLeaderboard: [...],   // Array of final results
  endedAt: ISODate("..."),   // Timestamp when frozen
}
```

### Log Verification

Look for these log messages:
```
[INFO] Battles transitioned to active { count: 1 }
[INFO] Verification cycle started { time: "...", activeBattles: 1 }
[INFO] Scrobbles verified { battleId: "...", username: "...", scrobblesCounted: 5 }
[INFO] Battle frozen { battleId: "...", participantCount: 3 }
[INFO] Verification cycle completed { time: "..." }
```

## Running Cleanup Script

To manually run the cleanup script:

```bash
node scripts/cleanupOldBattles.js
```

This will:
- Find all battles with status "ended" and `endedAt` older than 7 days
- Delete those battles and associated stream counts
- Clean up orphaned stream counts

## Troubleshooting

**Database connection issues:**
- Verify your MongoDB URI is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure the database user has proper permissions
- Check logs for retry attempts

**Spotify API errors:**
- Verify your Client ID and Secret are correct
- Make sure the playlist is public
- Check that you haven't exceeded API rate limits
- Playlists with 100+ songs are handled automatically

**Last.fm not showing plays:**
- Verify the Last.fm username is spelled correctly
- Ensure scrobbling is enabled in your music player
- Check that plays are within the battle time window
- Confirm track names match (normalized comparison used)
- Check logs for `Scrobbles verified` messages

**Cheat detection false positives:**
- Check `scrobbleTimestamps` in StreamCount collection
- Verify timestamp distribution
- Admin can manually review and override flags

**Rate limiting errors:**
- Wait for the retry time specified in the error
- Rate limits reset every minute
- Admin endpoints have stricter limits

## License

MIT
