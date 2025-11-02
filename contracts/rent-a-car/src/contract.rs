use soroban_sdk::{Address, Env, contract, contractimpl};
use crate::{interfaces::contract::RentACarContractTrait, 
    storage::{
        admin::{read_admin, write_admin, has_admin},
        car::{read_car, write_car, remove_car, has_car},
        token::write_token,
        types::{car_status::CarStatus, errors::Error},
        structs::{car::Car, rental::Rental},
        rental::write_rental,
        contract_balance::{read_contract_balance, write_contract_balance},
        admin_fee::{read_admin_fee, write_admin_fee},
        admin_fees_balance::{read_admin_fees_balance, write_admin_fees_balance},
    },
    methods::{
        token::token::token_transfer,
        public,
    },
    events,
};


#[contract]
pub struct RentACarContract;


#[contractimpl]
impl RentACarContractTrait for RentACarContract {
    fn __constructor(env: &Env, admin: Address, token: Address) -> Result<(), Error> {
        if admin == token {
            return Err(Error::AdminTokenConflict);
        }

        if has_admin(env) {
            return Err(Error::ContractInitialized);
        }
        write_admin(env, &admin);
        write_token(env, &token);
        events::contract::contract_initialized(env, admin, token);
        Ok(())
    }

    fn get_admin(env: &Env) -> Address {
        read_admin(env)
    }

    fn add_car(env: &Env, owner: Address, price_per_day: i128, commission_amount: i128) -> Result<(), Error> {
        let admin = read_admin(env);
        admin.require_auth();
        if price_per_day <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        // Validate commission amount: must be positive
        if commission_amount <= 0 {
            return Err(Error::InvalidCommissionAmount);
        }

        if has_car(env, &owner) {
            return Err(Error::CarAlreadyExist);
        }
        let car = Car {
            price_per_day,
            car_status: CarStatus::Available,
            available_to_withdraw: 0,
            commission_amount,
        };

        write_car(env, &owner, &car);
        events::add_car::car_added(env, owner, price_per_day);
        Ok(())
    }

    fn get_car_status(env: &Env, owner: Address) -> Result<CarStatus, Error> {
        public::get_car_status(env, &owner)
    }

    fn get_car_info(env: &Env, owner: Address) -> Result<(i128, i128), Error> {
        public::get_car_info(env, &owner)
    }

    fn rental(env: &Env, renter: Address, owner: Address, total_days_to_rent: u32, amount: i128) -> Result<(), Error> {
        renter.require_auth();

        if amount <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        if total_days_to_rent == 0 {
            return Err(Error::RentalDurationCannotBeZero);
        }

        if renter == owner {
            return Err(Error::SelfRentalNotAllowed);
        }

        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        let mut car = read_car(env, &owner);

        if car.car_status != CarStatus::Available {
            return Err(Error::CarAlreadyRented);
        }

        // Use fixed commission amount from car
        let admin_fee = car.commission_amount;
        let total_amount = amount
            .checked_add(admin_fee)
            .ok_or(Error::Overflow)?;

        car.car_status = CarStatus::Rented;
        // Only the rental amount (without fee) goes to the owner
        car.available_to_withdraw = car.available_to_withdraw
            .checked_add(amount)
            .ok_or(Error::Overflow)?;

        let rental = Rental {
            total_days_to_rent,
            amount,
        };

        // Update contract balance with total amount (deposit + fee)
        let mut contract_balance = read_contract_balance(env);
        contract_balance = contract_balance
            .checked_add(total_amount)
            .ok_or(Error::Overflow)?;

        // Update admin fees balance
        let mut admin_fees_balance = read_admin_fees_balance(env);
        admin_fees_balance = admin_fees_balance
            .checked_add(admin_fee)
            .ok_or(Error::Overflow)?;

        write_contract_balance(env, &contract_balance);
        write_admin_fees_balance(env, &admin_fees_balance);
        write_car(env, &owner, &car);
        write_rental(env, &renter, &owner, &rental);

        // Transfer total amount (deposit + fee) from renter to contract
        token_transfer(env, &renter, &env.current_contract_address(), &total_amount);
        events::rental::rented(env, renter, owner, total_days_to_rent, total_amount);
        Ok(())
    }
    fn remove_car(env: &Env, owner: Address) -> Result<(), Error> {

        let admin = read_admin(env);
        admin.require_auth();

        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }
        
        remove_car(env, &owner);
        events::remove_car::car_removed(env, owner);
        Ok(())
    }

    fn payout_owner(env: &Env, owner: Address, amount: i128) -> Result<(), Error> {
        owner.require_auth();

        if amount <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        let mut car = read_car(env, &owner);

        // Owners can only withdraw when car is returned (Available)
        if car.car_status != CarStatus::Available {
            return Err(Error::CarNotReturned);
        }

        if amount > car.available_to_withdraw {
            return Err(Error::InsufficientBalance);
        }
        let mut contract_balance = read_contract_balance(env);

        car.available_to_withdraw = car.available_to_withdraw
            .checked_sub(amount)
            .ok_or(Error::Underflow)?;
        contract_balance = contract_balance
            .checked_sub(amount)
            .ok_or(Error::Underflow)?;

        write_car(env, &owner, &car);
        write_contract_balance(env, &contract_balance);

        token_transfer(env, &env.current_contract_address(), &owner, &amount);
        events::payout_owner::payout_owner(env, owner, amount);
        Ok(())
    }

    fn set_admin_fee(env: &Env, fee: i128) -> Result<(), Error> {
        let admin = read_admin(env);
        admin.require_auth();

        if fee < 0 {
            return Err(Error::AmountMustBePositive);
        }

        write_admin_fee(env, &fee);
        events::contract::admin_fee_set(env, fee);
        Ok(())
    }

    fn get_admin_fee(env: &Env) -> i128 {
        read_admin_fee(env)
    }

    fn get_admin_fees_balance(env: &Env) -> i128 {
        read_admin_fees_balance(env)
    }

    fn withdraw_admin_fees(env: &Env, amount: i128) -> Result<(), Error> {
        let admin = read_admin(env);
        admin.require_auth();

        if amount <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        let mut admin_fees_balance = read_admin_fees_balance(env);

        if amount > admin_fees_balance {
            return Err(Error::InsufficientBalance);
        }

        let mut contract_balance = read_contract_balance(env);
        
        admin_fees_balance = admin_fees_balance
            .checked_sub(amount)
            .ok_or(Error::Underflow)?;
        contract_balance = contract_balance
            .checked_sub(amount)
            .ok_or(Error::Underflow)?;

        write_admin_fees_balance(env, &admin_fees_balance);
        write_contract_balance(env, &contract_balance);

        token_transfer(env, &env.current_contract_address(), &admin, &amount);
        events::payout_owner::admin_fees_withdrawn(env, admin, amount);
        Ok(())
    }
}
