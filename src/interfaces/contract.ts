import type { ClientOptions } from "@stellar/stellar-sdk/contract";
import { CarStatus } from "./car-status";

export interface IBaseContractClient {
  readonly options: ClientOptions;
  toXDR(): string;
}

export interface IRentACarContract extends IBaseContractClient {
  __constructor: ({
    admin,
    token,
  }: {
    admin: string;
    token: string;
  }) => Promise<this>;

  add_car: ({
    owner,
    price_per_day,
    commission_amount,
  }: {
    owner: string;
    price_per_day: number;
    commission_amount: number;
  }) => Promise<this>;

  get_car_status: ({ owner }: { owner: string }) => Promise<CarStatus>;
  get_car_info: ({ owner }: { owner: string }) => Promise<[number, number]>;
  has_rental: ({ renter, owner }: { renter: string; owner: string }) => Promise<boolean>;

  rental: ({
    renter,
    owner,
    total_days_to_rent,
    amount,
  }: {
    renter: string;
    owner: string;
    total_days_to_rent: number;
    amount: number;
  }) => Promise<this>;

  return_car: ({
    renter,
    owner,
  }: {
    renter: string;
    owner: string;
  }) => Promise<this>;

  remove_car: ({ owner }: { owner: string }) => Promise<this>;

  payout_owner: ({
    owner,
    amount,
  }: {
    owner: string;
    amount: number;
  }) => Promise<this>;

  set_admin_fee: ({ fee }: { fee: number }) => Promise<this>;
  get_admin_fee: () => Promise<number>;
  get_admin_fees_balance: () => Promise<number>;
  withdraw_admin_fees: ({ amount }: { amount: number }) => Promise<this>;
}