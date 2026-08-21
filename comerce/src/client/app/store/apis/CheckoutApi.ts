import { apiSlice } from "../slices/ApiSlice";

export const checkoutApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initiateCheckout: builder.mutation({
      query: () => ({
        url: "/checkout",
        method: "POST",
        credentials: "include",
      }),
    }),
    getCheckoutRecovery: builder.query({
      query: () => ({
        url: "/checkout/recovery",
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["CheckoutRecovery"],
    }),
    retryCheckout: builder.mutation({
      query: () => ({
        url: "/checkout/retry",
        method: "POST",
        credentials: "include",
      }),
      invalidatesTags: ["CheckoutRecovery", "Cart", "Order"],
    }),
    restoreCheckoutCart: builder.mutation({
      query: () => ({
        url: "/checkout/restore",
        method: "POST",
        credentials: "include",
      }),
      invalidatesTags: ["CheckoutRecovery", "Cart"],
    }),
    createCheckoutFallback: builder.mutation({
      query: () => ({
        url: "/checkout/dev-fallback",
        method: "POST",
        credentials: "include",
      }),
      invalidatesTags: ["CheckoutRecovery", "Cart", "Order"],
    }),
    supportCheckoutHandoff: builder.mutation({
      query: (body?: { reason?: string }) => ({
        url: "/checkout/support-handoff",
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["CheckoutRecovery"],
    }),
    markCheckoutFailed: builder.mutation({
      query: (body?: { reason?: string }) => ({
        url: "/checkout/mark-failed",
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["CheckoutRecovery"],
    }),
    markCheckoutCanceled: builder.mutation({
      query: (body?: { reason?: string }) => ({
        url: "/checkout/mark-canceled",
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["CheckoutRecovery"],
    }),
  }),
});

export const {
  useInitiateCheckoutMutation,
  useGetCheckoutRecoveryQuery,
  useRetryCheckoutMutation,
  useRestoreCheckoutCartMutation,
  useCreateCheckoutFallbackMutation,
  useSupportCheckoutHandoffMutation,
  useMarkCheckoutFailedMutation,
  useMarkCheckoutCanceledMutation,
} = checkoutApi;
