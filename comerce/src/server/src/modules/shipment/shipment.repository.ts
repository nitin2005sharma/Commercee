import prisma from "@/infra/database/database.config";

export class ShipmentRepository {
  async createShipment(data: {
    orderId: string;
    trackingNumber: string;
    shippedDate: Date;
    deliveryDate?: Date | null;
    carrier: string;
  }) {
    const shipment = await prisma.shipment.upsert({
      where: { orderId: data.orderId },
      create: {
        orderId: data.orderId,
        trackingNumber: data.trackingNumber,
        shippedDate: data.shippedDate,
        deliveryDate: data.deliveryDate || null,
        carrier: data.carrier,
      },
      update: {
        trackingNumber: data.trackingNumber,
        shippedDate: data.shippedDate,
        deliveryDate: data.deliveryDate || null,
        carrier: data.carrier,
      },
    });
    return shipment;
  }
}
