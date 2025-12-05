'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { NightlyWallet } from '@nightlylabs/aptos-wallet-adapter-plugin';
import { PropsWithChildren } from 'react';
import { NetworkName } from '@aptos-labs/wallet-adapter-core';

// Initialize Nightly wallet plugin
const wallets = [new NightlyWallet()];

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      dappConfig={{
        network: NetworkName.Testnet,
      }}
      onError={(error) => {
        console.error('Wallet error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}

