use soroban_sdk::{testutils::Address as _, Address};
use crate::{storage::{car::read_car, types::car_status::CarStatus}, tests::config::contract::ContractTest};

#[test]
pub fn test_add_car_successfully() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;

    contract.add_car( &owner, &price_per_day);

    let stored_car = env.as_contract(&contract.address, || {
        read_car(&env, &owner)
    });

    assert_eq!(stored_car.price_per_day, price_per_day);
    assert_eq!(stored_car.car_status, CarStatus::Available);
}
#[test]
#[should_panic(expected = "Error(Contract, #6)")]
pub fn test_add_car_with_zero_price_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();
    let owner = Address::generate(&env);
    let price_per_day = 0_i128;
    
    contract.add_car(&owner, &price_per_day);
}
#[test]
#[should_panic(expected = "Error(Contract, #6)")]
pub fn test_add_car_with_negative_price_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();
    let owner = Address::generate(&env);
    let price_per_day = -100_i128;
    
    contract.add_car(&owner, &price_per_day);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
pub fn test_add_car_already_exists_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();
    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;
    
    contract.add_car(&owner, &price_per_day);
    contract.add_car(&owner, &price_per_day);
}