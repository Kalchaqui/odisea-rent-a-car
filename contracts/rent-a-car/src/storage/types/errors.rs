use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    ContractInitialized = 0,
    ContractNotInitialized = 1,
    CarNotFound = 2,
    AdminTokenConflict = 3,
    CarAlreadyExist = 5,
    AmountMustBePositive = 6,
    RentalDurationCannotBeZero = 10,
    SelfRentalNotAllowed = 11,
    CarAlreadyRented = 12,
    RentalNotFound = 7,
    InsufficientBalance = 8,
    BalanceNotAvailableForAmountRequested = 9,
}