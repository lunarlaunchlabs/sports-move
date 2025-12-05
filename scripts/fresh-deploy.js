#!/usr/bin/env node

/**
 * Fresh Contract Deployment Script
 * 
 * Creates a brand new deployment with:
 * - New deployer address
 * - New admin wallets
 * - Fresh contract state (no markets)
 */

const { AptosClient, AptosAccount, HexString, FaucetClient } = require('aptos');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Movement Testnet Configuration
const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const FAUCET_URL = 'https://faucet.testnet.movementnetwork.xyz';

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
  console.log('🚀 Fresh Contract Deployment\n');
  console.log('📍 Network: Movement Testnet');
  console.log(`📍 RPC: ${NODE_URL}\n`);

  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  // Step 1: Generate NEW deployer account
  console.log('1️⃣  Generating NEW Deployer Account...');
  const deployer = new AptosAccount();
  const deployerAddress = deployer.address().hex();
  const deployerPrivateKey = `0x${Buffer.from(deployer.signingKey.secretKey).toString('hex').slice(0, 64)}`;
  
  console.log(`   Address: ${deployerAddress}`);
  console.log(`   Private Key: ${deployerPrivateKey}\n`);

  // Step 2: Fund deployer
  console.log('2️⃣  Funding Deployer Account...');
  // Fund multiple times to ensure enough for deployment
  for (let i = 0; i < 5; i++) {
    process.stdout.write(`   Funding attempt ${i + 1}/5... `);
    const success = await fundAccount(faucetClient, deployerAddress);
    console.log(success ? '✅' : '❌');
    await sleep(1000);
  }
  console.log('');

  // Step 3: Generate admin accounts
  console.log('3️⃣  Generating Admin Wallets...');
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

  console.log('   Generated Admin Addresses:');
  admins.forEach(({ name, account }) => {
    console.log(`   ${name}: ${account.address().hex()}`);
  });
  console.log('');

  // Step 4: Fund admin accounts
  console.log('4️⃣  Funding Admin Accounts...');
  for (const { name, account } of admins) {
    process.stdout.write(`   Funding ${name}... `);
    const success = await fundAccount(faucetClient, account.address().hex());
    console.log(success ? '✅' : '❌');
    await sleep(1000);
  }
  console.log('');

  // Step 5: Update Move.toml with new address
  console.log('5️⃣  Updating Move.toml...');
  const moveTomlPath = path.join(__dirname, '..', 'move', 'Move.toml');
  let moveToml = fs.readFileSync(moveTomlPath, 'utf8');
  moveToml = moveToml.replace(
    /sports_betting = "0x[a-fA-F0-9]+"/,
    `sports_betting = "${deployerAddress}"`
  );
  fs.writeFileSync(moveTomlPath, moveToml);
  console.log('   ✅ Move.toml updated\n');

  // Step 6: Compile and deploy
  console.log('6️⃣  Compiling and Deploying Contract...');
  console.log('   This may take a minute...\n');
  
  try {
    const movementCli = path.join(__dirname, '..', 'movement-cli');
    const moveDir = path.join(__dirname, '..', 'move');
    
    // Clean build
    execSync(`rm -rf ${moveDir}/build`, { stdio: 'pipe' });
    
    // Deploy
    const deployCmd = `cd ${moveDir} && ${movementCli} move publish \
      --private-key ${deployerPrivateKey} \
      --named-addresses sports_betting=${deployerAddress} \
      --assume-yes \
      --max-gas 500000 \
      --gas-unit-price 100`;
    
    const result = execSync(deployCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    console.log(result);
    console.log('   ✅ Contract deployed!\n');
  } catch (error) {
    console.error('   ❌ Deployment failed:', error.message);
    console.log('\n   Saving generated accounts anyway...\n');
  }

  await sleep(3000);

  // Step 7: Initialize smUSD
  console.log('7️⃣  Initializing smUSD...');
  try {
    const payload1 = {
      type: 'entry_function_payload',
      function: `${deployerAddress}::smusd::initialize`,
      type_arguments: [],
      arguments: [],
    };

    const tx1 = await client.generateTransaction(deployer.address(), payload1);
    const signedTx1 = await client.signTransaction(deployer, tx1);
    const result1 = await client.submitTransaction(signedTx1);
    await client.waitForTransaction(result1.hash);
    console.log(`   ✅ smUSD initialized - TX: ${result1.hash}\n`);
    await sleep(2000);
  } catch (error) {
    console.error('   ❌ Failed:', error.message, '\n');
  }

  // Step 8: Initialize Sports Betting
  console.log('8️⃣  Initializing Sports Betting...');
  try {
    const payload2 = {
      type: 'entry_function_payload',
      function: `${deployerAddress}::sports_betting::initialize`,
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
    console.log(`   ✅ Sports Betting initialized - TX: ${result2.hash}\n`);
    await sleep(2000);
  } catch (error) {
    console.error('   ❌ Failed:', error.message, '\n');
  }

  // Step 9: Register deployer for smUSD
  console.log('9️⃣  Registering Deployer for smUSD...');
  try {
    const payload3 = {
      type: 'entry_function_payload',
      function: `${deployerAddress}::smusd::register`,
      type_arguments: [],
      arguments: [],
    };

    const tx3 = await client.generateTransaction(deployer.address(), payload3);
    const signedTx3 = await client.signTransaction(deployer, tx3);
    const result3 = await client.submitTransaction(signedTx3);
    await client.waitForTransaction(result3.hash);
    console.log('   ✅ Deployer registered\n');
    await sleep(1000);
  } catch (error) {
    console.error('   ❌ Failed:', error.message, '\n');
  }

  // Step 10: Register admins for smUSD
  console.log('🔟  Registering Admins for smUSD...');
  for (const { name, account } of admins) {
    try {
      const payload = {
        type: 'entry_function_payload',
        function: `${deployerAddress}::smusd::register`,
        type_arguments: [],
        arguments: [],
      };

      const tx = await client.generateTransaction(account.address(), payload);
      const signedTx = await client.signTransaction(account, tx);
      const result = await client.submitTransaction(signedTx);
      await client.waitForTransaction(result.hash);
      console.log(`   ✅ ${name} registered`);
      await sleep(1000);
    } catch (error) {
      console.log(`   ⚠️  ${name} registration failed`);
    }
  }
  console.log('');

  // Step 11: Mint smUSD
  console.log('1️⃣1️⃣  Minting smUSD...');
  try {
    const mintAmount = 1_500_000_000_000_000; // 15,000,000 smUSD

    const payload4 = {
      type: 'entry_function_payload',
      function: `${deployerAddress}::smusd::mint`,
      type_arguments: [],
      arguments: [deployer.address().hex(), mintAmount.toString()],
    };

    const tx4 = await client.generateTransaction(deployer.address(), payload4);
    const signedTx4 = await client.signTransaction(deployer, tx4);
    const result4 = await client.submitTransaction(signedTx4);
    await client.waitForTransaction(result4.hash);
    console.log(`   ✅ Minted 15,000,000 smUSD - TX: ${result4.hash}\n`);
    await sleep(2000);
  } catch (error) {
    console.error('   ❌ Failed:', error.message, '\n');
  }

  // Step 12: Deposit house funds
  console.log('1️⃣2️⃣  Depositing House Funds...');
  try {
    const depositAmount = 1_000_000_000_000_000; // 10,000,000 smUSD

    const payload5 = {
      type: 'entry_function_payload',
      function: `${deployerAddress}::sports_betting::deposit_house_funds`,
      type_arguments: [],
      arguments: [depositAmount.toString()],
    };

    const tx5 = await client.generateTransaction(deployer.address(), payload5);
    const signedTx5 = await client.signTransaction(deployer, tx5);
    const result5 = await client.submitTransaction(signedTx5);
    await client.waitForTransaction(result5.hash);
    console.log(`   ✅ Deposited 10,000,000 smUSD - TX: ${result5.hash}\n`);
  } catch (error) {
    console.error('   ❌ Failed:', error.message, '\n');
  }

  // Step 13: Verify
  console.log('1️⃣3️⃣  Verifying...');
  try {
    const adminsResult = await client.view({
      function: `${deployerAddress}::sports_betting::get_admins`,
      type_arguments: [],
      arguments: [],
    });

    const houseBalance = await client.view({
      function: `${deployerAddress}::sports_betting::get_house_balance`,
      type_arguments: [],
      arguments: [],
    });

    const markets = await client.view({
      function: `${deployerAddress}::sports_betting::get_markets`,
      type_arguments: [],
      arguments: [],
    });

    console.log('   ✅ Verification Results:');
    console.log(`      Owner: ${deployerAddress}`);
    console.log(`      Admins: ${adminsResult[0].length}`);
    console.log(`      House Balance: ${(parseInt(houseBalance[0]) / 100_000_000).toFixed(2)} smUSD`);
    console.log(`      Markets: ${markets[0].length} (should be 0)`);
  } catch (error) {
    console.error('   ⚠️  Verification failed:', error.message);
  }

  // Save configuration
  console.log('\n📁 Saving Configuration...');
  
  const config = {
    generated: new Date().toISOString(),
    network: 'movement-testnet',
    chain_id: 250,
    rpc_url: NODE_URL,
    faucet_url: FAUCET_URL,
    explorer_url: 'https://explorer.movementnetwork.xyz/?network=bardock+testnet',
    contract_address: deployerAddress,
    modules: {
      smusd: `${deployerAddress}::smusd`,
      sports_betting: `${deployerAddress}::sports_betting`,
    },
    deployer: {
      address: deployerAddress,
      privateKey: deployerPrivateKey,
      role: 'Contract Owner',
    },
    admins: admins.map(({ name, account }, index) => ({
      id: index + 1,
      role: name,
      address: account.address().hex(),
      privateKey: `0x${Buffer.from(account.signingKey.secretKey).toString('hex').slice(0, 64)}`,
    })),
  };

  // Save to FRESH_DEPLOYMENT.json
  const configPath = path.join(__dirname, '..', 'FRESH_DEPLOYMENT.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`   ✅ Saved to: ${configPath}`);

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 FRESH DEPLOYMENT COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`\n📋 NEW Contract Address: ${deployerAddress}`);
  console.log('\n⚠️  IMPORTANT: Update these files with the new address:');
  console.log('   - app/page.tsx');
  console.log('   - app/services/SportsBettingContract.ts');
  console.log('   - app/api/get-user-bets/route.ts');
  console.log('\n📝 Admin 1 Private Key (for backend):');
  console.log(`   ${config.admins[0].privateKey}`);
}

main().catch(console.error);

