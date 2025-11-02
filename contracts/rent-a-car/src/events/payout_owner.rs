use soroban_sdk::{Address, Env, Symbol};

pub(crate) fn payout_owner(env: &Env, owner: Address, amount: i128) {
    let topics = (Symbol::new(env, "payout"), owner.clone());

    env.events().publish(
        topics,
        amount
    );
}

pub(crate) fn admin_fees_withdrawn(env: &Env, admin: Address, amount: i128) {
    let topics = (Symbol::new(env, "admin_fees_withdrawn"), admin.clone());

    env.events().publish(
        topics,
        amount
    );
}