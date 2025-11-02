import { useState, useEffect } from "react";
import { IRentACarContract } from "../interfaces/contract.ts";
import { useStellarAccounts } from "../providers/StellarAccountProvider.tsx";
import { stellarService } from "../services/stellar.service.ts";
import { walletService } from "../services/wallet.service.ts";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops.ts";

export const AdminFeeManager = () => {
  const { walletAddress, setHashId, hashId } = useStellarAccounts();
  const [adminFeesBalance, setAdminFeesBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      void loadAdminFeeInfo();
    }
  }, [walletAddress]);

  // Reload balance when a transaction completes (hashId changes)
  useEffect(() => {
    if (walletAddress && hashId) {
      // Small delay to ensure contract state is updated
      const timer = setTimeout(() => {
        void loadAdminFeeInfo();
      }, 2000); // Wait 2 seconds for transaction to be confirmed
      
      return () => clearTimeout(timer);
    }
  }, [hashId, walletAddress]);

  const loadAdminFeeInfo = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);
      
      // Try to get the value - it might return a transaction object that needs simulate()
      let balanceResult = contractClient.get_admin_fees_balance();
      console.log("📊 balanceResult type:", typeof balanceResult);
      console.log("📊 balanceResult constructor:", balanceResult?.constructor?.name);
      
      // First check if it's a Promise
      if (balanceResult && typeof (balanceResult as Promise<any>).then === 'function') {
        console.log("📊 balanceResult is a Promise, awaiting...");
        balanceResult = await balanceResult;
        console.log("📊 After await, balanceResult:", balanceResult);
      }
      
      // Check if it has a simulate method (for read-only functions)
      let balance: any;
      const hasSimulate = balanceResult && 
                         typeof balanceResult === 'object' && 
                         'simulate' in balanceResult &&
                         typeof (balanceResult as any).simulate === 'function';
      
      console.log("📊 balanceResult has simulate:", hasSimulate);
      
      if (hasSimulate) {
        try {
          console.log("📊 Calling simulate()...");
          const simulation = await (balanceResult as any).simulate();
          console.log("📊 Full simulation object:", JSON.stringify(simulation, null, 2));
          
          // Extract the result value - it could be nested in different places
          balance = simulation?.result?.value 
                 || simulation?.result
                 || simulation?.value?.value
                 || simulation?.value
                 || simulation;
          
          console.log("📊 Extracted balance from simulation:", balance, "type:", typeof balance);
        } catch (simError) {
          console.error("❌ Error simulating:", simError);
          // Fallback: try to use the object directly
          balance = balanceResult;
        }
      } else if (balanceResult && typeof (balanceResult as Promise<any>).then === 'function') {
        balance = await balanceResult;
      } else {
        balance = balanceResult;
      }
      
      console.log("📊 Raw balance result:", balance);
      console.log("📊 Balance type:", typeof balance);
      console.log("📊 Balance constructor:", balance?.constructor?.name);
      
      // Convert to number, handling different types (BigNumber, string, number, etc.)
      let balanceNum = 0;
      if (typeof balance === 'number') {
        balanceNum = balance;
      } else if (typeof balance === 'string') {
        balanceNum = parseInt(balance, 10) || parseFloat(balance) || 0;
      } else if (balance && typeof balance === 'object') {
        // Try common BigNumber/object properties
        if (typeof balance?.toString === 'function') {
          const strValue = balance.toString();
          balanceNum = parseInt(strValue, 10) || parseFloat(strValue) || 0;
        } else {
          balanceNum = balance?.value || balance?.toNumber?.() || Number(balance) || 0;
        }
      } else {
        balanceNum = Number(balance) || 0;
      }
      
      console.log("📊 Admin fees balance from contract:", balance, "→ converted:", balanceNum);
      console.log("📊 Balance in XLM:", balanceNum / ONE_XLM_IN_STROOPS);
      
      // Validate that we got a valid number
      if (isNaN(balanceNum)) {
        console.warn("Invalid balance value from contract:", balance);
      }
      
      setAdminFeesBalance(isNaN(balanceNum) ? 0 : balanceNum);
    } catch (error) {
      console.error("Error loading admin fees balance:", error);
      setAdminFeesBalance(0);
    } finally {
      setLoading(false);
    }
  };


  const handleWithdrawAllFees = async () => {
    if (!walletAddress) return;

    if (adminFeesBalance === 0) {
      alert("No hay comisiones acumuladas para retirar");
      return;
    }

    const totalXLM = (Number(adminFeesBalance) || 0) / ONE_XLM_IN_STROOPS;
    const confirmMessage = 
      `¿Retirar todas las comisiones acumuladas?\n\n` +
      `Monto total: ${totalXLM.toFixed(2)} XLM\n\n` +
      `¿Deseas continuar?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);

      const result = await contractClient.withdraw_admin_fees({ amount: adminFeesBalance });
      const xdr = result.toXDR();

      const signedTx = await walletService.signTransaction(xdr);
      const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

      setHashId(txHash as string);
      await loadAdminFeeInfo();
    } catch (error) {
      console.error("Error withdrawing admin fees:", error);
      alert(`Error al retirar comisiones: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="glass p-4 rounded-lg shadow-xl border border-purple-500/30">
        <p className="text-gray-300">Cargando información de comisiones...</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass p-6 rounded-lg shadow-xl mb-6 border border-purple-500/30 glow-purple">
        <h2 className="text-xl font-bold mb-4 text-purple-400 neon-text-purple">Gestión de Comisiones</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-4 rounded-lg border border-blue-500/30">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm text-gray-300">Comisiones Acumuladas</div>
              <button
                onClick={() => void loadAdminFeeInfo()}
                className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors"
                title="Recargar balance"
              >
                🔄 Actualizar
              </button>
            </div>
            <div className="text-2xl font-bold text-green-400 neon-text-blue">
              {((Number(adminFeesBalance) || 0) / ONE_XLM_IN_STROOPS).toFixed(2)} XLM
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Las comisiones se calculan según el monto fijo configurado en cada auto
            </p>
            {adminFeesBalance > 0 && (
              <p className="text-xs text-green-400 mt-1 font-semibold">
                ✓ Hay comisiones disponibles para retirar
              </p>
            )}
          </div>
          
          <div className="flex gap-2 items-end">
            <button
              onClick={() => void handleWithdrawAllFees()}
              disabled={!adminFeesBalance || adminFeesBalance <= 0}
              className={`w-full px-4 py-2 rounded font-semibold transition-all ${
                adminFeesBalance > 0
                  ? "bg-green-600/80 text-white hover:bg-green-600 hover:glow-blue cursor-pointer border border-green-500/50"
                  : "bg-gray-600/30 text-gray-500 cursor-not-allowed border border-gray-500/30"
              }`}
              title={adminFeesBalance > 0 ? `Retirar ${((Number(adminFeesBalance) || 0) / ONE_XLM_IN_STROOPS).toFixed(2)} XLM` : "No hay comisiones acumuladas"}
            >
              Retirar Todo
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

