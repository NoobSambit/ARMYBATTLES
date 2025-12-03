# ARMYBATTLES

A production-ready real-time music streaming battle platform where users compete by listening to Spotify playlists. The platform tracks plays through Last.fm scrobbles and displays live leaderboards with comprehensive battle management features, team gameplay, advanced host controls, and automated monitoring systems.

## Overview

ARMYBATTLES transforms music listening into competitive battles where participants earn points by scrobbling tracks from designated Spotify playlists. Whether competing solo or as part of a team, users can track their progress on real-time leaderboards with automatic cheat detection, battle lifecycle management, and powerful host control features.

## Core Features

### User Experience
- **Simple Authentication**: Username-only login using Last.fm usernames with secure session tokens
- **Real-time Leaderboards**: Live updates via HTTP polling every 2 minutes
- **Battle Browsing**: Explore all available battles with status indicators (upcoming, active, ended)
- **Personal Dashboard**: Quick access to user statistics and battle management
- **Responsive Design**: BTS/ARMY-inspired aesthetic optimized for all devices

### Battle Management
- **Flexible Battle Creation**: Create battles with Spotify playlists and custom time windows
- **Multiple Join Modes**: Join as solo player or create/join teams with invite codes
- **Battle Lifecycle**: Automatic transitions between upcoming → active → ended states
- **Scrobble Verification**: Normalized track matching against playlist with Last.fm integration
- **Frozen Results**: Battle results are permanently saved when battles end

### Team System
- **Team Creation**: Create teams with auto-generated 8-character invite codes
- **Team Joining**: Join existing teams using invite codes
- **Team Scoring**: Aggregate scores from all team members
- **Team Details**: View member contributions, progress bars, and statistics
- **Team Flexibility**: Unlimited team size, leave/rejoin options
- **Leaderboard Filtering**: Toggle between All Participants, Teams Only, or Solo Players

### Host Controls
- **Participant Management**: Kick disruptive or cheating participants
- **Battle Extension**: Extend battle duration on the fly
- **Manual Battle End**: End battles early with full result preservation
- **Activity Logging**: Comprehensive audit trail of all battle actions
- **Statistics Dashboard**: Real-time participation and scrobble analytics

### Security & Monitoring
- **Cheat Detection**: Automatic flagging of users with >10 scrobbles per minute
- **Rate Limiting**: Protection against API abuse on all endpoints
- **Input Validation**: Zod validation on all API routes
- **Admin Controls**: Admin-only endpoints for battle management and data cleanup
- **Query Sanitization**: MongoDB ObjectId validation and injection prevention
- **Activity Auditing**: Complete logs of kicks, extensions, and battle modifications

### Developer Features
- **Comprehensive Error Handling**: Structured error responses across all routes
- **Enhanced Logging**: Detailed logs for verification cycles and API operations
- **MongoDB Retry Logic**: Automatic reconnection with exponential backoff
- **Serverless Optimized**: Fully compatible with Netlify free tier deployment
- **External Cron Support**: GitHub Actions workflow for scheduled verification

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18.3
- **Styling**: Tailwind CSS 3.x with custom BTS/ARMY theme
- **Charts**: Recharts for statistics visualization
- **State Management**: React hooks and context
- **Real-time Updates**: HTTP polling (optimized for serverless)

### Backend
- **API**: Next.js API Routes with middleware architecture
- **Database**: MongoDB with Mongoose ODM
- **External APIs**: Spotify Web API, Last.fm API
- **Authentication**: Stateless session tokens with MongoDB session storage
- **Validation**: Zod schemas for all inputs
- **Logging**: Structured logging with context

### Infrastructure
- **Hosting**: Optimized for Netlify serverless deployment
- **Automation**: GitHub Actions for scheduled verification
- **Database Hosting**: MongoDB Atlas compatible
- **Cron Alternative**: Supports cron-job.org, EasyCron, UptimeRobot

## UI Design

The platform features a modern, responsive interface with a **BTS/ARMY inspired aesthetic**:

### Design Theme
- **BTS-Inspired Dark Mode**: Luxurious dark surfaces with purple and pink accents
- **Premium Typography**: Space Grotesk for headings, Inter for body text
- **Minimal Motion**: Subtle transitions without heavy animations
- **Glass Morphism**: Frosted glass effects with backdrop blur
- **Gradient Borders**: Purple-pink for teams, blue for solo players
- **Mobile-First**: Clean, readable layout optimized for all screen sizes

