import axiosClient from "@/core/axios.client";
import type { CheckoutOrderResponse } from "./payment.types";

export default abstract class PaymentApi {
  static async getCheckoutOrder(csi: string) {
    const response = await axiosClient.get<CheckoutOrderResponse>(
      `/payment-orders/${csi}`,
    );
    return response.data.data;
  }
}
