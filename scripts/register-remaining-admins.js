#!/usr/bin/env node

require('dotenv').config();
const { AptosClient, AptosAccount, HexString } = require('aptos');

const NODE_URL = process.env.NODE_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔧 Registering remaining admins for smUSD...\n');

  const client = new AptosClient(NODE_URL);

  const admin3 = new AptosAccount(new HexString(process.env.ADMIN3_PRIVATE_KEY).toUint8Array());
  const admin4 = new AptosAccount(new HexString(process.env.ADMIN4_PRIVATE_KEY).toUint8Array());

  console.log('3️⃣ Registering Admin 3 for smUSD...');
  try {
    const payload3 = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::smusd::register`,
      type_arguments: [],
      arguments: [],
    };
    const txn3 = await client.generateTransaction(admin3.address(), payload3);
    const signedTxn3 = await client.signTransaction(admin3, txn3);
    const result3 = await client.submitTransaction(signedTxn3);
    await client.waitForTransaction(result3.hash);
    console.log('✅ Admin 3 registered for smUSD');
    console.log(`   TX: ${result3.hash}\n`);
  } catch (error) {
    console.error('❌ Failed to register Admin 3:', error.message);
  }

  await sleep(1000);

  console.log('4️⃣ Registering Admin 4 for smUSD...');
  try {
    const payload4 = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::smusd::register`,
      type_arguments: [],
      arguments: [],
    };
    const txn4 = await client.generateTransaction(admin4.address(), payload4);
    const signedTxn4 = await client.signTransaction(admin4, txn4);
    const result4 = await client.submitTransaction(signedTxn4);
    await client.waitForTransaction(result4.hash);
    console.log('✅ Admin 4 registered for smUSD');
    console.log(`   TX: ${result4.hash}\n`);
  } catch (error) {
    console.error('❌ Failed to register Admin 4:', error.message);
  }

  console.log('🎉 All admins now registered for smUSD!');
}

main().catch(console.error);

