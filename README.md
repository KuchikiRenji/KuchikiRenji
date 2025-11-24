# GitHub Visit Counter

A production-ready serverless visit counter badge for GitHub README files. This project uses Vercel serverless functions to track and display visit counts in a beautiful SVG badge.

![Visits](https://github-visit-counter.vercel.app/api/counter)

## Features

- 🎨 Beautiful neon purple SVG badge (similar to shields.io style)
- ⚡ Serverless function on Vercel (fast and scalable)
- 💾 Dual storage: Vercel KV (production) or JSON file (local dev)
- 🛡️ Built-in rate limiting (prevents abuse)
- 🔄 Auto-detection of storage backend
- 📊 Real-time counter updates

## Quick Start

### 1. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

### 2. Set Up Vercel KV (Production)

For production, you'll need to set up Vercel KV:

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **KV**
3. Create a new KV database
4. Go to **Settings** → **Environment Variables** and add the following (Vercel will automatically inject these when you link the KV database):

**Option A: Using Vercel KV SDK (Recommended)**
When you link a KV database to your project, Vercel automatically sets:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**Option B: Manual Configuration**
If you need to set them manually:
- `KV_REST_API_URL` - Your KV REST API URL (from KV database settings)
- `KV_REST_API_TOKEN` - Your KV REST API token (from KV database settings)

**Note:** The project automatically detects which storage method to use. If KV environment variables are present, it uses KV. Otherwise, it falls back to JSON file storage (for local development).

### 3. Add Badge to Your README

Add this line to your GitHub README.md:

```markdown
![Visits](https://your-project-name.vercel.app/api/counter)
```

Replace `your-project-name` with your actual Vercel project name.

## Local Development

### Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)

### Running Locally

```bash
# Install dependencies (if any)
npm install

# Start local development server
npm run dev
```

The counter will use `counter.json` for storage when running locally (no KV required).

### Environment Variables (Local)

For local development, you can create a `.env` file (see `.env.example`). However, local development will automatically fall back to JSON file storage if KV variables are not set.

## Project Structure

```
.
├── api/
│   └── counter.js          # Serverless function handler
├── lib/
│   └── storage.js          # Storage abstraction layer
├── counter.json            # Initial seed file (local dev)
├── vercel.json             # Vercel configuration
├── package.json            # Project dependencies
├── .env.example            # Example environment variables
└── README.md               # This file
```

## How It Works

1. **Request Flow:**
   - User loads the badge URL in their README
   - Vercel serverless function is triggered
   - Function checks rate limiting (1 request per minute per IP)
   - Counter is incremented (if not rate limited)
   - SVG badge is generated and returned

2. **Storage:**
   - **Production:** Uses Vercel KV for persistent, distributed storage
   - **Local Dev:** Uses `counter.json` file for simplicity

3. **Rate Limiting:**
   - Prevents abuse by limiting increments to once per minute per IP
   - Still returns the current count even if rate limited

## Customization

### Changing Colors

Edit `api/counter.js` and modify the color constants:

```javascript
const labelColor = '#9D7CFF';  // Neon purple
const valueColor = '#0d1117';   // Dark background
const textColor = '#ffffff';     // White text
```

### Changing Label

Modify the `label` variable in `generateSVG()` function:

```javascript
const label = 'visits';  // Change to 'views', 'hits', etc.
```

## Troubleshooting

### Badge Not Updating

- Check that your Vercel deployment is successful
- Verify environment variables are set correctly
- Check Vercel function logs for errors

### Counter Resets

- Ensure Vercel KV is properly configured
- Check that `VERCEL_REST_API_TOKEN` has correct permissions
- Verify `VERCEL_KV_NAMESPACE` matches your KV database

### Local Development Issues

- Make sure `counter.json` exists and is writable
- Check that Node.js version is 18 or higher
- Verify Vercel CLI is installed and up to date

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
