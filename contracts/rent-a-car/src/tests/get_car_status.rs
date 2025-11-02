use soroban_sdk::{testutils::Address as _, Address};
use crate::{storage::{types::car_status::CarStatus, car::has_car}, tests::config::contract::ContractTest};

#[test]
pub fn test_get_car_status_returns_available() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;

    env.mock_all_auths();
    let commission_amount = 1_000_000_000_i128; // 1 XLM in stroops

    contract.add_car(&owner, &price_per_day, &commission_amount);

    let is_car_stored = env.as_contract(&contract.address, || {
        has_car(&env, &owner)
    });
    assert!(is_car_stored);

    let status = contract.get_car_status(&owner);
    assert_eq!(status, CarStatus::Available);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
pub fn test_get_car_status_car_not_found_fails() {
    let ContractTest { env, contract, .. } = ContractTest::setup();
    let owner = Address::generate(&env);
    
    contract.get_car_status(&owner);
}