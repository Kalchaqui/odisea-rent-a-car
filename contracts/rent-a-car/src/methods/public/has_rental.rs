use soroban_sdk::{Address, Env};
use crate::storage::{
    rental::has_rental,
    types::errors::Error,
};

pub fn check_has_rental(env: &Env, renter: &Address, owner: &Address) -> bool {
    has_rental(env, renter, owner)
}

