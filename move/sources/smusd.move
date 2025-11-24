module sports_betting::smusd {
    use std::signer;
    use std::string::{Self, String};
    use std::option;
    use aptos_framework::coin::{Self, MintCapability, BurnCapability, FreezeCapability};

    /// Error codes
    const EALREADY_INITIALIZED: u64 = 1;
    const ENOT_AUTHORIZED: u64 = 2;

    /// Capabilities for managing the smUSD coin
    struct Capabilities has key {
        mint_cap: MintCapability<SMUSD>,
        burn_cap: BurnCapability<SMUSD>,
        freeze_cap: FreezeCapability<SMUSD>,
    }

    /// The smUSD coin type
    struct SMUSD {}

    /// Initialize the smUSD stablecoin
    /// This should be called once by the module publisher
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        // Ensure not already initialized
        assert!(!exists<Capabilities>(account_addr), EALREADY_INITIALIZED);

        // Initialize the coin with metadata
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<SMUSD>(
            account,
            string::utf8(b"Sports Move USD"),
            string::utf8(b"smUSD"),
            8, // decimals
            true, // monitor_supply
        );

        // Store capabilities
        move_to(account, Capabilities {
            mint_cap,
            burn_cap,
            freeze_cap,
        });
    }

    /// Mint smUSD to any address (unlimited minting capability)
    public entry fun mint(to: address, amount: u64) acquires Capabilities {
        let capabilities = borrow_global<Capabilities>(@sports_betting);

        // Mint coins and deposit directly
        let coins = coin::mint(amount, &capabilities.mint_cap);
        coin::deposit(to, coins);
    }

    /// Register the caller's account to receive smUSD
    public entry fun register(account: &signer) {
        if (!coin::is_account_registered<SMUSD>(signer::address_of(account))) {
            coin::register<SMUSD>(account);
        };
    }

    /// Transfer smUSD from one account to another
    public entry fun transfer(from: &signer, to: address, amount: u64) {
        coin::transfer<SMUSD>(from, to, amount);
    }

    /// Burn smUSD from an account
    public entry fun burn(account: &signer, amount: u64) acquires Capabilities {
        let capabilities = borrow_global<Capabilities>(@sports_betting);
        let coins = coin::withdraw<SMUSD>(account, amount);
        coin::burn(coins, &capabilities.burn_cap);
    }

    /// Public function to withdraw coins (for use by other contracts)
    public fun withdraw(account: &signer, amount: u64): coin::Coin<SMUSD> {
        coin::withdraw<SMUSD>(account, amount)
    }

    /// Public function to deposit coins (for use by other contracts)
    public fun deposit(addr: address, coins: coin::Coin<SMUSD>) {
        coin::deposit(addr, coins);
    }

    /// View function: Get balance of an address
    #[view]
    public fun balance_of(addr: address): u64 {
        coin::balance<SMUSD>(addr)
    }

    /// View function: Check if account is registered
    #[view]
    public fun is_registered(addr: address): bool {
        coin::is_account_registered<SMUSD>(addr)
    }

    /// View function: Get total supply
    #[view]
    public fun total_supply(): u128 {
        let supply_option = coin::supply<SMUSD>();
        if (option::is_some(&supply_option)) {
            *option::borrow(&supply_option)
        } else {
            0u128
        }
    }

    /// View function: Get coin info
    #[view]
    public fun get_coin_info(): (String, String, u8) {
        (
            string::utf8(b"Sports Move USD"),
            string::utf8(b"smUSD"),
            8
        )
    }

    #[test_only]
    use aptos_framework::account;
    
    #[test_only]
    public fun initialize_for_test(account: &signer) {
        initialize(account);
    }

    #[test_only]
    public fun mint_for_test(to: address, amount: u64) acquires Capabilities {
        mint(to, amount);
    }
}

