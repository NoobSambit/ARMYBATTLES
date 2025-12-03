#!/usr/bin/env node

/**
 * Local Development Test Script
 * Simulates the cron job by calling the verification endpoint every 2 minutes
 *
 * Usage:
 *   node scripts/test-verification.js
 *
 * Press Ctrl+C to stop
 */

const http = require('http');

const VERIFICATION_URL = 'http://localhost:5000/api/battle/verify';
const INTERVAL_MS = 120000; // 2 minutes
const CRON_SECRET = process.env.CRON_SECRET || ''; // Optional

let callCount = 0;

function triggerVerification() {
  callCount++;
  const timestamp = new Date().toISOString();

  console.log(`\n[${timestamp}] Triggering verification #${callCount}...`);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  // Add secret header if configured
  if (CRON_SECRET) {
    options.headers['x-cron-secret'] = CRON_SECRET;
  }

  const req = http.request(VERIFICATION_URL, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✅ Verification successful (${res.statusCode})`);
        try {
          const response = JSON.parse(data);
          console.log(`   Message: ${response.message}`);
          console.log(`   Timestamp: ${response.timestamp}`);
        } catch (e) {
          console.log(`   Response: ${data}`);
        }
      } else {
        console.log(`❌ Verification failed (${res.statusCode})`);
        console.log(`   Response: ${data}`);
      }

      console.log(`   Next verification in 2 minutes...`);
    });
  });

  req.on('error', (error) => {
    console.error(`❌ Error calling verification endpoint:`, error.message);
    console.log(`   Is the dev server running on http://localhost:5000?`);
  });

  req.end();
}

console.log('🚀 Starting local verification test script...');
console.log(`📍 Endpoint: ${VERIFICATION_URL}`);
console.log(`⏱️  Interval: ${INTERVAL_MS / 1000} seconds (2 minutes)`);
console.log(`🔐 Secret: ${CRON_SECRET ? 'Configured' : 'Not configured (optional)'}`);
console.log('\nPress Ctrl+C to stop\n');

// Run immediately on start
triggerVerification();

// Then run every 2 minutes
const interval = setInterval(triggerVerification, INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping verification test script...');
  clearInterval(interval);
  console.log(`   Total verifications triggered: ${callCount}`);
  process.exit(0);
});
