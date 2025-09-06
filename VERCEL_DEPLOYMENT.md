# Vercel Deployment Guide

## Environment Variables

The following environment variables need to be set in your Vercel project settings:

### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key

### Traccar API
- `NEXT_PUBLIC_TRACCAR_URL`: URL of your Traccar server (e.g., https://tracking.jagalari.com)
- `NEXT_PUBLIC_TRACCAR_EMAIL`: Email for Traccar authentication
- `NEXT_PUBLIC_TRACCAR_PASSWORD`: Password for Traccar authentication

## Deployment Steps

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set the environment variables in Vercel dashboard
4. Deploy

## Vercel Configuration

The project includes a `vercel.json` file with the following configuration:
- Build command: `npm run build`
- Output directory: `.next`
- Framework: Next.js
- Region: Singapore (sin1) for better performance in Asia

## Notes

- The project uses Next.js 14.2.25 with React 18.3.1
- Tailwind CSS v3 is configured for styling
- The build may have issues with Node.js v22 locally, but should work on Vercel's deployment environment