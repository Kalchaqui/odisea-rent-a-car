import { Horizon, Keypair, TransactionBuilder, Operation, Asset, BASE_FEE, Claimant } from "@stellar/stellar-sdk";
import { STELLAR_NETWORK, HORIZON_URL, STELLAR_FRIENDBOT_URL } from "../utils/constants";
import { IKeypair } from "../interfaces/keypair";
import { AccountBalance } from "../interfaces/account";
import { IAccountBalanceResponse } from "../interfaces/balance";
import { HORIZON_NETWORK_PASSPHRASE } from "../utils/constants";

export interface ICreateClaimableBalanceResponse {
  transaction: Horizon.HorizonApi.SubmitTransactionResponse;
  claimableBalanceId: string;
}

export class StellarService {
  private server: Horizon.Server;
  private network: string;
  private horizonUrl: string;
  //private networkPassphrase: string;
  private friendBotUrl: string;
  private networkPassphrase: string;

  constructor() {
    this.network = STELLAR_NETWORK as string;
    this.horizonUrl = HORIZON_URL as string;
    this.friendBotUrl = STELLAR_FRIENDBOT_URL as string;
    this.networkPassphrase = HORIZON_NETWORK_PASSPHRASE as string;

    this.server = new Horizon.Server(this.horizonUrl, {
      allowHttp: true,
    });
  }

  private async getAccount(address: string): Promise<Horizon.AccountResponse> {
    try {
        return await this.server.loadAccount(address);
    } catch (error) {
        throw new Error('Account not found');
}
}
async getAccountBalance(publicKey: string): Promise<AccountBalance[]> {
const account =
  await this.getAccount(publicKey);

return account.balances.map((b) => ({
  assetCode:
    b.asset_type === "native"
      ? "XLM"
      : (b as IAccountBalanceResponse).asset_code,

  amount: b.balance,
}));
}
  
  createAccount(): IKeypair {
    const pair = Keypair.random();
    return {
      publicKey: pair.publicKey(),
      secretKey: pair.secret(),
    };
  }

  async fundAccount(publicKey: string): Promise<boolean> {
    try {
      if (this.network !== "testnet") {
        throw new Error("Friendbot is only available on testnet");
      }

      const response = await fetch(`${this.friendBotUrl}?addr=${publicKey}`);

      if (!response.ok) {
        return false;
      }

      return true;
    } catch (error: unknown) {
      throw new Error(
        `Error when funding account with Friendbot: ${error as string}`
      );
    }
  }
  private async loadAccount(address: string): Promise<Horizon.AccountResponse> {
    try {
      return await this.server.loadAccount(address);
    } catch (error) {
      console.error(error);
      throw new Error("Account not found");
    }
  }

  private getAsset(assetCode: string, issuerPublicKey: string): Asset {
    if (assetCode === "XLM") {
      return Asset.native();
    }
    return new Asset(assetCode, issuerPublicKey);
  }

  async payment(
    senderPubKey: string,
    senderSecret: string,
    receiverPubKey: string,
    _receiverSecret: string,
    amount: string,
    assetCode: string = "XLM"
  ): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
    const sourceAccount = await this.loadAccount(senderPubKey);
    const sourceKeypair = Keypair.fromSecret(senderSecret);

    let asset = Asset.native();
    if (assetCode !== "XLM") {
      const balance = sourceAccount.balances.find(b => 
        b.asset_type !== "native" && (b as IAccountBalanceResponse).asset_code === assetCode
      );
      if (balance && balance.asset_type !== "native") {
        const assetIssuer = (balance as IAccountBalanceResponse).asset_issuer;
        asset = new Asset(assetCode, assetIssuer);
      }
    }

    const transaction = new TransactionBuilder(sourceAccount, {
      networkPassphrase: this.networkPassphrase,
      fee: BASE_FEE,
    })
      .addOperation(
        Operation.payment({
          amount,
          asset: asset,
          destination: receiverPubKey,
        })
      )
      .setTimeout(180)
      .build();

    transaction.sign(sourceKeypair);

