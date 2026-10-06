import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@/features/account/hooks/useAccount";
import { useGetMerchants } from "@/features/merchant/hooks/useGetMerchants";
import { useMerchantStore } from "@/app/store/merchant.store";
import { useGetMerchantTransactions } from "@/features/transaction/hooks/useGetMerchantTransactions";
import { useGetMerchantApiKeys } from "@/features/api-key/hooks/useGetMerchantApiKeys";
import { useGetMerchantWebhooks } from "@/features/webhook/hooks/useGetMerchantWebhooks";
import TransactionDetailsDialog from "@/features/transaction/components/TransactionDetailsDialog";
import CurrencyUtil from "@/core/util/currency.util";
import AppRoutes from "@/router/app.routes";

import DashboardHeroComp from "./components/DashboardHeroComp";
import DashboardMetricsComp from "./components/DashboardMetricsComp";
import IntegrationChecklistComp from "./components/IntegrationChecklistComp";
import QuickstartApiComp from "./components/QuickstartApiComp";
import RecentTransactionsComp from "./components/RecentTransactionsComp";
import PageTitle from "@/components/text/PageTitle";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: user } = useAccount();
  const { data: merchantsData } = useGetMerchants();
  const { selectedMerchantId, setSelectedMerchantId } = useMerchantStore();

  const { data: txData, isLoading: txLoading } = useGetMerchantTransactions();
  const { data: apiKeysData } = useGetMerchantApiKeys();
  const { data: webhooksData } = useGetMerchantWebhooks();

  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);

  // Auto-select first merchant if none is selected
  useEffect(() => {
    if (
      !selectedMerchantId &&
      merchantsData?.merchants &&
      merchantsData.merchants.length > 0
    ) {
      setSelectedMerchantId(merchantsData.merchants[0].id);
    }
  }, [selectedMerchantId, merchantsData, setSelectedMerchantId]);

  // Current active merchant info
  const currentMerchant = useMemo(() => {
    return merchantsData?.merchants.find((m) => m.id === selectedMerchantId);
  }, [merchantsData, selectedMerchantId]);

  const transactions = useMemo(
    () => txData?.transactions ?? [],
    [txData?.transactions],
  );

  // Compute key financial metrics
  const metrics = useMemo(() => {
    let netTotalPaise = 0;
    let grossTotalPaise = 0;
    let payinCount = 0;
    let refundCount = 0;
    const currency = transactions[0]?.currency || "INR";

    for (const tx of transactions) {
      const net = Number(tx.netAmount) || 0;
      const gross = Number(tx.grossAmount) || 0;
      grossTotalPaise += gross;

      if (tx.paymentType === "PAYIN") {
        netTotalPaise += net;
        payinCount++;
      } else {
        netTotalPaise -= net;
        refundCount++;
      }
    }

    return {
      netTotal: CurrencyUtil.formatPaise(netTotalPaise, currency),
      grossTotal: CurrencyUtil.formatPaise(grossTotalPaise, currency),
      payinCount,
      refundCount,
    };
  }, [transactions]);

  // Integration checklist configuration
  const hasActiveApiKey = Boolean(
    apiKeysData?.apiKeys?.some((k) => k.status === "ACTIVE"),
  );
  const hasWebhook = Boolean(webhooksData?.webhooks?.length);
  const hasTransactions = transactions.length > 0;

  const checklistSteps = [
    {
      title: "Merchant Account Active",
      description: currentMerchant
        ? `Configured under MID: ${currentMerchant.mid}`
        : "Initial merchant account provisioned",
      completed: Boolean(currentMerchant?.isActive),
      actionText: "Account Settings",
      onAction: () => navigate(AppRoutes.ACCOUNT_SETTINGS),
    },
    {
      title: "Generate API Key",
      description: hasActiveApiKey
        ? "Active secret key ready for server integration"
        : "Create your API key to authenticate requests",
      completed: hasActiveApiKey,
      actionText: "Manage API Keys",
      onAction: () => navigate(AppRoutes.API_KEYS),
    },
    {
      title: "Configure Webhooks",
      description: hasWebhook
        ? "Webhook endpoints receiving payment events"
        : "Register your endpoint for real-time payment updates",
      completed: hasWebhook,
      actionText: "Add Webhook",
      onAction: () => navigate(AppRoutes.WEBHOOKS),
    },
    {
      title: "Process First Payment",
      description: hasTransactions
        ? `${transactions.length} payment records settled`
        : "Initiate your first checkout or API transaction",
      completed: hasTransactions,
      actionText: "Transactions",
      onAction: () => navigate(AppRoutes.TRANSACTIONS),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 py-2 pb-14">
      <PageTitle title="Dashboard" />
      {/* ── 1. Welcome & Status Hero ── */}
      <DashboardHeroComp
        userFullName={user?.fullname}
        companyName={user?.companyName}
        merchantMid={currentMerchant?.mid}
      />

      {/* ── 2. Metric Performance Cards ── */}
      <DashboardMetricsComp
        netTotal={metrics.netTotal}
        grossTotal={metrics.grossTotal}
        payinCount={metrics.payinCount}
        refundCount={metrics.refundCount}
      />

      {/* ── 3. Integration Checklist & Quickstart Developer Sandbox ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IntegrationChecklistComp steps={checklistSteps} />
        </div>
        <div className="lg:col-span-1">
          <QuickstartApiComp />
        </div>
      </div>

      {/* ── 4. Recent Transactions ── */}
      <RecentTransactionsComp
        transactions={transactions}
        isLoading={txLoading}
        onSelectTransaction={(id) => setSelectedTransactionId(id)}
      />

      {/* ── 5. Transaction Details Dialog ── */}
      <TransactionDetailsDialog
        isOpen={Boolean(selectedTransactionId)}
        onClose={() => setSelectedTransactionId(null)}
        transactionId={selectedTransactionId}
      />
    </div>
  );
};

export default HomePage;
