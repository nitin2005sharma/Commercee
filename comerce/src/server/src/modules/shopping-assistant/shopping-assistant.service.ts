import axios from "axios";
import prisma from "@/infra/database/database.config";
import AppError from "@/shared/errors/AppError";
import { GoalService } from "../goal/goal.service";

type AssistantHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantResponse = {
  reply: string;
  assistantMode: "openai" | "catalog";
  extractedBrief: {
    budget: number | null;
    keywords: string[];
  };
  suggestedProducts: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    categoryName: string | null;
    variantId: string;
    sku: string;
    price: number;
    stock: number;
    image: string | null;
    why: string;
  }>;
  suggestedGoals: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    audience: string;
    suggestedBudget: number;
    why: string;
  }>;
  suggestedBundles: Array<{
    id: string;
    title: string;
    summary: string;
    total: number;
    frequency: number;
    items: Array<{
      productName: string;
      productSlug: string;
      variantId: string;
      price: number;
      image: string | null;
    }>;
  }>;
  followUpQuestions: string[];
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "be",
  "best",
  "buy",
  "for",
  "from",
  "get",
  "have",
  "help",
  "i",
  "im",
  "in",
  "is",
  "it",
  "like",
  "me",
  "my",
  "need",
  "of",
  "on",
  "or",
  "shopping",
  "something",
  "that",
  "the",
  "this",
  "to",
  "under",
  "want",
  "with",
]);

const normalizeText = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

export class ShoppingAssistantService {
  private readonly goalService = new GoalService();

  private readonly openAiApiKey = process.env.OPENAI_API_KEY;

  private readonly openAiModel =
    process.env.OPENAI_SHOPPING_ASSISTANT_MODEL || "gpt-4.1-mini";

  private extractBudget(message: string) {
    const matches = [
      message.match(/\$\s?(\d+(?:\.\d+)?)/i),
      message.match(/under\s+(\d+(?:\.\d+)?)/i),
      message.match(/budget\s+of\s+(\d+(?:\.\d+)?)/i),
      message.match(/around\s+(\d+(?:\.\d+)?)/i),
    ].filter(Boolean) as RegExpMatchArray[];

    const rawBudget = matches[0]?.[1];
    if (!rawBudget) {
      return null;
    }

    const parsed = Number(rawBudget);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private extractKeywords(message: string) {
    return unique(
      normalizeText(message)
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    ).slice(0, 8);
  }

  private buildProductWhy({
    budget,
    price,
    matchCount,
    stock,
    categoryName,
  }: {
    budget: number | null;
    price: number;
    matchCount: number;
    stock: number;
    categoryName?: string | null;
  }) {
    const reasons = [
      matchCount > 1
        ? "Strong keyword match for your request."
        : "Relevant match for what you asked for.",
    ];

    if (budget !== null && price <= budget) {
      reasons.push("Fits inside the budget signal you mentioned.");
    }

    if (stock > 0) {
      reasons.push("Currently in stock.");
    }

    if (categoryName) {
      reasons.push(`From the ${categoryName} category.`);
    }

    return reasons.join(" ");
  }

  private buildGoalWhy(goal: any, keywords: string[], budget: number | null) {
    const haystack = normalizeText(
      [goal.title, goal.description, goal.audience].join(" ")
    );
    const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword));
    const reasons = [
      matchedKeywords.length
        ? `Matches ${matchedKeywords.slice(0, 2).join(" and ")} from your request.`
        : "Close fit for the shopping mission you described.",
    ];

    if (budget !== null && goal.suggestedBudget <= budget * 1.25) {
      reasons.push("Its usual budget stays close to your target.");
    }

