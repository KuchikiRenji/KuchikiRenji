/**
 * Storage abstraction layer for visit counter
 * Supports Vercel KV (production) and JSON file (local dev)
 */

const fs = require('fs').promises;
const path = require('path');

const COUNTER_KEY = 'visit-counter';
const COUNTER_FILE = path.join(process.cwd(), 'counter.json');

// Try to use @vercel/kv if available, otherwise fall back to REST API
let kv = null;
try {
  // Attempt to use standard Vercel KV SDK
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kv = require('@vercel/kv').kv;
  }
} catch (e) {
  // @vercel/kv not installed or not configured, will use REST API or file
}

/**
 * Check if Vercel KV environment variables are available
 */
function hasKVConfig() {
  // Check for standard KV env vars first
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return true;
  }
  // Fallback to custom REST API vars
  if (process.env.VERCEL_REST_API_URL && process.env.VERCEL_REST_API_TOKEN) {
    return true;
  }
  return false;
}

/**
 * Read counter from Vercel KV using SDK
 */
async function readFromKVSDK() {
  try {
    const value = await kv.get(COUNTER_KEY);
    return parseInt(value || '0', 10);
  } catch (error) {
    console.error('KV SDK read error:', error);
    throw error;
  }
}

/**
 * Write counter to Vercel KV using SDK
 */
async function writeToKVSDK(count) {
  try {
    await kv.set(COUNTER_KEY, count.toString());
    return true;
  } catch (error) {
    console.error('KV SDK write error:', error);
    throw error;
  }
}

/**
 * Read counter from Vercel KV using REST API
 */
async function readFromKVREST() {
  const apiUrl = process.env.KV_REST_API_URL || process.env.VERCEL_REST_API_URL;
  const apiToken = process.env.KV_REST_API_TOKEN || process.env.VERCEL_REST_API_TOKEN;
  
  try {
    const response = await fetch(`${apiUrl}/get/${COUNTER_KEY}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (response.status === 404) {
      return 0; // Key doesn't exist yet
    }

    if (!response.ok) {
      throw new Error(`KV read failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // KV REST API returns { result: "value" } format
    const value = data.result || data.value || '0';
    return parseInt(value, 10);
  } catch (error) {
    console.error('KV REST read error:', error);
    throw error;
  }
}

/**
 * Write counter to Vercel KV using REST API
 */
async function writeToKVREST(count) {
  const apiUrl = process.env.KV_REST_API_URL || process.env.VERCEL_REST_API_URL;
  const apiToken = process.env.KV_REST_API_TOKEN || process.env.VERCEL_REST_API_TOKEN;
  
  try {
    const response = await fetch(`${apiUrl}/set/${COUNTER_KEY}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(count.toString()),
    });

    if (!response.ok) {
      throw new Error(`KV write failed: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('KV REST write error:', error);
    throw error;
  }
}

/**
 * Read counter from Vercel KV (auto-detect method)
 */
async function readFromKV() {
  if (kv) {
    return await readFromKVSDK();
  } else {
    return await readFromKVREST();
  }
}

/**
 * Write counter to Vercel KV (auto-detect method)
 */
async function writeToKV(count) {
  if (kv) {
    return await writeToKVSDK(count);
  } else {
    return await writeToKVREST(count);
  }
}

/**
 * Read counter from JSON file
 */
async function readFromFile() {
  try {
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    const json = JSON.parse(data);
    return parseInt(json.count || '0', 10);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return 0
      return 0;
    }
    console.error('File read error:', error);
    throw error;
  }
}

/**
 * Write counter to JSON file
 */
async function writeToFile(count) {
  try {
    const data = JSON.stringify({ count }, null, 2);
    await fs.writeFile(COUNTER_FILE, data, 'utf8');
    return true;
  } catch (error) {
    console.error('File write error:', error);
    throw error;
  }
}

/**
 * Get current visit count
 */
async function getCount() {
  if (hasKVConfig()) {
    return await readFromKV();
  } else {
    return await readFromFile();
  }
}

/**
 * Set visit count
 */
async function setCount(count) {
  if (hasKVConfig()) {
    return await writeToKV(count);
  } else {
    return await writeToFile(count);
  }
}

/**
 * Increment visit count and return new value
 */
async function increment() {
  const current = await getCount();
  const next = current + 1;
  await setCount(next);
  return next;
}

module.exports = {
  getCount,
  setCount,
  increment,
  hasKVConfig,
};

