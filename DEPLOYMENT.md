# Deployment Guide

This guide covers deploying the Senior Care Central application to Vercel with proper environment configuration.

## Environment Variables

### Required Environment Variables

Set these in your Vercel project settings:

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Stream Chat Configuration
```
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

#### OpenAI Configuration
```
NEXT_OPEN_AI_SECRET=your_openai_api_key
OPENAI_API_KEY=your_openai_api_key
```

#### Google Maps Configuration
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

#### OpenCage Configuration
```
OPEN_CAGE_API_KEY=your_opencage_api_key
```

### Optional Environment Variables

#### Custom Domain (Production)
If you have a custom domain, set this to ensure proper redirect URLs:
```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**Note:** If not set, the app will automatically detect the domain from Vercel's `VERCEL_URL` environment variable.

## Vercel Deployment Steps

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**
   - In the project settings, go to "Environment Variables"
   - Add all the required environment variables listed above
   - Make sure to set them for all environments (Production, Preview, Development)

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - For manual deployment, click "Deploy" in the dashboard

## Password Reset Configuration

The application automatically handles redirect URLs for different environments:

- **Development**: Uses `http://localhost:3000`
- **Vercel Preview**: Uses `https://your-app-git-branch.vercel.app`
- **Vercel Production**: Uses `https://your-app.vercel.app` or your custom domain

### Supabase Configuration

Make sure your Supabase project is configured to allow redirects to your production domain:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > URL Configuration
3. Add your production domain to "Site URL" and "Redirect URLs":
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/auth/callback`
   - If using custom domain: `https://your-domain.com/auth/callback`

## Testing After Deployment

1. **Test Password Reset Flow**
   - Go to your production URL
   - Try the password reset for both family and provider roles
   - Verify that emails contain the correct production URLs

2. **Test Authentication**
   - Test signup and login for both roles
   - Verify email confirmations work correctly
   - Test OAuth flows if implemented

3. **Test API Endpoints**
   - Verify all API routes work correctly
   - Check that database connections are working
   - Test Stream Chat integration

## Troubleshooting

### Common Issues

1. **Password Reset Links Not Working**
   - Check that Supabase redirect URLs include your production domain
   - Verify environment variables are set correctly
   - Check browser console for errors

2. **Environment Variable Issues**
   - Ensure all required variables are set in Vercel
   - Check that variable names match exactly (case-sensitive)
   - Redeploy after adding new environment variables

3. **Database Connection Issues**
   - Verify Supabase URL and keys are correct
   - Check that RLS policies are configured properly
   - Ensure database migrations have been run

### Debug Mode

To enable debug logging in production, you can temporarily add:
```
NODE_ENV=development
```

**Note:** Remove this after debugging as it may expose sensitive information.

## Security Considerations

1. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use Vercel's environment variable system for secrets
   - Regularly rotate API keys and secrets

2. **Supabase Security**
   - Configure proper RLS policies
   - Use service role key only on server-side
   - Regularly review and update security settings

3. **Domain Security**
   - Use HTTPS in production
   - Configure proper CORS settings
   - Validate all redirect URLs

## Monitoring

1. **Vercel Analytics**
   - Enable Vercel Analytics for performance monitoring
   - Set up alerts for errors and performance issues

2. **Supabase Monitoring**
   - Monitor database performance and usage
   - Set up alerts for authentication issues
   - Review logs regularly

3. **Application Monitoring**
   - Monitor API response times
   - Track user authentication success rates
   - Monitor password reset completion rates
