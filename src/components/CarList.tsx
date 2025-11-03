import { useState, useEffect } from "react";
import { ICar } from "../interfaces/car";
import { CarStatus } from "../interfaces/car-status";
import { IRentACarContract } from "../interfaces/contract.ts";
import { UserRole } from "../interfaces/user-role";
import { useStellarAccounts } from "../providers/StellarAccountProvider";
import { stellarService } from "../services/stellar.service";
import { walletService } from "../services/wallet.service.ts";
import { shortenAddress } from "../utils/shorten-address";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";

interface CarsListProps {
  cars: ICar[];
}

export const CarsList = ({ cars }: CarsListProps) => {
  const { walletAddress, selectedRole, setHashId, setCars } =
    useStellarAccounts();

  // Load car info (status and available balance) for owners
  useEffect(() => {
    if (selectedRole === UserRole.OWNER && walletAddress && cars.length > 0) {
      cars.forEach((car) => {
        if (car.ownerAddress === walletAddress) {
          void loadCarInfo(car.ownerAddress);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, walletAddress, cars.length]);

  const loadCarInfo = async (owner: string) => {
    if (!walletAddress) return;
    try {
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);
      
      // get_car_info and get_car_status might return transaction objects that need simulate()
      let carInfoResult = contractClient.get_car_info({ owner });
      let statusResult = contractClient.get_car_status({ owner });
      
      let carInfo: [number, number];
      let status: CarStatus;
      
      // Handle car_info
      if (carInfoResult && typeof carInfoResult === 'object' && 'simulate' in carInfoResult) {
        const simulation = await (carInfoResult as any).simulate();
        carInfo = simulation?.result || simulation?.value || simulation;
      } else if (carInfoResult && typeof (carInfoResult as Promise<any>).then === 'function') {
        carInfo = await carInfoResult;
      } else {
        carInfo = carInfoResult as [number, number];
      }
      
      // Handle status - ensure it's a valid CarStatus string
      let statusValue: any;
      if (statusResult && typeof statusResult === 'object' && 'simulate' in statusResult) {
        try {
          let simulation = await (statusResult as any).simulate();
          console.log("📊 Full status simulation:", simulation);
          
          // If simulation is still an object with simulate(), call it again (shouldn't happen but handle it)
          let retryCount = 0;
          while (simulation && typeof simulation === 'object' && 'simulate' in simulation && retryCount < 2) {
            console.warn(`⚠️ Simulation result still has simulate() method, retrying (${retryCount + 1})...`);
            simulation = await (simulation as any).simulate();
            retryCount++;
          }
          
          // The simulation result can be in different formats
          // Try to extract the actual value from various possible structures
          if (simulation && typeof simulation === 'object') {
            // Check for nested result structures - the result is often in simulation.result
            if ('result' in simulation) {
              const result = simulation.result;
              if (result !== null && typeof result === 'object') {
                // Could be { result: { value: ... } } or { result: { name: ... } }
                statusValue = result.value ?? result.name ?? result.variant ?? result.tag;
                // If still object, try to get the first property
                if (statusValue === undefined && Object.keys(result).length > 0) {
                  const firstKey = Object.keys(result)[0];
                  statusValue = (result as any)[firstKey];
                }
              } else {
                // { result: number } or { result: string }
                statusValue = result;
              }
            } else if ('value' in simulation) {
              statusValue = simulation.value;
            } else if ('name' in simulation) {
              statusValue = simulation.name;
            } else {
              // Try to find a numeric or string value in the object
              const keys = Object.keys(simulation);
              for (const key of keys) {
                // Skip methods
                if (key === 'simulate' || key === 'sign' || key === 'signAndSend') continue;
                const val = (simulation as any)[key];
                if (typeof val === 'number' || typeof val === 'string') {
                  statusValue = val;
                  break;
                }
              }
              // If still not found, try to stringify and parse
              if (statusValue === undefined) {
                try {
                  const str = JSON.stringify(simulation);
                  // Try to extract number from string representation
                  const numMatch = str.match(/["']?(\d+)["']?/);
                  if (numMatch) {
                    statusValue = parseInt(numMatch[1], 10);
                  }
                } catch (e) {
                  // Ignore JSON stringify errors
                }
              }
            }
          } else {
            // Primitive value
            statusValue = simulation;
          }
        } catch (simError) {
          console.error("❌ Error calling simulate():", simError);
          // Fallback: try to use statusResult directly
          statusValue = statusResult;
        }
      } else if (statusResult && typeof (statusResult as Promise<any>).then === 'function') {
        statusValue = await statusResult;
      } else {
        statusValue = statusResult;
      }
      
      console.log("📊 Status value extracted:", statusValue, "type:", typeof statusValue);
      
      // Convert status to CarStatus enum string
      // Rust enum with #[repr(u32)] returns as number: 0=Available, 1=Rented, 2=Maintenance
      let statusStr: string;
      if (typeof statusValue === 'number') {
        // Map Rust enum index to CarStatus
        const statusMap: Record<number, CarStatus> = {
          0: CarStatus.AVAILABLE,
          1: CarStatus.RENTED,
          2: CarStatus.MAINTENANCE,
        };
        statusStr = statusMap[statusValue] || CarStatus.AVAILABLE;
        console.log(`📊 Mapped status number ${statusValue} to ${statusStr}`);
      } else if (typeof statusValue === 'string') {
        // Direct string match
        statusStr = Object.values(CarStatus).includes(statusValue as CarStatus) 
          ? statusValue 
          : CarStatus.AVAILABLE;
      } else if (statusValue && typeof statusValue === 'object') {
        // Try to extract numeric value from object properties
        const numValue = statusValue?.value ?? statusValue?.name ?? statusValue?.variant ?? statusValue?.tag;
        
        if (typeof numValue === 'number') {
          const statusMap: Record<number, CarStatus> = {
            0: CarStatus.AVAILABLE,
            1: CarStatus.RENTED,
            2: CarStatus.MAINTENANCE,
          };
          statusStr = statusMap[numValue] || CarStatus.AVAILABLE;
          console.log(`📊 Extracted number ${numValue} from object, mapped to ${statusStr}`);
        } else if (typeof numValue === 'string') {
          statusStr = Object.values(CarStatus).includes(numValue as CarStatus) 
            ? numValue 
            : CarStatus.AVAILABLE;
        } else {
          // Last resort: try to parse the object by stringifying
          const str = JSON.stringify(statusValue);
          if (str.includes('"Available"') || str.includes('"0"') || str.includes('Available')) {
            statusStr = CarStatus.AVAILABLE;
          } else if (str.includes('"Rented"') || str.includes('"1"') || str.includes('Rented')) {
            statusStr = CarStatus.RENTED;
          } else if (str.includes('"Maintenance"') || str.includes('"2"') || str.includes('Maintenance')) {
            statusStr = CarStatus.MAINTENANCE;
          } else {
            // If we still can't parse, but the object has a simulate method, 
            // it might be the transaction object itself - try calling simulate again
            if ('simulate' in statusValue && typeof statusValue.simulate === 'function') {
              console.warn("⚠️ Status value is still a transaction object, this shouldn't happen");
            }
            // Default to checking if object looks like it might be Rented (most common after rental)
            // But actually, let's be safe - find the car in state
            const currentCar = cars.find(c => c.ownerAddress === owner);
            statusStr = currentCar?.status || CarStatus.AVAILABLE;
            console.warn("⚠️ Could not parse status object, using car.status from state:", statusStr);
          }
        }
      } else {
        // Default to AVAILABLE if we can't determine, but check car.status from state first
        const currentCar = cars.find(c => c.ownerAddress === owner);
        statusStr = currentCar?.status || CarStatus.AVAILABLE;
        console.warn("⚠️ Could not determine status, defaulting to car.status from state:", statusStr);
      }
      
      status = statusStr as CarStatus;
      
      // If status parsing failed and we're preserving RENTED status, check current state
      const currentCar = cars.find(c => c.ownerAddress === owner);
      if (currentCar?.status === CarStatus.RENTED && status === CarStatus.AVAILABLE) {
        // If car was RENTED in state but we got AVAILABLE, it might be a parsing error
        // Keep RENTED status (the blockchain update might not be visible yet)
        console.warn("⚠️ Status mismatch: state shows RENTED but contract returned AVAILABLE. Keeping RENTED status.");
        status = CarStatus.RENTED;
      }
      
      const [, availableToWithdraw] = Array.isArray(carInfo) ? carInfo : [0, 0];
      
      console.log("✅ Final car info:", {
        owner,
        status,
        availableToWithdraw: availableToWithdraw / ONE_XLM_IN_STROOPS,
        previousStatus: currentCar?.status,
      });
      
      // Update car in state - ensure status is always a valid CarStatus string
      setCars((prev) =>
        prev.map((c) =>
          c.ownerAddress === owner
            ? { 
                ...c, 
                status: status as CarStatus, 
                availableToWithdraw: availableToWithdraw / ONE_XLM_IN_STROOPS 
              }
            : c
        )
      );
    } catch (error) {
      console.error("Error loading car info:", error);
    }
  };

  const handleDelete = async (owner: string) => {
    if (!walletAddress) return;
    
    try {
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);

      const result = await contractClient.remove_car({ owner });
      const xdr = result.toXDR();

      const signedTx = await walletService.signTransaction(xdr);
      const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

      // Update UI only after successful transaction
      setCars((prev) => prev.filter((car) => car.ownerAddress !== owner));
      setHashId(txHash as string);
    } catch (error) {
      console.error("Error deleting car:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Only show alert for actual errors, not for user cancellations
      if (!errorMessage.includes("rejected") && !errorMessage.includes("cancelado")) {
        alert(`Error al eliminar el auto: ${errorMessage}`);
      }
      // Don't throw - let the error be handled silently if user cancelled
    }
  };

  const handlePayout = async (owner: string, amount: number) => {
    try {
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);

      const result = await contractClient.payout_owner({ owner, amount });
      const xdr = result.toXDR();

      const signedTx = await walletService.signTransaction(xdr);
      const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

      setHashId(txHash as string);
      
      // Reload car info after payout
      await loadCarInfo(owner);
    } catch (error) {
      console.error("Error in payout:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("CarNotReturned")) {
        alert("No puedes retirar fondos. El auto debe estar devuelto (disponible) para poder retirar.");
      } else {
        alert(`Error al retirar: ${errorMessage}`);
      }
    }
  };

  const handleRent = async (
    car: ICar,
    renter: string,
    totalDaysToRent: number
  ) => {
    try {
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);

      // Use fixed commission amount from car
      const commissionAmount = car.commissionAmount || 1; // Default 1 XLM if not set
      const depositAmount = car.pricePerDay * totalDaysToRent * ONE_XLM_IN_STROOPS;
      const adminFee = commissionAmount * ONE_XLM_IN_STROOPS; // Convert XLM to stroops
      const totalCost = depositAmount + adminFee;

      // Show confirmation with fee breakdown
      const feeXLM = commissionAmount;
      const depositXLM = depositAmount / ONE_XLM_IN_STROOPS;
      const totalXLM = totalCost / ONE_XLM_IN_STROOPS;

      const confirmMessage = 
        `Confirmar alquiler:\n\n` +
        `Depósito: ${depositXLM.toFixed(2)} XLM\n` +
        `Comisión admin (fija): ${feeXLM.toFixed(2)} XLM\n` +
        `Total a pagar: ${totalXLM.toFixed(2)} XLM\n\n` +
        `¿Deseas continuar?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      // Verify wallet matches renter
      if (walletAddress !== renter) {
        alert(`Error: La wallet conectada (${walletAddress}) no coincide con el renter (${renter}). Por favor, conecta la wallet correcta.`);
        return;
      }

      // Prevent self-rental (can't rent your own car)
      if (renter === car.ownerAddress) {
        alert(`No puedes rentar tu propio auto. Conecta una wallet diferente como renter.`);
        return;
      }

      console.log("🚗 Renting car:", {
        renter,
        owner: car.ownerAddress,
        depositAmount: depositAmount / ONE_XLM_IN_STROOPS,
        commissionAmount: commissionAmount,
        adminFee: adminFee / ONE_XLM_IN_STROOPS,
        totalCost: totalCost / ONE_XLM_IN_STROOPS,
        totalDaysToRent,
      });

      const result = await contractClient.rental({
        renter,
        owner: car.ownerAddress,
        total_days_to_rent: totalDaysToRent,
        amount: depositAmount, // Contract calculates admin fee internally
      });
      const xdr = result.toXDR();

      console.log("✍️ Requesting signature for rental transaction...");
      const signedTx = await walletService.signTransaction(xdr);
      
      console.log("📝 Signed transaction details:", {
        signedAddress: signedTx.signedAddress,
        renter,
        walletAddress,
      });
      
      if (!signedTx.signedAddress) {
        console.error("❌ signedAddress is undefined!");
        alert(`Error: No se pudo verificar qué wallet firmó la transacción. Por favor, intenta nuevamente.`);
        return;
      }
      
      if (signedTx.signedAddress !== renter) {
        alert(`Error: La transacción fue firmada por ${signedTx.signedAddress}, pero el renter es ${renter}. Debes firmar con la wallet del renter.\n\nWallet conectada: ${walletAddress}\nRenter requerido: ${renter}`);
        return;
      }
      
      console.log("✅ Transaction signed by renter:", signedTx.signedAddress);
      const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);
      console.log("✅ Transaction submitted successfully:", txHash);

      // Update UI immediately after successful transaction
      setCars((prev) =>
        prev.map((c) =>
          c.ownerAddress === car.ownerAddress
            ? { ...c, status: CarStatus.RENTED }
            : c
        )
      );
      setHashId(txHash as string);
      
      alert(`✅ Auto alquilado exitosamente!\nHash: ${txHash}`);
    } catch (error) {
      console.error("❌ Error renting car:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Error details:", {
        errorMessage,
        error,
        renter,
        walletAddress,
        carOwner: car.ownerAddress,
      });
      
      // Don't show alert if user rejected/cancelled
      if (!errorMessage.includes("rejected") && 
          !errorMessage.includes("cancelado") && 
          !errorMessage.includes("rechazada") &&
          !errorMessage.includes("User rejected")) {
        let userMessage = `Error al alquilar: ${errorMessage}`;
        
        // Provide specific error messages
        if (errorMessage.includes("tx_bad_auth")) {
          userMessage = `Error de autenticación: La wallet que firmó la transacción no coincide con el renter. Asegúrate de estar conectado con la wallet correcta (${renter}).`;
        } else if (errorMessage.includes("insufficient_balance") || errorMessage.includes("balance")) {
          userMessage = `Error: No tienes suficientes fondos. Necesitas ${(totalCost / ONE_XLM_IN_STROOPS).toFixed(2)} XLM para alquilar este auto.`;
        } else if (errorMessage.includes("SelfRentalNotAllowed") || errorMessage.includes("self rental")) {
          userMessage = `Error: No puedes rentar tu propio auto. El renter y el owner no pueden ser la misma cuenta.`;
        } else if (errorMessage.includes("expected to fail")) {
          userMessage = `Error: La transacción está configurada para fallar. Revisa que:\n- No estés intentando rentar tu propio auto\n- Tengas suficientes fondos\n- La wallet conectada sea la del renter`;
        }
        
        alert(userMessage);
      }
    }
  };

  const getStatusStyle = (status: CarStatus) => {
    switch (status) {
      case CarStatus.AVAILABLE:
        return "px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/50 glow-blue";
      case CarStatus.RENTED:
        return "px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50 neon-text-blue";
      case CarStatus.MAINTENANCE:
        return "px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
      default:
        return "px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/50";
    }
  };

  const renderActionButton = (car: ICar) => {
    if (selectedRole === UserRole.ADMIN) {
      return (
        <button
          onClick={() => void handleDelete(car.ownerAddress)}
          className="px-3 py-1 bg-red-600/80 text-white rounded font-semibold hover:bg-red-600 hover:glow-blue transition-all cursor-pointer border border-red-500/50"
        >
          Delete
        </button>
      );
    }

    if (selectedRole === UserRole.OWNER) {
      // Owners can only withdraw when car is available (returned)
      const canWithdraw = car.status === CarStatus.AVAILABLE && 
                         (car.availableToWithdraw ?? 0) > 0;
      const availableAmount = car.availableToWithdraw ?? 0;
      
      return (
        <button
          onClick={() => {
            if (availableAmount > 0) {
              void handlePayout(car.ownerAddress, availableAmount * ONE_XLM_IN_STROOPS);
            }
          }}
          disabled={!canWithdraw}
          className={`px-3 py-1 rounded font-semibold transition-all ${
            canWithdraw
              ? "bg-green-600/80 text-white hover:bg-green-600 hover:glow-blue cursor-pointer border border-green-500/50"
              : "bg-gray-600/30 text-gray-500 cursor-not-allowed border border-gray-500/30"
          }`}
          title={
            !canWithdraw
              ? car.status !== CarStatus.AVAILABLE
                ? "El auto debe estar devuelto (Available) para retirar fondos"
                : "No hay fondos disponibles para retirar"
              : `Retirar ${availableAmount.toFixed(2)} XLM disponibles`
          }
        >
          Withdraw
        </button>
      );
    }

    if (selectedRole === UserRole.RENTER) {
      const isOwner = walletAddress === car.ownerAddress;
      
      // Show "Rent" button only if car is available and not owned by renter
      if (car.status === CarStatus.AVAILABLE && !isOwner) {
        return (
          <button
            onClick={() => void handleRent(car, walletAddress, 3)}
            disabled={isOwner}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              isOwner
                ? "bg-gray-600/30 text-gray-500 cursor-not-allowed border border-gray-500/30"
                : "bg-blue-600/80 text-white hover:bg-blue-600 hover:glow-blue cursor-pointer border border-blue-500/50 neon-text-blue"
            }`}
            title={isOwner ? "No puedes rentar tu propio auto" : "Rentar este auto"}
          >
            Rent
          </button>
        );
      }
    }

    return null;
  };

  return (
    <div data-test="cars-list" className="text-white">
      <div>
        <table className="min-w-full glass shadow-xl rounded-lg border border-blue-500/30">
          <thead className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider neon-text-blue">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider neon-text-blue">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider neon-text-blue">
                Color
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider neon-text-blue">
                Passengers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider neon-text-blue">
                A/C
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider neon-text-blue">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider neon-text-blue">
                Price/Day
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider neon-text-blue">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider neon-text-blue">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-500/20">
            {cars.map((car, index) => (
              <tr key={index} className="hover:bg-blue-500/10 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {car.brand}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {car.model}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {car.color}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {car.passengers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {car.ac ? (
                    <span className="text-green-400 font-semibold">Yes</span>
                  ) : (
                    <span className="text-red-400 font-semibold">No</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {shortenAddress(car.ownerAddress)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                  ${car.pricePerDay}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span className={getStatusStyle(car.status)}>
                    {typeof car.status === 'string' ? car.status : String(car.status || CarStatus.AVAILABLE)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {renderActionButton(car)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};