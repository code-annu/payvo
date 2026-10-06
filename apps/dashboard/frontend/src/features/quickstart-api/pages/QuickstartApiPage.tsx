import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppRoutes from "@/router/app.routes";
import { useGetMerchantApiKeys } from "@/features/api-key/hooks/useGetMerchantApiKeys";
import PageTitle from "@/components/text/PageTitle";

import QuickstartHeaderComp from "../components/QuickstartHeaderComp";
import QuickstartEndpointBannerComp from "../components/QuickstartEndpointBannerComp";
import QuickstartAuthStatusComp from "../components/QuickstartAuthStatusComp";
import QuickstartCodeSnippetsComp, {
  type LanguageTab,
} from "../components/QuickstartCodeSnippetsComp";
import QuickstartPayloadResponseComp from "../components/QuickstartPayloadResponseComp";
import QuickstartNextStepsComp from "../components/QuickstartNextStepsComp";

export const QuickstartApiPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: apiKeysData } = useGetMerchantApiKeys();

  const [activeTab, setActiveTab] = useState<LanguageTab>("curl");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [useRealApiKey, setUseRealApiKey] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResponse, setSimulationResponse] = useState<string | null>(
    null,
  );

  // Read base URL from env
  const gatewayBaseUrl =
    (import.meta.env.VITE_GATEWAY_API_URL as string) ||
    "http://localhost:3001/api";
  const fullEndpoint = `${gatewayBaseUrl.replace(/\/+$/, "")}/payment-orders/`;

  // Find first active API key for current merchant
  const activeKey = useMemo(() => {
    return apiKeysData?.apiKeys?.find((k) => k.status === "ACTIVE");
  }, [apiKeysData]);

  const displayedKeyId =
    useRealApiKey && activeKey ? activeKey.id : "<YOUR_API_KEY_ID>";
  const displayedKeySecret = "<YOUR_API_KEY_SECRET>";

  const requestBody = useMemo(() => {
    return {
      merchantCustomerId: "286e1e5d-e7c0-4bc3-a7d0-7013c4d47ebc",
      merchantOrderId: "9cde5325-18e2-481f-9ccc-c8076d8fe050",
      idempotencyKey: "lsdosur3wtttrp893tuotiusiuwr932tse",
      amount: 20000,
      currency: "INR",
    };
  }, []);

  const formattedJsonBody = useMemo(() => {
    return JSON.stringify(requestBody, null, 2);
  }, [requestBody]);

  // Code snippets generator
  const snippets = useMemo(() => {
    const curl = `curl -X POST "${fullEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key-id: ${displayedKeyId}" \\
  -H "x-api-key-secret: ${displayedKeySecret}" \\
  -d '${formattedJsonBody}'`;

    const javascript = `// Node.js 18+ (Fetch API) or Browser
const response = await fetch("${fullEndpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key-id": "${displayedKeyId}",
    "x-api-key-secret": "${displayedKeySecret}",
  },
  body: JSON.stringify({
    merchantCustomerId: "286e1e5d-e7c0-4bc3-a7d0-7013c4d47ebc",
    merchantOrderId: "9cde5325-18e2-481f-9ccc-c8076d8fe050",
    idempotencyKey: "lsdosur3wtttrp893tuotiusiuwr932tse",
    amount: 20000, // 20000 paise = ₹200.00
    currency: "INR",
  }),
});

const data = await response.json();
console.log("Checkout URL:", data.data.checkoutUrl);`;

    const python = `import requests

url = "${fullEndpoint}"

headers = {
    "Content-Type": "application/json",
    "x-api-key-id": "${displayedKeyId}",
    "x-api-key-secret": "${displayedKeySecret}",
}

payload = {
    "merchantCustomerId": "286e1e5d-e7c0-4bc3-a7d0-7013c4d47ebc",
    "merchantOrderId": "9cde5325-18e2-481f-9ccc-c8076d8fe050",
    "idempotencyKey": "lsdosur3wtttrp893tuotiusiuwr932tse",
    "amount": 20000,  # 20000 paise = 200.00 INR
    "currency": "INR",
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Checkout URL:", data["data"]["checkoutUrl"])`;

    return { curl, javascript, python };
  }, [fullEndpoint, displayedKeyId, displayedKeySecret, formattedJsonBody]);

  const dummySuccessResponse = useMemo(() => {
    return JSON.stringify(
      {
        success: true,
        statusCode: 201,
        message: "Payment order created successfully",
        data: {
          checkoutUrl:
            "http://localhost:3002/checkout?csi=csi_9cde532518e2481f",
        },
      },
      null,
      2,
    );
  }, []);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSimulateCall = () => {
    setIsSimulating(true);
    setSimulationResponse(null);

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationResponse(dummySuccessResponse);
      toast.success("Simulation complete: 201 Created");
    }, 700);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 py-2 pb-16">
      <PageTitle title="Payment Order Quickstart API" />

      {/* ── 1. Header & Navigation ── */}
      <QuickstartHeaderComp
        onBack={() => navigate(AppRoutes.HOME)}
        onManageApiKeys={() => navigate(AppRoutes.API_KEYS)}
        onConfigureWebhooks={() => navigate(AppRoutes.WEBHOOKS)}
      />

      {/* ── 2. Endpoint & Environment Banner ── */}
      <QuickstartEndpointBannerComp
        fullEndpoint={fullEndpoint}
        onCopy={handleCopy}
        isCopied={copiedKey === "Endpoint URL"}
      />

      {/* ── 3. Active Merchant API Key Status ── */}
      <QuickstartAuthStatusComp
        activeKeyId={activeKey?.id}
        useRealApiKey={useRealApiKey}
        onToggleUseRealApiKey={setUseRealApiKey}
      />

      {/* ── 4. Request Specifications, Code Snippets & Response Simulation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Snippets & Headers */}
        <div className="lg:col-span-7">
          <QuickstartCodeSnippetsComp
            snippets={snippets}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />
        </div>

        {/* Right Column: JSON Payload & Expected Response */}
        <div className="lg:col-span-5">
          <QuickstartPayloadResponseComp
            formattedJsonBody={formattedJsonBody}
            dummySuccessResponse={dummySuccessResponse}
            simulationResponse={simulationResponse}
            isSimulating={isSimulating}
            onSimulate={handleSimulateCall}
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />
        </div>
      </div>

      {/* ── 5. Integration Lifecycle & Further Steps ── */}
      <QuickstartNextStepsComp
        onNavigateToWebhooks={() => navigate(AppRoutes.WEBHOOKS)}
        onNavigateToTransactions={() => navigate(AppRoutes.TRANSACTIONS)}
      />
    </div>
  );
};

export default QuickstartApiPage;
