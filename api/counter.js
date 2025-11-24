/**
 * Vercel serverless function for GitHub visit counter badge
 * Returns an SVG badge with the current visit count
 */

const storage = require('../lib/storage');

// In-memory rate limiting (simple approach)
// In production, consider using Vercel KV for distributed rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

/**
 * Get client IP address from request
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check if request should be rate limited
 */
function shouldRateLimit(ip) {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip);
  
  if (!lastRequest) {
    rateLimitMap.set(ip, now);
    return false;
  }
  
  if (now - lastRequest < RATE_LIMIT_WINDOW) {
    return true; // Rate limited
  }
  
  rateLimitMap.set(ip, now);
  return false;
}

/**
 * Generate SVG badge
 */
function generateSVG(count) {
  const label = 'visits';
  const labelWidth = label.length * 7 + 20; // Approximate width
  const valueWidth = count.toString().length * 7 + 20;
  const totalWidth = labelWidth + valueWidth;
  const height = 20;
  
  // Neon purple (#9D7CFF) for label, dark (#0d1117) for value
  const labelColor = '#9D7CFF';
  const valueColor = '#0d1117';
  const textColor = '#ffffff';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <defs>
    <linearGradient id="labelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${labelColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${labelColor};stop-opacity:0.9" />
    </linearGradient>
  </defs>
  
  <!-- Label background (neon purple) -->
  <rect x="0" y="0" width="${labelWidth}" height="${height}" rx="3" fill="url(#labelGradient)"/>
  
  <!-- Value background (dark) -->
  <rect x="${labelWidth}" y="0" width="${valueWidth}" height="${height}" rx="3" fill="${valueColor}"/>
  
  <!-- Label text -->
  <text x="${labelWidth / 2}" y="14" font-family="monospace" font-size="11" font-weight="bold" fill="${textColor}" text-anchor="middle">${label}</text>
  
  <!-- Value text -->
  <text x="${labelWidth + valueWidth / 2}" y="14" font-family="monospace" font-size="11" font-weight="bold" fill="${textColor}" text-anchor="middle">${count}</text>
</svg>`;
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const isRateLimited = shouldRateLimit(clientIP);
    
    let count;
    if (isRateLimited) {
      // Don't increment, just return current count
      count = await storage.getCount();
    } else {
      // Increment counter
      count = await storage.increment();
    }
    
    const svg = generateSVG(count);
    
    // Set headers
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Return SVG
    res.status(200).send(svg);
  } catch (error) {
    console.error('Counter error:', error);
    
    // Return error SVG
    const errorSVG = generateSVG(0);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).send(errorSVG);
  }
};

