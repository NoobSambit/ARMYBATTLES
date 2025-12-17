# Clean Log Format Reference

## Normal Operation (No Issues)

```
🟢 2 battles transitioned to active
🏁 Ending 1 battles
🏁 "BTS Comeback Battle" ended: 45 entries, 42 participants
🔄 Starting verification: 3 battles, 87 total participants
Shard 0/4: Processing 22/87 participants
✅ Verification complete [Shard 0/4]: 22/22 processed (7821ms)
```

## No Active Battles

```
⏸️  No active battles, skipping verification cycle
```

## With Cheater Detected

```
🔄 Starting verification: 2 battles, 54 total participants
Shard 1/4: Processing 14/54 participants
⚠️ suspicious_user: 120 scrobbles [CHEATER]
✅ Verification complete [Shard 1/4]: 14/14 processed (6234ms)
```

## With High Activity User

```
🔄 Starting verification: 1 battles, 23 total participants
⚠️ power_listener: 87 scrobbles
✅ Verification complete: 23/23 processed (5123ms)
```

## With Timeout (Partial Processing)

```
🔄 Starting verification: 5 battles, 143 total participants
Shard 2/4: Processing 36/143 participants
Timeout approaching - stopping processing
⚠️ Verification complete [Shard 2/4]: 28/36 processed (9001ms)
```

## With Errors

```
🔄 Starting verification: 2 battles, 45 total participants
❌ Error for broken_user: Network timeout fetching Last.fm data
✅ Verification complete: 44/45 processed (8456ms)
```

## Battle Freezing Timeout

```
🏁 Ending 3 battles
🏁 "Morning Battle" ended: 23 entries, 20 participants
⚠️ Timeout during battle freezing, 2 remaining
```

---

## Key Indicators

| Emoji | Meaning |
|-------|---------|
| 🟢 | Battle state transition |
| 🏁 | Battle ending |
| 🔄 | Verification starting |
| ✅ | Successful completion |
| ⚠️ | Warning (timeout, cheater, high activity) |
| ❌ | Error |
| ⏸️ | No work to do |

---

## What to Look For

### ✅ Healthy System
```
🔄 Starting verification: 3 battles, 87 total participants
Shard 0/4: Processing 22/87 participants
✅ Verification complete [Shard 0/4]: 22/22 processed (7821ms)
```
- All participants processed (22/22)
- Execution time < 9000ms
- No errors or warnings

### ⚠️ System Under Load
```
🔄 Starting verification: 8 battles, 245 total participants
Shard 0/4: Processing 61/245 participants
⚠️ Verification complete [Shard 0/4]: 52/61 processed (9001ms)
```
- Some participants skipped (52/61)
- Execution time close to limit (9001ms)
- Consider increasing shards from 4 to 8

### ❌ System Issues
```
🔄 Starting verification: 2 battles, 45 total participants
❌ Error for user1: Network timeout fetching Last.fm data
❌ Error for user2: Network timeout fetching Last.fm data
❌ Error for user3: Network timeout fetching Last.fm data
⚠️ Verification complete: 32/45 processed (8900ms)
```
- Multiple errors
- Many participants failing
- Likely Last.fm API issue or network problem

---

## Monitoring Checklist

**Every 2 minutes, check logs for:**

1. ✅ **Verification starting** - Confirms cron jobs are running
2. ✅ **All shards reporting** - All 4 shards (0-3) should appear
3. ✅ **Processing counts** - Matches expected participant count
4. ✅ **Execution time** - Should be under 9000ms
5. ✅ **No errors** - No ❌ symbols
6. ✅ **Completion ratio** - processed/total should be equal (e.g., 22/22)

**Red flags:**

- ⚠️ Consistent partial processing (e.g., always 18/25)
- ❌ Multiple errors for different users
- ⚠️ Execution time always > 8500ms
- 🏁 Battles ending but no leaderboard entries
- Missing shard reports (only seeing 2 of 4 shards)

---

## Example Full Cycle (4 Shards)

```
--- Shard 0 (10:00:00) ---
🔄 Starting verification: 3 battles, 100 total participants
Shard 0/4: Processing 25/100 participants
✅ Verification complete [Shard 0/4]: 25/25 processed (7234ms)

--- Shard 1 (10:00:15) ---
🔄 Starting verification: 3 battles, 100 total participants
Shard 1/4: Processing 25/100 participants
⚠️ cheater123: 145 scrobbles [CHEATER]
✅ Verification complete [Shard 1/4]: 25/25 processed (6891ms)

--- Shard 2 (10:00:30) ---
🔄 Starting verification: 3 battles, 100 total participants
Shard 2/4: Processing 25/100 participants
✅ Verification complete [Shard 2/4]: 25/25 processed (7456ms)

--- Shard 3 (10:00:45) ---
🔄 Starting verification: 3 battles, 100 total participants
Shard 3/4: Processing 25/100 participants
✅ Verification complete [Shard 3/4]: 25/25 processed (7123ms)
```

**Result:** All 100 participants processed successfully across 4 shards in ~7-8 seconds each.
