#[test_only]
module sports_betting::smusd_tests {
    use std::signer;
    use aptos_framework::coin;
    use sports_betting::smusd::{Self, SMUSD};

    #[test(deployer = @sports_betting)]
    public fun test_initialize(deployer: &signer) {
        // Initialize the smUSD coin
        smusd::initialize_for_test(deployer);

        // Verify coin info
        let (name, symbol, decimals) = smusd::get_coin_info();
        assert!(name == std::string::utf8(b"Sports Move USD"), 0);
        assert!(symbol == std::string::utf8(b"smUSD"), 1);
        assert!(decimals == 8, 2);
    }

    #[test(deployer = @sports_betting, user = @0x123)]
    public fun test_mint_and_balance(deployer: &signer, user: &signer) {
        // Initialize
        smusd::initialize_for_test(deployer);
        
        let user_addr = signer::address_of(user);
        
        // Register user account
        smusd::register(user);
        
        // Mint tokens to user
        smusd::mint_for_test(user_addr, 1000000000); // 10 smUSD (with 8 decimals)
        
        // Check balance
        let balance = smusd::balance_of(user_addr);
        assert!(balance == 1000000000, 0);
    }

    #[test(deployer = @sports_betting, user1 = @0x123, user2 = @0x456)]
    public fun test_transfer(deployer: &signer, user1: &signer, user2: &signer) {
        // Initialize
        smusd::initialize_for_test(deployer);
        
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        
        // Register accounts
        smusd::register(user1);
        smusd::register(user2);
        
        // Mint to user1
        smusd::mint_for_test(user1_addr, 1000000000);
        
        // Transfer from user1 to user2
        smusd::transfer(user1, user2_addr, 300000000);
        
        // Check balances
        assert!(smusd::balance_of(user1_addr) == 700000000, 0);
        assert!(smusd::balance_of(user2_addr) == 300000000, 1);
    }

    #[test(deployer = @sports_betting, user = @0x123)]
    public fun test_burn(deployer: &signer, user: &signer) {
        // Initialize
        smusd::initialize_for_test(deployer);
        
        let user_addr = signer::address_of(user);
        
        // Register and mint
        smusd::register(user);
        smusd::mint_for_test(user_addr, 1000000000);
        
        // Burn some tokens
        smusd::burn(user, 300000000);
        
        // Check balance
        assert!(smusd::balance_of(user_addr) == 700000000, 0);
    }

    #[test(deployer = @sports_betting)]
    public fun test_is_registered(deployer: &signer) {
        // Initialize
        smusd::initialize_for_test(deployer);
        
        let test_addr = @0x789;
        
        // Should not be registered initially
        assert!(!smusd::is_registered(test_addr), 0);
    }
}

