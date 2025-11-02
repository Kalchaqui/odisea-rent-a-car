import { useState, useEffect } from "react";
import { CreateCar } from "../interfaces/create-car";
import Modal from "./Modal";

interface CreateCarFormProps {
  onCreateCar: (formData: CreateCar) => Promise<void>;
  onCancel: () => void;
  walletAddress?: string;
}

export const CreateCarForm = ({
  onCreateCar,
  onCancel,
  walletAddress,
}: CreateCarFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCar>({
    brand: "",
    model: "",
    color: "",
    passengers: 1,
    pricePerDay: 0,
    ac: false,
    ownerAddress: walletAddress || "",
    commissionAmount: 1, // Default 1 XLM
  });

  useEffect(() => {
    if (walletAddress) {
      setFormData((prev) => ({ ...prev, ownerAddress: walletAddress }));
    }
  }, [walletAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onCreateCar(formData);
    } catch (error) {
      console.error("Error creating car:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Create New Car" closeModal={onCancel}>
      <div className="glass rounded-lg px-8 border border-purple-500/30">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="brand"
              className="block text-sm font-medium text-gray-300"
            >
              Brand
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              value={formData.brand}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-800/50 border border-blue-500/30 text-white placeholder-gray-500 shadow-sm focus:border-blue-400 focus:ring-blue-400 focus:ring-2 focus:ring-opacity-50 p-2"
            />
          </div>

          <div>
            <label
              htmlFor="model"
              className="block text-sm font-medium text-gray-300"
            >
              Model
            </label>
            <input
              id="model"
              name="model"
              type="text"
              value={formData.model}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-800/50 border border-blue-500/30 text-white placeholder-gray-500 shadow-sm focus:border-blue-400 focus:ring-blue-400 focus:ring-2 focus:ring-opacity-50 p-2"
            />
          </div>

          <div>
            <label
              htmlFor="color"
              className="block text-sm font-medium text-gray-300"
            >
              Color
            </label>
            <input
              id="color"
              name="color"
              type="text"
              value={formData.color}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-800/50 border border-blue-500/30 text-white placeholder-gray-500 shadow-sm focus:border-blue-400 focus:ring-blue-400 focus:ring-2 focus:ring-opacity-50 p-2"
            />
          </div>

          <div>
            <label
              htmlFor="passengers"
              className="block text-sm font-medium text-gray-300"
            >
              Number of Passengers
            </label>
            <input
              id="passengers"
              name="passengers"
              type="number"
              min="1"
              max="10"
              value={formData.passengers}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-800/50 border border-blue-500/30 text-white placeholder-gray-500 shadow-sm focus:border-blue-400 focus:ring-blue-400 focus:ring-2 focus:ring-opacity-50 p-2"
            />
          </div>

          <div>
            <label
              htmlFor="pricePerDay"
              className="block text-sm font-medium text-gray-300"
            >
              Price per Day
            </label>
            <input
              id="pricePerDay"
              name="pricePerDay"
              type="number"
              min="0"
              value={formData.pricePerDay}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-800/50 border border-blue-500/30 text-white placeholder-gray-500 shadow-sm focus:border-blue-400 focus:ring-blue-400 focus:ring-2 focus:ring-opacity-50 p-2"
            />
          </div>

          <div>
            <label
              htmlFor="commissionAmount"
              className="block text-sm font-medium text-gray-300"
            >
              Admin Commission Amount (XLM)
            </label>
            <input
              id="commissionAmount"
              name="commissionAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.commissionAmount || 1}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-800/50 border border-blue-500/30 text-white placeholder-gray-500 shadow-sm focus:border-blue-400 focus:ring-blue-400 focus:ring-2 focus:ring-opacity-50 p-2"
            />
            <p className="mt-1 text-xs text-gray-400">
              Fixed commission amount in XLM that goes to admin for each rental of this car
            </p>
          </div>

          <div>
            <label
              htmlFor="ownerAddress"
              className="block text-sm font-medium text-gray-300"
            >
              Owner Address
            </label>
            <input
              id="ownerAddress"
              name="ownerAddress"
              type="text"
              value={formData.ownerAddress}
              onChange={handleChange}
              placeholder={walletAddress || "Enter Stellar address"}
              className="mt-1 block w-full rounded-md bg-gray-800/50 border border-blue-500/30 text-white placeholder-gray-500 shadow-sm focus:border-blue-400 focus:ring-blue-400 focus:ring-2 focus:ring-opacity-50 p-2"
            />
            {walletAddress && (
              <p className="mt-1 text-xs text-gray-400">
                Using connected wallet address. You can change it if needed.
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="ac"
              name="ac"
              type="checkbox"
              checked={formData.ac}
              onChange={handleChange}
              className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-blue-500/50 bg-gray-800/50 rounded cursor-pointer"
            />
            <label htmlFor="ac" className="ml-2 block text-sm text-gray-300">
              Air Conditioning
            </label>
          </div>

          <div className="flex justify-end gap-4 space-x-3 pt-2 pb-6">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-500/50 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-purple-500/50 rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 hover:glow-blue focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:bg-gray-600/30 disabled:border-gray-600/30 cursor-pointer transition-all"
            >
              {isSubmitting ? "Creating..." : "Create Car"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};