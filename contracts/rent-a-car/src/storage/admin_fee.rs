use soroban_sdk::Env;

use crate::storage::types::storage::DataKey;

pub(crate) fn read_admin_fee(env: &Env) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::AdminFee)
        .unwrap_or(0)
}

pub(crate) fn write_admin_fee(env: &Env, fee: &i128) {
    env.storage()
        .persistent()
        .set(&DataKey::AdminFee, fee);
}

