# Mock Move - Hello World Contract

A Move smart contract for the Movement Network that demonstrates data storage and retrieval for frontend/backend integration.

## 📋 Overview

This contract provides a simple data store that can:
- **Store data** on-chain (message strings, numeric values, and status flags)
- **Read data** from the frontend using view functions
- **Update data** from the backend using entry functions
- **Emit events** when data changes

## 🏗️ Project Structure

```
mock-move/
├── Move.toml                    # Project configuration
├── sources/
│   └── hello_world.move        # Main contract module
├── scripts/                     # Transaction scripts (optional)
└── tests/                       # Unit tests (included in module)
```

## 📦 Contract Details

### Account Address
```
0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c
```

### Module Name
```
mock_move::hello_world
```

## 🔧 Data Structures

### `DataStore` Resource
Stores user data on-chain:
```move
struct DataStore has key {
    message: String,           // Text data
    value: u64,               // Numeric data
    is_active: bool,          // Status flag
    data_change_events: EventHandle<DataChangeEvent>
}
```

### `DataChangeEvent`
Emitted when data is updated:
```move
struct DataChangeEvent has drop, store {
    old_message: String,
    new_message: String,
    old_value: u64,
    new_value: u64,
    timestamp: u64
}
```

## 📖 View Functions (Frontend - Read Data)

These functions can be called from your frontend to read on-chain data:

### 1. `get_message(addr: address): String`
Get the stored message for an account.

### 2. `get_value(addr: address): u64`
Get the stored numeric value for an account.

### 3. `is_active(addr: address): bool`
Check if the data store is active.

### 4. `has_data_store(addr: address): bool`
Check if an account has initialized their data store.

### 5. `get_all_data(addr: address): (String, u64, bool)`
Get all data at once (message, value, is_active).

### 6. `get_contract_address(): address`
Get the contract's address.

## ✍️ Entry Functions (Backend - Write Data)

These functions can be called from your backend to modify on-chain data:

### 1. `initialize(account: signer, message: String, value: u64)`
Initialize a new data store for an account. Must be called first.

**Example:**
```bash
movement move run \
  --function-id '0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c::hello_world::initialize' \
  --args 'string:Hello World' 'u64:100'
```

### 2. `update_message(account: signer, new_message: String)`
Update only the message field.

### 3. `update_value(account: signer, new_value: u64)`
Update only the numeric value field.

### 4. `update_data(account: signer, new_message: String, new_value: u64)`
Update both message and value at once.

### 5. `toggle_active(account: signer)`
Toggle the active status flag.

## 🚀 Usage

### Compile the Contract
```bash
cd mock-move
movement move compile
```

### Run Tests
```bash
movement move test
```

Expected output:
```
Test result: OK. Total tests: 5; passed: 5; failed: 0
```

### Publish to Testnet
```bash
movement move publish
```

Or with optimized package size:
```bash
movement move publish --included-artifacts none
```

## 🔗 Integration Examples

### Frontend Integration (TypeScript/JavaScript)

Using the Movement/Aptos TypeScript SDK:

```typescript
import { AptosClient } from 'aptos';

const client = new AptosClient('https://testnet.movementnetwork.xyz/v1');
const moduleAddress = '0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c';

// Read message from contract
async function getMessage(userAddress: string) {
  const resource = await client.view({
    function: `${moduleAddress}::hello_world::get_message`,
    type_arguments: [],
    arguments: [userAddress]
  });
  return resource[0];
}

// Read all data at once
async function getAllData(userAddress: string) {
  const [message, value, isActive] = await client.view({
    function: `${moduleAddress}::hello_world::get_all_data`,
    type_arguments: [],
    arguments: [userAddress]
  });
  return { message, value, isActive };
}
```

### Backend Integration (Node.js)

```typescript
import { AptosAccount, AptosClient, TxnBuilderTypes, BCS } from 'aptos';

const client = new AptosClient('https://testnet.movementnetwork.xyz/v1');
const account = new AptosAccount(privateKeyBytes);

// Initialize data store
async function initialize(message: string, value: number) {
  const payload = {
    function: `${moduleAddress}::hello_world::initialize`,
    type_arguments: [],
    arguments: [message, value]
  };
  
  const txn = await client.generateTransaction(account.address(), payload);
  const signedTxn = await client.signTransaction(account, txn);
  const result = await client.submitTransaction(signedTxn);
  await client.waitForTransaction(result.hash);
  
  return result;
}

// Update data
async function updateData(message: string, value: number) {
  const payload = {
    function: `${moduleAddress}::hello_world::update_data`,
    type_arguments: [],
    arguments: [message, value]
  };
  
  const txn = await client.generateTransaction(account.address(), payload);
  const signedTxn = await client.signTransaction(account, txn);
  const result = await client.submitTransaction(signedTxn);
  await client.waitForTransaction(result.hash);
  
  return result;
}
```

## 🧪 Testing

The contract includes 5 unit tests:
1. `test_initialize` - Tests initialization
2. `test_update_data` - Tests data updates
3. `test_has_data_store` - Tests data store existence
4. `test_get_all_data` - Tests reading all data
5. `test_contract_address` - Tests contract address retrieval

## 📚 Resources

- [Movement Network Documentation](https://docs.movementnetwork.xyz/)
- [Movement CLI Guide](https://docs.movementnetwork.xyz/devs/movementcli)
- [First Move Contract Tutorial](https://docs.movementnetwork.xyz/devs/firstMoveContract)
- [Movement Testnet Explorer](https://explorer.movementnetwork.xyz/?network=bardock+testnet)
- [Movement Faucet](https://faucet.testnet.movementnetwork.xyz/)

## 🔑 Configuration

Your account configuration is stored in `.movement/config.yaml`:
```yaml
profiles:
  default:
    network: Custom
    account: "0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c"
    rest_url: "https://testnet.movementnetwork.xyz/v1"
    faucet_url: "https://faucet.testnet.movementnetwork.xyz/"
```

⚠️ **Warning:** Never commit `.movement/config.yaml` to version control as it contains your private key!

## 💡 Next Steps

1. **Fund your account** using the [Movement Faucet](https://faucet.testnet.movementnetwork.xyz/)
2. **Publish the contract** to Movement testnet
3. **Integrate with your frontend** using the TypeScript SDK
4. **Connect your backend** to write data to the contract
5. **Listen to events** for real-time updates

## 📄 License

MIT

