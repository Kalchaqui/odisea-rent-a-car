
use soroban_sdk::{Address, Env};

use crate::storage::{structs::rental::Rental, types::storage::DataKey};

pub(crate) fn write_rental(env: &Env, renter: &Address, car_owner: &Address, rental: &Rental) {
    env.storage().instance().set(&DataKey::Rental(renter.clone(), car_owner.clone()), rental);
}

#[allow(dead_code)] // Used in tests
pub(crate) fn read_rental(env: &Env, renter: &Address, car_owner: &Address) -> Rental {
    env.storage().instance().get(&DataKey::Rental(renter.clone(), car_owner.clone())).unwrap()
}