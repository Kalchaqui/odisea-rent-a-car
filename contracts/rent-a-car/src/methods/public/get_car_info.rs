use soroban_sdk::{Address, Env};
use crate::storage::{
    car::{read_car, has_car},
    types::errors::Error,
};

pub fn get_car_info(env: &Env, owner: &Address) -> Result<(i128, i128), Error> {
    if !has_car(env, owner) {
        return Err(Error::CarNotFound);
    }

    let car = read_car(env, owner);
    Ok((car.price_per_day, car.available_to_withdraw))
}

