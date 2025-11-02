import { Heading, Icon, Text } from "@stellar/design-system";
import { useNavigate } from "react-router-dom";
import { useStellarAccounts } from "../providers/StellarAccountProvider.tsx";
import { UserRole } from "../interfaces/user-role.ts";

export default function RoleSelection() {
    const { setSelectedRole, selectedRole } = useStellarAccounts();
    const navigate = useNavigate();
  
    const handleRoleSelect = (role: UserRole) => {
      localStorage.setItem("role", role);
      setSelectedRole(role);
  
      void navigate("/cars");
    };
  
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <Heading as="h1" size="lg" className="text-purple-400 neon-text-purple">
              Select your role
            </Heading>
            <Text size="lg" as="p" className="text-gray-300">
              Do you want to hire a vehicle, put yours up for hire, or withdraw
              your earnings?
            </Text>
          </div>
  
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => handleRoleSelect(UserRole.ADMIN)}
              className={`group relative p-8 rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer glass ${
                selectedRole === UserRole.ADMIN
                  ? "border-purple-500/70 bg-purple-500/20 shadow-xl glow-purple"
                  : "border-purple-500/30 hover:border-purple-500/50 hover:glow-purple"
              }`}
            >
              <div className="space-y-4">
                <div
                  className={`inline-block p-4 rounded-full transition-all duration-300 ${
                    selectedRole === UserRole.ADMIN
                      ? "bg-purple-500/30 glow-purple"
                      : "bg-purple-500/10 group-hover:bg-purple-500/20"
                  }`}
                >
                  <Icon.UserSquare
                    className={`w-12 h-12 transition-colors duration-300 ${
                      selectedRole === UserRole.ADMIN
                        ? "text-purple-400 neon-text-purple"
                        : "text-purple-400/70 group-hover:text-purple-400"
                    }`}
                  />
                </div>
                <Heading as="h2" size="md" className="text-white">
                  Admin
                </Heading>
                <Text size="lg" as="p" className="text-gray-300">
                  Create the cars for hire and you can remove them.
                </Text>
              </div>
            </button>
  
            <button
              onClick={() => handleRoleSelect(UserRole.OWNER)}
              className={`group relative p-8 rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer glass ${
                selectedRole === UserRole.OWNER
                  ? "border-green-500/70 bg-green-500/20 shadow-xl glow-blue"
                  : "border-green-500/30 hover:border-green-500/50 hover:glow-blue"
              }`}
            >
              <div className="space-y-4">
                <div
                  className={`inline-block p-4 rounded-full transition-all duration-300 ${
                    selectedRole === UserRole.OWNER
                      ? "bg-green-500/30 glow-blue"
                      : "bg-green-500/10 group-hover:bg-green-500/20"
                  }`}
                >
                  <Icon.Car01
                    className={`w-12 h-12 transition-colors duration-300 ${
                      selectedRole === UserRole.OWNER
                        ? "text-green-400"
                        : "text-green-400/70 group-hover:text-green-400"
                    }`}
                  />
                </div>
                <Heading as="h2" size="md" className="text-white">
                  Owner
                </Heading>
                <Text size="lg" as="p" className="text-gray-300">
                  Check the status of your car and collect the profits generated
                </Text>
              </div>
            </button>
  
            <button
              onClick={() => handleRoleSelect(UserRole.RENTER)}
              className={`group relative p-8 rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer glass ${
                selectedRole === UserRole.RENTER
                  ? "border-blue-500/70 bg-blue-500/20 shadow-xl glow-blue"
                  : "border-blue-500/30 hover:border-blue-500/50 hover:glow-blue"
              }`}
            >
              <div className="space-y-4">
                <div
                  className={`inline-block p-4 rounded-full transition-all duration-300 ${
                    selectedRole === UserRole.RENTER
                      ? "bg-blue-500/30 glow-blue"
                      : "bg-blue-500/10 group-hover:bg-blue-500/20"
                  }`}
                >
                  <Icon.UserCircle
                    className={`w-12 h-12 transition-colors duration-300 ${
                      selectedRole === UserRole.RENTER
                        ? "text-blue-400 neon-text-blue"
                        : "text-blue-400/70 group-hover:text-blue-400"
                    }`}
                  />
                </div>
                <Heading as="h2" size="md" className="text-white">
                  Renter
                </Heading>
                <Text as="p" size="lg" className="text-gray-300">
                  Browse available vehicles and hire the one you need in a
                  transparent manner
                </Text>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

