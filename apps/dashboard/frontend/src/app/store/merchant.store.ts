import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MerchantStoreState {
  selectedMerchantId: string | null;
  setSelectedMerchantId: (id: string | null) => void;
}

export const useMerchantStore = create<MerchantStoreState>()(
  persist(
    (set) => ({
      selectedMerchantId: null,
      setSelectedMerchantId: (id: string | null) =>
        set({ selectedMerchantId: id }),
    }),
    { name: "merchant-store" },
  ),
);
