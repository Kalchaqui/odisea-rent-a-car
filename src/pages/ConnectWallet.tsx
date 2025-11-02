import { Button, Icon, Text } from "@stellar/design-system";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStellarAccounts } from "../providers/StellarAccountProvider.tsx";
import { walletService } from "../services/wallet.service.ts";

export default function ConnectWallet() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { setWalletAddress } = useStellarAccounts();
  const navigate = useNavigate();

  const handleConnectWallet = async () => {
    setIsConnecting(true);

    try {
      const address = await walletService.connect();
      localStorage.setItem("wallet", address);

      setWalletAddress(address);
      void navigate("/role-selection");
    } catch (error) {
      console.error(error);
      setIsConnecting(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[65vh] relative overflow-hidden"
      style={{
        backgroundImage: 'url(/futuristic-car.png)',
        backgroundSize: '50%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27]/30 via-transparent to-[#0a0e27]/40 z-0"></div>
      
      
      <div className="text-center space-y-4 px-4 relative z-20 mb-8">
        <h1 
          className="text-5xl font-bold text-purple-400 text-balance uppercase drop-shadow-2xl"
          style={{
            textShadow: '0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.6)',
            opacity: 0.85
          }}
        >
          Stellar Car Rental
        </h1>
        <Text as="p" size="lg" className="text-gray-200 drop-shadow-lg" style={{ opacity: 0.9 }}>
          Connect your wallet to access the decentralized rental platform
        </Text>
      </div>

      
      <div className="flex justify-center mt-auto mb-16 relative z-10">
        <button
          onClick={() => void handleConnectWallet()}
          disabled={isConnecting}
          className={`
            px-8 py-4 rounded-xl font-semibold text-lg
            bg-gradient-to-r from-blue-600/90 to-purple-600/90
            hover:from-blue-600 hover:to-purple-600
            text-white
            border-2 border-purple-400/50
            shadow-lg hover:shadow-xl
            transition-all duration-200
            flex items-center gap-3
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
            glow-blue
          `}
        >
          {isConnecting ? (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Icon.Wallet02 className="w-6 h-6" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

