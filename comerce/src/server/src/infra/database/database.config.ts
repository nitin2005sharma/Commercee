import * as PrismaPkg from "@prisma/client";
const PrismaClientCtor =
  (PrismaPkg as any).PrismaClient ?? (PrismaPkg as any).default ?? PrismaPkg;
const prisma = new (PrismaClientCtor as any)();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Neon Database connected successfully.");
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export default prisma;