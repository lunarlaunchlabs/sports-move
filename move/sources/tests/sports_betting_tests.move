#[test_only]
module sports_betting::sports_betting_tests {
    use std::signer;
    use std::string;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use sports_betting::smusd;
    use sports_betting::sports_betting;

    // Test helper to setup the environment
    fun setup_test(
        deployer: &signer,
        admin1: address,
        admin2: address,
        admin3: address,
        admin4: address
    ) {
        // Create accounts for testing
        account::create_account_for_test(signer::address_of(deployer));
        account::create_account_for_test(admin1);
        account::create_account_for_test(admin2);
        account::create_account_for_test(admin3);
        account::create_account_for_test(admin4);
        
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&account::create_signer_for_test(@0x1));
        
        // Initialize smUSD
        smusd::initialize_for_test(deployer);
        
        // Initialize sports betting
        sports_betting::initialize(deployer, admin1, admin2, admin3, admin4);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400)]
    public fun test_initialize(
        deployer: &signer,
        admin1: address,
        admin2: address,
        admin3: address,
        admin4: address
    ) {
        setup_test(deployer, admin1, admin2, admin3, admin4);
        
        // Verify admins are set
        let admins = sports_betting::get_admins();
        assert!(vector::length(&admins) == 4, 0);
        assert!(vector::contains(&admins, &admin1), 1);
        
        // Verify owner
        let owner = sports_betting::get_owner();
        assert!(owner == signer::address_of(deployer), 2);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400)]
    public fun test_create_market(
        deployer: &signer,
        admin1: &signer,
        admin2: address,
        admin3: address,
        admin4: address
    ) {
        let admin1_addr = signer::address_of(admin1);
        setup_test(deployer, admin1_addr, admin2, admin3, admin4);
        
        // Create a market
        let game_id = string::utf8(b"game_123");
        sports_betting::create_market(
            admin1,
            game_id,
            string::utf8(b"americanfootball_nfl"),
            string::utf8(b"Team A"),
            string::utf8(b"Team B"),
            1700000000
        );
        
        // Verify market was created
        let markets = sports_betting::get_markets();
        assert!(vector::length(&markets) == 1, 0);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400, user = @0x500)]
    public fun test_place_bet(
        deployer: &signer,
        admin1: &signer,
        admin2: address,
        admin3: address,
        admin4: address,
        user: &signer
    ) {
        let admin1_addr = signer::address_of(admin1);
        let user_addr = signer::address_of(user);
        
        setup_test(deployer, admin1_addr, admin2, admin3, admin4);
        
        // Setup user account
        account::create_account_for_test(user_addr);
        smusd::register(user);
        
        // Mint smUSD to user
        smusd::mint_for_test(user_addr, 10000000000); // 100 smUSD
        
        // Create a market
        let game_id = string::utf8(b"game_123");
        sports_betting::create_market(
            admin1,
            game_id,
            string::utf8(b"americanfootball_nfl"),
            string::utf8(b"Team A"),
            string::utf8(b"Team B"),
            1700000000
        );
        
        // Place a bet
        sports_betting::place_bet(
            user,
            game_id,
            string::utf8(b"Team A"),
            1000000000, // 10 smUSD
            150 // +150 odds
        );
        
        // Verify bet was placed
        let user_bets = sports_betting::get_user_bets(user_addr);
        assert!(vector::length(&user_bets) == 1, 0);
        
        // Verify user balance decreased
        let balance = smusd::balance_of(user_addr);
        assert!(balance == 9000000000, 1);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400)]
    public fun test_calculate_payout_positive_odds(
        deployer: &signer,
        admin1: address,
        admin2: address,
        admin3: address,
        admin4: address
    ) {
        setup_test(deployer, admin1, admin2, admin3, admin4);
        
        // Test positive odds: +200
        // $100 bet at +200 should return $300 ($100 stake + $200 profit)
        let payout = sports_betting::calculate_payout_view(10000000000, 200, true);
        assert!(payout == 30000000000, 0);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400)]
    public fun test_calculate_payout_negative_odds(
        deployer: &signer,
        admin1: address,
        admin2: address,
        admin3: address,
        admin4: address
    ) {
        setup_test(deployer, admin1, admin2, admin3, admin4);
        
        // Test negative odds: -200
        // $100 bet at -200 should return $150 ($100 stake + $50 profit)
        let payout = sports_betting::calculate_payout_view(10000000000, 200, false);
        assert!(payout == 15000000000, 0);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400)]
    public fun test_resolve_market(
        deployer: &signer,
        admin1: &signer,
        admin2: address,
        admin3: address,
        admin4: address
    ) {
        let admin1_addr = signer::address_of(admin1);
        setup_test(deployer, admin1_addr, admin2, admin3, admin4);
        
        // Create a market
        let game_id = string::utf8(b"game_123");
        sports_betting::create_market(
            admin1,
            game_id,
            string::utf8(b"americanfootball_nfl"),
            string::utf8(b"Team A"),
            string::utf8(b"Team B"),
            1700000000
        );
        
        // Resolve the market
        sports_betting::resolve_market(
            admin1,
            game_id,
            string::utf8(b"Team A")
        );
        
        // Verify market is resolved
        let market = sports_betting::get_market(game_id);
        assert!(market.is_resolved == true, 0);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400)]
    public fun test_is_admin(
        deployer: &signer,
        admin1: address,
        admin2: address,
        admin3: address,
        admin4: address
    ) {
        setup_test(deployer, admin1, admin2, admin3, admin4);
        
        // Check admin status
        assert!(sports_betting::is_admin_view(admin1) == true, 0);
        assert!(sports_betting::is_admin_view(admin2) == true, 1);
        assert!(sports_betting::is_admin_view(@0x999) == false, 2);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400, new_admin = @0x500)]
    public fun test_add_remove_admin(
        deployer: &signer,
        admin1: address,
        admin2: address,
        admin3: address,
        admin4: address,
        new_admin: address
    ) {
        setup_test(deployer, admin1, admin2, admin3, admin4);
        
        // Add new admin
        sports_betting::add_admin(deployer, new_admin);
        assert!(sports_betting::is_admin_view(new_admin) == true, 0);
        
        // Remove admin
        sports_betting::remove_admin(deployer, new_admin);
        assert!(sports_betting::is_admin_view(new_admin) == false, 1);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400)]
    public fun test_cancel_market(
        deployer: &signer,
        admin1: &signer,
        admin2: address,
        admin3: address,
        admin4: address
    ) {
        let admin1_addr = signer::address_of(admin1);
        setup_test(deployer, admin1_addr, admin2, admin3, admin4);
        
        // Create a market
        let game_id = string::utf8(b"game_123");
        sports_betting::create_market(
            admin1,
            game_id,
            string::utf8(b"americanfootball_nfl"),
            string::utf8(b"Team A"),
            string::utf8(b"Team B"),
            1700000000
        );
        
        // Cancel the market
        sports_betting::cancel_market(admin1, game_id);
        
        // Verify market is cancelled
        let market = sports_betting::get_market(game_id);
        assert!(market.is_cancelled == true, 0);
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400)]
    #[expected_failure(abort_code = 2)] // EMARKET_NOT_FOUND
    public fun test_get_nonexistent_market(
        deployer: &signer,
        admin1: address,
        admin2: address,
        admin3: address,
        admin4: address
    ) {
        setup_test(deployer, admin1, admin2, admin3, admin4);
        
        // Try to get a market that doesn't exist
        sports_betting::get_market(string::utf8(b"nonexistent"));
    }

    #[test(deployer = @sports_betting, admin1 = @0x100, admin2 = @0x200, admin3 = @0x300, admin4 = @0x400, non_admin = @0x999)]
    #[expected_failure(abort_code = 1)] // ENOT_ADMIN
    public fun test_non_admin_cannot_create_market(
        deployer: &signer,
        admin1: address,
        admin2: address,
        admin3: address,
        admin4: address,
        non_admin: &signer
    ) {
        setup_test(deployer, admin1, admin2, admin3, admin4);
        account::create_account_for_test(signer::address_of(non_admin));
        
        // Non-admin tries to create market
        sports_betting::create_market(
            non_admin,
            string::utf8(b"game_123"),
            string::utf8(b"americanfootball_nfl"),
            string::utf8(b"Team A"),
            string::utf8(b"Team B"),
            1700000000
        );
    }
}

