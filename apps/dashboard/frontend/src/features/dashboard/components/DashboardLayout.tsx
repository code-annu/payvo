import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardTopBar from "./DashboardTopBar";
import DashboardSideNavbar, { SIDEBAR_WIDTH } from "./DashboardSideNavbar";
import MerchantSwitcher from "@/features/merchant/components/MerchantSwitcher";
import { useMerchants } from "@/features/merchant/hooks/useMerchants";
import { useCreateMerchant } from "@/features/merchant/hooks/useCreateMerchant";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import { useMerchantStore } from "@/app/store/merchant.store";

export const DashboardLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setMobileNavOpen(false);

  // ── Merchant data & store ──────────────────────────────────
  const { data, isLoading: isMerchantsLoading } = useMerchants();
  const createMerchant = useCreateMerchant();
  const { selectedMerchantId, setSelectedMerchantId } = useMerchantStore();

  // Auto-create a merchant when user has none and
  useEffect(() => {
    if (isMerchantsLoading || !data) return;

    if (data.totalMerchants === 0 && !createMerchant.isPending) {
      createMerchant.mutate();
    }

    if (data.merchants.length > 0 && selectedMerchantId === null) {
      setSelectedMerchantId(data.merchants[0].id);
    }
  }, [data, isMerchantsLoading]);

  // ── Loading state ──────────────────────────────────────────
  if (isMerchantsLoading || createMerchant.isPending) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center">
        <CircularLoadingBar size={48} strokeWidth={4} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed top bar */}
      <DashboardTopBar
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={toggleMobileNav}
        onOpenSwitcher={() => setSwitcherOpen(true)}
      />

      {/* Fixed side navbar */}
      <DashboardSideNavbar
        mobileNavOpen={mobileNavOpen}
        onCloseMobileNav={closeMobileNav}
      />

      {/* Main content area — offset by topbar height and sidebar width */}
      <main
        className="pt-14 transition-[margin] duration-300 ease-in-out lg:ml-0"
        style={{ marginLeft: 0 }}
      >
        {/* On lg+ screens, offset by sidebar width */}
        <div
          className="hidden lg:block"
          style={{ display: "contents" }}
          aria-hidden="true"
        />
        <div
          className="min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8"
          style={{ marginLeft: 0 }}
        >
          <Outlet />
        </div>
      </main>

      {/* Merchant switcher dialog */}
      <MerchantSwitcher
        isOpen={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
      />

      {/* Inline style to handle the lg sidebar offset cleanly */}
      <style>{`
        @media (min-width: 1024px) {
          main {
            margin-left: ${SIDEBAR_WIDTH} !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
