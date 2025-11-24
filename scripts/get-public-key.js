#!/usr/bin/env node

const { AptosAccount, HexString } = require('aptos');

const privateKeyHex = process.argv[2] || process.env.DEPLOYER_PRIVATE_KEY;

if (!privateKeyHex) {
  console.error('Usage: node get-public-key.js <private_key>');
  process.exit(1);
}

const privateKeyBytes = new HexString(privateKeyHex).toUint8Array();
const account = new AptosAccount(privateKeyBytes);
const publicKey = account.pubKey().hex();

console.log(`ed25519-pub-${publicKey}`);

