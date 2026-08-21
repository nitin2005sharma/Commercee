import { apiSlice } from "../slices/ApiSlice";

export const shoppingAssistantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendShoppingAssistantMessage: builder.mutation({
      query: ({
        message,
        history,
      }: {
        message: string;
        history?: Array<{
          role: "user" | "assistant";
          content: string;
        }>;
      }) => ({
        url: "/shopping-assistant/message",
        method: "POST",
        body: {
          message,
          history,
        },
        credentials: "include",
      }),
    }),
  }),
});

export const { useSendShoppingAssistantMessageMutation } = shoppingAssistantApi;
