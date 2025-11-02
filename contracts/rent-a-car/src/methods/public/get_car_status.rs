use soroban_sdk::{Address, Env};
use crate::storage::{
    car::{has_car, read_car}, 
    structs::car::Car,
    types::{car_status::CarStatus, errors::Error}
};

pub fn get_car_status(env: &Env, owner: &Address) -> Result<CarStatus, Error> {
    if !has_car(env, owner) {
        return Err(Error::CarNotFound);
    }
    let car: Car = read_car(env, &owner);

    Ok(car.car_status)
}

