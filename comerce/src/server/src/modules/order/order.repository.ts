import prisma from "@/infra/database/database.config";

export class OrderRepository {
  async findAllOrders() {
    return prisma.order.findMany({
      orderBy: { orderDate: "desc" },
      include: {
        goalTemplate: {
          include: {
            steps: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        goalBundle: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      include: { category: true },
                    },
                  },
                },
              },
            },
          },
        },
        orderItems: {
          include: {
            variant: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
          },
        },
        transaction: true,
        shipment: true,
        trackingEvents: {
          orderBy: { occurredAt: "asc" },
        },
      },
    });
  }

  async findOrdersByUserId(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { orderDate: "desc" },
      include: {
        goalTemplate: {
          include: {
            steps: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        goalBundle: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      include: { category: true },
                    },
                  },
                },
              },
            },
          },
        },
        orderItems: {
          include: {
            variant: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
          },
        },
        transaction: true,
        shipment: true,
        trackingEvents: {
          orderBy: { occurredAt: "asc" },
        },
      },
    });
  }

  async findOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        goalTemplate: {
          include: {
            steps: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        goalBundle: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      include: { category: true },
                    },
                  },
                },
              },
            },
          },
        },
        orderItems: {
          include: {
            variant: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
          },
        },
        payment: true,
        address: true,
        shipment: true,
        transaction: true,
        trackingEvents: {
          orderBy: { occurredAt: "asc" },
        },
        reminders: {
          orderBy: { remindAt: "asc" },
        },
      },
    });
  }

  async findOrderForLookup(orderId: string, email: string) {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        user: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            variant: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
          },
        },
        payment: true,
        address: true,
        shipment: true,
        transaction: true,
        trackingEvents: {
          orderBy: { occurredAt: "asc" },
        },
      },
    });
  }

  async createOrder(data: {
    userId: string;
    amount: number;
    goalTemplateId?: string | null;
    goalBundleId?: string | null;
    orderItems: { variantId: string; quantity: number; price: number }[];
  }) {
    return prisma.$transaction(async (tx:any) => {
      // Validate stock for all variants
      for (const item of data.orderItems) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true, product: { select: { id: true, salesCount: true } } },
        });
        if (!variant) {
          throw new Error(`Variant not found: ${item.variantId}`);
        }
        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for variant ${item.variantId}: only ${variant.stock} available`);
        }
      }

      // Create order
      const order = await tx.order.create({
        data: {
          userId: data.userId,
          goalTemplateId: data.goalTemplateId || null,
          goalBundleId: data.goalBundleId || null,
          amount: data.amount,
          status: "PENDING",
          orderItems: {
            create: data.orderItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          trackingEvents: {
            create: {
              status: "PENDING",
              title: "Order placed",
              description:
                "We received your order and queued it for fulfillment.",
            },
          },
        },
      });

      // Update stock and sales count
      for (const item of data.orderItems) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true, product: { select: { id: true, salesCount: true } } },
        });
        if (variant) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: variant.stock - item.quantity },
          });
          await tx.product.update({
            where: { id: variant.product.id },
            data: { salesCount: variant.product.salesCount + item.quantity },
          });
        }
      }

      return order;
    });
  }
}
