# Deployment Guide (Vercel)

This application is built with **Next.js**, which makes deployment to **Vercel** extremely straightforward.

## Prerequisites

1.  A **GitHub** (or GitLab/Bitbucket) account.
2.  A **Vercel** account.
3.  Your **Supabase** project URL and Keys.

## Steps

### 1. Push to GitHub
Ensure your latest code is pushed to a GitHub repository.
```bash
git add .
git commit -m "Ready for deploy"
git push
```

### 2. Import to Vercel
1.  Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your `coffee-shops` repository and click **Import**.

### 3. Configure Project
Vercel will automatically detect that this is a Next.js project. You generally do **not** need to change the Build Command or Output Directory.

**CRITICAL: Environment Variables**
You must add the environment variables from your `.env.local` file to Vercel.

Expand the **Environment Variables** section and add the following:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `your_supabase_url` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your_supabase_anon_key` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_supabase_service_role_key` |

> **Note**: `SUPABASE_SERVICE_ROLE_KEY` is required for the server-side Admin API routes to function correctly (bypassing RLS).

### 4. Deploy
Click **Deploy**.
Vercel will build your application. This might take a minute or two.
Once finished, you will get a production URL (e.g., `coffee-shops.vercel.app`).

## Post-Deployment Checks

1.  **Authentication**: Try to Log in / Sign up. This confirms `NEXT_PUBLIC_` variables are correct.
2.  **Admin Access**:
    *   Navigate to `/dashboard/admin/users`.
    *   If you see "Forbidden" or 500 errors, check your `SUPABASE_SERVICE_ROLE_KEY` in Vercel settings.
3.  **Permissions**:
    *   Since the database is the same (Supabase), your existing users and permissions will work immediately.

## Troubleshooting

-   **500 Internal Server Error**: Usually missing `SUPABASE_SERVICE_ROLE_KEY`.
-   **Build Failures**: Check the Vercel logs. Ensure strict type checking passes locally (`npm run build`).
-   **Repository Not Visible**: If you see "No Git repositories found" or an empty list:
    1.  Click the **"Install"** link or **"Adjust GitHub App Permissions"** on Vercel.
    2.  Select your GitHub account.
    3.  Choose **"Only select repositories"** and select `zenith-shops` (or "All repositories").
    4.  Click **Save**. The repository should now appear in the Vercel list.
