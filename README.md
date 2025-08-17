# ClamFlow Frontend

A Next.js TypeScript application for compliance and quality management in food processing.

## Features

- TypeScript-first development
- Next.js 14.2.31 with App Router
- Supabase integration for authentication and data
- Tailwind CSS for styling
- Vercel deployment ready

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Deployment

This application is deployed on Vercel at: https://clamflowcloud.vercel.app/

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## TypeScript

All TypeScript compilation errors have been systematically resolved. The build process validates types and ensures code quality.
