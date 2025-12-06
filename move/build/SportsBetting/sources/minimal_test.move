module sports_betting::minimal_test {
    use std::signer;
    use std::string::{Self, String};
    
    struct TestResource has key {
        value: u64,
        message: String,
    }
    
    public entry fun initialize(account: &signer, value: u64) {
        let account_addr = signer::address_of(account);
        move_to(account, TestResource {
            value,
            message: string::utf8(b"test"),
        });
    }
    
    #[view]
    public fun get_value(addr: address): u64 acquires TestResource {
        borrow_global<TestResource>(addr).value
    }
}