    try {
      const result = await this.server.submitTransaction(transaction);

      return result;
    } catch (error) {
      console.error(error);
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any;
        if (err.response?.data?.extras?.result_codes) {
          console.error(
            "❌ Error en la transacción:",
            err.response.data.extras.result_codes
          );
        }
      } else {
        console.error("❌ Error general:", error);
      }
      throw error;
    }
  }

  async createAsset(
    issuerSecret: string,
    distributorSecret: string,
    assetCode: string,
    amount: string
  ) {
    const issuerKeys = Keypair.fromSecret(issuerSecret);
    const distributorKeys = Keypair.fromSecret(distributorSecret);
    const newAsset = new Asset(assetCode, issuerKeys.publicKey());
    const assetLimit = Number(amount) * 100;

    try {
      const distributorAccount = await this.loadAccount(
        distributorKeys.publicKey()
      );

      const trustTransaction = new TransactionBuilder(distributorAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(Operation.changeTrust({
          asset: newAsset,
          limit: assetLimit.toString(),
        }))
        .setTimeout(30)
        .build();

      trustTransaction.sign(distributorKeys);
      await this.server.submitTransaction(trustTransaction);

      const issuerAccount = await this.loadAccount(issuerKeys.publicKey());

      const issueTransaction = new TransactionBuilder(issuerAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: distributorKeys.publicKey(),
            asset: newAsset,
            amount,
          })
        )
        .setTimeout(30)
        .build();

      issueTransaction.sign(issuerKeys);
      const response = await this.server.submitTransaction(issueTransaction);

      return response;
    } catch (error) {
      console.error("Error creating asset:", error);
      throw error;
    }
  }

  async createClaimableBalance(
    assetCode: string,
    amount: string,
    senderSecretKey: string,
    destinationSecretKey: string
  ): Promise<ICreateClaimableBalanceResponse> {
    console.log("Ingresa a create Claimable");
    const sourceKeypair = Keypair.fromSecret(senderSecretKey);
    const destinationKeypair = Keypair.fromSecret(destinationSecretKey);
    const sourceAccount = await this.server.loadAccount(
      sourceKeypair.publicKey()
    );

    const asset = this.getAsset(assetCode, sourceKeypair.publicKey());
    console.log({ asset });

    const claimants = [
      new Claimant(
        sourceKeypair.publicKey(),
        Claimant.predicateUnconditional()
      ),
      new Claimant(
        destinationKeypair.publicKey(),
        Claimant.predicateUnconditional()
      ),
    ];

    const createClaimableBalanceOperation = Operation.createClaimableBalance({
      amount: amount.toString(),
      asset,
      claimants: claimants,
    });

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(createClaimableBalanceOperation)
      .setTimeout(180)
      .build();

    const claimableBalanceId = transaction.getClaimableBalanceId(0);

    transaction.sign(sourceKeypair);
    try {
      const response = await this.server.submitTransaction(transaction);
      return {
        transaction: response,
        claimableBalanceId,
      };
    } catch (error) {
      console.error(error);
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any;
        if (err.response?.data?.extras?.result_codes) {
          console.error(
            "❌ Error en la transacción:",
            err.response.data.extras.result_codes
          );
        }
      } else {
        console.error("❌ Error general:", error);
      }
      throw error;
    }
  }

  async claimClaimableBalance(
    claimant: string,
    claimableBalanceId: string
  ): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
    const claimantKeypair = Keypair.fromSecret(claimant);
    const claimantAccount = await this.server.loadAccount(
      claimantKeypair.publicKey()
    );

    const transaction = new TransactionBuilder(claimantAccount, {
      fee: (await this.server.fetchBaseFee()).toString(),
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.claimClaimableBalance({
          balanceId: claimableBalanceId,
          source: claimantKeypair.publicKey(),
        })
      )
      .setTimeout(180)
      .build();

    transaction.sign(claimantKeypair);

    try {
      return await this.server.submitTransaction(transaction);
    } catch (error) {
      console.error(error);
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any;
        if (err.response?.data?.extras?.result_codes) {
          console.error(
            "❌ Error en la transacción:",
            err.response.data.extras.result_codes
          );
        }
      } else {
        console.error("❌ Error general:", error);
      }
      throw error;
    }
  }
}



export const  stellarService = new StellarService();
