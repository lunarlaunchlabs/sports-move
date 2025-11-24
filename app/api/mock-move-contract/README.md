# Mock Move Contract API

API endpoints for interacting with the Movement Network smart contract.

## Endpoints

### GET `/api/mock-move-contract`

Read data from the Movement smart contract.

#### Query Parameters

- `address` (required): The account address to read data from
- `field` (optional): Specific field to read (`message`, `value`, or `isActive`)

#### Examples

**Get all data:**
```bash
curl "http://localhost:3000/api/mock-move-contract?address=0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c"
```

Response:
```json
{
  "address": "0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c",
  "data": {
    "message": "Hello, Blockchain!",
    "value": 42,
    "isActive": true
  },
  "initialized": true
}
```

**Get specific field:**
```bash
curl "http://localhost:3000/api/mock-move-contract?address=0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c&field=message"
```

Response:
```json
{
  "address": "0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c",
  "field": "message",
  "value": "Hello, Blockchain!"
}
```

#### Error Responses

**Missing address:**
```json
{
  "error": "Missing required parameter: address"
}
```

**Data store not initialized:**
```json
{
  "error": "Data store not initialized for this address",
  "address": "0x...",
  "initialized": false
}
```

---

### POST `/api/mock-move-contract`

Write data to the Movement smart contract.

#### Request Body

```json
{
  "privateKey": "0x...",  // Private key of the account (hex string with 0x prefix)
  "message": "Hello",     // Message to store
  "value": 42            // Numeric value to store (non-negative number)
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/mock-move-contract \
  -H "Content-Type: application/json" \
  -d '{
    "privateKey": "0xYOUR_PRIVATE_KEY_HERE",
    "message": "Hello from API",
    "value": 100
  }'
```

Response:
```json
{
  "success": true,
  "transactionHash": "0xabc123...",
  "address": "0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c",
  "data": {
    "message": "Hello from API",
    "value": 100,
    "isActive": true
  },
  "explorerUrl": "https://explorer.movementnetwork.xyz/txn/0xabc123...?network=testnet"
}
```

#### Error Responses

**Missing required fields:**
```json
{
  "error": "Missing required field: privateKey"
}
```

**Invalid value:**
```json
{
  "error": "Value must be a non-negative number"
}
```

---

## Testing Flow

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Write Data to Contract (POST)

First, write some data to the contract using your private key from `.movement/config.yaml`:

```bash
curl -X POST http://localhost:3000/api/mock-move-contract \
  -H "Content-Type: application/json" \
  -d '{
    "privateKey": "0xYOUR_PRIVATE_KEY",
    "message": "Test Message",
    "value": 42
  }'
```

Note the `address` and `transactionHash` in the response.

### 3. Read Data from Contract (GET)

Then, read the data back using the address:

```bash
curl "http://localhost:3000/api/mock-move-contract?address=YOUR_ADDRESS"
```

You should see the same data you just wrote!

---

## Integration with Frontend

### Using Fetch API

```typescript
// Write data to contract
async function writeToContract(privateKey: string, message: string, value: number) {
  const response = await fetch('/api/mock-move-contract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      privateKey,
      message,
      value
    })
  });
  
  const result = await response.json();
  console.log('Transaction Hash:', result.transactionHash);
  console.log('Explorer URL:', result.explorerUrl);
  return result;
}

// Read data from contract
async function readFromContract(address: string) {
  const response = await fetch(`/api/mock-move-contract?address=${address}`);
  const result = await response.json();
  console.log('Contract Data:', result.data);
  return result;
}

// Read specific field
async function readField(address: string, field: 'message' | 'value' | 'isActive') {
  const response = await fetch(`/api/mock-move-contract?address=${address}&field=${field}`);
  const result = await response.json();
  console.log(`${field}:`, result.value);
  return result;
}
```

### Using in React Component

```tsx
'use client';

import { useState } from 'react';

export default function ContractInteraction() {
  const [message, setMessage] = useState('');
  const [value, setValue] = useState(0);
  const [address, setAddress] = useState('');
  const [contractData, setContractData] = useState(null);

  const writeData = async () => {
    const response = await fetch('/api/mock-move-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privateKey: process.env.NEXT_PUBLIC_PRIVATE_KEY,
        message,
        value
      })
    });
    const result = await response.json();
    console.log('Written:', result);
    setAddress(result.address);
  };

  const readData = async () => {
    const response = await fetch(`/api/mock-move-contract?address=${address}`);
    const result = await response.json();
    setContractData(result.data);
  };

  return (
    <div>
      <h2>Write to Contract</h2>
      <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
      <input value={value} onChange={(e) => setValue(Number(e.target.value))} placeholder="Value" />
      <button onClick={writeData}>Write Data</button>

      <h2>Read from Contract</h2>
      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
      <button onClick={readData}>Read Data</button>
      {contractData && <pre>{JSON.stringify(contractData, null, 2)}</pre>}
    </div>
  );
}
```

---

## Security Notes

⚠️ **Important:**
- Never expose private keys in client-side code
- Store private keys in environment variables on the server
- Use `.env.local` for development
- Add `.env.local` to `.gitignore`

Example `.env.local`:
```
MOVEMENT_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

Then modify the POST endpoint to use:
```typescript
const privateKey = process.env.MOVEMENT_PRIVATE_KEY;
```

---

## Troubleshooting

### "Data store not initialized"
- You need to write data first (POST) before you can read it (GET)
- The contract automatically initializes the data store on the first write

### "Failed to write contract data"
- Make sure your account has testnet tokens from the faucet
- Verify your private key is correct
- Check the Movement testnet is operational

### Transaction not found
- Wait a few seconds for the transaction to be confirmed
- Check the explorer URL provided in the response
- Ensure you're connected to the correct network

---

## Resources

- [Movement Network Documentation](https://docs.movementnetwork.xyz/)
- [Movement Testnet Explorer](https://explorer.movementnetwork.xyz/?network=bardock+testnet)
- [Movement Faucet](https://faucet.testnet.movementnetwork.xyz/)

