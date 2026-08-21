import { apiSlice } from "../slices/ApiSlice";

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrders: builder.query({
      query: () => ({
        url: "/orders",
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Order"],
    }),

    getUserOrders: builder.query({
      query: () => ({
        url: "/orders/user",
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Order"],
    }),
    lookupOrderTracking: builder.mutation({
      query: ({ orderId, email }) => ({
        url: "/orders/lookup",
        method: "POST",
        body: { orderId, email },
      }),
    }),

    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "/orders",
        method: "POST",
        body: orderData,
        credentials: "include",
      }),
      invalidatesTags: ["Order"],
    }),

    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/orders/${orderId}`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["Order"],
    }),

    updateOrder: builder.mutation({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}`,
        method: "PUT",
        body: { status },
        credentials: "include",
      }),
      invalidatesTags: ["Order"],
    }),

    getOrder: builder.query({
      query: (orderId) => ({
        url: `/orders/${orderId}`,
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Order"],
    }),
    getOrderCompanion: builder.query({
      query: (orderId) => ({
        url: `/orders/${orderId}/companion`,
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Order"],
    }),
    getOrderGoalSuccess: builder.query({
      query: (orderId) => ({
        url: `/orders/${orderId}/goal-success`,
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["GoalSuccess"],
    }),
    submitOrderGoalSuccess: builder.mutation({
      query: ({ orderId, ...body }) => ({
        url: `/orders/${orderId}/goal-success`,
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["GoalSuccess"],
    }),
    createOrderSupportHandoff: builder.mutation({
      query: ({ orderId, ...body }) => ({
        url: `/orders/${orderId}/support-handoff`,
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["Order"],
    }),
    createOrderReminder: builder.mutation({
      query: ({ orderId, remindAt, note }) => ({
        url: `/orders/${orderId}/reminders`,
        method: "POST",
        body: { remindAt, note },
        credentials: "include",
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useGetAllOrdersQuery,
  useGetUserOrdersQuery,
  useLookupOrderTrackingMutation,
  useCreateOrderMutation,
  useDeleteOrderMutation,
  useUpdateOrderMutation,
  useGetOrderQuery,
  useGetOrderCompanionQuery,
  useGetOrderGoalSuccessQuery,
  useSubmitOrderGoalSuccessMutation,
  useCreateOrderSupportHandoffMutation,
  useCreateOrderReminderMutation,
} = orderApi;
