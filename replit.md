# ARMY Stream Battles

## Overview

ARMY Stream Battles is a real-time music streaming competition platform where users compete by listening to Spotify playlists. The application tracks plays through Last.fm scrobbles and displays live leaderboards using WebSocket connections. Users can create battles with specific time windows, join existing battles, and compete for the highest number of verified streams from designated playlists.

The platform includes production-ready features like cheat detection, automatic battle lifecycle management, frozen results for ended battles, and comprehensive admin controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 14 with App Router  
The application uses Next.js 14's App Router pattern for routing and page organization. Pages are organized under the `/app` directory with route-based organization.

**State Management**: React hooks (useState, useEffect)  
Client-side state is managed using React's built-in hooks without external state management libraries. Component state is localized and passed through props or fetched directly from APIs.

**Real-time Communication**: Socket.io-client  
WebSocket connections are established on battle detail pages to receive live leaderboard updates every 30 seconds. Clients join specific battle "rooms" to receive targeted updates.

**Styling**: Tailwind CSS 3.x with custom theme  
The UI uses a BTS/ARMY inspired purple gradient aesthetic with custom color schemes, shadows, and animations defined in the Tailwind config. Component classes are extracted using `@layer components` for reusability.

**UI Components**: Modular React components  
Reusable components include Badge, BattleCard, Hero, LoadingSpinner, Modal, and Navbar. These handle common UI patterns across the application.

### Backend Architecture

**API Layer**: Next.js API Routes  
All backend logic is implemented as Next.js API routes under `/pages/api`. This co-locates frontend and backend code in a single Next.js application.

**Middleware Pattern**: Composable middleware functions  
Request handling uses a middleware composition pattern with reusable functions for:
- CORS configuration
- Rate limiting (in-memory Map store)
- JWT authentication validation
- Input validation using Zod schemas
- Admin authorization checks

**Authentication**: JWT with bcryptjs  
User authentication uses JSON Web Tokens stored on the client side. Passwords are hashed using bcryptjs with 10 salt rounds before storage.

**Battle Verification Engine**: Polling-based verification  
A background process runs every 30 seconds to:
1. Find all active battles
2. Fetch Last.fm scrobbles for each participant
3. Match scrobbles against playlist tracks using normalized string matching
4. Update stream counts in the database
5. Detect potential cheating (>10 scrobbles per minute)
6. Emit updated leaderboards via Socket.io
7. Automatically transition battles to "ended" status when time expires
8. Freeze final leaderboards when battles end

**Battle Lifecycle Management**: Time-based state transitions  
Battles automatically transition through states:
- **Upcoming**: Before start time
- **Active**: Between start and end time (verification runs)
- **Ended**: After end time (verification stops, results frozen)

**Cheat Detection**: Rate-based analysis  
The system flags users as potential cheaters if they have more than 10 scrobbles within any 1-minute window. This is detected by analyzing sorted timestamp windows.

### Data Storage

**Database**: MongoDB with Mongoose ODM  
MongoDB is used as the primary data store with Mongoose providing schema definitions and validation.

**Connection Management**: Singleton pattern with retry logic  
Database connections use a cached singleton pattern to reuse connections across serverless function invocations. Includes exponential backoff retry logic (up to 5 attempts) for connection failures.

**Data Models**:

1. **User Schema**
   - username, email, passwordHash (required)
   - lastfmUsername (optional, required to join battles)
   - isAdmin (boolean flag for admin privileges)

2. **Battle Schema**
   - host (User reference), name, spotifyPlaylist ID
   - playlistTracks array (title, artist, normalized versions)
   - startTime, endTime (Date objects)
   - participants array (User references)
   - status enum (upcoming, active, ended)
   - finalLeaderboard (frozen results when battle ends)
   - endedAt timestamp

3. **StreamCount Schema**
   - battleId, userId (compound unique index)
   - count (number of verified scrobbles)
   - isCheater (boolean flag)
   - scrobbleTimestamps (array for cheat detection)

**Indexing Strategy**: Compound unique index on (battleId, userId) in StreamCount ensures no duplicate entries and efficient queries.

### External Dependencies

**Last.fm API**  
Used to fetch user scrobble history (recently played tracks). The application queries scrobbles within battle time windows and matches them against playlist tracks using normalized artist/title comparison.

**Spotify Web API**  
Used with client credentials flow to fetch playlist track listings. The system:
- Extracts playlist IDs from Spotify URLs
- Authenticates using client credentials (cached with expiry)
- Fetches all tracks from playlists (handles pagination for >100 tracks)
- Normalizes track names and artists for matching

**Socket.io**  
Provides bidirectional real-time communication between server and clients. The server emits:
- `leaderboard-update`: Every 30 seconds for active battles
- `battle-ended`: When a battle concludes with final results

**Environment Variables Required**:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `LASTFM_API_KEY`: Last.fm API key
- `SPOTIFY_CLIENT_ID`: Spotify application client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify application client secret

**Input Validation**: Zod  
All user inputs are validated using Zod schemas before processing. Validation covers registration, login, Last.fm username updates, battle creation, battle joining, and admin actions.

**Rate Limiting**: In-memory implementation  
Rate limiting uses an in-memory Map to track request counts per IP address with configurable limits and time windows. Applied to all POST endpoints to prevent abuse.

**Admin Features**:
- Manual battle ending endpoint (admin-only)
- Automated cleanup of battles older than 7 days
- Cleanup of orphaned stream counts

**Logging**: Structured logging utility  
All significant operations are logged with contextual information including timestamps, user IDs, battle IDs, and operation results.