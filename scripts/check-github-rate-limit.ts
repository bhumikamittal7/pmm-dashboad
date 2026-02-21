/**
 * Check GitHub API token usage (rate limit).
 * Loads GITHUB_TOKEN from .env.local if present.
 *
 * Usage: npx tsx scripts/check-github-rate-limit.ts
 */

import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

loadEnvLocal();

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN not set. Add it to .env.local or set the env var.');
    process.exit(1);
  }

  const res = await fetch('https://api.github.com/rate_limit', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error('Request failed:', res.status, res.statusText);
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      console.error(j.message || text);
    } catch {
      console.error(text);
    }
    process.exit(1);
  }

  const data = (await res.json()) as {
    resources: {
      core: { limit: number; remaining: number; reset: number };
      search: { limit: number; remaining: number; reset: number };
      graphql?: { limit: number; remaining: number; reset: number };
    };
    rate: { limit: number; remaining: number; reset: number };
  };

  const { resources, rate } = data;
  const fmt = (n: number) => n.toLocaleString();
  const resetDate = (ts: number) => new Date(ts * 1000).toLocaleString();

  console.log('GitHub API rate limit (authenticated)\n');
  console.log('Overall (rate):');
  console.log(`  Limit:    ${fmt(rate.limit)} requests/hour`);
  console.log(`  Remaining: ${fmt(rate.remaining)}`);
  console.log(`  Reset:    ${resetDate(rate.reset)}\n`);
  console.log('Core API (e.g. repos, issues, PRs):');
  console.log(`  Limit:    ${fmt(resources.core.limit)} requests/hour`);
  console.log(`  Remaining: ${fmt(resources.core.remaining)}`);
  console.log(`  Reset:    ${resetDate(resources.core.reset)}\n`);
  console.log('Search API:');
  console.log(`  Limit:    ${fmt(resources.search.limit)} requests/minute`);
  console.log(`  Remaining: ${fmt(resources.search.remaining)}`);
  console.log(`  Reset:    ${resetDate(resources.search.reset)}`);
  if (resources.graphql) {
    console.log('\nGraphQL:');
    console.log(`  Limit:    ${fmt(resources.graphql.limit)} points/hour`);
    console.log(`  Remaining: ${fmt(resources.graphql.remaining)}`);
    console.log(`  Reset:    ${resetDate(resources.graphql.reset)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
