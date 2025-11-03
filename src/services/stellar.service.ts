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
      console.log("📤 Submitting transaction XDR length:", xdr.length);
      
      // For Soroban contract transactions, submit via RPC
      // For regular Stellar transactions, submit via Horizon
      try {
        console.log("🔷 Attempting to submit via RPC server (Soroban transaction)");
        
        // Parse XDR to TransactionEnvelope for RPC
        const envelope = xdr.TransactionEnvelope.fromXDR(xdr, "base64");
        console.log("📦 Parsed XDR to TransactionEnvelope");
        
        // Send via RPC (this is the correct method for Soroban)
        // The RPC server expects a TransactionEnvelope
        const result = await this.rpcServer.sendTransaction(envelope);
        console.log("✅ Transaction submitted via RPC:", result);
        
        // The result from sendTransaction should have a hash property
        // Result type: { hash: string, status: string, ... }
        if (result && typeof result === 'object') {
          const resultAny = result as any;
          
          // Check if we have a hash directly
          if (resultAny.hash) {
            return resultAny.hash;
          }
          
          // Check status
          const status = resultAny.status;
          if (status) {
            // Check if status indicates success or pending
            const isSuccess = status === "SUCCESS" || 
                             status === "PENDING" ||
                             status === rpc.GetTransactionStatus.SUCCESS ||
                             status === rpc.GetTransactionStatus.PENDING;
            
            if (isSuccess) {
              // Transaction was accepted, compute hash from the envelope
              // Use TransactionBuilder to parse and get hash
              try {
                const txBuilder = TransactionBuilder.fromXDR(xdr, this.networkPassphrase);
                return txBuilder.hash().toString("hex");
              } catch (parseErr) {
                // If parsing fails, try alternative method
                console.warn("Could not parse XDR for hash, trying alternative:", parseErr);
              }
            } else {
              // Transaction failed
              const errorXdr = resultAny.errorResultXdr;
              if (errorXdr) {
                throw new Error(`Transaction failed with status: ${status}. Error XDR: ${errorXdr}`);
              }
              throw new Error(`Transaction failed with status: ${status}`);
            }
          }
        }
        
        // Last resort: compute hash from the XDR using TransactionBuilder
        try {
          const txBuilder = TransactionBuilder.fromXDR(xdr, this.networkPassphrase);
          return txBuilder.hash().toString("hex");
        } catch (hashErr) {
          console.error("❌ Could not compute transaction hash:", hashErr);
          throw new Error("Could not extract transaction hash from result or XDR");
        }
      } catch (rpcError: any) {
        console.warn("⚠️ RPC submission failed, trying Horizon as fallback:", rpcError);
        
        // Fallback to Horizon for regular Stellar transactions
        try {
          const transaction = TransactionBuilder.fromXDR(
            xdr,
            this.networkPassphrase
          );
          const result = await this.server.submitTransaction(transaction);
          console.log("✅ Transaction submitted via Horizon:", result.hash);
          return result.hash;
        } catch (horizonError: any) {
          console.error("❌ Horizon submission also failed:", horizonError);
          
          // Provide a helpful error message
          const rpcErrorMsg = rpcError instanceof Error ? rpcError.message : String(rpcError);
          const horizonErrorMsg = horizonError instanceof Error ? horizonError.message : String(horizonError);
          
          // If RPC error is about malformed transaction, use that
          if (rpcErrorMsg.includes("malformed") || rpcErrorMsg.includes("tx_malformed")) {
            throw new Error(
              `❌ Error: La transacción está mal formada (tx_malformed)\n\n` +
              `Esto puede deberse a un problema con la firma o la construcción de la transacción.\n\n` +
              `Por favor intenta:\n` +
              `1. Recargar la página\n` +
              `2. Desconectar y reconectar tu wallet\n` +
              `3. Verificar que tu wallet esté en TESTNET\n` +
              `4. Intentar crear el auto nuevamente`
            );
          }
          
          // Otherwise, throw the RPC error as it's more specific for Soroban
          throw rpcError;
        }
      }
    } catch (error: any) {
      console.error("❌ Error submitting transaction:", error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any;
        const resultCodes = err.response?.data?.extras?.result_codes;
        
        if (resultCodes) {
          console.error("❌ Error en la transacción:", resultCodes);
          
          // Handle specific error codes
          if (resultCodes.transaction === 'tx_malformed') {
            throw new Error(
              `❌ Error: La transacción está mal formada (tx_malformed)\n\n` +
              `Esto puede deberse a:\n` +
              `1. Problema con la firma de la transacción\n` +
              `2. La XDR no está correctamente formada\n` +
              `3. Problema con el SDK de Soroban\n\n` +
              `Por favor intenta:\n` +
              `1. Recargar la página\n` +
              `2. Desconectar y reconectar tu wallet\n` +
              `3. Intentar crear el auto nuevamente`
            );
          }
          
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
