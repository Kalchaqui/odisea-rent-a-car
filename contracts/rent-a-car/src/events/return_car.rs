use soroban_sdk::{Address, Env, Symbol};

pub(crate) fn car_returned(
    env: &Env,
    renter: Address,
    owner: Address,
) {
    let topics = (Symbol::new(env, "car_returned"), renter.clone(), owner.clone());

    env.events().publish(
        topics,
        ()
    );
}

