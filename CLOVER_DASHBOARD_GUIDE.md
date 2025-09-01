# Clover Developer Dashboard - Redirect URI Setup

## Step-by-Step Guide to Add Redirect URI

### 1. Access Developer Dashboard
- Go to: **https://www.clover.com/developers/**
- Log in with your Clover account

### 2. Find Your App
- Look for app with ID: **8QSDCRTWSBPWT**
- Click on the app name/card to open it

### 3. Locate OAuth/Redirect URI Settings
The redirect URI setting can be found in different locations depending on the dashboard version:

**Option A - OAuth Settings Tab:**
- Look for an "OAuth" or "OAuth Settings" tab
- Click it to open OAuth configuration

**Option B - App Configuration:**
- Look for "App Settings", "Configuration", or "Settings" section
- Scroll down to find OAuth-related fields

**Option C - Direct Redirect URI Field:**
- Look for fields labeled:
  - "Redirect URIs"
  - "OAuth Redirect URLs" 
  - "Callback URLs"
  - "Authorized Redirect URIs"

### 4. Add the Redirect URI
**Exact URI to add:**
```
https://1b423122-988c-4041-913f-504458c4eb91-00-b968ik9ict5p.janeway.replit.dev/api/admin/clover/oauth/callback
```

**Important:**
- Copy and paste the URI exactly (no spaces, no modifications)
- Ensure it starts with `https://`
- Include the full path ending in `/callback`

### 5. Save Changes
- Click "Save", "Update", or "Apply Changes"
- Wait for confirmation message
- Changes may take a few minutes to propagate

### 6. Common Field Names to Look For
- Redirect URIs
- OAuth Redirect URLs
- Callback URLs
- Authorized Redirect URIs
- Return URLs
- OAuth Settings
- App Configuration

### 7. If You Can't Find It
If you can't locate the redirect URI field:
1. Try different tabs in your app settings
2. Look for an "OAuth" or "Security" section
3. Contact Clover Developer Support for guidance
4. Check if your app needs additional permissions

### 8. Test After Setup
After adding the redirect URI:
1. Save the configuration
2. Wait 2-3 minutes for changes to propagate  
3. Try the OAuth connection again from your admin panel
4. You should no longer get the "Clover will not accept the connection" error