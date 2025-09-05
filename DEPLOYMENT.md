# Deployment Guide - Vercel + Supabase

## Prerequisites
- Vercel account connected to your GitHub repository
- Supabase project created
- Environment variables configured

## Supabase Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Database Setup**
   - Your Supabase project comes with a PostgreSQL database
   - Copy the connection string from Settings > Database

## Environment Variables for Vercel

Add these environment variables in your Vercel dashboard:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URLs
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-production-secret
```

## Deployment Steps

1. **Push your code to GitHub** (already done)
2. **Connect Vercel to your GitHub repository**
3. **Configure environment variables in Vercel**
4. **Deploy the application**
5. **Run database migrations**

## Database Migration

### Option A: Using SQL Migration (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_migration.sql` file
4. Execute the SQL script to create all tables and sample data

### Option B: Using Prisma (Alternative)

After deployment, you can also run:

```bash
npx prisma db push
```

Note: Make sure your environment variables are properly set before running Prisma commands.

## Important Notes

- Make sure all environment variables are set in Vercel
- The database will be PostgreSQL (Supabase) instead of SQLite
- All existing data will need to be migrated manually
- Test the application thoroughly after deployment

## Troubleshooting

- Check Vercel function logs for any errors
- Verify database connection in Supabase dashboard
- Ensure all environment variables are correctly set
- Check that Prisma schema matches your Supabase database