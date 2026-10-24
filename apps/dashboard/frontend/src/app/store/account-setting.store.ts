import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccountSettingTab = "profile" | "address" | "merchant";

interface AccountSettingStoreState {
  activeTab: AccountSettingTab | null;
  setActiveTab: (tab: AccountSettingTab | null) => void;
}

export const useAccountSettingStore = create<AccountSettingStoreState>()(
  persist(
    (set) => ({
      activeTab: null,
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    { name: "account-setting-store" },
  ),
);
