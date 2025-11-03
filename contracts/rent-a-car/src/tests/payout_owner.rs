use soroban_sdk::{testutils::Address as _, Address, vec, IntoVal, Symbol};
use crate::{
    storage::{
        car::{read_car, write_car},
        contract_balance::read_contract_balance,
        types::car_status::CarStatus,
    },
    tests::config::{contract::ContractTest, utils::get_contract_events},
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

    let commission_amount = 1_000_000_000_i128; // 1 XLM in stroops
    // Mint suficiente para cubrir amount + commission_amount
    let amount_mint = amount + commission_amount + 1_000_000_i128; // Extra para seguridad
    token_admin.mint(&renter, &amount_mint);
    contract.add_car(&owner, &price_per_day, &commission_amount);
    contract.rental(&renter, &owner, &total_days, &amount);

    // Use fixed commission amount
    let admin_fee = commission_amount;
    let total_balance = amount + admin_fee;
    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, total_balance);

    // Return the car (change status to Available) so owner can withdraw
    env.as_contract(&contract.address, || {
        let mut car = read_car(&env, &owner);
        car.car_status = CarStatus::Available;
        write_car(&env, &owner, &car);
    });

    contract.payout_owner(&owner, &amount);
    let contract_events = get_contract_events(&env, &contract.address);

    let car = env.as_contract(&contract.address, || read_car(&env, &owner));
    assert_eq!(car.available_to_withdraw, 0);

    // After payout, balance should only have the admin fee
    let admin_fee = commission_amount;
    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, admin_fee);
    
    assert_eq!(
        contract_events,
        vec![
            &env,
            (
                contract.address.clone(),
                vec![
                    &env,
                    *Symbol::new(&env, "payout").as_val(),
                    owner.clone().into_val(&env),
                ],
                amount.into_val(&env)
            )
        ]
    );
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

    let commission_amount = 1_000_000_000_i128; // 1 XLM in stroops
    // Mint suficiente para cubrir rental_amount + commission_amount
    let amount_mint = rental_amount + commission_amount + 1_000_000_i128; // Extra para seguridad
    token_admin.mint(&renter, &amount_mint);
    contract.add_car(&owner, &price_per_day, &commission_amount);
    contract.rental(&renter, &owner, &total_days, &rental_amount);

    // Return the car (change status to Available) so we can test withdrawal
    env.as_contract(&contract.address, || {
        let mut car = read_car(&env, &owner);
        car.car_status = CarStatus::Available;
        write_car(&env, &owner, &car);
    });

    // Intentar retirar más de lo disponible
    let withdraw_amount = 5000_i128; // Mayor que rental_amount (4500)
    contract.payout_owner(&owner, &withdraw_amount);
}