### Pages
- **Landing Page** (`/`): Hero section with featured battles and platform highlights
- **Login/Signup** (`/login`, `/signup`): Card-based authentication forms
- **Battles** (`/battles`): Browse all battles with filter and status options
- **Dashboard** (`/dashboard`): User hub with statistics and quick actions
- **Battle Detail** (`/battle/[id]`): Live leaderboard with team details, host controls, and statistics

### Components
- **Navbar**: Responsive navigation with mobile hamburger menu and profile dropdown
- **Hero Section**: Eye-catching landing with call-to-action buttons
- **BattleCard**: Battle information with status badges and participant counts
- **TeamCard**: Team leaderboard entries with rank badges and member counts
- **TeamDetailsModal**: Expandable team view with member contributions
- **BattleJoinModal**: Multi-step wizard for joining battles (solo or team)
- **KickParticipantModal**: Host interface for removing participants
- **ExtendBattleModal**: Host interface for extending battle duration
- **ActivityLogModal**: Complete audit trail of battle actions
- **StatisticsDashboard**: Real-time charts and participation metrics
- **Modal**: Reusable modal dialogs with animations
- **Badge**: Status indicators with color-coded labels
- **LoadingSpinner**: Animated loading indicator

## Prerequisites

Before running this application, you need:

1. **MongoDB Database**: MongoDB Atlas (free tier available)
2. **Spotify API Credentials**: Client ID and Client Secret from developer dashboard
3. **Last.fm API Key**: API key and shared secret from Last.fm

## Environment Variables

Create a `.env` file in the root directory:

```env
# Required
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/armybattles?retryWrites=true&w=majority
LASTFM_API_KEY=your-lastfm-api-key
LASTFM_SHARED_SECRET=your-lastfm-shared-secret
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Optional
LOG_LEVEL=INFO
CRON_SECRET=your-random-secret-for-verification-cron
```

### How to Get API Keys

**MongoDB URI:**
1. Visit https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy connection string and replace `<password>` with your database password

**Spotify Credentials:**
1. Visit https://developer.spotify.com/dashboard
2. Create a new app
3. Copy Client ID and Client Secret

**Last.fm API Key:**
1. Visit https://www.last.fm/api/account/create
2. Fill in application details
3. Copy API Key and Shared Secret

**CRON_SECRET (for deployment):**
```bash
# Generate secure random secret
openssl rand -hex 32
```

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values
```

## Running Locally

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application runs on http://localhost:5000

## Deployment (Netlify Free Tier)

This project is fully optimized for Netlify's free tier serverless architecture.

### 1. Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Or connect your GitHub repository through Netlify's web interface.

### 2. Configure Environment Variables

In Netlify Dashboard → Site settings → Environment variables, add:
- `MONGO_URI`
- `LASTFM_API_KEY`
- `LASTFM_SHARED_SECRET`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `CRON_SECRET`

### 3. Set Up GitHub Actions Cron

In your GitHub repository → Settings → Secrets, add:
- `CRON_SECRET` (same value as Netlify)
- `VERIFICATION_ENDPOINT_URL` (your Netlify URL + `/api/battle/verify`)

The included GitHub Actions workflow (`.github/workflows/battle-verification-cron.yml`) will automatically trigger battle verification every 2 minutes.

### 4. Alternative Cron Services

Instead of GitHub Actions, you can use:
- **cron-job.org**: Free tier, simple setup
- **EasyCron**: User-friendly interface
- **UptimeRobot**: Combines monitoring with cron

See [NETLIFY_OPTIMIZATION.md](NETLIFY_OPTIMIZATION.md) for detailed deployment instructions.

## How to Use

### 1. Sign Up / Login
Enter your Last.fm username. Profile is auto-created using public Last.fm data.

### 2. Create a Battle
- Enter battle name
- Paste Spotify playlist URL
- Set start and end times
- Choose whether to allow teams

### 3. Join a Battle
- Browse available battles
- Click "Join Battle"
- Choose solo or team mode
- For teams: create new team or join with invite code

### 4. Listen and Compete
- Play tracks from the playlist on any platform (Spotify, Apple Music, YouTube Music, etc.)
- Ensure Last.fm scrobbling is enabled
- Watch live leaderboard updates every 2 minutes
- Monitor your ranking and team progress

### 5. Host Controls (Battle Creator)
- **Kick Participants**: Remove disruptive users
- **Extend Battle**: Add more time to ongoing battles
- **View Statistics**: Monitor participation and engagement
- **Activity Log**: Review all battle actions
- **End Battle**: Manually end before scheduled time

### 6. View Team Details
- Click any team on the leaderboard
- See all members and their contributions
- Copy invite code to add more members
- View progress bars and percentages
- Leave team if needed

## How Stream Verification Works

### Verification Cycle (Every 2 Minutes)

1. **Battle Lifecycle Check**
   - Transitions battles from "upcoming" to "active" when start time is reached
   - Identifies battles that have ended and freezes results

2. **Scrobble Fetching** (Active Battles Only)
   - Queries Last.fm API for each participant's recent tracks
   - Fetches scrobbles between battle start time and current time

3. **Track Matching**
   - Normalizes track names and artists (lowercase, removes diacritics, trims whitespace)
   - Matches scrobbles against playlist tracks
   - Filters scrobbles within battle time window

4. **Cheat Detection**
   - Analyzes scrobble timestamps for suspicious patterns
   - Flags users with >10 scrobbles within any 1-minute window
   - Displays warning indicator on leaderboard

5. **Team Score Aggregation**
   - Sums scrobbles from all team members
   - Updates team rankings in real-time
   - Tracks individual contributions

6. **Result Freezing** (Battle End)
   - Saves final leaderboard to database
   - Stops Last.fm API queries
   - Preserves team and solo results

### Fair Play Guidelines

**What Counts:**
- ✅ Tracks from the specified playlist
- ✅ Scrobbles within battle time window
- ✅ Exact track and artist matches (normalized)
- ✅ Any music platform that scrobbles to Last.fm

**What Doesn't Count:**
- ❌ Tracks not in the playlist
- ❌ Scrobbles before start or after end time
- ❌ Artificially accelerated scrobbling (>10/minute)
- ❌ Duplicate scrobbles (handled by Last.fm)

## Project Structure

```
/app                              # Next.js App Router pages
  /battle/[id]/                   # Battle detail with leaderboard
  /battles/                       # Browse all battles
  /dashboard/                     # User dashboard
  /login/                         # Login page
  /signup/                        # Sign up page
  layout.js                       # Root layout with Navbar
  page.js                         # Landing page

