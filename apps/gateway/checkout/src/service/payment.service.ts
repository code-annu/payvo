import axiosClient from "@/core/api/axios.client";
import type {
  CheckoutOrderResponse,
  AttemptPaymentResponse,
  AttemptPaymentResult,
} from "./payment.types";

export default abstract class PaymentService {
  static async getCheckoutOrder(csi: string) {
    const response = await axiosClient.get<CheckoutOrderResponse>(
      `/payment-orders/${csi}`,
    );
    return response.data.data;
  }

  static async attemptPayment(
    paymentOrderId: string,
    paymentMethodCode: string,
  ): Promise<AttemptPaymentResult> {
    const response = await axiosClient.post<AttemptPaymentResponse>(
      `/payment-orders/${paymentOrderId}/attempt`,
      { paymentMethodCode },
    );
    return response.data.data;
  }
}
