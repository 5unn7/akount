#!/usr/bin/env tsx

/**
 * Simple load testing script for PERF-8
 * Tests p95 < 2s page load target
 *
 * Usage: tsx scripts/load-test.ts
 */

interface LoadTestResult {
  url: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  latencies: number[];
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
  duration: number;
}

async function makeRequest(url: string, authToken?: string): Promise<number> {
  const startTime = Date.now();

  try {
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, { headers });
    const latency = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return latency;
  } catch (error) {
    return -1; // Failure marker
  }
}

function calculatePercentile(sorted: number[], percentile: number): number {
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

async function loadTest(
  url: string,
  options: {
    requests: number;
    concurrent: number;
    authToken?: string;
  }
): Promise<LoadTestResult> {
  console.log(`\n🚀 Load testing: ${url}`);
  console.log(`📊 Requests: ${options.requests}, Concurrency: ${options.concurrent}\n`);

  const startTime = Date.now();
  const latencies: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  // Run requests in batches to control concurrency
  for (let i = 0; i < options.requests; i += options.concurrent) {
    const batchSize = Math.min(options.concurrent, options.requests - i);
    const batch = Array(batchSize)
      .fill(null)
      .map(() => makeRequest(url, options.authToken));

    const results = await Promise.all(batch);

    results.forEach((latency) => {
      if (latency === -1) {
        failedRequests++;
      } else {
        successfulRequests++;
        latencies.push(latency);
      }
    });

    // Progress indicator
    const progress = Math.round(((i + batchSize) / options.requests) * 100);
    process.stdout.write(`\r⏳ Progress: ${progress}%`);
  }

  const duration = Date.now() - startTime;
  console.log('\n'); // New line after progress

  // Sort latencies for percentile calculation
  const sortedLatencies = latencies.slice().sort((a, b) => a - b);

  return {
    url,
    totalRequests: options.requests,
    successfulRequests,
    failedRequests,
    latencies,
    p50: calculatePercentile(sortedLatencies, 50),
    p95: calculatePercentile(sortedLatencies, 95),
    p99: calculatePercentile(sortedLatencies, 99),
    min: sortedLatencies[0] || 0,
    max: sortedLatencies[sortedLatencies.length - 1] || 0,
    avg: latencies.reduce((sum, val) => sum + val, 0) / latencies.length || 0,
    duration,
  };
}

function printResults(result: LoadTestResult) {
  console.log('📈 Load Test Results:');
  console.log('═'.repeat(50));
  console.log(`Total Requests:      ${result.totalRequests}`);
  console.log(`Successful:          ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Failed:              ${result.failedRequests}`);
  console.log(`Duration:            ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`Throughput:          ${(result.totalRequests / (result.duration / 1000)).toFixed(2)} req/s`);
  console.log('');
  console.log('Latency (ms):');
  console.log(`  Min:               ${result.min}ms`);
  console.log(`  Max:               ${result.max}ms`);
  console.log(`  Avg:               ${Math.round(result.avg)}ms`);
  console.log(`  p50 (median):      ${result.p50}ms`);
  console.log(`  p95:               ${result.p95}ms`);
  console.log(`  p99:               ${result.p99}ms`);
  console.log('');

  // Check against 2s p95 target
  if (result.p95 < 2000) {
    console.log(`✅ PASS: p95 latency (${result.p95}ms) < 2000ms target`);
  } else {
    console.log(`❌ FAIL: p95 latency (${result.p95}ms) >= 2000ms target`);
  }
  console.log('═'.repeat(50));
}

async function main() {
  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  const authToken = process.env.TEST_AUTH_TOKEN;

  if (!authToken) {
    console.warn('⚠️  Warning: No TEST_AUTH_TOKEN provided. Testing unauthenticated endpoints only.');
  }

  // Test critical endpoints
  const endpoints = [
    { url: `${apiUrl}/api/overview/dashboard`, name: 'Dashboard' },
    { url: `${apiUrl}/api/banking/accounts`, name: 'Accounts List' },
    { url: `${apiUrl}/api/banking/transactions`, name: 'Transactions List' },
  ];

  const results: LoadTestResult[] = [];

  for (const endpoint of endpoints) {
    console.log(`\n🎯 Testing: ${endpoint.name}`);
    const result = await loadTest(endpoint.url, {
      requests: 100,
      concurrent: 10,
      authToken,
    });
    results.push(result);
    printResults(result);

    // Small delay between endpoint tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n\n📊 Summary:');
  console.log('═'.repeat(50));
  const allPass = results.every((r) => r.p95 < 2000);
  results.forEach((r) => {
    const status = r.p95 < 2000 ? '✅' : '❌';
    const url = new URL(r.url).pathname;
    console.log(`${status} ${url}: p95 = ${r.p95}ms`);
  });
  console.log('═'.repeat(50));

  if (allPass) {
    console.log('\n🎉 All endpoints meet p95 < 2s target!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some endpoints exceed p95 < 2s target');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
