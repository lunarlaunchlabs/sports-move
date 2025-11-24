module mock_move::hello_world {
    use std::error;
    use std::signer;
    use std::string::{String};
    use aptos_framework::account;
    use aptos_framework::event;

    /// Data structure to hold sports-related information
    struct DataStore has key {
        message: String,
        value: u64,
        is_active: bool,
        data_change_events: event::EventHandle<DataChangeEvent>,
    }

    /// Event emitted when data is updated
    struct DataChangeEvent has drop, store {
        old_message: String,
        new_message: String,
        old_value: u64,
        new_value: u64,
        timestamp: u64,
    }

    /// Error codes
    const ENO_DATA_STORE: u64 = 0;
    const EALREADY_INITIALIZED: u64 = 1;
    const ENOT_AUTHORIZED: u64 = 2;

    /// View function: Get the contract signature/address
    #[view]
    public fun get_contract_address(): address {
        @mock_move
    }

    /// View function: Get the stored message
    /// This can be called from the frontend to read data
    #[view]
    public fun get_message(addr: address): String acquires DataStore {
        assert!(exists<DataStore>(addr), error::not_found(ENO_DATA_STORE));
        borrow_global<DataStore>(addr).message
    }

    /// View function: Get the stored value
    /// This can be called from the frontend to read numerical data
    #[view]
    public fun get_value(addr: address): u64 acquires DataStore {
        assert!(exists<DataStore>(addr), error::not_found(ENO_DATA_STORE));
        borrow_global<DataStore>(addr).value
    }

    /// View function: Check if data store is active
    #[view]
    public fun is_active(addr: address): bool acquires DataStore {
        assert!(exists<DataStore>(addr), error::not_found(ENO_DATA_STORE));
        borrow_global<DataStore>(addr).is_active
    }

    /// View function: Check if a user has initialized their data store
    #[view]
    public fun has_data_store(addr: address): bool {
        exists<DataStore>(addr)
    }

    /// View function: Get all data at once
    /// Returns (message, value, is_active)
    #[view]
    public fun get_all_data(addr: address): (String, u64, bool) acquires DataStore {
        assert!(exists<DataStore>(addr), error::not_found(ENO_DATA_STORE));
        let store = borrow_global<DataStore>(addr);
        (store.message, store.value, store.is_active)
    }

    /// Entry function: Initialize the data store for an account
    /// This should be called first before using other functions
    public entry fun initialize(account: signer, message: String, value: u64) {
        let account_addr = signer::address_of(&account);
        assert!(!exists<DataStore>(account_addr), error::already_exists(EALREADY_INITIALIZED));
        
        move_to(&account, DataStore {
            message,
            value,
            is_active: true,
            data_change_events: account::new_event_handle<DataChangeEvent>(&account),
        });
    }

    /// Entry function: Update the message
    /// Backend can call this to push new message data
    public entry fun update_message(
        account: signer, 
        new_message: String
    ) acquires DataStore {
        let account_addr = signer::address_of(&account);
        assert!(exists<DataStore>(account_addr), error::not_found(ENO_DATA_STORE));
        
        let store = borrow_global_mut<DataStore>(account_addr);
        let old_message = store.message;
        let old_value = store.value;
        
        store.message = new_message;
        
        event::emit_event(&mut store.data_change_events, DataChangeEvent {
            old_message,
            new_message: store.message,
            old_value,
            new_value: store.value,
            timestamp: aptos_framework::timestamp::now_microseconds(),
        });
    }

    /// Entry function: Update the value
    /// Backend can call this to push new numerical data
    public entry fun update_value(
        account: signer, 
        new_value: u64
    ) acquires DataStore {
        let account_addr = signer::address_of(&account);
        assert!(exists<DataStore>(account_addr), error::not_found(ENO_DATA_STORE));
        
        let store = borrow_global_mut<DataStore>(account_addr);
        let old_message = store.message;
        let old_value = store.value;
        
        store.value = new_value;
        
        event::emit_event(&mut store.data_change_events, DataChangeEvent {
            old_message,
            new_message: store.message,
            old_value,
            new_value: store.value,
            timestamp: aptos_framework::timestamp::now_microseconds(),
        });
    }

    /// Entry function: Update both message and value at once
    /// Backend can call this to push multiple data points
    public entry fun update_data(
        account: signer,
        new_message: String,
        new_value: u64
    ) acquires DataStore {
        let account_addr = signer::address_of(&account);
        assert!(exists<DataStore>(account_addr), error::not_found(ENO_DATA_STORE));
        
        let store = borrow_global_mut<DataStore>(account_addr);
        let old_message = store.message;
        let old_value = store.value;
        
        store.message = new_message;
        store.value = new_value;
        
        event::emit_event(&mut store.data_change_events, DataChangeEvent {
            old_message,
            new_message: store.message,
            old_value,
            new_value: store.value,
            timestamp: aptos_framework::timestamp::now_microseconds(),
        });
    }

    /// Entry function: Toggle active status
    public entry fun toggle_active(account: signer) acquires DataStore {
        let account_addr = signer::address_of(&account);
        assert!(exists<DataStore>(account_addr), error::not_found(ENO_DATA_STORE));
        
        let store = borrow_global_mut<DataStore>(account_addr);
        store.is_active = !store.is_active;
    }

    #[test(account = @0x1)]
    public entry fun test_initialize(account: signer) acquires DataStore {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);
        
        initialize(account, std::string::utf8(b"Hello, Blockchain!"), 42);
        
        assert!(has_data_store(addr), ENO_DATA_STORE);
        assert!(get_message(addr) == std::string::utf8(b"Hello, Blockchain!"), ENO_DATA_STORE);
        assert!(get_value(addr) == 42, ENO_DATA_STORE);
        assert!(is_active(addr), ENO_DATA_STORE);
    }

    #[test(account = @0x1)]
    public entry fun test_update_data(account: signer) acquires DataStore {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);
        
        initialize(account, std::string::utf8(b"Hello"), 100);
        
        assert!(get_message(addr) == std::string::utf8(b"Hello"), ENO_DATA_STORE);
        assert!(get_value(addr) == 100, ENO_DATA_STORE);
    }

    #[test(account = @0x1)]
    public entry fun test_has_data_store(account: signer) {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);
        
        assert!(!has_data_store(addr), ENO_DATA_STORE);
        initialize(account, std::string::utf8(b"Test"), 50);
        assert!(has_data_store(addr), ENO_DATA_STORE);
    }

    #[test(account = @0x1)]
    public entry fun test_get_all_data(account: signer) acquires DataStore {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);
        
        initialize(account, std::string::utf8(b"Complete Test"), 999);
        let (msg, val, active) = get_all_data(addr);
        
        assert!(msg == std::string::utf8(b"Complete Test"), ENO_DATA_STORE);
        assert!(val == 999, ENO_DATA_STORE);
        assert!(active == true, ENO_DATA_STORE);
    }

    #[test]
    public fun test_contract_address() {
        assert!(get_contract_address() == @mock_move, ENO_DATA_STORE);
    }
}