    return reasons.join(" ");
  }

  private buildBundleWhy(bundle: any, keywords: string[]) {
    const haystack = normalizeText(
      [
        bundle.title,
        bundle.summary,
        ...(bundle.items || []).map((item: any) => item.productName),
      ].join(" ")
    );
    const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword));

    if (matchedKeywords.length) {
      return `Frequently bought bundle that aligns with ${matchedKeywords
        .slice(0, 2)
        .join(" and ")}.`;
    }

    return "Frequently bought together by recent shoppers.";
  }

  private async findProducts(keywords: string[], budget: number | null) {
    if (!keywords.length) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          ...keywords.map((keyword) => ({
            name: {
              contains: keyword,
              mode: "insensitive" as const,
            },
          })),
          ...keywords.map((keyword) => ({
            description: {
              contains: keyword,
              mode: "insensitive" as const,
            },
          })),
          ...keywords.map((keyword) => ({
            category: {
              is: {
                name: {
                  contains: keyword,
                  mode: "insensitive" as const,
                },
              },
            },
          })),
        ],
      },
      include: {
        category: true,
        variants: {
          where: {
            stock: { gt: 0 },
          },
          orderBy: { price: "asc" },
          take: 3,
        },
      },
      take: 18,
    });

    return products
      .map((product) => {
        const searchable = normalizeText(
          [product.name, product.description, product.category?.name].join(" ")
        );
        const bestVariant =
          (budget !== null
            ? product.variants.find((variant) => variant.price <= budget)
            : null) || product.variants[0];

        if (!bestVariant) {
          return null;
        }

        const matchCount = keywords.filter((keyword) => searchable.includes(keyword)).length;
        const budgetSignal =
          budget === null
            ? 0
            : bestVariant.price <= budget
              ? 8
              : Math.max(0, 5 - (bestVariant.price - budget) / Math.max(budget, 1));
        const featuredSignal =
          (product.isFeatured ? 3 : 0) +
          (product.isTrending ? 2 : 0) +
          (product.isBestSeller ? 2 : 0);
        const score = matchCount * 10 + budgetSignal + featuredSignal;

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description || "No description yet.",
          categoryName: product.category?.name || null,
          variantId: bestVariant.id,
          sku: bestVariant.sku,
          price: bestVariant.price,
          stock: bestVariant.stock,
          image: bestVariant.images?.[0] || null,
          why: this.buildProductWhy({
            budget,
            price: bestVariant.price,
            matchCount,
            stock: bestVariant.stock,
            categoryName: product.category?.name || null,
          }),
          score,
        };
      })
      .filter(Boolean)
      .sort((left: any, right: any) => right.score - left.score)
      .slice(0, 5)
      .map(({ score, ...product }) => product);
  }

  private async findGoals(keywords: string[], budget: number | null) {
    const goals = await this.goalService.listGoals();

    return (goals || [])
      .map((goal: any) => {
        const searchable = normalizeText(
          [goal.title, goal.description, goal.audience].join(" ")
        );
        const matchCount = keywords.filter((keyword) => searchable.includes(keyword)).length;
        const budgetSignal =
          budget === null
            ? 0
            : goal.suggestedBudget <= budget * 1.25
              ? 4
              : 0;
        const score = matchCount * 8 + budgetSignal;

        return {
          id: goal.id,
          slug: goal.slug,
          title: goal.title,
          description: goal.description,
          audience: goal.audience,
          suggestedBudget: goal.suggestedBudget,
          why: this.buildGoalWhy(goal, keywords, budget),
          score,
        };
      })
      .filter((goal: any) => goal.score > 0)
      .sort((left: any, right: any) => right.score - left.score)
      .slice(0, 3)
      .map(({ score, ...goal }: any) => goal);
  }

  private async findBundles(keywords: string[]) {
    const bundles = await this.goalService.listFrequentBundles(4);

    return (bundles || []).map((bundle: any) => ({
      id: bundle.id,
      title: bundle.title,
      summary: `${bundle.summary} ${this.buildBundleWhy(bundle, keywords)}`,
      total: bundle.total,
      frequency: bundle.frequency,
      items: (bundle.items || []).map((item: any) => ({
        productName: item.productName,
        productSlug: item.productSlug,
        variantId: item.variantId,
        price: item.variantPrice,
        image: item.image,
      })),
    }));
  }

  private buildFollowUpQuestions({
    budget,
    suggestedProducts,
    suggestedGoals,
  }: {
    budget: number | null;
    suggestedProducts: AssistantResponse["suggestedProducts"];
    suggestedGoals: AssistantResponse["suggestedGoals"];
  }) {
    const questions: string[] = [];

    if (budget === null) {
      questions.push("What budget range should I optimize for?");
    }

    if (!suggestedGoals.length) {
      questions.push("Is this for travel, work, gifting, gaming, or something else?");
    }

    if (!suggestedProducts.length) {
      questions.push("Which item matters most so I can narrow the catalog faster?");
    }

    questions.push("Do you want the safest value picks or the strongest-looking setup?");

    return unique(questions).slice(0, 3);
  }

  private buildFallbackReply({
    message,
    suggestedProducts,
    suggestedGoals,
    suggestedBundles,
    followUpQuestions,
    budget,
  }: {
    message: string;
    suggestedProducts: AssistantResponse["suggestedProducts"];
    suggestedGoals: AssistantResponse["suggestedGoals"];
    suggestedBundles: AssistantResponse["suggestedBundles"];
    followUpQuestions: string[];
    budget: number | null;
  }) {
    const lines = [
      `I looked through your catalog for "${message.trim()}".`,
      budget !== null ? `I’m keeping a ${budget.toFixed(0)} budget signal in mind.` : null,
      suggestedProducts.length
        ? `Best product starting points: ${suggestedProducts
            .slice(0, 2)
            .map((product) => product.name)
            .join(" and ")}.`
        : "I don’t have a strong direct product match yet, so I’d tighten the brief first.",
      suggestedGoals.length
        ? `Closest guided goal: ${suggestedGoals[0].title}.`
        : null,
      suggestedBundles.length
        ? `A strong frequent bundle to review is ${suggestedBundles[0].title}.`
        : null,
      followUpQuestions[0] ? `Next question: ${followUpQuestions[0]}` : null,
    ];

    return lines.filter(Boolean).join(" ");
  }

  private async generateOpenAiReply({
    message,
    history,
    suggestedProducts,
    suggestedGoals,
    suggestedBundles,
    followUpQuestions,
    budget,
  }: {
    message: string;
    history: AssistantHistoryMessage[];
    suggestedProducts: AssistantResponse["suggestedProducts"];
    suggestedGoals: AssistantResponse["suggestedGoals"];
    suggestedBundles: AssistantResponse["suggestedBundles"];
    followUpQuestions: string[];
    budget: number | null;
  }) {
    if (!this.openAiApiKey) {
      return null;
    }

    const catalogContext = [
      budget !== null ? `Budget signal: ${budget}` : "Budget signal: unknown",
      `Suggested products: ${JSON.stringify(suggestedProducts)}`,
      `Suggested goals: ${JSON.stringify(suggestedGoals)}`,
      `Suggested bundles: ${JSON.stringify(suggestedBundles)}`,
      `Follow-up questions: ${JSON.stringify(followUpQuestions)}`,
    ].join("\n");

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/responses",
        {
          model: this.openAiModel,
          instructions:
            "You are a grounded ecommerce shopping assistant. Only mention products, bundles, and goals provided in the catalog context. Give concise advice, explain tradeoffs, and ask at most one follow-up question.",
          input: [
            ...history.slice(-6).map((entry) => ({
              role: entry.role,
              content: [
                {
                  type: "input_text",
                  text: entry.content,
                },
              ],
            })),
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Customer request: ${message}\n\nCatalog context:\n${catalogContext}`,
                },
              ],
            },
          ],
          max_output_tokens: 320,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openAiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const outputText =
        response.data?.output_text ||
        (response.data?.output || [])
          .flatMap((entry: any) => entry.content || [])
          .map((item: any) => item.text || item.value || "")
          .join("\n")
          .trim();

      return outputText || null;
    } catch {
      return null;
    }
  }

  async respond(payload: {
    message: string;
    history?: AssistantHistoryMessage[];
  }): Promise<AssistantResponse> {
    const message = payload.message?.trim();

    if (!message) {
      throw new AppError(400, "Message is required");
    }

    const budget = this.extractBudget(message);
    const keywords = this.extractKeywords(message);
    const [suggestedProducts, suggestedGoals, suggestedBundles] = await Promise.all([
      this.findProducts(keywords, budget),
      this.findGoals(keywords, budget),
      this.findBundles(keywords),
    ]);

    const followUpQuestions = this.buildFollowUpQuestions({
      budget,
      suggestedProducts,
      suggestedGoals,
    });

    const aiReply = await this.generateOpenAiReply({
      message,
      history: payload.history || [],
      suggestedProducts,
      suggestedGoals,
      suggestedBundles,
      followUpQuestions,
      budget,
    });

    return {
      reply:
        aiReply ||
        this.buildFallbackReply({
          message,
          suggestedProducts,
          suggestedGoals,
          suggestedBundles,
          followUpQuestions,
          budget,
        }),
      assistantMode: aiReply ? "openai" : "catalog",
      extractedBrief: {
        budget,
        keywords,
      },
      suggestedProducts,
      suggestedGoals,
      suggestedBundles,
      followUpQuestions,
    };
  }
}
