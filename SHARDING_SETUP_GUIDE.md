# Sharding Setup Guide for ARMYBATTLES Cron Jobs

## Overview

This guide explains how to set up **parallel cron jobs** using sharding to process all battle participants within Netlify's 10-second free tier timeout limit.

### What is Sharding?

Instead of one cron job processing all participants sequentially (which times out), we split participants across **4 parallel cron jobs** that run simultaneously.

**Example with 100 participants:**
```
Shard 0: Processes participants 0, 4, 8, 12, 16... (25 total)
Shard 1: Processes participants 1, 5, 9, 13, 17... (25 total)
Shard 2: Processes participants 2, 6, 10, 14, 18... (25 total)
Shard 3: Processes participants 3, 7, 11, 15, 19... (25 total)
```

All 4 shards run in parallel, completing in ~9 seconds each instead of 40+ seconds sequentially.

---

## Step-by-Step Setup on cron-job.org

### Prerequisites

1. Your site is deployed on Netlify: `https://armybattles.netlify.app`
2. You have your `CRON_SECRET` from `.env.local`: `03c184722ae7f7bb57be737cdcda3d097121346c51297c8190a27c5ccdfb109a`
3. You have an account on [cron-job.org](https://cron-job.org)

---

### Create Cron Job #1 (Shard 0)

1. **Log in to cron-job.org**
2. **Click "Create Cronjob"**
3. **Configure the job:**

   **Title:** `ARMYBATTLES Verify - Shard 0`

   **Address (URL):**
   ```
   https://armybattles.netlify.app/api/battle/verify?shard=0&totalShards=4
   ```

   **Schedule:**
   - **Minutes:** `*/2` (every 2 minutes)
   - **Hours:** `*`
   - **Days:** `*`
   - **Months:** `*`
   - **Weekdays:** `*`

   **Request method:** `POST`

   **Request timeout:** `30 seconds`

4. **Add Custom Headers** (click "Advanced" or "Headers" section):
   - **Header Name:** `x-cron-secret`
   - **Header Value:** `03c184722ae7f7bb57be737cdcda3d097121346c51297c8190a27c5ccdfb109a`

5. **Save the cron job**

---

### Create Cron Job #2 (Shard 1)

Repeat the same steps, but with these changes:

**Title:** `ARMYBATTLES Verify - Shard 1`

**Address (URL):**
```
https://armybattles.netlify.app/api/battle/verify?shard=1&totalShards=4
```

**Schedule:** Same as Shard 0, but **offset by 15 seconds**:
- If Shard 0 runs at: `10:00:00, 10:02:00, 10:04:00...`
- Then Shard 1 should run at: `10:00:15, 10:02:15, 10:04:15...`

To achieve this on cron-job.org:
- Set the schedule to run every 2 minutes
- Use the "Advanced timing" option if available to add a 15-second delay
- OR: Simply create it and it will naturally offset due to creation time differences

**Headers:** Same `x-cron-secret` header

---

### Create Cron Job #3 (Shard 2)

**Title:** `ARMYBATTLES Verify - Shard 2`

**Address (URL):**
```
https://armybattles.netlify.app/api/battle/verify?shard=2&totalShards=4
```

**Schedule:** Offset by 30 seconds from Shard 0

**Headers:** Same `x-cron-secret` header

---

### Create Cron Job #4 (Shard 3)

**Title:** `ARMYBATTLES Verify - Shard 3`

**Address (URL):**
```
https://armybattles.netlify.app/api/battle/verify?shard=3&totalShards=4
```

**Schedule:** Offset by 45 seconds from Shard 0

**Headers:** Same `x-cron-secret` header

---

## Timeline Example

Here's how the shards will run:

```
10:00:00 - Shard 0 starts (processes participants 0, 4, 8, 12...)
10:00:15 - Shard 1 starts (processes participants 1, 5, 9, 13...)
10:00:30 - Shard 2 starts (processes participants 2, 6, 10, 14...)
10:00:45 - Shard 3 starts (processes participants 3, 7, 11, 15...)

10:02:00 - Shard 0 runs again
10:02:15 - Shard 1 runs again
10:02:30 - Shard 2 runs again
10:02:45 - Shard 3 runs again
```

**Benefits of staggered timing:**
- Prevents all 4 shards from hammering your database simultaneously
- Spreads the load across the 2-minute window
- Reduces chances of MongoDB connection issues

---

## Verifying Your Setup

### Test Each Shard

You can manually test each endpoint using `curl`:

**Test Shard 0:**
```bash
curl -X POST \
  "https://armybattles.netlify.app/api/battle/verify?shard=0&totalShards=4" \
  -H "x-cron-secret: 03c184722ae7f7bb57be737cdcda3d097121346c51297c8190a27c5ccdfb109a"
```

**Expected response:**
```json
{
  "message": "Verification completed successfully",
  "timestamp": "2025-12-17T10:30:00.000Z",
  "success": true,
  "executionTimeMs": 8234,
  "participantsProcessed": 23,
  "participantsSkipped": 0,
  "partialSuccess": false,
  "allComplete": true,
  "shardId": 0,
  "totalShards": 4
}
```

**Test all shards:**
```bash
# Shard 1
curl -X POST "https://armybattles.netlify.app/api/battle/verify?shard=1&totalShards=4" \
  -H "x-cron-secret: YOUR_SECRET"

# Shard 2
curl -X POST "https://armybattles.netlify.app/api/battle/verify?shard=2&totalShards=4" \
  -H "x-cron-secret: YOUR_SECRET"

# Shard 3
curl -X POST "https://armybattles.netlify.app/api/battle/verify?shard=3&totalShards=4" \
  -H "x-cron-secret: YOUR_SECRET"
```

---

## Monitoring

### Check Netlify Function Logs

1. Go to Netlify Dashboard → Your Site → Functions
2. Click on the `verify` function
3. View recent invocations
4. Look for logs like:
   ```
   Sharding enabled: { shardId: 0, totalShards: 4, processingRange: '0/4' }
   Shard filtering applied: { totalParticipants: 87, shardParticipants: 22, shardId: 0, totalShards: 4 }
   Verification cycle completed: { executionTimeMs: 8234, participantsProcessed: 22, shardId: 0 }
   ```

### Check cron-job.org Dashboard

1. Go to cron-job.org → Your Jobs
2. Check execution history for each shard
3. All 4 should show green "Success" statuses
4. Execution time should be under 10 seconds

---

## Troubleshooting

### Problem: "Unauthorized" error

**Cause:** Missing or incorrect `x-cron-secret` header

**Solution:**
1. Double-check the header name is exactly: `x-cron-secret`
2. Verify the value matches your `.env.local` file: `03c184722ae7f7bb57be737cdcda3d097121346c51297c8190a27c5ccdfb109a`
3. Make sure there are no extra spaces or newlines

---

### Problem: Still getting timeouts

**Cause:** Too many participants per shard

**Solution:**
1. Increase total shards from 4 to 6 or 8
2. Update all cron job URLs:
   ```
   Shard 0: ?shard=0&totalShards=8
   Shard 1: ?shard=1&totalShards=8
   ... up to Shard 7
   ```

---

### Problem: Some participants not getting processed

**Cause:** One or more shards failing

**Solution:**
1. Check cron-job.org dashboard for failed jobs
2. Check Netlify function logs for errors
3. Verify all 4 shards are enabled and running
4. Make sure each shard has correct URL parameters (shard 0-3, totalShards 4)

---

## Scaling Further

### For 200+ participants (8 shards)

Create 8 cron jobs with:
```
Shard 0: ?shard=0&totalShards=8
Shard 1: ?shard=1&totalShards=8
Shard 2: ?shard=2&totalShards=8
... up to Shard 7
```

Offset timing:
- Shard 0: 10:00:00
- Shard 1: 10:00:07
- Shard 2: 10:00:14
- Shard 3: 10:00:21
- Shard 4: 10:00:28
- Shard 5: 10:00:35
- Shard 6: 10:00:42
- Shard 7: 10:00:49

---

## Alternative: Disable Sharding (Fallback)

If you want to go back to single cron job (for testing or small battles):

**URL:** `https://armybattles.netlify.app/api/battle/verify` (no query parameters)

This will process all participants in one run (may timeout with many participants).

---

## Summary

✅ **4 parallel cron jobs** process all participants in ~10 seconds total
✅ **Staggered timing** prevents database overload
✅ **No frontend or database changes** needed
✅ **No build limits consumed** - deploy once, works forever
✅ **Scales to 400+ participants** by increasing shard count

---

## Quick Reference

| Setting | Value |
|---------|-------|
| **Base URL** | `https://armybattles.netlify.app/api/battle/verify` |
| **Shard 0 URL** | `?shard=0&totalShards=4` |
| **Shard 1 URL** | `?shard=1&totalShards=4` |
| **Shard 2 URL** | `?shard=2&totalShards=4` |
| **Shard 3 URL** | `?shard=3&totalShards=4` |
| **Method** | `POST` |
| **Header** | `x-cron-secret: 03c184722ae7f7bb57be737cdcda3d097121346c51297c8190a27c5ccdfb109a` |
| **Schedule** | Every 2 minutes, offset by 15s each |
| **Timeout** | 30 seconds |

---

**Need help?** Check the Netlify function logs and cron-job.org execution history for detailed error messages.
