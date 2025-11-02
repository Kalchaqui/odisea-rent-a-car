use soroban_sdk::{testutils::{Address as _, MockAuth, MockAuthInvoke}, Address, vec, IntoVal, Symbol};
use crate::{storage::{car::read_car, types::car_status::CarStatus}, tests::config::{contract::ContractTest, utils::get_contract_events}};

#[test]
pub fn test_add_car_successfully() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;

    env.mock_all_auths();
    let commission_amount = 1_000_000_000_i128; // 1 XLM in stroops
    contract.add_car(&owner, &price_per_day, &commission_amount);
    let contract_events = get_contract_events(&env, &contract.address);

    let stored_car = env.as_contract(&contract.address, || {
        read_car(&env, &owner)
    });

    assert_eq!(stored_car.price_per_day, price_per_day);
    assert_eq!(stored_car.car_status, CarStatus::Available);
    
    assert_eq!(
        contract_events,
        vec![
            &env,
            (
                contract.address.clone(),
                vec![
                    &env,
                    *Symbol::new(&env, "car_added").as_val(),
                    owner.clone().into_val(&env),
                ],
                price_per_day.into_val(&env)
            )
        ]
    );
}
#[test]
#[should_panic(expected = "Error(Contract, #6)")]
pub fn test_add_car_with_zero_price_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();
    let owner = Address::generate(&env);
    let price_per_day = 0_i128;
    
    env.mock_all_auths();
    let commission_percentage = 10_u32;

    contract.add_car(&owner, &price_per_day, &commission_percentage);
}
#[test]
#[should_panic(expected = "Error(Contract, #6)")]
pub fn test_add_car_with_negative_price_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();
    let owner = Address::generate(&env);
    let price_per_day = -100_i128;
    
    env.mock_all_auths();
    let commission_percentage = 10_u32;

    contract.add_car(&owner, &price_per_day, &commission_percentage);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
pub fn test_add_car_already_exists_fails() {
    let ContractTest { contract, env, .. } = ContractTest::setup();
    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;
    
    env.mock_all_auths();
    let commission_amount = 1_000_000_000_i128;

    contract.add_car(&owner, &price_per_day, &commission_amount);
    contract.add_car(&owner, &price_per_day, &commission_amount);
}

#[test]
#[should_panic(expected = "Error(Auth, InvalidAction)")]
pub fn test_unauthorized_user_cannot_add_car() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let fake_admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;

    env.mock_auths(&[MockAuth {
        address: &fake_admin,
        invoke: &MockAuthInvoke {
            contract: &contract.address,
            fn_name: "add_car",
            args: (owner.clone(), price_per_day, 1_000_000_000_i128).into_val(&env),
            sub_invokes: &[],
        },
    }]);

    let commission_amount = 1_000_000_000_i128;
    contract.add_car(&owner, &price_per_day, &commission_amount);
}