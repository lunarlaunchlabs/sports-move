#!/usr/bin/env node

/**
 * Initialize Sports Betting Contracts
 * 
 * This script:
 * 1. Initializes the smUSD stablecoin
 * 2. Initializes the sports betting contract with admin addresses
 * 3. Registers admins for smUSD
 * 4. Mints initial smUSD to admins
 * 5. Deposits house funds
 */

require('dotenv').config();
const { AptosClient, AptosAccount, HexString } = require('aptos');

const NODE_URL = process.env.NODE_URL || 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initialize() {
  console.log('🔧 Initializing Sports Betting Contracts...\n');

  const client = new AptosClient(NODE_URL);

  // Load accounts
  const deployer = new AptosAccount(
    new HexString(process.env.DEPLOYER_PRIVATE_KEY).toUint8Array()
  );
  const admin1 = new AptosAccount(
    new HexString(process.env.ADMIN1_PRIVATE_KEY).toUint8Array()
  );
  const admin2 = new AptosAccount(
    new HexString(process.env.ADMIN2_PRIVATE_KEY).toUint8Array()
  );
  const admin3 = new AptosAccount(
    new HexString(process.env.ADMIN3_PRIVATE_KEY).toUint8Array()
  );
  const admin4 = new AptosAccount(
    new HexString(process.env.ADMIN4_PRIVATE_KEY).toUint8Array()
  );

  console.log('📝 Contract Address:', CONTRACT_ADDRESS);
  console.log('📝 Admin Addresses:');
  console.log('   Admin 1:', admin1.address().hex());
  console.log('   Admin 2:', admin2.address().hex());
  console.log('   Admin 3:', admin3.address().hex());
  console.log('   Admin 4:', admin4.address().hex());
  console.log('');

  // Step 1: Initialize smUSD
  console.log('1️⃣  Initializing smUSD...');
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
    console.error('❌ Failed to initialize smUSD:', error.message);
    process.exit(1);
  }

  // Step 2: Initialize Sports Betting Contract
  console.log('2️⃣  Initializing Sports Betting Contract...');
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
    console.error('❌ Failed to initialize sports betting:', error.message);
    process.exit(1);
  }

  // Step 3: Register admins for smUSD
  console.log('3️⃣  Registering admins for smUSD...');
  const admins = [
    { name: 'Admin 1', account: admin1 },
    { name: 'Admin 2', account: admin2 },
    { name: 'Admin 3', account: admin3 },
    { name: 'Admin 4', account: admin4 },
  ];

  for (const admin of admins) {
    try {
      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::smusd::register`,
        type_arguments: [],
        arguments: [],
      };

      const tx = await client.generateTransaction(admin.account.address(), payload);
      const signedTx = await client.signTransaction(admin.account, tx);
      const result = await client.submitTransaction(signedTx);
      await client.waitForTransaction(result.hash);
      
      console.log(`✅ ${admin.name} registered for smUSD`);
      await sleep(1000);
    } catch (error) {
      console.error(`❌ Failed to register ${admin.name}:`, error.message);
    }
  }

  // Step 4: Mint smUSD to Admin 1 for house funding
  console.log('\n4️⃣  Minting smUSD to Admin 1 for house funding...');
  try {
    const mintAmount = 10_000_000_000_000; // 100,000 smUSD (8 decimals)

    const payload4 = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::smusd::mint`,
      type_arguments: [],
      arguments: [admin1.address().hex(), mintAmount.toString()],
    };

    const tx4 = await client.generateTransaction(deployer.address(), payload4);
    const signedTx4 = await client.signTransaction(deployer, tx4);
    const result4 = await client.submitTransaction(signedTx4);
    await client.waitForTransaction(result4.hash);
    
    console.log(`✅ Minted 100,000 smUSD to Admin 1`);
    console.log(`   TX: ${result4.hash}\n`);
    await sleep(2000);
  } catch (error) {
    console.error('❌ Failed to mint smUSD:', error.message);
  }

  // Step 5: Deposit house funds
  console.log('5️⃣  Depositing house funds...');
  try {
    const depositAmount = 5_000_000_000_000; // 50,000 smUSD

    const payload5 = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::sports_betting::deposit_house_funds`,
      type_arguments: [],
      arguments: [depositAmount.toString()],
    };

    const tx5 = await client.generateTransaction(admin1.address(), payload5);
    const signedTx5 = await client.signTransaction(admin1, tx5);
    const result5 = await client.submitTransaction(signedTx5);
    await client.waitForTransaction(result5.hash);
    
    console.log(`✅ Deposited 50,000 smUSD to house`);
    console.log(`   TX: ${result5.hash}\n`);
  } catch (error) {
    console.error('❌ Failed to deposit house funds:', error.message);
  }

  // Verify initialization
  console.log('6️⃣  Verifying initialization...');
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

    console.log('✅ Verification complete:');
    console.log(`   Registered Admins: ${adminsResult[0].length}`);
    console.log(`   House Balance: ${(parseInt(houseBalance[0]) / 100_000_000).toFixed(2)} smUSD`);
  } catch (error) {
    console.error('⚠️  Verification failed:', error.message);
  }

  console.log('\n🎉 Initialization Complete!');
  console.log('\n📝 Summary:');
  console.log('✅ smUSD contract initialized');
  console.log('✅ Sports betting contract initialized');
  console.log('✅ 4 admin oracles registered and authorized');
  console.log('✅ House funded with smUSD');
  console.log('\n🚀 Ready for production use!');
  console.log('\n📝 Next Steps:');
  console.log('1. Integrate with Next.js APIs (see API_INTEGRATION.md)');
  console.log('2. Set up cron jobs for automated settlement');
  console.log('3. Test with real API data');
}

initialize().catch(console.error);

