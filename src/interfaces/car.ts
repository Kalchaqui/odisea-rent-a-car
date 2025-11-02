import { CarStatus } from "./car-status";

export interface ICar {
  brand: string;
  model: string;
  color: string;
  passengers: number;
  ac: boolean;
  pricePerDay: number;
  status: CarStatus;
  ownerAddress: string;
  availableToWithdraw?: number; // Optional: available balance in XLM
  commissionAmount?: number; // Fixed commission amount in XLM (per rental)
}