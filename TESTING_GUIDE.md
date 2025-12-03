# Local Testing Guide

Since Socket.io has been removed for Netlify compatibility, here's how to test the battle verification system on localhost.

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

Server will run on `http://localhost:5000`

### 2. Test the Verification Endpoint

#### Option A: Manual Trigger (Simplest)

Open a new terminal and trigger verification manually:

```bash
# Without secret (recommended for local testing)
curl -X POST http://localhost:5000/api/battle/verify

# With secret (if CRON_SECRET is set in .env)
curl -X POST http://localhost:5000/api/battle/verify \
  -H "x-cron-secret: your-secret-here"
```

#### Option B: Automated Test Script (Best for Extended Testing)

Run the test script that simulates the cron job:

```bash
node scripts/test-verification.js
```

This will:
- ✅ Call the verification endpoint immediately
- ✅ Continue calling every 2 minutes automatically
- ✅ Show success/error status for each call
- ✅ Log response messages

Press `Ctrl+C` to stop.

#### Option C: Watch Command (Quick Iterations)

For faster testing during development, use watch to trigger every 30 seconds:

```bash
# Install watch (if not already installed)
npm install -g watch-cli

# Run verification every 30 seconds
watch -n 30 'curl -X POST http://localhost:5000/api/battle/verify'
```

### 3. Monitor the Results

#### Check Server Logs

In your dev server terminal, you'll see:

```
Verification triggered by external cron
Verification cycle started
Scrobbles verified for user...
Verification cycle completed
```

#### Check Leaderboard Updates

1. Open browser: `http://localhost:5000/battle/[battle-id]`
2. Leaderboard will auto-refresh every 2 minutes
3. Or manually refresh the page to see updated scores

#### Check Database

```bash
# Connect to MongoDB
mongosh

# Use your database
use armybattles

# Check stream counts
db.streamcounts.find().pretty()

# Check battles
db.battles.find({ status: 'active' }).pretty()
```

## Faster Polling for Development

If 2 minutes is too slow for local testing, you can temporarily speed it up:

### Option 1: Modify Frontend Polling (Temporary)

Edit `app/battle/[id]/page.js` line 63:

```javascript
// Original (2 minutes)
}, 120000);

// Faster for testing (30 seconds)
}, 30000);

// Very fast for testing (10 seconds)
}, 10000);
```

**Remember to change it back before deploying!**

### Option 2: Use Environment Variable

Add to your `.env` file:

```bash
# Development polling interval in milliseconds
NEXT_PUBLIC_POLLING_INTERVAL=30000  # 30 seconds for dev
```

Then update `app/battle/[id]/page.js`:

```javascript
const pollingInterval = setInterval(() => {
  fetchLeaderboard(battleId);
}, process.env.NEXT_PUBLIC_POLLING_INTERVAL || 120000);
```

## Testing Workflow

### Basic Test Flow

1. **Start dev server**: `npm run dev`
2. **Create a battle** via the UI
3. **Join the battle** with your test account
4. **Play some tracks** from the battle playlist on Last.fm
5. **Trigger verification**: `curl -X POST http://localhost:5000/api/battle/verify`
6. **Check leaderboard**: Refresh the battle page
7. **Verify scores updated**: You should see your scrobble count increase

### Automated Testing

Run the test script in the background:

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Auto verification
node scripts/test-verification.js

# Terminal 3: Your testing activities
# (create battles, scrobble tracks, etc.)
```

## Testing Without Last.fm Scrobbles

If you want to test without actual Last.fm scrobbles, you can mock the data:

### Option 1: Seed Test Data

Create `scripts/seed-test-data.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const StreamCount = require('../models/StreamCount');

async function seedTestData(battleId, userId) {
  await StreamCount.findOneAndUpdate(
    { battleId, userId },
    {
      count: Math.floor(Math.random() * 20) + 1,
      scrobbleTimestamps: [],
      isCheater: false
    },
    { upsert: true }
  );

  console.log('Test data seeded!');
  process.exit(0);
}

