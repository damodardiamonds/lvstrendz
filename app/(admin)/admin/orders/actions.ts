
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus } from "@prisma/client";

// Update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await db.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

// Update payment status
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
) {
  await db.order.update({
    where: { id: orderId },
    data: { paymentStatus },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

// Add order notes
export async function updateOrderNotes(orderId: string, notes: string) {
  await db.order.update({
    where: { id: orderId },
    data: { notes },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}

