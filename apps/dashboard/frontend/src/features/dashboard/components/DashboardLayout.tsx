import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardSideNavbar, { SIDEBAR_WIDTH } from "./DashboardSideNavbar";
import DashboardTopBar from "./DashboardTopBar";
import { useGetMerchants } from "@/features/merchant/hooks/useGetMerchants";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import { useCreateMerchant } from "@/features/merchant/hooks/useCreateMerchant";

/**
 * Top-level layout shell for all authenticated dashboard pages.
 *
 * Renders a fixed top bar, a fixed sidebar, and a content area that
 * is offset on desktop to sit alongside the sidebar.
 * Data-fetching and merchant logic are handled elsewhere — this is UI-only.
 */
export const DashboardLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: userMerchants, isLoading, isError } = useGetMerchants();
  const createMerchant = useCreateMerchant();

  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setMobileNavOpen(false);

  useEffect(() => {
    if (!isLoading && !isError && (userMerchants?.merchants?.length ?? 0) < 1) {
      console.log("Creating merchant.....");
      createMerchant.mutate();
    }
  }, [userMerchants]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center">
        <CircularLoadingBar size={48} strokeWidth={4} />
      </div>
    );
  }

  if (isError) return <></>;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Fixed top bar ─────────────────────────────────── */}
      <DashboardTopBar
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={toggleMobileNav}
      />

      {/* ── Fixed sidebar ────────────────────────────────── */}
      <DashboardSideNavbar
        mobileNavOpen={mobileNavOpen}
        onCloseMobileNav={closeMobileNav}
      />

      {/* ── Main content area ────────────────────────────── */}
      <main
        className="pt-14 transition-[margin] duration-300 ease-in-out lg:ml-0"
        style={{ marginLeft: 0 }}
      >
        <div className="min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Offset the main content by the sidebar width on lg+ */}
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
