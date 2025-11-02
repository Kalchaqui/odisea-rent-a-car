use soroban_sdk::{Address, Env, Symbol};

pub(crate) fn contract_initialized(env: &Env, admin: Address, token: Address) {
    let topics = (Symbol::new(env, "contract_initialized"),);

    env.events().publish(
        topics,
        (admin, token)
    );
}

pub(crate) fn admin_fee_set(env: &Env, fee: i128) {
    let topics = (Symbol::new(env, "admin_fee_set"),);

    env.events().publish(
        topics,
        fee
    );
}