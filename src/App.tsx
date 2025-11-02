import { Button, Layout, Profile } from "@stellar/design-system";
import { Outlet, Route, Routes, useNavigate } from "react-router-dom";
import AccountManager from "./components/AccountManager";
import { shortenAddress } from "./utils/shorten-address.ts";
import { useStellarAccounts } from "./providers/StellarAccountProvider.tsx";
import ConnectWallet from "./pages/ConnectWallet.tsx";
import RoleSelection from "./pages/RoleSelection.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { walletService } from "./services/wallet.service.ts";

const AppLayout: React.FC = () => {
  const { walletAddress, selectedRole, setWalletAddress } = useStellarAccounts();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    };

    if (showWalletMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showWalletMenu]);

  const handleDisconnect = async () => {
    try {
      await walletService.disconnect();
      localStorage.removeItem("wallet");
      localStorage.removeItem("role");
      setWalletAddress("");
      setShowWalletMenu(false);
      navigate("/");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      // Still disconnect locally even if wallet service fails
      localStorage.removeItem("wallet");
      localStorage.removeItem("role");
      setWalletAddress("");
      setShowWalletMenu(false);
      navigate("/");
    }
  };

  const handleChangeWallet = async () => {
    try {
      await walletService.disconnect();
      localStorage.removeItem("wallet");
      localStorage.removeItem("role");
      setWalletAddress("");
      setShowWalletMenu(false);
      navigate("/");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      // Still disconnect locally
      localStorage.removeItem("wallet");
      localStorage.removeItem("role");
      setWalletAddress("");
      setShowWalletMenu(false);
      navigate("/");
    }
  };

  return (
    <main className="bg-gradient-to-b from-[#0a0e27] via-[#0f172a] to-[#121633] min-h-screen">
      <Layout.Header
        projectId="My App"
        projectTitle="Rent a car"
        contentCenter={
          <>
            <nav className="flex justify-between gap-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `font-medium transition-all duration-200 ${
                    isActive
                      ? "text-blue-400 border-b-2 border-blue-400 pb-1 neon-text-blue"
                      : "text-gray-300 hover:text-blue-400"
                  }`
                }
              >
                Connect Wallet
              </NavLink>

              <NavLink
                to="/role-selection"
                className={({ isActive }) =>
                  `font-medium transition-all duration-200 ${
                    isActive
                      ? "text-blue-400 border-b-2 border-blue-400 pb-1 neon-text-blue"
                      : "text-gray-300 hover:text-blue-400"
                  }`
                }
              >
                Select Role
              </NavLink>

              {selectedRole && (
                <NavLink
                  to="/cars"
                  className={({ isActive }) =>
                    `font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                        : "text-gray-700 hover:text-blue-600"
                    }`
                  }
                >
                  Car List
                </NavLink>
              )}
            </nav>
          </>
        }
        contentRight={
          <>
            <nav className="relative">
              {walletAddress && (
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="tertiary"
                    size="md"
                    onClick={() => setShowWalletMenu(!showWalletMenu)}
                  >
                  <Profile
                    publicAddress={shortenAddress(walletAddress)}
                    size="md"
                  />
                </Button>
                  {showWalletMenu && (
                    <div className="absolute right-0 mt-2 w-56 glass rounded-lg shadow-xl z-50 border border-purple-500/30 glow-purple">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-200 border-b border-purple-500/30">
                          <div className="font-medium text-blue-400">Wallet conectada</div>
                        </div>
                        <button
                          onClick={() => void handleChangeWallet()}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
                        >
                          Cambiar wallet
                        </button>
                        <button
                          onClick={() => void handleDisconnect()}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Desconectar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </>
        }
      />
      <div className="min-h-[65vh]">
        <Outlet />
      </div>
      <Layout.Footer>
        <span className="text-gray-400">
          © {new Date().getFullYear()} My App. Licensed under the Diego Raúl Barrionuevo{" "}
          <a
            href="http://www.apache.org/licenses/LICENSE-2.0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-purple-400 transition-colors"
          >
            Apache License, Version 2.0
          </a>
          .
        </span>
      </Layout.Footer>
    </main>
  );
};

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<ConnectWallet />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/cars" element={<Dashboard />} />
        <Route path="/horizon-example" element={<AccountManager />} />
      </Route>
    </Routes>
  );
}