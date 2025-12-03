# Database Cleanup Setup Guide

This guide explains how to set up automated database cleanup to keep your database clean and prevent it from growing indefinitely.

## What Gets Cleaned?

The cleanup process removes:

1. **Ended battles** older than the retention period (default: 2 days)
2. **StreamCounts** associated with deleted battles
3. **Teams** associated with deleted battles
4. **BattleActivityLogs** associated with deleted battles
5. **Orphaned data** (data referencing non-existent battles)
6. **Expired user sessions** (optional, enabled by default)

## Configuration

### Environment Variables

Add these to your Netlify environment variables:

```bash
# How many days to keep ended battles (default: 2)
CLEANUP_RETENTION_DAYS=2

# Whether to clean expired sessions (default: true, set to 'false' to disable)
CLEANUP_EXPIRED_SESSIONS=true

# Same secret as used for verification endpoint
CRON_SECRET=your-secret-here
```

## Setting Up Automated Cleanup

### Option 1: Using cron-job.org (Recommended)

1. **Log in to cron-job.org**
   - Go to https://cron-job.org
   - Sign in to your account

2. **Create a new cron job**
   - Click "Create cronjob" or "Add cronjob"
   - Set the following:
     - **Title**: Database Cleanup
     - **Address (URL)**: `https://your-app.netlify.app/api/cron/cleanup`
     - **Request Method**: `POST`
     - **Schedule**: Every 2 days (`0 0 */2 * *`) or daily (`0 0 * * *`)

3. **Add Custom Header**
   - Go to **Advanced** or **Headers** section
   - Add header:
     - **Key**: `x-cron-secret`
     - **Value**: `[your CRON_SECRET value]`

4. **Save and Test**
   - Save the cron job
   - Click "Run Now" to test
   - Check Netlify function logs to verify it worked

### Option 2: Using GitHub Actions

Create `.github/workflows/database-cleanup.yml`:

```yaml
name: Database Cleanup

on:
  schedule:
    # Run every 2 days at midnight UTC
    - cron: '0 0 */2 * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Database Cleanup
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            https://your-app.netlify.app/api/cron/cleanup
```

Then add `CLEANUP_ENDPOINT_URL` to your GitHub secrets:
- Value: `https://your-app.netlify.app/api/admin/cleanup-cron`

### Option 3: Manual Cleanup

You can also trigger cleanup manually:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_SECRET" \
  https://your-app.netlify.app/api/cron/cleanup
```

Or use the admin endpoint (requires authentication):
```bash
GET https://your-app.netlify.app/api/admin/cleanup
```

## Recommended Schedule

- **Every 2 days**: Good balance between keeping data and preventing database bloat
- **Daily**: If you have many battles and want to keep the database very clean
- **Weekly**: If you want to keep battle history longer

**Cron expressions:**
- Every 2 days: `0 0 */2 * *` (runs at midnight UTC every 2 days)
- Daily: `0 0 * * *` (runs at midnight UTC daily)
- Weekly: `0 0 * * 0` (runs Sunday at midnight UTC)

## Monitoring

### Check Cleanup Logs

In Netlify Function Logs, you should see:

```
[INFO] Cleanup triggered by external cron
[INFO] Starting database cleanup {"retentionDays":2,"cutoffDate":"..."}
[INFO] Found old battles to clean {"count":5}
[INFO] Cleanup completed successfully {"battlesDeleted":5,"streamCountsDeleted":120,...}
```

### Expected Response

Successful cleanup returns:

```json
{
  "message": "Cleanup completed successfully",
  "success": true,
  "summary": {
    "battlesDeleted": 5,
    "streamCountsDeleted": 120,
    "teamsDeleted": 8,
    "activityLogsDeleted": 45,
    "expiredSessionsCleaned": 12
  },
  "retentionDays": 2,
  "cutoffDate": "2025-12-01T00:00:00.000Z"
}
```

## Troubleshooting

### Unauthorized Error (401)

- Check that `x-cron-secret` header is set correctly
- Verify `CRON_SECRET` matches in Netlify environment variables
- Ensure header name is exactly `x-cron-secret` (lowercase, with hyphen)

### No Data Being Cleaned

- Check that battles have `status: 'ended'` and `endedAt` field set
- Verify `CLEANUP_RETENTION_DAYS` is set correctly
- Ensure battles are older than the retention period

### Cleanup Taking Too Long

- The cleanup runs synchronously and may take time for large datasets
- Consider running it during off-peak hours
- If you have thousands of battles, consider increasing retention period

## Security Notes

- The cleanup endpoint requires the `CRON_SECRET` header to prevent unauthorized access
- Never expose your `CRON_SECRET` in client-side code
- The cleanup is destructive - deleted data cannot be recovered
- Consider backing up important battle data before cleanup if needed

## Customization

### Change Retention Period

Set `CLEANUP_RETENTION_DAYS` to your desired value:
- `1` = Keep ended battles for 1 day
- `7` = Keep ended battles for 1 week
- `30` = Keep ended battles for 1 month

### Disable Session Cleanup

Set `CLEANUP_EXPIRED_SESSIONS=false` to skip cleaning expired user sessions.

## Related Endpoints

- **Verification Endpoint**: `/api/battle/verify` - Runs every 2 minutes
- **Admin Cleanup**: `/api/admin/cleanup` - Manual cleanup (requires admin auth)
- **Cron Cleanup**: `/api/cron/cleanup` - Automated cleanup (requires cron secret, no admin auth needed)

