// Test script for Shinami API - Movement Network
const SHINAMI_KEY = 'us1_movement_testnet_bf44be9f0c5b48e9beb0bf0664a3902b';

// Movement-specific endpoints (NOT Aptos!)
const KEY_URL = 'https://api.us1.shinami.com/movement/key/v1';
const WALLET_URL = 'https://api.us1.shinami.com/movement/wallet/v1';

async function makeRequest(url, body, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`REQUEST: ${description}`);
  console.log(`${'='.repeat(60)}`);
  console.log('URL:', url);
  console.log('Body:', JSON.stringify(body, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SHINAMI_KEY,
      },
      body: JSON.stringify(body),
    });
    
    console.log('\nRESPONSE STATUS:', response.status, response.statusText);
    console.log('RESPONSE HEADERS:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const text = await response.text();
    console.log('\nRESPONSE BODY (raw):', text);
    
    try {
      const json = JSON.parse(text);
      console.log('RESPONSE BODY (parsed):', JSON.stringify(json, null, 2));
      
      if (json.error) {
        console.log('\n❌ ERROR DETECTED:');
        console.log('  Code:', json.error.code);
        console.log('  Message:', json.error.message);
        if (json.error.data) {
          console.log('  Data:', JSON.stringify(json.error.data, null, 2));
        }
      } else if (json.result !== undefined) {
        console.log('\n✅ SUCCESS! Result:', typeof json.result === 'string' ? json.result.substring(0, 50) + '...' : JSON.stringify(json.result));
      }
      
      return json;
    } catch (parseError) {
      console.log('\n❌ FAILED TO PARSE JSON:', parseError.message);
      return null;
    }
  } catch (fetchError) {
    console.log('\n❌ FETCH ERROR:', fetchError.message);
    console.log('Stack:', fetchError.stack);
    return null;
  }
}

async function testShinami() {
  const testWalletId = 'test-wallet-' + Date.now();
  const testSecret = 'test-secret-123';
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           SHINAMI MOVEMENT API TEST                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Configuration:');
  console.log('  Key URL:', KEY_URL);
  console.log('  Wallet URL:', WALLET_URL);
  console.log('  API Key:', SHINAMI_KEY);
  console.log('  Test Wallet ID:', testWalletId);
  console.log('  Test Secret:', testSecret);
  
  // Test 1: Create session via Key API
  const keyResult = await makeRequest(KEY_URL, {
    jsonrpc: '2.0',
    method: 'key_createSession',
    params: [testSecret],
    id: 1,
  }, 'Create Session (key_createSession)');
  
  if (!keyResult || keyResult.error || !keyResult.result) {
    console.log('\n🛑 STOPPING: Failed to create session. Cannot continue tests.');
    return;
  }
  
  const sessionToken = keyResult.result;
  
  // Test 2: Get wallet (should fail for new wallet)
  await makeRequest(WALLET_URL, {
    jsonrpc: '2.0',
    method: 'wal_getWallet',
    params: [testWalletId],
    id: 2,
  }, 'Get Wallet (wal_getWallet) - Expected to fail for new wallet');
  
  // Test 3: Create wallet
  const createResult = await makeRequest(WALLET_URL, {
    jsonrpc: '2.0',
    method: 'wal_createWallet',
    params: [testWalletId, sessionToken],
    id: 3,
  }, 'Create Wallet (wal_createWallet)');
  
  if (createResult && createResult.result) {
    console.log('\n🎉 WALLET CREATED SUCCESSFULLY!');
    console.log('  Wallet ID:', testWalletId);
    console.log('  Address:', createResult.result.accountAddress || createResult.result);
  }
  
  // Test 4: Get the wallet we just created
  await makeRequest(WALLET_URL, {
    jsonrpc: '2.0',
    method: 'wal_getWallet',
    params: [testWalletId],
    id: 4,
  }, 'Get Wallet Again (should succeed now)');
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

testShinami();
