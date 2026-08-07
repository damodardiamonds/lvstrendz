// src/backend/lib/push-notifications.ts
import { db } from '@/lib/db';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Sends Expo Push Notifications to all registered admin devices.
 * Automatically cleans up stale tokens if Expo returns DeviceNotRegistered.
 */
export async function sendAdminPushNotification({
  title,
  body,
  data = {},
}: PushNotificationPayload): Promise<void> {
  try {
    const adminTokens = await db.adminPushToken.findMany();
    if (!adminTokens || adminTokens.length === 0) {
      console.log('[push-notifications] No admin push tokens registered.');
      return;
    }

    const messages = adminTokens.map((t) => ({
      to: t.token,
      sound: 'default',
      priority: 'high',
      title,
      body,
      data,
    }));

    console.log(`[push-notifications] Dispatching push to ${messages.length} admin device(s)...`);

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('[push-notifications] Expo response:', JSON.stringify(result));

    // Cleanup unregistered tokens if any errors occurred
    if (result.data && Array.isArray(result.data)) {
      const tokensToRemove: string[] = [];
      result.data.forEach((ticket: any, index: number) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          tokensToRemove.push(adminTokens[index].token);
        }
      });

      if (tokensToRemove.length > 0) {
        console.log('[push-notifications] Cleaning up stale tokens:', tokensToRemove);
        await db.adminPushToken.deleteMany({
          where: { token: { in: tokensToRemove } },
        });
      }
    }
  } catch (error) {
    console.error('[push-notifications] Failed to send push notification:', error);
  }
}
