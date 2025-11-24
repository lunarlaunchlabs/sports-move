module sports_betting::sports_betting {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use sports_betting::smusd::{Self, SMUSD};

    /// Error codes
    const ENOT_ADMIN: u64 = 1;
    const EMARKET_NOT_FOUND: u64 = 2;
    const EMARKET_RESOLVED: u64 = 3;
    const EMARKET_CANCELLED: u64 = 4;
    const EINSUFFICIENT_BALANCE: u64 = 5;
    const EINSUFFICIENT_HOUSE_FUNDS: u64 = 6;
    const EALREADY_SETTLED: u64 = 7;
    const EINVALID_ODDS: u64 = 8;
    const EBET_NOT_FOUND: u64 = 9;
    const EALREADY_INITIALIZED: u64 = 10;
    const ENOT_OWNER: u64 = 11;
    const EMARKET_NOT_RESOLVED: u64 = 12;
    const EADMIN_LIMIT_REACHED: u64 = 13;
    const EADMIN_NOT_FOUND: u64 = 14;

    /// Represents a betting market for a game
    struct Market has store, drop, copy {
        game_id: String,
        sport_key: String,
        sport_title: String,
        home_team: String,
        away_team: String,
        commence_time: u64,
        home_odds: u64,         // Absolute value of American odds
        home_odds_positive: bool, // true if positive odds, false if negative
        away_odds: u64,         // Absolute value of American odds
        away_odds_positive: bool, // true if positive odds, false if negative
        odds_last_update: u64,
        is_resolved: bool,
        is_cancelled: bool,
        winning_outcome: String,
    }

    /// Individual user bet
    struct Bet has store, drop, copy {
        bet_id: u64,
        user: address,
        game_id: String,
        outcome: String,
        amount: u64,
        odds: u64,              // Absolute value of American odds
        odds_positive: bool,    // true if positive odds, false if negative
        potential_payout: u64,
        is_settled: bool,
        timestamp: u64,
    }

    /// Global state for the sports betting contract
    struct BettingState has key {
        markets: vector<Market>,
        bets: vector<Bet>,
        next_bet_id: u64,
        house_balance: u64,
        admins: vector<address>,
        owner: address,
        signer_cap: account::SignerCapability,
        market_created_events: event::EventHandle<MarketCreatedEvent>,
        bet_placed_events: event::EventHandle<BetPlacedEvent>,
        market_resolved_events: event::EventHandle<MarketResolvedEvent>,
        market_cancelled_events: event::EventHandle<MarketCancelledEvent>,
        bet_settled_events: event::EventHandle<BetSettledEvent>,
        bet_refunded_events: event::EventHandle<BetRefundedEvent>,
    }

    /// Events
    struct MarketCreatedEvent has drop, store {
        game_id: String,
        sport_key: String,
        sport_title: String,
        home_team: String,
        away_team: String,
        commence_time: u64,
        home_odds: u64,
        home_odds_positive: bool,
        away_odds: u64,
        away_odds_positive: bool,
    }

    struct BetPlacedEvent has drop, store {
        bet_id: u64,
        user: address,
        game_id: String,
        outcome: String,
        amount: u64,
        odds: u64,
        odds_positive: bool,
        potential_payout: u64,
    }

    struct MarketResolvedEvent has drop, store {
        game_id: String,
        winning_outcome: String,
    }

    struct MarketCancelledEvent has drop, store {
        game_id: String,
    }

    struct BetSettledEvent has drop, store {
        bet_id: u64,
        user: address,
        game_id: String,
        won: bool,
        payout: u64,
    }

    struct BetRefundedEvent has drop, store {
        bet_id: u64,
        user: address,
        game_id: String,
        refund_amount: u64,
    }

    /// Initialize the sports betting contract
    public entry fun initialize(
        account: &signer, 
        admin1: address, 
        admin2: address, 
        admin3: address, 
        admin4: address
    ) {
        let account_addr = signer::address_of(account);
        assert!(!exists<BettingState>(account_addr), EALREADY_INITIALIZED);

        // Create resource account for holding funds
        let (resource_signer, signer_cap) = account::create_resource_account(account, b"sports_betting_vault");
        
        // Register the resource account for smUSD
        smusd::register(&resource_signer);

        let admins = vector::empty<address>();
        vector::push_back(&mut admins, admin1);
        vector::push_back(&mut admins, admin2);
        vector::push_back(&mut admins, admin3);
        vector::push_back(&mut admins, admin4);

        move_to(account, BettingState {
            markets: vector::empty<Market>(),
            bets: vector::empty<Bet>(),
            next_bet_id: 1,
            house_balance: 0,
            admins,
            owner: account_addr,
            signer_cap,
            market_created_events: account::new_event_handle<MarketCreatedEvent>(account),
            bet_placed_events: account::new_event_handle<BetPlacedEvent>(account),
            market_resolved_events: account::new_event_handle<MarketResolvedEvent>(account),
            market_cancelled_events: account::new_event_handle<MarketCancelledEvent>(account),
            bet_settled_events: account::new_event_handle<BetSettledEvent>(account),
            bet_refunded_events: account::new_event_handle<BetRefundedEvent>(account),
        });
    }

    /// Check if an address is an admin
    fun is_admin(addr: address, state: &BettingState): bool {
        vector::contains(&state.admins, &addr)
    }

    /// Assert that caller is an admin
    fun assert_is_admin(addr: address, state: &BettingState) {
        assert!(is_admin(addr, state), ENOT_ADMIN);
    }

    /// Assert that caller is owner
    fun assert_is_owner(addr: address, state: &BettingState) {
        assert!(addr == state.owner, ENOT_OWNER);
    }

    /// Find market index by game_id
    fun find_market_index(game_id: &String, state: &BettingState): (bool, u64) {
        let len = vector::length(&state.markets);
        let i = 0;
        while (i < len) {
            let market = vector::borrow(&state.markets, i);
            if (market.game_id == *game_id) {
                return (true, i)
            };
            i = i + 1;
        };
        (false, 0)
    }

    /// Calculate payout based on American odds
    fun calculate_payout(amount: u64, odds: u64, is_positive: bool): u64 {
        if (is_positive) {
            // Positive odds: profit = amount * (odds / 100)
            amount + (amount * odds / 100)
        } else {
            // Negative odds: profit = amount * (100 / odds)
            amount + (amount * 100 / odds)
        }
    }

    /// Admin: Create a new betting market
    public entry fun create_market(
        admin: &signer,
        game_id: String,
        sport_key: String,
        sport_title: String,
        home_team: String,
        away_team: String,
        commence_time: u64,
        home_odds: u64,
        home_odds_positive: bool,
        away_odds: u64,
        away_odds_positive: bool
    ) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        assert_is_admin(signer::address_of(admin), state);

        // Validate odds
        assert!(home_odds != 0, EINVALID_ODDS);
        assert!(away_odds != 0, EINVALID_ODDS);

        let market = Market {
            game_id: game_id,
            sport_key: sport_key,
            sport_title: sport_title,
            home_team: home_team,
            away_team: away_team,
            commence_time,
            home_odds,
            home_odds_positive,
            away_odds,
            away_odds_positive,
            odds_last_update: timestamp::now_seconds(),
            is_resolved: false,
            is_cancelled: false,
            winning_outcome: string::utf8(b""),
        };

        vector::push_back(&mut state.markets, market);

        event::emit_event(&mut state.market_created_events, MarketCreatedEvent {
            game_id: market.game_id,
            sport_key: market.sport_key,
            sport_title: market.sport_title,
            home_team: market.home_team,
            away_team: market.away_team,
            commence_time: market.commence_time,
            home_odds: market.home_odds,
            home_odds_positive: market.home_odds_positive,
            away_odds: market.away_odds,
            away_odds_positive: market.away_odds_positive,
        });
    }

    /// Admin: Update market details (before resolution)
    public entry fun update_market(
        admin: &signer,
        game_id: String,
        sport_key: String,
        sport_title: String,
        home_team: String,
        away_team: String,
        commence_time: u64,
        home_odds: u64,
        home_odds_positive: bool,
        away_odds: u64,
        away_odds_positive: bool
    ) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        assert_is_admin(signer::address_of(admin), state);

        let (found, index) = find_market_index(&game_id, state);
        assert!(found, EMARKET_NOT_FOUND);

        let market = vector::borrow_mut(&mut state.markets, index);
        assert!(!market.is_resolved, EMARKET_RESOLVED);
        
        // Validate odds
        assert!(home_odds != 0, EINVALID_ODDS);
        assert!(away_odds != 0, EINVALID_ODDS);
        
        market.sport_key = sport_key;
        market.sport_title = sport_title;
        market.home_team = home_team;
        market.away_team = away_team;
        market.commence_time = commence_time;
        market.home_odds = home_odds;
        market.home_odds_positive = home_odds_positive;
        market.away_odds = away_odds;
        market.away_odds_positive = away_odds_positive;
        market.odds_last_update = timestamp::now_seconds();
    }

    /// Admin: Update only the odds for a market (before resolution)
    public entry fun update_market_odds(
        admin: &signer,
        game_id: String,
        home_odds: u64,
        home_odds_positive: bool,
        away_odds: u64,
        away_odds_positive: bool
    ) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        assert_is_admin(signer::address_of(admin), state);

        let (found, index) = find_market_index(&game_id, state);
        assert!(found, EMARKET_NOT_FOUND);

        let market = vector::borrow_mut(&mut state.markets, index);
        assert!(!market.is_resolved, EMARKET_RESOLVED);
        assert!(!market.is_cancelled, EMARKET_CANCELLED);
        
        // Validate odds
        assert!(home_odds != 0, EINVALID_ODDS);
        assert!(away_odds != 0, EINVALID_ODDS);
        
        market.home_odds = home_odds;
        market.home_odds_positive = home_odds_positive;
        market.away_odds = away_odds;
        market.away_odds_positive = away_odds_positive;
        market.odds_last_update = timestamp::now_seconds();
    }

    /// Admin: Resolve a market with winning outcome
    public entry fun resolve_market(
        admin: &signer,
        game_id: String,
        winning_team: String
    ) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        assert_is_admin(signer::address_of(admin), state);

        let (found, index) = find_market_index(&game_id, state);
        assert!(found, EMARKET_NOT_FOUND);

        let market = vector::borrow_mut(&mut state.markets, index);
        assert!(!market.is_resolved, EMARKET_RESOLVED);
        assert!(!market.is_cancelled, EMARKET_CANCELLED);

        market.is_resolved = true;
        market.winning_outcome = winning_team;

        event::emit_event(&mut state.market_resolved_events, MarketResolvedEvent {
            game_id: game_id,
            winning_outcome: winning_team,
        });
    }

    /// Admin: Cancel a market and refund all bets
    public entry fun cancel_market(admin: &signer, game_id: String) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        assert_is_admin(signer::address_of(admin), state);

        let (found, index) = find_market_index(&game_id, state);
        assert!(found, EMARKET_NOT_FOUND);

        let market = vector::borrow_mut(&mut state.markets, index);
        assert!(!market.is_resolved, EMARKET_RESOLVED);
        
        market.is_cancelled = true;

        event::emit_event(&mut state.market_cancelled_events, MarketCancelledEvent {
            game_id: game_id,
        });

        // Process refunds for all bets on this market
        let resource_signer = account::create_signer_with_capability(&state.signer_cap);
        let bet_len = vector::length(&state.bets);
        let i = 0;
        while (i < bet_len) {
            let bet = vector::borrow_mut(&mut state.bets, i);
            if (bet.game_id == game_id && !bet.is_settled) {
                // Refund the bet
                let refund_amount = bet.amount;
                let user_addr = bet.user;
                
                // Transfer from house to user
                let coins = coin::withdraw<SMUSD>(&resource_signer, refund_amount);
                coin::deposit(user_addr, coins);
                
                bet.is_settled = true;

                event::emit_event(&mut state.bet_refunded_events, BetRefundedEvent {
                    bet_id: bet.bet_id,
                    user: user_addr,
                    game_id: game_id,
                    refund_amount,
                });
            };
            i = i + 1;
        };
    }

    /// Admin: Settle all bets for a resolved market
    public entry fun settle_bets(admin: &signer, game_id: String) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        assert_is_admin(signer::address_of(admin), state);

        let (found, index) = find_market_index(&game_id, state);
        assert!(found, EMARKET_NOT_FOUND);

        let market = vector::borrow(&state.markets, index);
        assert!(market.is_resolved, EMARKET_NOT_RESOLVED);
        assert!(!market.is_cancelled, EMARKET_CANCELLED);

        let winning_outcome = market.winning_outcome;

        // Settle all bets for this market
        let resource_signer = account::create_signer_with_capability(&state.signer_cap);
        let bet_len = vector::length(&state.bets);
        let i = 0;
        while (i < bet_len) {
            let bet = vector::borrow_mut(&mut state.bets, i);
            if (bet.game_id == game_id && !bet.is_settled) {
                let won = (bet.outcome == winning_outcome);
                let payout = 0u64;

                if (won) {
                    // Calculate winnings with 5% house fee
                    let gross_payout = bet.potential_payout;
                    let profit = gross_payout - bet.amount;
                    let house_fee = profit * 5 / 100;
                    payout = gross_payout - house_fee;

                    // Transfer winnings to user
                    let user_addr = bet.user;
                    let coins = coin::withdraw<SMUSD>(&resource_signer, payout);
                    coin::deposit(user_addr, coins);

                    // Update house balance (house keeps losing bets, pays out winnings)
                    state.house_balance = state.house_balance + bet.amount - payout;
                } else {
                    // Losing bet - house keeps the funds
                    state.house_balance = state.house_balance + bet.amount;
                };

                bet.is_settled = true;

                event::emit_event(&mut state.bet_settled_events, BetSettledEvent {
                    bet_id: bet.bet_id,
                    user: bet.user,
                    game_id: game_id,
                    won,
                    payout,
                });
            };
            i = i + 1;
        };
    }

    /// Admin: Add a new admin address
    public entry fun add_admin(owner: &signer, new_admin: address) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        assert_is_owner(signer::address_of(owner), state);
        assert!(vector::length(&state.admins) < 10, EADMIN_LIMIT_REACHED); // Max 10 admins
        
        if (!vector::contains(&state.admins, &new_admin)) {
            vector::push_back(&mut state.admins, new_admin);
        };
    }

    /// Admin: Remove an admin address
    public entry fun remove_admin(owner: &signer, admin_to_remove: address) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        assert_is_owner(signer::address_of(owner), state);
        
        let (found, index) = vector::index_of(&state.admins, &admin_to_remove);
        assert!(found, EADMIN_NOT_FOUND);
        vector::remove(&mut state.admins, index);
    }

    /// Admin: Deposit funds to house balance
    public entry fun deposit_house_funds(admin: &signer, amount: u64) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        assert_is_admin(signer::address_of(admin), state);

        let resource_addr = account::get_signer_capability_address(&state.signer_cap);
        let coins = coin::withdraw<SMUSD>(admin, amount);
        coin::deposit(resource_addr, coins);
        state.house_balance = state.house_balance + amount;
    }

    /// User: Place a bet on a market
    public entry fun place_bet(
        user: &signer,
        game_id: String,
        outcome: String,
        amount: u64
    ) acquires BettingState {
        let state = borrow_global_mut<BettingState>(@sports_betting);
        let user_addr = signer::address_of(user);

        // Validate market exists and get current odds
        let (found, index) = find_market_index(&game_id, state);
        assert!(found, EMARKET_NOT_FOUND);

        let market = vector::borrow(&state.markets, index);
        assert!(!market.is_resolved, EMARKET_RESOLVED);
        assert!(!market.is_cancelled, EMARKET_CANCELLED);

        // Determine which odds to use based on outcome
        // Outcome can be "home", "away", or the actual team name
        let (odds, odds_positive) = if (outcome == string::utf8(b"home") || outcome == market.home_team) {
            (market.home_odds, market.home_odds_positive)
        } else if (outcome == string::utf8(b"away") || outcome == market.away_team) {
            (market.away_odds, market.away_odds_positive)
        } else {
            abort EINVALID_ODDS
        };

        // Validate odds
        assert!(odds != 0, EINVALID_ODDS);

        // Calculate potential payout using current market odds
        let potential_payout = calculate_payout(amount, odds, odds_positive);

        // Transfer smUSD from user to contract (escrow)
        let resource_addr = account::get_signer_capability_address(&state.signer_cap);
        let coins = coin::withdraw<SMUSD>(user, amount);
        coin::deposit(resource_addr, coins);

        // Create bet record with captured odds
        let bet = Bet {
            bet_id: state.next_bet_id,
            user: user_addr,
            game_id,
            outcome,
            amount,
            odds,
            odds_positive,
            potential_payout,
            is_settled: false,
            timestamp: timestamp::now_seconds(),
        };

        state.next_bet_id = state.next_bet_id + 1;
        vector::push_back(&mut state.bets, bet);

        event::emit_event(&mut state.bet_placed_events, BetPlacedEvent {
            bet_id: bet.bet_id,
            user: user_addr,
            game_id: bet.game_id,
            outcome: bet.outcome,
            amount: bet.amount,
            odds: bet.odds,
            odds_positive: bet.odds_positive,
            potential_payout: bet.potential_payout,
        });
    }

    // ========== View Functions ==========

    #[view]
    public fun get_market(game_id: String): Market acquires BettingState {
        let state = borrow_global<BettingState>(@sports_betting);
        let (found, index) = find_market_index(&game_id, state);
        assert!(found, EMARKET_NOT_FOUND);
        *vector::borrow(&state.markets, index)
    }

    #[view]
    public fun get_markets(): vector<Market> acquires BettingState {
        let state = borrow_global<BettingState>(@sports_betting);
        state.markets
    }

    #[view]
    public fun get_user_bets(user: address): vector<Bet> acquires BettingState {
        let state = borrow_global<BettingState>(@sports_betting);
        let user_bets = vector::empty<Bet>();
        let len = vector::length(&state.bets);
        let i = 0;
        while (i < len) {
            let bet = vector::borrow(&state.bets, i);
            if (bet.user == user) {
                vector::push_back(&mut user_bets, *bet);
            };
            i = i + 1;
        };
        user_bets
    }

    #[view]
    public fun get_bet(bet_id: u64): Bet acquires BettingState {
        let state = borrow_global<BettingState>(@sports_betting);
        let len = vector::length(&state.bets);
        let i = 0;
        while (i < len) {
            let bet = vector::borrow(&state.bets, i);
            if (bet.bet_id == bet_id) {
                return *bet
            };
            i = i + 1;
        };
        abort EBET_NOT_FOUND
    }

    #[view]
    public fun calculate_payout_view(amount: u64, odds: u64, is_positive: bool): u64 {
        calculate_payout(amount, odds, is_positive)
    }

    #[view]
    public fun get_house_balance(): u64 acquires BettingState {
        let state = borrow_global<BettingState>(@sports_betting);
        state.house_balance
    }

    #[view]
    public fun is_admin_view(addr: address): bool acquires BettingState {
        let state = borrow_global<BettingState>(@sports_betting);
        is_admin(addr, state)
    }

    #[view]
    public fun get_admins(): vector<address> acquires BettingState {
        let state = borrow_global<BettingState>(@sports_betting);
        state.admins
    }

    #[view]
    public fun get_owner(): address acquires BettingState {
        let state = borrow_global<BettingState>(@sports_betting);
        state.owner
    }

}

