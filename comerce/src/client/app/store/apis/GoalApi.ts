import { apiSlice } from "../slices/ApiSlice";

export const goalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGoals: builder.query({
      query: () => ({
        url: "/goals",
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Goal"],
    }),
    getGoal: builder.query({
      query: (slug: string) => ({
        url: `/goals/${slug}`,
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Goal"],
    }),
    assembleGoal: builder.mutation({
      query: (body: {
        slug: string;
        budget?: number;
        brief?: {
          whoFor?: string;
          occasion?: string;
          deadline?: string;
          style?: string;
          mustHaves?: string[];
          avoidList?: string[];
          notes?: string;
          budgetMin?: number;
          budgetMax?: number;
        };
        bundleId?: string;
        lockedStepKeys?: string[];
        selectedVariants?: Record<string, string>;
        regenerateStepKeys?: string[];
      }) => ({
        url: "/goals/assemble",
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["Goal"],
    }),
    assembleCustomBundle: builder.mutation({
      query: (body: {
        budget?: number;
        brief?: {
          name?: string;
          requestText?: string;
          style?: string;
          avoidList?: string[];
          notes?: string;
          items?: Array<{
            key?: string;
            label: string;
            description?: string;
            quantity?: number;
            categoryNames?: string[];
            keywords?: string[];
            priority?: "HIGH" | "MEDIUM" | "LOW";
            targetBudget?: number;
          }>;
        };
        bundleId?: string;
        lockedItemKeys?: string[];
        selectedVariants?: Record<string, string>;
        regenerateItemKeys?: string[];
      }) => ({
        url: "/goals/custom-bundles/assemble",
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["Goal"],
    }),
    getGoalBundles: builder.query({
      query: () => ({
        url: "/goals/bundles",
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Goal"],
    }),
    getFrequentBundles: builder.query({
      query: (limit = 6) => ({
        url: `/goals/bundles/frequent?limit=${limit}`,
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Goal"],
    }),
    getGoalBundle: builder.query({
      query: (bundleId: string) => ({
        url: `/goals/bundles/${bundleId}`,
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Goal"],
    }),
    applyGoalBundleToCart: builder.mutation({
      query: (bundleId: string) => ({
        url: `/goals/bundles/${bundleId}/apply`,
        method: "POST",
        credentials: "include",
      }),
      invalidatesTags: ["Goal", "Cart"],
    }),
    shareGoalBundle: builder.mutation({
      query: ({ bundleId, title }: { bundleId: string; title?: string }) => ({
        url: `/goals/bundles/${bundleId}/share`,
        method: "POST",
        body: { title },
        credentials: "include",
      }),
      invalidatesTags: ["Goal", "SharedCart"],
    }),
  }),
});

export const {
  useGetGoalsQuery,
  useGetGoalQuery,
  useAssembleGoalMutation,
  useAssembleCustomBundleMutation,
  useGetGoalBundlesQuery,
  useGetFrequentBundlesQuery,
  useGetGoalBundleQuery,
  useApplyGoalBundleToCartMutation,
  useShareGoalBundleMutation,
} = goalApi;
