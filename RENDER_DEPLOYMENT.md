# 🚀 Render.com Deployment Guide

## Why Render.com?
- ✅ **UNLIMITED execution time** (no 10-second timeout!)
- ✅ **750 hours/month FREE** (more than enough for cron jobs)
- ✅ **Native cron job support** (no need for cron-job.org)
- ✅ **Simple setup** with render.yaml

---

## Setup Instructions

### Step 1: Sign Up for Render.com
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### Step 2: Create New Cron Job Services

#### Option A: Using Dashboard (Easier)
1. Click "New +" → "Cron Job"
2. Connect your `ARMYBATTLES-main` repository
3. Configure **first cron job (Shard 0)**:
   - **Name:** `armybattles-verify-shard-0`
   - **Build Command:** `npm ci`
   - **Start Command:** `node scripts/verify-cron.js 0 4`
   - **Schedule:** `0,4,8,12,16,20,24,28,32,36,40,44,48,52,56 * * * *`
   - Click "Advanced" → Add Environment Variables:
     - `MONGO_URI`: Your MongoDB connection string
     - `LASTFM_API_KEY`: Your Last.fm API key
     - `LASTFM_SHARED_SECRET`: Your Last.fm shared secret
     - `CRON_SECRET`: (optional) Your cron secret

4. Repeat for **Shard 1, 2, 3** with updated:
   - Start Command: `node scripts/verify-cron.js 1 4` (change shard number)
   - Schedule: Use different minutes (see render.yaml for schedules)

#### Option B: Using render.yaml (Automatic)
1. Push the `render.yaml` file to your GitHub repo:
   ```bash
   git add render.yaml scripts/verify-cron.js
   git commit -m "Add Render.com cron job configuration"
   git push
   ```

2. In Render Dashboard:
   - Click "New" → "Blueprint"
   - Select your repository
   - Render will automatically detect `render.yaml`
   - Click "Apply"
   - Add environment variables for each service

---

## Environment Variables

Add these to **each** cron job service:

| Variable | Value | Where to Find |
|----------|-------|---------------|
| `MONGO_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |
| `LASTFM_API_KEY` | Your API key | https://www.last.fm/api/account/create |
| `LASTFM_SHARED_SECRET` | Your shared secret | Same as above |
| `CRON_SECRET` | (Optional) Random string | For authentication |

---

## Verification Schedules

Each shard runs every 4 minutes, staggered by 1 minute:

| Shard | Schedule | Example Run Times |
|-------|----------|-------------------|
| Shard 0 | `0,4,8,12,16...* * * * *` | 12:00, 12:04, 12:08... |
| Shard 1 | `1,5,9,13,17...* * * * *` | 12:01, 12:05, 12:09... |
| Shard 2 | `2,6,10,14,18...* * * * *` | 12:02, 12:06, 12:10... |
| Shard 3 | `3,7,11,15,19...* * * * *` | 12:03, 12:07, 12:11... |

---

## Testing

### Test Locally First:
```bash
# Test Shard 0
MONGO_URI=<your-uri> LASTFM_API_KEY=<your-key> node scripts/verify-cron.js 0 4

# Should see logs like:
# Starting verification: Shard 0/4
# 🔄 Starting verification: 2 battles, 45 total participants
# Shard 0/4: Processing 11/45 participants
# ✅ Verification complete [Shard 0/4]: 11/11 processed (8234ms)
```

### Check Render Logs:
1. Go to Render Dashboard
2. Click on your cron job service
3. View "Logs" tab
4. Should see successful execution logs every 4 minutes

---

## Migration Steps

### Phase 1: Parallel Testing (Recommended)
1. ✅ Deploy to Render.com (all 4 shards)
2. ✅ Keep cron-job.org running for 24 hours
3. ✅ Monitor both systems to ensure Render works
4. ✅ Compare results (should be identical)

### Phase 2: Full Migration
1. ✅ Verify Render logs show successful runs
2. ✅ **Disable/delete cron-job.org jobs**
3. ✅ Monitor Render for 48 hours
4. ✅ Celebrate unlimited execution time! 🎉

---

## Cost & Usage

### Current Render Usage (4 shards):
```
4 shards × 15 invocations/hour × 24 hours × 30 days = 43,200 invocations/month
Average execution: 15-30 seconds per run
Total runtime: 43,200 × 20s avg = 864,000 seconds = 240 hours/month

Free Tier Limit: 750 hours/month
Your Usage: 240 hours/month (32% of limit) ✅ PLENTY OF ROOM!
```

### If You Need More Shards:
- 8 shards: ~480 hours/month (still free!)
- 16 shards: ~960 hours/month (need paid tier at $7/month)

---

## Troubleshooting

### Cron Job Not Running?
1. Check Render Dashboard → Service Status (should be "Healthy")
2. View Logs → Check for errors
3. Verify environment variables are set
4. Test schedule syntax at https://crontab.guru

### Database Connection Issues?
1. Check `MONGO_URI` is correct
2. Whitelist Render IPs in MongoDB Atlas:
   - Go to Network Access
   - Add IP: `0.0.0.0/0` (allow all) or Render's IP ranges
3. Test connection locally first

### Import Errors in verify-cron.js?
Make sure your models export correctly:
```javascript
// models/Battle.js should have:
export default Battle; // ✅ Correct
// NOT: module.exports = Battle; // ❌ Wrong for ES modules
```

---

## Benefits After Migration

### Before (Netlify + cron-job.org):
- ❌ 10-second timeout (always hitting limit)
- ❌ Need external cron service (cron-job.org)
- ❌ Can only process 10-15 participants per shard
- ❌ Complex sharding needed (4, 8, 16 shards)

### After (Render.com):
- ✅ **UNLIMITED timeout** (can take minutes if needed!)
- ✅ Built-in cron jobs (no external service)
- ✅ Can process 50-100 participants per shard easily
- ✅ Can use fewer shards (2-4 shards sufficient)
- ✅ Cleaner logs, better monitoring

---

## Next Steps

1. ✅ **Created:** `render.yaml` configuration
2. ✅ **Created:** `scripts/verify-cron.js` standalone script
3. 🚀 **Deploy:** Push to GitHub and connect to Render
4. ⚙️ **Configure:** Add environment variables
5. 🎯 **Test:** Monitor logs for successful runs
6. 🎉 **Migrate:** Disable cron-job.org once Render is stable

---

## Support

- Render Docs: https://render.com/docs/cronjobs
- Render Community: https://community.render.com
- Cron Schedule Help: https://crontab.guru

**Questions?** Check Render logs first! Most issues are environment variable related.
