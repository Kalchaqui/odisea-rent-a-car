import {
    AlbedoModule,
    FREIGHTER_ID,
    FreighterModule,
    type ISupportedWallet,
    StellarWalletsKit,
    WalletNetwork,
    xBullModule,
  } from "@creit.tech/stellar-wallets-kit";
  import { stellarService, StellarService } from "./stellar.service";
  
  export class WalletService {
    private readonly kit: StellarWalletsKit;
    private readonly stellarService: StellarService;
  
    constructor(stellarService: StellarService) {
      this.stellarService = stellarService;
      this.kit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        selectedWalletId: FREIGHTER_ID,
        modules: [new xBullModule(), new FreighterModule(), new AlbedoModule()],
      });
    }
  
    async connect(): Promise<string> {
      return new Promise((resolve, reject) => {
        void this.kit.openModal({
          onWalletSelected: (option: ISupportedWallet) => {
            this.kit.setWallet(option.id);
            this.kit
              .getAddress()
              .then(({ address }) => resolve(address))
              .catch((error) =>
                reject(error instanceof Error ? error : new Error(String(error)))
              );
          },
        });
      });
    }
  
    async disconnect(): Promise<void> {
      await this.kit.disconnect();
    }
  
    async signTransaction(xdr: string): Promise<{
      signedTxXdr: string;
      signedAddress: string;
    }> {
      try {
        // Verify wallet is still connected before signing
        const address = await this.kit.getAddress();
        const signerAddress = address.address;
        console.log("🔐 Signing transaction with wallet:", signerAddress);
        
        const environment = this.stellarService.environment();
        const result = await this.kit.signTransaction(xdr, {
          networkPassphrase: environment.networkPassphrase,
        });
        
        // Ensure signedAddress is always present
        return {
          signedTxXdr: result.signedTxXdr,
          signedAddress: result.signedAddress || signerAddress,
        };
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = error?.code || error?.ext?.code;
        
        // User rejected the transaction
        if (errorCode === -4 || errorMessage.includes("rejected") || errorMessage.includes("denied") || errorMessage.includes("cancelled")) {
          throw new Error(
            `Transacción rechazada.\n\n` +
            `Has cancelado o rechazado la solicitud de firma en Freighter.\n\n` +
            `Si quieres crear el auto, por favor:\n` +
            `1. Intenta crear el auto nuevamente\n` +
            `2. Cuando aparezca el popup de Freighter, haz clic en "Sign" o "Firmar"\n` +
            `3. No hagas clic en "Reject" o "Cancel"`
          );
        }
        
        if (errorMessage.includes("not currently connected") || 
            errorMessage.includes("not connected") ||
            errorMessage.includes("disconnected")) {
          throw new Error(
            `Freighter no está conectado.\n\n` +
            `Por favor:\n` +
            `1. Abre la extensión de Freighter\n` +
            `2. Asegúrate de estar en TESTNET (no mainnet)\n` +
            `3. Conecta tu wallet nuevamente desde la página principal\n` +
            `4. Intenta crear el auto de nuevo`
          );
        }
        
        if (errorMessage.includes("network") || errorMessage.includes("Network")) {
          throw new Error(
            `Error de red: ${errorMessage}\n\n` +
            `Asegúrate de que Freighter esté configurado para TESTNET.`
          );
        }
        
        console.error("Error signing transaction:", error);
        throw error;
      }
    }
  }
  
  export const walletService = new WalletService(stellarService);