/pages/api                        # API routes
  /admin/                         # Admin-only endpoints
    cleanup.js                    # Data cleanup (7+ day old battles)
    end-battle-manually.js        # Manual battle end
    clear-final-leaderboard.js    # Clear frozen results
  /auth/                          # Authentication
    username-login.js             # Last.fm username login
    login.js                      # Legacy login (deprecated)
    register.js                   # Legacy register (deprecated)
    logout.js                     # Destroy session
    me.js                         # Current user profile
  /battle/                        # Battle management
    create.js                     # Create battle
    join.js                       # Join battle
    list.js                       # List all battles
    verify.js                     # Verification cron endpoint
    /team/                        # Team operations
      create.js                   # Create team
      join.js                     # Join team
      leave.js                    # Leave team
      [teamId].js                 # Get team details
    /[id]/                        # Battle-specific endpoints
      leaderboard.js              # Get leaderboard (with filters)
      statistics.js               # Battle statistics
      activity.js                 # Activity log
      kick.js                     # Kick participant
      extend.js                   # Extend battle
      end.js                      # End battle
  /user/                          # User operations
    lastfm.js                     # Last.fm profile fetch
  socket.js                       # Socket.io (deprecated, kept for compatibility)

/models                           # Mongoose schemas
  User.js                         # User model with admin flag
  Battle.js                       # Battle model with lifecycle fields
  StreamCount.js                  # Stream count with team tracking
  Team.js                         # Team model with invite codes

/components                       # React components
  Navbar.js                       # Navigation bar
  Hero.js                         # Landing page hero
  BattleCard.js                   # Battle list item
  TeamCard.js                     # Team leaderboard card
  TeamDetailsModal.js             # Team details view
  BattleJoinModal.js              # Join battle wizard
  KickParticipantModal.js         # Host kick interface
  ExtendBattleModal.js            # Host extend interface
  ActivityLogModal.js             # Activity audit log
  StatisticsDashboard.js          # Statistics charts
  Modal.js                        # Generic modal
  Badge.js                        # Status badges
  LoadingSpinner.js               # Loading indicator

/lib                              # Shared utilities
  middleware.js                   # Auth, validation, rate limiting
  schemas.js                      # Zod validation schemas

/utils                            # Helper functions
  auth.js                         # Session and cookie utilities
  db.js                           # MongoDB connection with retry
  spotify.js                      # Spotify API with normalization
  lastfm.js                       # Last.fm API integration
  logger.js                       # Structured logging

/scripts                          # Utility scripts
  cleanupOldBattles.js            # Manual cleanup script

/.github/workflows                # CI/CD
  battle-verification-cron.yml    # Automated verification cron
