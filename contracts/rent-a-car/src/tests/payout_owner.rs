use soroban_sdk::{testutils::Address as _, Address};
use crate::{
    storage::{car::read_car, contract_balance::read_contract_balance},
    tests::config::contract::ContractTest,
};

#[test]
pub fn test_payout_owner_successfully() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;
    
    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.rental(&renter, &owner, &total_days, &amount);

    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, amount);

    contract.payout_owner(&owner, &amount);

    let car = env.as_contract(&contract.address, || read_car(&env, &owner));
    assert_eq!(car.available_to_withdraw, 0);

    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")]
pub fn test_payout_owner_insufficient_balance_fails() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let rental_amount = 4500_i128;
    
    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.rental(&renter, &owner, &total_days, &rental_amount);

    // Intentar retirar más de lo disponible
    let withdraw_amount = 5000_i128; // Mayor que rental_amount (4500)
    contract.payout_owner(&owner, &withdraw_amount);
}