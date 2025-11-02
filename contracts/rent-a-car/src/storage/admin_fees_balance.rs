use soroban_sdk::Env;

use crate::storage::types::storage::DataKey;

pub(crate) fn read_admin_fees_balance(env: &Env) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::AdminFeesBalance)
        .unwrap_or(0)
}

pub(crate) fn write_admin_fees_balance(env: &Env, amount: &i128) {
    env.storage()
        .persistent()
        .set(&DataKey::AdminFeesBalance, amount);
}

