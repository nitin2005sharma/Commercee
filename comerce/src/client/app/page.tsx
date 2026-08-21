"use client";
import dynamic from "next/dynamic";
import { useQuery } from "@apollo/client";
import { GET_PRODUCTS_SUMMARY } from "./gql/Product";
import { useMemo } from "react";
import groupProductsByFlag from "./utils/groupProductsByFlag";
import SkeletonLoader from "./components/feedback/SkeletonLoader";
import { useGetGoalsQuery } from "./store/apis/GoalApi";

const HeroSection = dynamic(() => import("./(public)/(home)/HeroSection"), {
  ssr: false,
});
const GoalLaunchpad = dynamic(
  () => import("./(public)/(home)/GoalLaunchpad"),
  {
    ssr: false,
  }
);
const CategoryBar = dynamic(() => import("./(public)/(home)/CategoryBar"), {
  ssr: false,
});
const ProductSection = dynamic(
  () => import("./(public)/product/ProductSection"),
  { ssr: false }
);
const MainLayout = dynamic(() => import("./components/templates/MainLayout"), {
  ssr: false,
});

const Home = () => {
  const { data, loading, error } = useQuery(GET_PRODUCTS_SUMMARY, {
    variables: { first: 100 },
    fetchPolicy: "no-cache",
  });
  const { data: goalData } = useGetGoalsQuery(undefined);

  const { featured, trending, newArrivals, bestSellers } = useMemo(() => {
    if (!data?.products?.products)
      return { featured: [], trending: [], newArrivals: [], bestSellers: [] };
    return groupProductsByFlag(data.products.products);
  }, [data]);

  const goals = goalData?.goals || [];
  const featuredGoals = goals.slice(0, 3);
  const totalProducts = data?.products?.products?.length || 0;

  if (loading) {
    return (
      <MainLayout>
        <HeroSection totalGoals={goals.length} totalProducts={totalProducts} />
        <SkeletonLoader />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <HeroSection
        featuredGoals={featuredGoals}
        totalGoals={goals.length}
        totalProducts={totalProducts}
      />
      <GoalLaunchpad goals={featuredGoals} />
      <CategoryBar />
      <ProductSection
        title="Featured picks"
        products={featured}
        loading={false}
        error={error}
        showTitle={true}
      />
      <ProductSection
        title="Trending right now"
        products={trending}
        loading={false}
        error={error}
        showTitle={true}
      />
      <ProductSection
        title="New Arrivals"
        products={newArrivals}
        loading={false}
        error={error}
        showTitle={true}
      />
      <ProductSection
        title="Best Sellers"
        products={bestSellers}
        loading={false}
        error={error}
        showTitle={true}
      />
    </MainLayout>
  );
};

export default Home;