// Usage: node scripts/seed-test-data.js <battleId> <userId>
seedTestData(process.argv[2], process.argv[3]);
```

### Option 2: Test with Real Scrobbles

1. Set up a test Last.fm account
2. Install a scrobbler app (e.g., Web Scrobbler browser extension)
3. Play tracks from Spotify/YouTube with the scrobbler active
4. Tracks will appear on Last.fm within 1-2 minutes
5. Trigger verification to see them count

## Debugging Tips

### Check if Verification is Running

```bash
# Check server logs for these messages
✓ "Verification triggered by external cron"
✓ "Verification cycle started"
✓ "Scrobbles verified"
✓ "Verification cycle completed"
```

### Check API Response

```bash
# Get full response with status code
curl -i -X POST http://localhost:5000/api/battle/verify

# Expected success response:
HTTP/1.1 200 OK
{
  "message": "Verification completed successfully",
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

### Common Issues

#### Issue: "Method not allowed"
**Cause**: Using GET instead of POST
**Fix**: Use `-X POST` with curl

#### Issue: "Unauthorized"
**Cause**: CRON_SECRET mismatch
**Fix**: Either remove CRON_SECRET from .env or use correct header

#### Issue: "No active battles"
**Cause**: No battles with status 'active'
**Fix**: Create a battle with start/end times that span current time

#### Issue: Leaderboard not updating
**Cause**: Frontend polling not working
**Fix**: Check browser console for errors, verify API endpoint returns data

## Testing the Cron Workflow (GitHub Actions)

To test the actual GitHub Actions workflow locally:

### Using `act` (GitHub Actions Local Runner)

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# Create secrets file
echo "CRON_SECRET=test-secret" > .secrets
echo "VERIFICATION_ENDPOINT_URL=http://host.docker.internal:5000/api/battle/verify" >> .secrets

# Run the workflow locally
act schedule --secret-file .secrets
```

## Performance Testing

### Test with Multiple Participants

```bash
# Create multiple test users and have them scrobble
# Then check verification performance

# Time the verification call
time curl -X POST http://localhost:5000/api/battle/verify
```

### Monitor Resource Usage

```bash
# Watch server memory/CPU
htop  # or 'top' on macOS

# Monitor MongoDB queries
mongosh --eval "db.setProfilingLevel(2)"  # Enable query profiling
```

## Testing Checklist

Before deploying to production:

- [ ] Verification endpoint responds to POST
- [ ] Verification processes all active battles
- [ ] Leaderboard updates with new scores
- [ ] Cheat detection works correctly
- [ ] Team scores aggregate properly
- [ ] Battle status transitions (upcoming → active → ended)
- [ ] Frontend polling works in browser
- [ ] No Socket.io errors in console
- [ ] Manual verification trigger works
- [ ] Test script runs without errors
- [ ] Database updates persist correctly
- [ ] CRON_SECRET validation works (if enabled)

## Quick Test Script

Save this as `test-quick.sh`:

```bash
#!/bin/bash

echo "🧪 Quick ARMYBATTLES Test"
echo ""

# Test 1: Server running?
echo "1. Checking if server is running..."
curl -s http://localhost:5000/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✅ Server is running"
else
  echo "   ❌ Server is not running. Start with: npm run dev"
  exit 1
fi

# Test 2: Verification endpoint
echo "2. Testing verification endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/battle/verify)
if [[ $RESPONSE == *"success"* ]]; then
  echo "   ✅ Verification works"
else
  echo "   ❌ Verification failed: $RESPONSE"
fi

# Test 3: Can fetch battles?
echo "3. Testing battle API..."
curl -s http://localhost:5000/api/battle > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✅ Battle API works"
else
  echo "   ❌ Battle API failed"
fi

echo ""
echo "✅ Basic tests complete!"
```

Make it executable:
```bash
chmod +x test-quick.sh
./test-quick.sh
```

## Summary

**For quick testing**: Use manual curl commands
**For extended testing**: Use the test-verification.js script
**For very fast iteration**: Temporarily reduce polling interval
**For automated testing**: Use the quick test script

The system works exactly the same as before, just without Socket.io. The only difference is you trigger verification manually or via script instead of it happening automatically with setInterval.
