import { CarsList } from "../components/CarList";
import { CreateCarForm } from "../components/CreateCarForm";
import { AdminFeeManager } from "../components/AdminFeeManager.tsx";
import StellarExpertLink from "../components/StellarExpertLink";
import useModal from "../hooks/useModal";
import { ICar } from "../interfaces/car.ts";
import { CarStatus } from "../interfaces/car-status.ts";
import { IRentACarContract } from "../interfaces/contract.ts";
import { CreateCar } from "../interfaces/create-car.ts";
import { UserRole } from "../interfaces/user-role.ts";
import { useStellarAccounts } from "../providers/StellarAccountProvider.tsx";
import { stellarService } from "../services/stellar.service.ts";
import { walletService } from "../services/wallet.service.ts";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops.ts";
import { Keypair } from "@stellar/stellar-sdk";

export default function Dashboard() {
  const { hashId, cars, walletAddress, setCars, setHashId, selectedRole } =
    useStellarAccounts();
  const { showModal, openModal, closeModal } = useModal();

  const handleCreateCar = async (formData: CreateCar) => {
    if (!walletAddress) {
      alert("Por favor, conecta tu wallet primero");
      throw new Error("Wallet not connected");
    }

      const { brand, model, color, passengers, pricePerDay, ac, ownerAddress, commissionAmount } =
        formData;

    if (!ownerAddress || ownerAddress.trim() === "") {
      alert("Por favor, ingresa una dirección de owner válida");
      throw new Error("Owner address is required");
    }

    // Validate Stellar address format (but don't check if account exists)
    try {
      Keypair.fromPublicKey(ownerAddress);
    } catch (error) {
      alert("Formato de dirección Stellar inválido. Por favor verifica la dirección.");
      throw new Error("Invalid address format");
    }

    try {
      // IMPORTANT: walletAddress is the admin who creates the car
      // This wallet MUST be the same one that signs the transaction
      console.log("🔧 Building contract client with admin wallet:", walletAddress);
      
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);

      // Validate commission amount
      if (!commissionAmount || commissionAmount <= 0) {
        alert("El monto de comisión debe ser mayor a 0 XLM");
        throw new Error("Invalid commission amount");
      }

      // ownerAddress can be any valid Stellar address, doesn't need to exist yet
      const addCarResult = await contractClient.add_car({
        owner: ownerAddress,
        price_per_day: pricePerDay * ONE_XLM_IN_STROOPS,
        commission_amount: commissionAmount * ONE_XLM_IN_STROOPS, // Convert XLM to stroops
      });
      const xdr = addCarResult.toXDR();

      console.log("✍️ Requesting transaction signature...");
      console.log("📝 Admin wallet (MUST match signer):", walletAddress);
      
      const signedTx = await walletService.signTransaction(xdr);
      console.log("✅ Transaction signed successfully");
      
      // Verify the signer matches the admin - CRITICAL for contract auth
      // The admin wallet that builds the client MUST be the same that signs
      if (signedTx.signedAddress && signedTx.signedAddress !== walletAddress) {
        const errorMsg = 
          `❌ Error: El wallet que firma la transacción (${signedTx.signedAddress}) no coincide con el admin conectado (${walletAddress})\n\n` +
          `⚠️ IMPORTANTE: El admin que crea el auto debe ser el mismo que firma.\n\n` +
          `El wallet conectado (admin) debe ser: ${walletAddress}\n` +
          `Pero está firmando: ${signedTx.signedAddress}\n\n` +
          `SOLUCIÓN:\n` +
          `1. Ve a la página principal y desconecta tu wallet\n` +
          `2. Reconecta usando el wallet ADMIN: ${walletAddress}\n` +
          `3. Vuelve a intentar crear el auto`;
        
        console.error("❌ Wallet mismatch:", {
          adminWallet: walletAddress,
          signerWallet: signedTx.signedAddress
        });
        throw new Error(errorMsg);
      }
      
      console.log("✅ Admin wallet matches signer:", walletAddress);
      
      const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);
      console.log("📤 Transaction submitted:", txHash);

      const newCar: ICar = {
        brand,
        model,
        color,
        passengers,
        pricePerDay,
        ac,
        ownerAddress,
        status: CarStatus.AVAILABLE,
        commissionAmount: commissionAmount || 1,
      };

      setCars((prevCars) => [...prevCars, newCar]);
      setHashId(txHash as string);
      closeModal();
    } catch (error) {
      console.error("Error creating car:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Don't show alert if user rejected/cancelled the transaction
      if (errorMessage.includes("rejected") || errorMessage.includes("cancelado") || errorMessage.includes("rechazada")) {
        // User cancelled - don't show error, just return silently
        return;
      }
      
      // Check if error is about admin wallet (not owner address)
      if (errorMessage.includes("Account not found")) {
        alert("Your wallet account was not found in the network. Please:\n1. Ensure your wallet is connected\n2. Make sure you're on the correct network (testnet)\n3. Fund your account if needed");
      } else if (errorMessage.includes("contract") || errorMessage.includes("Contract")) {
        alert("Contract error. Please check the contract ID configuration.");
      } else {
        alert(`Error creating car: ${errorMessage}`);
      }
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-400 neon-text-purple" data-test="dashboard-title">
          Cars Catalog
        </h1>
        {selectedRole === UserRole.ADMIN && (
          <>
            {!walletAddress && (
              <p className="text-red-400 text-sm mr-4">
                Please connect your wallet to add cars
              </p>
            )}
            <button
              onClick={openModal}
              disabled={!walletAddress}
              className="group px-6 py-3 bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-600 hover:glow-blue disabled:from-gray-600/30 disabled:to-gray-600/30 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none cursor-pointer border border-purple-500/50"
            >
              <span className="flex items-center gap-2">Add Car</span>
            </button>
          </>
        )}
      </div>

      {selectedRole === UserRole.ADMIN && <AdminFeeManager />}

      {cars && <CarsList cars={cars} />}

      {showModal && (
        <CreateCarForm 
          onCreateCar={handleCreateCar} 
          onCancel={closeModal}
          walletAddress={walletAddress}
        />
      )}

      {hashId && <StellarExpertLink url={hashId} />}
    </div>
  );
}

