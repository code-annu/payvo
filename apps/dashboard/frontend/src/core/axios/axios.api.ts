import type { SuccessResponseType } from "@payvo/shared/api";
import axiosClient from "./axios.client.ts";

export async function getRequest<T>(
  endpoint: string,
  query?: unknown,
): Promise<T> {
  const response = await axiosClient.get<SuccessResponseType<T>>(endpoint, {
    params: query,
  });
  return response.data.data;
}

export async function postRequest<T>(
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const response = await axiosClient.post<SuccessResponseType<T>>(
    endpoint,
    body,
  );

  return response.data.data;
}

export async function patchRequest<T>(
  endpoint: string,
  body: unknown,
): Promise<T> {
  const response = await axiosClient.patch<SuccessResponseType<T>>(
    endpoint,
    body,
  );

  return response.data.data;
}

export async function deleteRequest<T = void>(endpoint: string): Promise<T> {
  const response = await axiosClient.delete<SuccessResponseType<T>>(endpoint);
  return response.data?.data;
}
