# Clover OAuth Setup Instructions

## Issue: "Clover will not accept the connection"

This error occurs because the Clover OAuth app configuration doesn't have the correct redirect URI registered.

## Required Redirect URI

The following redirect URI must be registered in your Clover app configuration:

```
https://1b423122-988c-4041-913f-504458c4eb91-00-b968ik9ict5p.janeway.replit.dev/api/admin/clover/oauth/callback
```

## Steps to Fix

1. **Go to Clover Developer Dashboard**
   - Visit: https://www.clover.com/developers/
   - Log in with your Clover account

2. **Select Your App**
   - Find your app with ID: `8QSDCRTWSBPWT`
   - Click on the app to edit its settings

3. **Update Redirect URIs**
   - Look for "Redirect URIs" or "OAuth Redirect URIs" section
   - Add the exact redirect URI above
   - Save the configuration

4. **Verify App Permissions**
   - Ensure the app has the following permissions:
     - `payments:read`
     - `payments:write` 
     - `orders:read`
     - `orders:write`
     - `merchants:read`
     - `customers:read`
     - `customers:write`

5. **Test the Connection**
   - After saving, try the OAuth connection again from the admin panel

## Current Configuration Details

- **App ID**: 8QSDCRTWSBPWT
- **Merchant ID**: PFHDQ8MSX5F81
- **Environment**: Production only
- **OAuth Endpoint**: https://www.clover.com/oauth/authorize
- **Callback Endpoint**: /api/admin/clover/oauth/callback

## Notes

- The redirect URI must match exactly (including https://)
- Any changes to the app configuration may take a few minutes to propagate
- If you don't have access to modify the app, contact the app owner or Clover support