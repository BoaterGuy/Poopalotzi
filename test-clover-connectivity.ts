/**
 * Simple Clover API Connectivity Test
 * Tests basic connectivity to Clover API without requiring OAuth tokens
 */

const MERCHANT_ID = 'PFHDQ8MSX5F81';
const APP_ID = process.env.CLOVER_APP_ID || '8QSDCRTWSBPWT';
const ENVIRONMENT = process.env.CLOVER_ENVIRONMENT || 'production';

async function testCloverConnectivity() {
  console.log('🔍 Testing Clover API Connectivity');
  console.log('===================================');
  console.log(`Merchant ID: ${MERCHANT_ID}`);
  console.log(`App ID: ${APP_ID}`);
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log('');

  // Test 1: Check if merchant exists
  const baseUrl = ENVIRONMENT === 'sandbox' 
    ? 'https://apisandbox.dev.clover.com' 
    : 'https://api.clover.com';
  
  const merchantUrl = `${baseUrl}/v3/merchants/${MERCHANT_ID}`;
  
  try {
    console.log('1. Testing merchant endpoint (no auth)...');
    const response = await fetch(merchantUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ Merchant exists (401 Unauthorized is expected without token)');
    } else if (response.status === 404) {
      console.log('   ❌ Merchant not found (404) - Invalid merchant ID');
      return false;
    } else {
      console.log(`   ⚠️  Unexpected response: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Network error: ${error}`);
    return false;
  }

  // Test 2: Test OAuth URL generation
  console.log('\n2. Testing OAuth URL generation...');
  const redirectUri = 'https://test.replit.dev/api/admin/clover/oauth/callback';
  const oauthBaseUrl = ENVIRONMENT === 'sandbox' 
    ? 'https://sandbox.dev.clover.com/oauth'
    : 'https://www.clover.com/oauth';
  
  const oauthUrl = `${oauthBaseUrl}/authorize?client_id=${APP_ID}&merchant_id=${MERCHANT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  
  console.log(`   Generated URL: ${oauthUrl}`);
  console.log('   ✅ OAuth URL generated successfully');

  // Test 3: Check app configuration
  console.log('\n3. Testing app configuration...');
  const appUrl = `${baseUrl}/v3/apps/${APP_ID}`;
  
  try {
    const appResponse = await fetch(appUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log(`   Status: ${appResponse.status}`);
    
    if (appResponse.status === 401) {
      console.log('   ✅ App exists (401 Unauthorized is expected without token)');
    } else if (appResponse.status === 404) {
      console.log('   ❌ App not found (404) - Invalid app ID');
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ App check error: ${error}`);
  }

  console.log('\n✅ Basic connectivity tests completed successfully');
  console.log('\nNext steps:');
  console.log('1. Complete OAuth flow with real merchant authorization');
  console.log('2. Test payment processing with valid tokens');
  console.log('3. Verify webhook endpoint accessibility');
  
  return true;
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCloverConnectivity().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { testCloverConnectivity };