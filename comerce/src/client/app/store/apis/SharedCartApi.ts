import { apiSlice } from "../slices/ApiSlice";

export const sharedCartApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createSharedCart: builder.mutation({
      query: (body?: {
        title?: string;
        cartId?: string;
        goalBundleId?: string;
        inviteMode?: "COLLABORATE" | "VIEW_ONLY";
        isReadOnly?: boolean;
        expiresAt?: string | null;
      }) => ({
        url: "/shared-carts",
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["SharedCart"],
    }),
    getSharedCart: builder.query({
      query: (code: string) => ({
        url: `/shared-carts/${code}`,
        method: "GET",
        credentials: "include",
      }),
      providesTags: (_result, _error, code) => [{ type: "SharedCart", id: code }],
    }),
    joinSharedCart: builder.mutation({
      query: ({ code, displayName }: { code: string; displayName?: string }) => ({
        url: `/shared-carts/${code}/join`,
        method: "POST",
        body: { displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
      ],
    }),
    updateSharedCartItem: builder.mutation({
      query: ({
        code,
        variantId,
        quantity,
        displayName,
      }: {
        code: string;
        variantId: string;
        quantity: number;
        displayName?: string;
      }) => ({
        url: `/shared-carts/${code}/items`,
        method: "POST",
        body: { variantId, quantity, displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
        "Cart",
      ],
    }),
    removeSharedCartItem: builder.mutation({
      query: ({
        code,
        itemId,
        displayName,
      }: {
        code: string;
        itemId: string;
        displayName?: string;
      }) => ({
        url: `/shared-carts/${code}/items/${itemId}`,
        method: "DELETE",
        body: { displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
        "Cart",
      ],
    }),
    voteOnSharedCartItem: builder.mutation({
      query: ({
        code,
        variantId,
        vote,
        displayName,
      }: {
        code: string;
        variantId: string;
        vote: "UPVOTE" | "DOWNVOTE";
        displayName?: string;
      }) => ({
        url: `/shared-carts/${code}/votes`,
        method: "POST",
        body: { variantId, vote, displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
      ],
    }),
    addSharedCartNote: builder.mutation({
      query: ({
        code,
        content,
        variantId,
        displayName,
      }: {
        code: string;
        content: string;
        variantId?: string;
        displayName?: string;
      }) => ({
        url: `/shared-carts/${code}/notes`,
        method: "POST",
        body: { content, variantId, displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
      ],
    }),
    sendSharedCartMessage: builder.mutation({
      query: ({
        code,
        content,
        variantId,
        displayName,
      }: {
        code: string;
        content: string;
        variantId?: string;
        displayName?: string;
      }) => ({
        url: `/shared-carts/${code}/messages`,
        method: "POST",
        body: { content, variantId, displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
      ],
    }),
    assignSharedCartItem: builder.mutation({
      query: ({
        code,
        variantId,
        quantity,
        status,
        displayName,
      }: {
        code: string;
        variantId: string;
        quantity?: number;
        status?: "CLAIMED" | "PURCHASING" | "PURCHASED" | "RELEASED";
        displayName?: string;
      }) => ({
        url: `/shared-carts/${code}/assignments`,
        method: "POST",
        body: { variantId, quantity, status, displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
      ],
    }),
    updateSharedCartSettings: builder.mutation({
      query: ({
        code,
        ...body
      }: {
        code: string;
        title?: string;
        inviteMode?: "COLLABORATE" | "VIEW_ONLY";
        isReadOnly?: boolean;
        expiresAt?: string | null;
        displayName?: string;
      }) => ({
        url: `/shared-carts/${code}/settings`,
        method: "PATCH",
        body,
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
      ],
    }),
    regenerateSharedCartInvite: builder.mutation({
      query: ({ code, displayName }: { code: string; displayName?: string }) => ({
        url: `/shared-carts/${code}/regenerate-invite`,
        method: "POST",
        body: { displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
      ],
    }),
    initiateSharedCartCheckout: builder.mutation({
      query: ({ code, displayName }: { code: string; displayName?: string }) => ({
        url: `/shared-carts/${code}/checkout`,
        method: "POST",
        body: { displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
        "Cart",
        "Order",
      ],
    }),
    releaseSharedCartCheckout: builder.mutation({
      query: ({ code, displayName }: { code: string; displayName?: string }) => ({
        url: `/shared-carts/${code}/checkout/release`,
        method: "POST",
        body: { displayName },
        credentials: "include",
      }),
      invalidatesTags: (_result, _error, { code }) => [
        { type: "SharedCart", id: code },
      ],
    }),
  }),
});

export const {
  useCreateSharedCartMutation,
  useGetSharedCartQuery,
  useJoinSharedCartMutation,
  useUpdateSharedCartItemMutation,
  useRemoveSharedCartItemMutation,
  useVoteOnSharedCartItemMutation,
  useAddSharedCartNoteMutation,
  useSendSharedCartMessageMutation,
  useAssignSharedCartItemMutation,
  useUpdateSharedCartSettingsMutation,
  useRegenerateSharedCartInviteMutation,
  useInitiateSharedCartCheckoutMutation,
  useReleaseSharedCartCheckoutMutation,
} = sharedCartApi;
