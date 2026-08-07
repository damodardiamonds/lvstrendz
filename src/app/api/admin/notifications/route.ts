import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications: Array<{
      id: string;
      type: 'warning' | 'info' | 'success';
      title: string;
      message: string;
      href: string;
      createdAt: string;
      category: 'stock' | 'order' | 'chat' | 'system';
    }> = [];

    // 1. Fetch low stock variants
    const lowStockVariants = await db.variant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: true },
      take: 5,
      orderBy: { stock: 'asc' },
    });

    lowStockVariants.forEach((v) => {
      notifications.push({
        id: `stock-${v.id}`,
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${v.product.name} (SKU: ${v.sku}) has only ${v.stock} unit(s) remaining.`,
        href: '/admin/attributes',
        createdAt: v.updatedAt.toISOString(),
        category: 'stock',
      });
    });

    // 2. Fetch recent orders (last 10)
    try {
      const recentOrders = await db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      });

      recentOrders.forEach((order) => {
        const isPaid = order.paymentStatus === 'PAID';
        notifications.push({
          id: `order-${order.id}`,
          type: isPaid ? 'success' : 'info',
          title: `New Order #${order.orderNumber}`,
          message: `Order of ₹${Number(order.total).toLocaleString('en-IN')} by ${order.user?.name || 'Guest'} (${order.status.toLowerCase()}).`,
          href: '/admin/orders',
          createdAt: order.createdAt.toISOString(),
          category: 'order',
        });
      });
    } catch {
      // Order table might be empty or uninitialized
    }

    // 3. Fetch active chat sessions
    try {
      const activeChats = await db.chatSession.findMany({
        where: { archived: false },
        take: 3,
        orderBy: { updatedAt: "desc" },
      });

      activeChats.forEach((chat) => {
        notifications.push({
          id: `chat-${chat.id}`,
          type: "info",
          title: "Active Live Chat",
          message: `Chat session active with visitor (${chat.email || "Visitor"}).`,
          href: "/admin/chat",
          createdAt: chat.updatedAt.toISOString(),
          category: "chat",
        });
      });
    } catch {
      // Chat table might be uninitialized
    }

    // Sort all notifications newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      notifications,
      unreadCount: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
