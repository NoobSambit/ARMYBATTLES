# Deployment Checklist - Sharding Implementation

## ✅ Changes Made

### 1. Backend Changes
- ✅ Modified `/pages/api/battle/verify.js`:
  - Added `shardId` and `totalShards` parameters
  - Implemented modulo-based participant filtering
  - Added query parameter parsing and validation
  - Enhanced logging for shard tracking
  - No breaking changes - backward compatible

### 2. Database Changes
- ✅ **NO DATABASE CHANGES REQUIRED**
- Uses existing schemas and collections
- No migrations needed

### 3. Frontend Changes
- ✅ **NO FRONTEND CHANGES REQUIRED**
- Sharding is purely backend/cron infrastructure
- Users see no difference in functionality

### 4. Configuration Changes
- ✅ Optimized `netlify.toml` for faster deployments
- ✅ Optimized `utils/db.js` connection timeouts
- ✅ Added comprehensive documentation

---

## 🚀 Deployment Steps

### Step 1: Deploy to Netlify

```bash
# From your local machine
git add .
git commit -m "Add sharding support for cron jobs"
git push origin main
```

Netlify will automatically deploy. **No build limit consumed** if you already deployed recently - this is just a code update.

### Step 2: Verify Deployment

Once deployed, test a single shard:

```bash
curl -X POST \
  "https://armybattles.netlify.app/api/battle/verify?shard=0&totalShards=4" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "message": "Verification completed successfully",
  "success": true,
  "shardId": 0,
  "totalShards": 4,
  "participantsProcessed": 25
}
```

### Step 3: Set Up Cron Jobs

Follow the detailed instructions in [SHARDING_SETUP_GUIDE.md](./SHARDING_SETUP_GUIDE.md)

**Quick Summary:**
1. Go to [cron-job.org](https://cron-job.org)
2. Create 4 cron jobs (one per shard)
3. Each runs every 2 minutes, offset by 15 seconds
4. All use the same `x-cron-secret` header

**Cron Job URLs:**
```
Shard 0: https://armybattles.netlify.app/api/battle/verify?shard=0&totalShards=4
Shard 1: https://armybattles.netlify.app/api/battle/verify?shard=1&totalShards=4
Shard 2: https://armybattles.netlify.app/api/battle/verify?shard=2&totalShards=4
Shard 3: https://armybattles.netlify.app/api/battle/verify?shard=3&totalShards=4
```

### Step 4: Monitor for 24 Hours

Check Netlify function logs and cron-job.org dashboard for:
- ✅ All 4 shards running successfully
- ✅ Execution time < 10 seconds
- ✅ No timeout errors
- ✅ All participants being processed

---

## 📊 Testing Locally (Optional)

### Test Sharding Logic

```bash
node scripts/test-sharding.js
```

Expected output shows even distribution across shards.

### Test Single Shard Locally

```bash
# Start your local dev server
npm run dev

# In another terminal, test shard 0
curl -X POST \
  "http://localhost:3000/api/battle/verify?shard=0&totalShards=4" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

---

## 🔍 Verification Checklist

- [ ] Code deployed to Netlify successfully
- [ ] Tested single shard endpoint manually
- [ ] Created all 4 cron jobs on cron-job.org
- [ ] Verified cron jobs have correct URLs and headers
- [ ] Checked Netlify function logs show sharding working
- [ ] Monitored for at least 1 hour - no errors
- [ ] Confirmed all participants being processed
- [ ] Execution time under 10 seconds per shard

---

## 🛟 Rollback Plan (If Needed)

If sharding causes issues, you can immediately roll back to single cron job:

1. **Disable** the 4 sharded cron jobs on cron-job.org
2. **Create** a single cron job:
   - URL: `https://armybattles.netlify.app/api/battle/verify` (no query params)
   - Schedule: Every 2 minutes
   - Same `x-cron-secret` header

The endpoint is backward compatible - it works with or without sharding.

---

## 📈 Scaling Guide

### Current Setup (50-150 participants)
- **Shards:** 4
- **Participants per shard:** ~25-37
- **Execution time:** ~8s

### If You Get 150-300 Participants
- **Shards:** 8
- **Participants per shard:** ~19-37
- **Execution time:** ~6-8s

Update all cron job URLs to use `totalShards=8` and create 4 additional cron jobs (shard 4-7).

### If You Get 300+ Participants
- **Shards:** 16
- **Participants per shard:** ~19-25
- **Execution time:** ~6-8s

---

## 🐛 Troubleshooting

### Issue: Still getting timeouts

**Solution:**
1. Check if all 4 shards are enabled and running
2. Verify MongoDB connection is fast (< 2s)
3. Consider increasing shards to 8

### Issue: Some participants not processed

**Solution:**
1. Verify all shard IDs are correct (0, 1, 2, 3)
2. Check that `totalShards=4` is consistent across all jobs
3. Look for failed cron job executions in cron-job.org dashboard

### Issue: Database connection errors

**Solution:**
1. Check MongoDB Atlas isn't rate limiting
2. Verify Netlify environment variables are set
3. Consider increasing MongoDB connection pool size

---

## 📝 Files Modified

| File | Changes | Breaking? |
|------|---------|-----------|
| `pages/api/battle/verify.js` | Added shard support | ❌ No - backward compatible |
| `netlify.toml` | Optimized functions config | ❌ No |
| `utils/db.js` | Faster timeouts | ❌ No |

## 📄 Files Created

- `SHARDING_SETUP_GUIDE.md` - Detailed cron setup instructions
- `SHARDING_DIAGRAM.md` - Visual diagrams and explanations
- `scripts/test-sharding.js` - Test script for validation
- `DEPLOYMENT_CHECKLIST.md` - This file

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ No timeout errors in Netlify function logs
2. ✅ All 4 shards complete in < 10 seconds
3. ✅ Every participant gets their scrobbles counted
4. ✅ Leaderboards update every 2 minutes
5. ✅ No degradation in user experience

---

**Questions?** Check the Netlify function logs for detailed error messages and consult `SHARDING_SETUP_GUIDE.md` for setup help.
