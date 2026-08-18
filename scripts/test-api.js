#!/usr/bin/env node
/**
 * Smoke-tests the running backend API. No dependencies beyond Node's
 * built-in fetch (Node 18+) — just start the server (`npm run dev`) in one
 * terminal and run this in another (`npm run test:api`).
 *
 * Checks a handful of read-only endpoints and prints PASS/FAIL per check.
 * Exits with code 1 if anything fails, so it's CI-friendly too.
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

const checks = [
  {
    name: 'GET /health',
    path: '/health',
    expectStatus: 200,
    expectBody: (body) => body.status === 'ok',
  },
  {
    name: 'GET /api/paintings',
    path: '/api/paintings',
    expectStatus: 200,
  },
  {
    name: 'GET /api/categories',
    path: '/api/categories',
    expectStatus: 200,
  },
  {
    name: 'GET /api/unknown-route (should 404)',
    path: '/api/unknown-route',
    expectStatus: 404,
  },
  {
    name: 'GET /api/orders/my (no auth, should 401)',
    path: '/api/orders/my',
    expectStatus: 401,
  },
];

async function runCheck(check) {
  const url = `${BASE_URL}${check.path}`;
  const start = Date.now();
  try {
    const res = await fetch(url);
    const ms = Date.now() - start;
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    const statusOk = res.status === check.expectStatus;
    const bodyOk = check.expectBody ? check.expectBody(body) : true;
    const passed = statusOk && bodyOk;

    if (passed) {
      console.log(`  \x1b[32m✓\x1b[0m ${check.name} (${res.status}, ${ms}ms)`);
    } else {
      console.log(`  \x1b[31m✗\x1b[0m ${check.name}`);
      console.log(`      expected status ${check.expectStatus}, got ${res.status}`);
      if (check.expectBody && !bodyOk) {
        console.log(`      body: ${JSON.stringify(body)}`);
      }
    }
    return passed;
  } catch (err) {
    console.log(`  \x1b[31m✗\x1b[0m ${check.name}`);
    console.log(`      request failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`Testing Shakti Crafts API at ${BASE_URL}\n`);

  let allPassed = true;
  for (const check of checks) {
    const passed = await runCheck(check);
    if (!passed) allPassed = false;
  }

  console.log();
  if (allPassed) {
    console.log('\x1b[32mAll checks passed — backend is up and responding.\x1b[0m');
    process.exitCode = 0;
  } else {
    console.log('\x1b[31mSome checks failed — see above.\x1b[0m');
    console.log(`(Is the server running? Try: npm run dev, or set API_URL if it's not on ${BASE_URL})`);
    process.exitCode = 1;
  }
}

main();