```

## API Reference

See the full API documentation in the original README sections, which include:
- Authentication endpoints (login, logout, me)
- Battle endpoints (create, join, list, leaderboard, verify)
- Team endpoints (create, join, leave, details)
- Host control endpoints (kick, extend, end, statistics, activity)
- Admin endpoints (cleanup, manual battle end)

All endpoints include:
- Request/response schemas
- Error codes
- Rate limiting information
- Authentication requirements

## Documentation

- **[README.md](README.md)**: This file - complete project overview
- **[QUICK_START.md](QUICK_START.md)**: Fast track guide to using the platform
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)**: Technical implementation details
- **[NETLIFY_OPTIMIZATION.md](NETLIFY_OPTIMIZATION.md)**: Serverless deployment guide
- **[TEAM_INTEGRATION_GUIDE.md](TEAM_INTEGRATION_GUIDE.md)**: Team system technical guide
- **[BATTLE_MONITORING_SYSTEM.md](BATTLE_MONITORING_SYSTEM.md)**: Host controls and monitoring
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)**: Testing procedures and examples
- **[STARTUP_GUIDE.md](STARTUP_GUIDE.md)**: Initial setup and configuration

## Testing

```bash
# Run verification test
npm run test:verify

# Manual API testing
curl -X POST http://localhost:5000/api/battle/verify \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_SECRET"

# Create test battle
curl -X POST http://localhost:5000/api/battle/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Battle","spotifyPlaylist":"playlist_url","startTime":"2025-12-03T12:00:00Z","endTime":"2025-12-03T18:00:00Z"}'
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing procedures.

## Troubleshooting

**Database Connection Issues:**
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has proper permissions
- Review logs for retry attempts

**Spotify API Errors:**
- Verify Client ID and Secret are correct
- Ensure playlist is public
- Check rate limit headers
- Large playlists (100+ songs) are handled automatically

**Last.fm Scrobbles Not Showing:**
- Verify Last.fm username spelling
- Ensure scrobbling is enabled in music player
- Confirm plays are within battle time window
- Check track name normalization in logs
- Verify songs play for 30+ seconds (Last.fm requirement)

**Leaderboard Not Updating:**
- Check browser console for fetch errors
- Verify verification cron is running (GitHub Actions)
- Ensure battle status is "active"
- Confirm CRON_SECRET matches in GitHub and Netlify
- Test verification endpoint manually

**Cheat Detection False Positives:**
- Review `scrobbleTimestamps` in StreamCount collection
- Check timestamp distribution pattern
- Admin can manually override flags in database

**Rate Limiting Errors:**
- Wait for retry time specified in error
- Rate limits reset every minute
- Admin endpoints have stricter limits

## Performance Optimization

### Serverless Architecture Benefits
- **75% fewer API calls**: 2-minute intervals instead of 30 seconds
- **Lower costs**: Well within free tier limits
- **Better scalability**: Handles 5-10 concurrent battles on free tier
- **Simpler maintenance**: No WebSocket or persistent connections

### Resource Usage (Per Battle)
- **Database queries**: 5-10 per verification cycle
- **Last.fm API calls**: 1 per participant per cycle (30/hour)
- **Function execution**: 2-5 seconds per verification
- **MongoDB operations**: Indexed for optimal performance

## Security Features

- **Session-based Authentication**: Secure token generation and validation
- **Rate Limiting**: Prevents API abuse on all POST endpoints
- **Input Validation**: Zod schemas for all inputs
- **Query Sanitization**: MongoDB injection prevention
- **Admin Authorization**: Separate admin flag for privileged operations
- **CRON Secret Validation**: Prevents unauthorized verification triggers
- **Activity Auditing**: Complete logs of all administrative actions

## Future Enhancements

Potential improvements (not currently implemented):
- Team chat functionality
- Multi-battle team statistics
- Public teams (non-invite)
- Team member removal by host
- Team size limits and constraints
- Team customization (avatars, badges)
- Battle templates and presets
- Email notifications
- Mobile native apps

## Contributing

This is a production-ready platform. Contributions welcome for:
- Bug fixes
- Performance improvements
- Documentation updates
- Feature suggestions

## License

MIT

## Credits

**Platform**: ARMYBATTLES
**Design Inspiration**: BTS/ARMY Community
**Tech Stack**: Next.js, MongoDB, Last.fm API, Spotify API
**Architecture**: Serverless-optimized for Netlify
**Version**: 2.0 (Serverless Edition)

---

**Status**: ✅ Production Ready
**Deployment**: Optimized for Netlify Free Tier
**Last Updated**: December 2025

🎵 Turn your music listening into epic battles! 🎵
