import {
  Asset,
  BASE_FEE,
  Claimant,
  contract,
  Horizon,
  Keypair,
  Operation,
  rpc,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

import {
  CONTRACT_ADDRESS,
  HORIZON_NETWORK_PASSPHRASE,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  STELLAR_FRIENDBOT_URL,
  STELLAR_NETWORK,
} from "../utils/constants";

import { IKeypair } from "../interfaces/keypair";

import { IAccountBalanceResponse } from "../interfaces/balance";

import { AccountBalance } from "../interfaces/account";

import { ICreateClaimableBalanceResponse } from "../interfaces/claimable-balance";

export class StellarService {
  private network: string;
  private horizonUrl: string;
  private server: Horizon.Server;
  private rpcServer: rpc.Server;
  private friendBotUrl: string;
  private networkPassphrase: string;
  private rpcUrl: string;
  private contractAddress: string;

  constructor() {
    this.network = STELLAR_NETWORK as string;
    this.horizonUrl = HORIZON_URL as string;
    this.rpcUrl = SOROBAN_RPC_URL as string;
    this.friendBotUrl = STELLAR_FRIENDBOT_URL as string;
    this.networkPassphrase = HORIZON_NETWORK_PASSPHRASE as string;
    this.contractAddress = CONTRACT_ADDRESS as string;

    // Validate required environment variables
    if (!this.contractAddress) {
      console.error("⚠️ PUBLIC_CONTRACT_ADDRESS is not set in .env file");
    }
    if (!this.rpcUrl) {
      console.error("⚠️ PUBLIC_STELLAR_RPC_URL is not set in .env file");
    }
    if (!this.networkPassphrase) {
      console.error("⚠️ PUBLIC_STELLAR_NETWORK_PASSPHRASE is not set in .env file");
    }

    this.server = new Horizon.Server(this.horizonUrl, {
      allowHttp: true,
    });
    this.rpcServer = new rpc.Server(this.rpcUrl, {
      allowHttp: true,
    });
  }

  async buildClient<T = unknown>(publicKey: string): Promise<T> {
    if (!this.contractAddress) {
      throw new Error("Contract address is not configured. Please set PUBLIC_CONTRACT_ADDRESS in your .env file.");
    }

    console.log("🔍 Building client with:", {
      publicKey,
      contractAddress: this.contractAddress,
      rpcUrl: this.rpcUrl,
      network: this.networkPassphrase.includes("Test") ? "testnet" : "mainnet"
    });

    // First, verify the account exists in the network
    try {
      const account = await this.server.loadAccount(publicKey);
      console.log("✅ Account exists:", {
        accountId: account.accountId(),
        balances: account.balances?.length || 0
      });
    } catch (accountError: any) {
      const accountErrorMsg = accountError instanceof Error ? accountError.message : String(accountError);
      const statusCode = accountError?.response?.status || accountError?.status || accountError?.statusCode;
      
      console.error("❌ Account check failed:", {
        statusCode,
        error: accountErrorMsg,
        publicKey,
        horizonUrl: this.horizonUrl
      });
      
      if (statusCode === 404 || accountErrorMsg.includes("not found") || accountErrorMsg.includes("404")) {
        const networkType = this.networkPassphrase.includes("Test") ? "testnet" : "mainnet";
        const friendbotUrl = `https://friendbot.stellar.org/?addr=${publicKey}`;
        const explorerUrl = `https://stellar.expert/explorer/${networkType}/account/${publicKey}`;
        
        // Create a clickable link in the console
        console.error("═══════════════════════════════════════════");
        console.error("❌ CUENTA NO EXISTE EN TESTNET");
        console.error("═══════════════════════════════════════════");
        console.error(`📝 Wallet: ${publicKey}`);
        console.error(`🔗 Fondear: ${friendbotUrl}`);
        console.error(`🔍 Verificar: ${explorerUrl}`);
        console.error("═══════════════════════════════════════════");
        
        const errorMsg = 
          `❌ Tu wallet no existe en ${networkType}\n\n` +
          `📝 Wallet: ${publicKey}\n\n` +
          `⚠️ IMPORTANTE:\n` +
          `1. Asegúrate de que tu wallet esté configurada para TESTNET (no mainnet)\n` +
          `2. Si usas Freighter/xBull, cambia la red a "Testnet" en la extensión\n` +
          `3. Abre este enlace para fondear: ${friendbotUrl}\n` +
          `4. Espera 30-60 segundos después de fondear\n` +
          `5. Verifica que existe: ${explorerUrl}\n` +
          `6. Recarga esta página y vuelve a intentar`;
        
        throw new Error(errorMsg);
      }
      // If it's a different error, continue to try building the client
    }

    // Try to build the client
    try {
      const client = await contract.Client.from({
        contractId: this.contractAddress,
        rpcUrl: this.rpcUrl,
        networkPassphrase: this.networkPassphrase,
        publicKey,
      });

      console.log("✅ Client built successfully");
      return client as T;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Failed to build client:", errorMessage);
      throw error;
    }
  }

  async submitTransaction(xdr: string): Promise<string | undefined> {
    try {
      const transaction = TransactionBuilder.fromXDR(
        xdr,
        this.networkPassphrase
      );
      const result = await this.server.submitTransaction(transaction);

      return result.hash;
    } catch (error: any) {
      console.error("❌ Error submitting transaction:", error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any;
        const resultCodes = err.response?.data?.extras?.result_codes;
        
        if (resultCodes) {
          console.error("❌ Error en la transacción:", resultCodes);
          
          // Handle specific error codes
          if (resultCodes.transaction === 'tx_bad_auth') {
            throw new Error(
              `❌ Error de autenticación (tx_bad_auth)\n\n` +
              `El wallet que construyó el cliente debe ser el mismo que firma la transacción.\n\n` +
              `Por favor:\n` +
              `1. Asegúrate de que el wallet conectado sea el admin\n` +
              `2. Reconecta tu wallet desde la página principal\n` +
              `3. Intenta crear el auto nuevamente`
            );
          }
          
          if (resultCodes.transaction === 'tx_bad_seq') {
            throw new Error(
              `Error de secuencia. Por favor intenta de nuevo en unos segundos.`
            );
          }
        }
        
        // Log full error response for debugging
        if (err.response?.data) {
          console.error("Full error response:", err.response.data);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error al enviar la transacción: ${errorMessage}`);
    }
  }

  environment(): { rpc: string; networkPassphrase: string } {
    return {
      rpc: this.rpcUrl,
      networkPassphrase: this.networkPassphrase,
    };
  }
}

export const stellarService = new StellarService();
