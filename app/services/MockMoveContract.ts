import { AptosClient, AptosAccount, TxnBuilderTypes, BCS, HexString } from 'aptos';

// Contract configuration
const MODULE_ADDRESS = '0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c';
const MODULE_NAME = 'hello_world';
const MOVEMENT_TESTNET_URL = 'https://testnet.movementnetwork.xyz/v1';

// Initialize Aptos client for Movement Network
const client = new AptosClient(MOVEMENT_TESTNET_URL);

export interface ContractData {
  message: string;
  value: number;
  isActive: boolean;
}

export class MockMoveContract {
  /**
   * Read data from the smart contract
   * @param accountAddress - The address to read data from
   * @returns ContractData object with message, value, and isActive
   */
  static async getData(accountAddress: string): Promise<ContractData | null> {
    try {
      // Check if account has data store initialized
      const hasDataStore = await client.view({
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::has_data_store`,
        type_arguments: [],
        arguments: [accountAddress]
      });

      if (!hasDataStore[0]) {
        return null;
      }

      // Get all data at once using the get_all_data view function
      const result = await client.view({
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_all_data`,
        type_arguments: [],
        arguments: [accountAddress]
      });

      return {
        message: result[0] as string,
        value: Number(result[1]),
        isActive: result[2] as boolean
      };
    } catch (error) {
      console.error('Error reading from contract:', error);
      throw new Error(`Failed to read contract data: ${error}`);
    }
  }

  /**
   * Write data to the smart contract
   * @param privateKey - The private key of the account (hex string with 0x prefix)
   * @param message - The message to store
   * @param value - The numeric value to store
   * @returns Transaction hash
   */
  static async setData(
    privateKey: string,
    message: string,
    value: number
  ): Promise<string> {
    try {
      // Create account from private key
      const privateKeyBytes = new HexString(privateKey).toUint8Array();
      const account = new AptosAccount(privateKeyBytes);
      const accountAddress = account.address().hex();

      // Check if account has data store initialized
      const hasDataStore = await client.view({
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::has_data_store`,
        type_arguments: [],
        arguments: [accountAddress]
      });

      let payload;
      
      if (!hasDataStore[0]) {
        // Initialize the data store if it doesn't exist
        payload = {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::initialize`,
          type_arguments: [],
          arguments: [message, value.toString()]
        };
      } else {
        // Update existing data
        payload = {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::update_data`,
          type_arguments: [],
          arguments: [message, value.toString()]
        };
      }

      // Generate and sign transaction
      const txnRequest = await client.generateTransaction(
        account.address(),
        payload
      );
      
      const signedTxn = await client.signTransaction(account, txnRequest);
      const transactionRes = await client.submitTransaction(signedTxn);
      
      // Wait for transaction to complete
      await client.waitForTransaction(transactionRes.hash);

      return transactionRes.hash;
    } catch (error) {
      console.error('Error writing to contract:', error);
      throw new Error(`Failed to write contract data: ${error}`);
    }
  }

  /**
   * Get individual field from the contract
   * @param accountAddress - The address to read from
   * @param field - The field to read ('message', 'value', or 'isActive')
   */
  static async getField(
    accountAddress: string,
    field: 'message' | 'value' | 'isActive'
  ): Promise<string | number | boolean> {
    try {
      let functionName: string;
      
      switch (field) {
        case 'message':
          functionName = 'get_message';
          break;
        case 'value':
          functionName = 'get_value';
          break;
        case 'isActive':
          functionName = 'is_active';
          break;
        default:
          throw new Error(`Unknown field: ${field}`);
      }

      const result = await client.view({
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::${functionName}`,
        type_arguments: [],
        arguments: [accountAddress]
      });

      return field === 'value' ? Number(result[0]) : result[0] as string | boolean;
    } catch (error) {
      console.error(`Error reading ${field} from contract:`, error);
      throw new Error(`Failed to read ${field}: ${error}`);
    }
  }

  /**
   * Get the contract module address
   */
  static getContractAddress(): string {
    return MODULE_ADDRESS;
  }

  /**
   * Check if an account has initialized their data store
   */
  static async hasDataStore(accountAddress: string): Promise<boolean> {
    try {
      const result = await client.view({
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::has_data_store`,
        type_arguments: [],
        arguments: [accountAddress]
      });
      return result[0] as boolean;
    } catch (error) {
      console.error('Error checking data store:', error);
      return false;
    }
  }
}

