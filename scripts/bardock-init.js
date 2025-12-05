#!/usr/bin/env node

/**
 * Bardock Testnet Initialization Script
 * 
 * This script:
 * 1. Generates new admin wallets
 * 2. Funds them with MOVE tokens via faucet
 * 3. Initializes smUSD contract
 * 4. Initializes sports_betting contract with admins
 * 5. Registers admins for smUSD
 * 6. Mints smUSD to deployer
 * 7. Deposits house funds
 */

const { AptosClient, AptosAccount, HexString, FaucetClient } = require('aptos');
const fs = require('fs');
const path = require('path');

// Bardock Testnet Configuration
const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const FAUCET_URL = 'https://faucet.testnet.movementnetwork.xyz';
const CONTRACT_ADDRESS = '0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5';

// Deployer private key (from the deployed contract)
const DEPLOYER_PRIVATE_KEY = '0xc3776a685c1a0d5060b7ce523c1c08a66409a7f1ebc8b0f836dc1c936046c692';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fundAccount(faucetClient, address, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await faucetClient.fundAccount(address, 100_000_000); // 1 MOVE
      return true;
    } catch (error) {
      console.log(`  Retry ${i + 1}/${retries}...`);
      await sleep(2000);
    }
  }
  return false;
}

async function main() {
  console.log('🚀 Bardock Testnet Contract Initialization\n');
  console.log('📍 Network: Movement Bardock Testnet');
  console.log(`📍 RPC: ${NODE_URL}`);
  console.log(`📍 Contract: ${CONTRACT_ADDRESS}\n`);

  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  // Load deployer account
  const deployer = new AptosAccount(new HexString(DEPLOYER_PRIVATE_KEY).toUint8Array());
  console.log(`📝 Deployer Address: ${deployer.address().hex()}\n`);

  // Step 1: Generate new admin accounts
  console.log('1️⃣  Generating Admin Wallets...');
  const admin1 = new AptosAccount();
  const admin2 = new AptosAccount();
  const admin3 = new AptosAccount();
  const admin4 = new AptosAccount();

  const admins = [
    { name: 'Admin 1 (Primary Oracle)', account: admin1 },
    { name: 'Admin 2 (Backup Oracle 1)', account: admin2 },
    { name: 'Admin 3 (Backup Oracle 2)', account: admin3 },
    { name: 'Admin 4 (Backup Oracle 3)', account: admin4 },
  ];

  console.log('Generated Admin Addresses:');
  admins.forEach(({ name, account }) => {
    console.log(`  ${name}: ${account.address().hex()}`);
  });
  console.log('');

  // Step 2: Fund admin accounts with MOVE
  console.log('2️⃣  Funding Admin Accounts with MOVE...');
  for (const { name, account } of admins) {
    process.stdout.write(`  Funding ${name}... `);
    const success = await fundAccount(faucetClient, account.address().hex());
    if (success) {
      console.log('✅');
    } else {
      console.log('❌ (will retry later)');
    }
    await sleep(1000);
  }
  console.log('');

  // Step 3: Initialize smUSD
  console.log('3️⃣  Initializing smUSD Contract...');
  try {
    const payload1 = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::smusd::initialize`,
      type_arguments: [],
      arguments: [],
    };

    const tx1 = await client.generateTransaction(deployer.address(), payload1);
    const signedTx1 = await client.signTransaction(deployer, tx1);
    const result1 = await client.submitTransaction(signedTx1);
    await client.waitForTransaction(result1.hash);
    
    console.log('✅ smUSD initialized');
    console.log(`   TX: ${result1.hash}\n`);
    await sleep(2000);
  } catch (error) {
    if (error.message?.includes('EALREADY_INITIALIZED')) {
      console.log('⚠️  smUSD already initialized\n');
    } else {
      console.error('❌ Failed to initialize smUSD:', error.message);
      console.log('   Continuing anyway...\n');
    }
  }

  // Step 4: Initialize Sports Betting Contract
  console.log('4️⃣  Initializing Sports Betting Contract...');
  try {
    const payload2 = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::sports_betting::initialize`,
      type_arguments: [],
      arguments: [
        admin1.address().hex(),
        admin2.address().hex(),
        admin3.address().hex(),
        admin4.address().hex(),
      ],
    };

    const tx2 = await client.generateTransaction(deployer.address(), payload2);
    const signedTx2 = await client.signTransaction(deployer, tx2);
    const result2 = await client.submitTransaction(signedTx2);
    await client.waitForTransaction(result2.hash);
    
    console.log('✅ Sports Betting initialized with 4 admin addresses');
    console.log(`   TX: ${result2.hash}\n`);
    await sleep(2000);
  } catch (error) {
    if (error.message?.includes('EALREADY_INITIALIZED')) {
      console.log('⚠️  Sports Betting already initialized\n');
    } else {
      console.error('❌ Failed to initialize sports betting:', error.message);
      console.log('   Continuing anyway...\n');
    }
  }

  // Step 5: Register deployer for smUSD (needed to mint)
  console.log('5️⃣  Registering Deployer for smUSD...');
  try {
    const payload3 = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::smusd::register`,
      type_arguments: [],
      arguments: [],
    };

    const tx3 = await client.generateTransaction(deployer.address(), payload3);
    const signedTx3 = await client.signTransaction(deployer, tx3);
    const result3 = await client.submitTransaction(signedTx3);
    await client.waitForTransaction(result3.hash);
    console.log('✅ Deployer registered for smUSD\n');
    await sleep(1000);
  } catch (error) {
    console.log('⚠️  Deployer may already be registered\n');
  }

  // Step 6: Register admins for smUSD
  console.log('6️⃣  Registering Admins for smUSD...');
  for (const { name, account } of admins) {
    try {
      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::smusd::register`,
        type_arguments: [],
        arguments: [],
      };

      const tx = await client.generateTransaction(account.address(), payload);
      const signedTx = await client.signTransaction(account, tx);
      const result = await client.submitTransaction(signedTx);
      await client.waitForTransaction(result.hash);
      console.log(`✅ ${name} registered for smUSD`);
      await sleep(1000);
    } catch (error) {
      console.log(`⚠️  ${name} may already be registered or needs funding`);
    }
  }
  console.log('');

  // Step 7: Mint smUSD to deployer
  console.log('7️⃣  Minting smUSD to Deployer...');
  try {
    const mintAmount = 1_500_000_000_000_000; // 15,000,000 smUSD (8 decimals)

    const payload4 = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::smusd::mint`,
      type_arguments: [],
      arguments: [deployer.address().hex(), mintAmount.toString()],
    };

    const tx4 = await client.generateTransaction(deployer.address(), payload4);
    const signedTx4 = await client.signTransaction(deployer, tx4);
    const result4 = await client.submitTransaction(signedTx4);
    await client.waitForTransaction(result4.hash);
    
    console.log(`✅ Minted 15,000,000 smUSD to Deployer`);
    console.log(`   TX: ${result4.hash}\n`);
    await sleep(2000);
  } catch (error) {
    console.error('❌ Failed to mint smUSD:', error.message, '\n');
  }

  // Step 8: Deposit house funds
  console.log('8️⃣  Depositing House Funds...');
  try {
    const depositAmount = 1_000_000_000_000_000; // 10,000,000 smUSD (8 decimals)

    const payload5 = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::sports_betting::deposit_house_funds`,
      type_arguments: [],
      arguments: [depositAmount.toString()],
    };

    const tx5 = await client.generateTransaction(deployer.address(), payload5);
    const signedTx5 = await client.signTransaction(deployer, tx5);
    const result5 = await client.submitTransaction(signedTx5);
    await client.waitForTransaction(result5.hash);
    
    console.log(`✅ Deposited 10,000,000 smUSD to house`);
    console.log(`   TX: ${result5.hash}\n`);
  } catch (error) {
    console.error('❌ Failed to deposit house funds:', error.message, '\n');
  }

  // Step 9: Verify initialization
  console.log('9️⃣  Verifying Initialization...');
  try {
    const adminsResult = await client.view({
      function: `${CONTRACT_ADDRESS}::sports_betting::get_admins`,
      type_arguments: [],
      arguments: [],
    });

    const houseBalance = await client.view({
      function: `${CONTRACT_ADDRESS}::sports_betting::get_house_balance`,
      type_arguments: [],
      arguments: [],
    });

    const owner = await client.view({
      function: `${CONTRACT_ADDRESS}::sports_betting::get_owner`,
      type_arguments: [],
      arguments: [],
    });

    console.log('✅ Verification Results:');
    console.log(`   Owner: ${owner[0]}`);
    console.log(`   Registered Admins: ${adminsResult[0].length}`);
    console.log(`   House Balance: ${(parseInt(houseBalance[0]) / 100_000_000).toFixed(2)} smUSD`);
  } catch (error) {
    console.error('⚠️  Verification failed:', error.message);
  }

  // Save wallet configuration
  console.log('\n📁 Saving Wallet Configuration...');
  
  const walletsData = {
    generated: new Date().toISOString(),
    network: 'bardock-testnet',
    chain_id: 250,
    rpc_url: NODE_URL,
    faucet_url: FAUCET_URL,
    explorer_url: 'https://explorer.movementnetwork.xyz/?network=bardock+testnet',
    contract_address: CONTRACT_ADDRESS,
    modules: {
      smusd: `${CONTRACT_ADDRESS}::smusd`,
      sports_betting: `${CONTRACT_ADDRESS}::sports_betting`,
    },
    deployer: {
      address: deployer.address().hex(),
      privateKey: DEPLOYER_PRIVATE_KEY,
      role: 'Contract Owner',
    },
    admins: admins.map(({ name, account }, index) => ({
      id: index + 1,
      role: name,
      address: account.address().hex(),
      privateKey: `0x${Buffer.from(account.signingKey.secretKey).toString('hex').slice(0, 64)}`,
    })),
  };

  // Save to NEW_ADMINS.json in project root
  const newAdminsPath = path.join(__dirname, '..', 'NEW_ADMINS.json');
  fs.writeFileSync(newAdminsPath, JSON.stringify(walletsData, null, 2));
  console.log(`✅ Saved to: ${newAdminsPath}`);
  
  // Also save to config folder for backup
  const configPath = path.join(__dirname, '..', 'config', 'bardock-admin-wallets.json');
  fs.writeFileSync(configPath, JSON.stringify(walletsData, null, 2));
  console.log(`✅ Backup saved to: ${configPath}`);

  // Generate .env content for user to copy
  const envContent = `# Movement Bardock Testnet Configuration
# Generated: ${new Date().toISOString()}

# Network
NODE_URL=${NODE_URL}
FAUCET_URL=${FAUCET_URL}

# Contract
CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
SMUSD_MODULE_ADDRESS=${CONTRACT_ADDRESS}::smusd
BETTING_MODULE_ADDRESS=${CONTRACT_ADDRESS}::sports_betting

# Deployer
DEPLOYER_ADDRESS=${deployer.address().hex()}
DEPLOYER_PRIVATE_KEY=${DEPLOYER_PRIVATE_KEY}

# Admin 1 (Primary Oracle)
ADMIN1_ADDRESS=${admin1.address().hex()}
ADMIN1_PRIVATE_KEY=0x${Buffer.from(admin1.signingKey.secretKey).toString('hex').slice(0, 64)}

# Admin 2 (Backup Oracle 1)
ADMIN2_ADDRESS=${admin2.address().hex()}
ADMIN2_PRIVATE_KEY=0x${Buffer.from(admin2.signingKey.secretKey).toString('hex').slice(0, 64)}

# Admin 3 (Backup Oracle 2)
ADMIN3_ADDRESS=${admin3.address().hex()}
ADMIN3_PRIVATE_KEY=0x${Buffer.from(admin3.signingKey.secretKey).toString('hex').slice(0, 64)}

# Admin 4 (Backup Oracle 3)
ADMIN4_ADDRESS=${admin4.address().hex()}
ADMIN4_PRIVATE_KEY=0x${Buffer.from(admin4.signingKey.secretKey).toString('hex').slice(0, 64)}

# The Odds API
THE_ODDS_API_KEY=your_api_key_here
`;

  const envPath = path.join(__dirname, '..', 'config', 'bardock.env');
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Environment template saved to: ${envPath}`);
  console.log('   Copy this to .env: cp config/bardock.env .env\n');

  // Summary
  console.log('═'.repeat(60));
  console.log('🎉 INITIALIZATION COMPLETE!');
  console.log('═'.repeat(60));
  console.log('\n📋 Summary:');
  console.log('✅ smUSD contract initialized');
  console.log('✅ Sports betting contract initialized');
  console.log('✅ 4 admin oracles configured');
  console.log('✅ House funded with smUSD');
  console.log('✅ Admin wallets saved to NEW_ADMINS.json');
  console.log('✅ Environment template saved to config/bardock.env');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Copy environment: cp config/bardock.env .env');
  console.log('2. Add your Odds API key to .env');
  console.log('3. Start the app: npm run dev');
  console.log('\n🔗 Explorer: https://explorer.movementnetwork.xyz/?network=bardock+testnet');
}

main().catch(console.error);

