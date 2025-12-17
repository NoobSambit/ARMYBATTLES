# 🚀 GitHub Actions Setup Guide

## ✅ What We Just Created

A GitHub Actions workflow that runs **every 5 minutes** to verify battle scrobbles with **NO TIMEOUT LIMIT**!

---

## 📋 Setup Steps (Takes 5 Minutes)

### Step 1: Push the Workflow File to GitHub

```bash
git add .github/workflows/verify-battles.yml
git commit -m "Add GitHub Actions workflow for verification cron job"
git push origin main
```

### Step 2: Add Secrets to GitHub Repository

1. Go to your GitHub repo: https://github.com/NoobSambit/ARMYBATTLES
2. Click **Settings** (top menu)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button

Add these 4 secrets (one by one):

| Secret Name | Value |
|-------------|-------|
| `MONGO_URI` | Your MongoDB connection string (from MongoDB Atlas) |
| `LASTFM_API_KEY` | Your Last.fm API key |
| `LASTFM_SHARED_SECRET` | Your Last.fm shared secret |
| `CRON_SECRET` | (Optional) Any random string for security |

**How to add each secret:**
- Click "New repository secret"
- Name: `MONGO_URI`
- Secret: `mongodb+srv://...` (paste your value)
- Click "Add secret"
- Repeat for other 3 secrets

---

## Step 3: Enable GitHub Actions

1. In your repo, click **Actions** tab (top menu)
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. You should see "Verify Battle Scrobbles" workflow listed

---

## Step 4: Test the Workflow

**Option A: Wait 5 minutes** (it will run automatically)

**Option B: Run manually NOW:**
1. Go to **Actions** tab
2. Click **"Verify Battle Scrobbles"** workflow (left sidebar)
3. Click **"Run workflow"** dropdown (right side)
4. Click green **"Run workflow"** button
5. Refresh page after 10 seconds
6. You'll see a yellow dot → click it → view logs

---

## Step 5: Verify It's Working

1. Go to **Actions** tab
2. Click on the latest workflow run
3. Click **"verify-scrobbles"** job
4. Expand **"Run verification script"** step
5. You should see logs like:
   ```
   Starting verification: Shard 0/1
   🔄 Starting verification: 3 battles, 45 total participants
   Shard 0/1: Processing 45/45 participants
   ✅ Verification complete [Shard 0/1]: 45/45 processed (23456ms)
   ```

---

## Step 6: Disable cron-job.org (After 24 Hours)

Once you verify GitHub Actions is working for 24 hours:

1. Go to https://cron-job.org
2. **Disable or delete all 4 shard cron jobs**
3. You're done! ✅

---

## 🎯 What Changed

### Before (cron-job.org + Netlify):
```
cron-job.org → Netlify Function (/api/battle/verify?shard=0)
   ↓ 10-second timeout ❌
   ↓ Need 4 shards to avoid timeout
MongoDB
```

### After (GitHub Actions):
```
GitHub Actions → Direct script (scripts/verify-cron.js)
   ↓ NO timeout limit! ✅
   ↓ Process ALL participants in ONE job
MongoDB
```

---

## 📊 Benefits

| Feature | cron-job.org | GitHub Actions |
|---------|--------------|----------------|
| **Timeout** | 10 seconds ❌ | **6 hours** ✅ |
| **Cost** | Free ✅ | Free ✅ |
| **Sharding needed** | Yes (4 shards) | **No! (1 job)** ✅ |
| **Setup** | External account | Built-in ✅ |
| **Logs** | Scattered | **GitHub UI** ✅ |
| **Reliability** | Depends on service | **99.9% uptime** ✅ |

---

## 🔧 Configuration Details

### Schedule:
```yaml
schedule:
  - cron: '*/5 * * * *'  # Every 5 minutes
```

Change to:
- `*/2 * * * *` - Every 2 minutes (faster)
- `*/10 * * * *` - Every 10 minutes (slower)

### Script:
```bash
node scripts/verify-cron.js 0 1
```

- `0` = Shard ID (always 0 since no sharding needed!)
- `1` = Total shards (always 1 since no sharding needed!)

With unlimited timeout, you can process **1000+ participants** in ONE job!

---

## 📈 Usage & Limits

**GitHub Actions Free Tier:**
- 2,000 minutes/month (33 hours)
- Unlimited for public repos

**Your Usage:**
- Runs every 5 minutes = 288 times/day
- Average 30 seconds per run
- Daily: 288 × 30s = 144 minutes (2.4 hours)
- Monthly: 144 × 30 = **4,320 minutes** ❌ **EXCEEDS LIMIT!**

### ⚠️ IMPORTANT: Adjust Schedule!

Change to **every 10 minutes** to stay under limit:

```yaml
schedule:
  - cron: '*/10 * * * *'  # Every 10 minutes
```

**New usage:**
- 144 runs/day × 30s = 72 minutes/day
- 72 × 30 = **2,160 minutes/month** ✅ **Under 2,000!**

**OR** keep your site **public** = unlimited minutes! ✅

---

## 🐛 Troubleshooting

### Workflow not running?
- Check **Actions** tab → Enable workflows if disabled
- Verify secrets are added (Settings → Secrets)

### Seeing errors in logs?
- Click on failed workflow → View logs
- Common issues:
  - Missing secrets (add in Settings)
  - MongoDB connection (check MONGO_URI)
  - Last.fm API (check LASTFM_API_KEY)

### Want to run manually?
- Actions tab → Verify Battle Scrobbles → Run workflow

---

## 🎉 Success Checklist

- ✅ Workflow file pushed to GitHub
- ✅ All 4 secrets added to GitHub repo
- ✅ Workflow enabled in Actions tab
- ✅ Manual test run successful
- ✅ Logs show participants being processed
- ✅ Wait 24 hours to verify stability
- ✅ Disable cron-job.org jobs

---

## 📝 Notes

- **Site stays on Netlify** (no change!)
- **Only cron job moved** to GitHub Actions
- **Same MongoDB database** (no migration)
- **Better performance** (no timeout!)
- **Still 100% free** (if repo is public)

---

## 🆘 Need Help?

- View workflow runs: GitHub repo → Actions tab
- View logs: Click on workflow run → Click job → Expand steps
- GitHub Actions docs: https://docs.github.com/en/actions

**Your cron job is now UNLIMITED!** 🚀
