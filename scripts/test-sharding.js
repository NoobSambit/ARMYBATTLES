/**
 * Test script to verify sharding logic works correctly
 * Run with: node scripts/test-sharding.js
 */

console.log('🧪 Testing Sharding Logic\n');

// Simulate participant distribution
function testSharding() {
  const totalParticipants = 100;
  const totalShards = 4;

  console.log(`Total Participants: ${totalParticipants}`);
  console.log(`Total Shards: ${totalShards}\n`);

  // Create mock participant array
  const participants = Array.from({ length: totalParticipants }, (_, i) => ({
    id: i,
    username: `user${i}`
  }));

  // Test each shard
  for (let shardId = 0; shardId < totalShards; shardId++) {
    // This is the exact logic from verify.js
    const shardParticipants = participants.filter((_, index) => {
      return index % totalShards === shardId;
    });

    console.log(`Shard ${shardId}:`);
    console.log(`  - Participants: ${shardParticipants.length}`);
    console.log(`  - First 5 indices: ${shardParticipants.slice(0, 5).map(p => p.id).join(', ')}`);
    console.log(`  - Last 5 indices: ${shardParticipants.slice(-5).map(p => p.id).join(', ')}`);
    console.log();
  }

  // Verify all participants are covered
  let allCovered = [];
  for (let shardId = 0; shardId < totalShards; shardId++) {
    const shardParticipants = participants.filter((_, index) => {
      return index % totalShards === shardId;
    });
    allCovered = allCovered.concat(shardParticipants.map(p => p.id));
  }

  allCovered.sort((a, b) => a - b);
  const expectedIds = Array.from({ length: totalParticipants }, (_, i) => i);

  const allMatch = JSON.stringify(allCovered) === JSON.stringify(expectedIds);

  console.log('✅ Coverage Test:');
  console.log(`  - All participants covered: ${allMatch ? '✅ YES' : '❌ NO'}`);
  console.log(`  - Expected: ${totalParticipants} participants`);
  console.log(`  - Got: ${allCovered.length} participants`);

  if (!allMatch) {
    const missing = expectedIds.filter(id => !allCovered.includes(id));
    const duplicates = allCovered.filter((id, idx) => allCovered.indexOf(id) !== idx);
    console.log(`  - Missing: ${missing.join(', ')}`);
    console.log(`  - Duplicates: ${duplicates.join(', ')}`);
  }

  console.log();

  // Test timing simulation
  console.log('⏱️  Timing Simulation (4 shards):');
  const startTime = new Date('2025-12-17T10:00:00Z');
  const offsetSeconds = 15;

  for (let shardId = 0; shardId < totalShards; shardId++) {
    const shardStart = new Date(startTime.getTime() + shardId * offsetSeconds * 1000);
    console.log(`  Shard ${shardId}: ${shardStart.toISOString().split('T')[1].slice(0, 8)} (offset: +${shardId * offsetSeconds}s)`);
  }

  console.log();

  // Test different shard counts
  console.log('📊 Different Shard Configurations:\n');

  const testConfigs = [
    { total: 50, shards: 4 },
    { total: 100, shards: 4 },
    { total: 200, shards: 8 },
    { total: 400, shards: 16 }
  ];

  testConfigs.forEach(({ total, shards }) => {
    const avgPerShard = Math.ceil(total / shards);
    console.log(`  ${total} participants with ${shards} shards:`);
    console.log(`    ~${avgPerShard} participants per shard`);
    console.log(`    Est. time per shard: ~${Math.ceil(avgPerShard * 0.3)}s (at 300ms/participant)`);
    console.log();
  });
}

// Run tests
testSharding();

console.log('✅ All tests completed!');
