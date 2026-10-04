import { and, eq } from "drizzle-orm";

import { pushDevices } from "../drizzle/schema";
import { getDb } from "./db";

type AssistancePushEvent = "request" | "response" | "guidance";

const copyByEvent: Record<AssistancePushEvent, { title: string; body: string }> = {
  request: {
    title: "Movo: novo pedido",
    body: "Você recebeu um pedido de acompanhamento para revisar.",
  },
  response: {
    title: "Movo: acompanhamento atualizado",
    body: "Há uma atualização em um acompanhamento consentido.",
  },
  guidance: {
    title: "Movo: orientação disponível",
    body: "Uma nova orientação está disponível no acompanhamento consentido.",
  },
};

type ExpoTicket = {
  status?: "ok" | "error";
  details?: { error?: string };
};

/**
 * Envia somente textos neutros e a rota interna. O payload não inclui título/conteúdo
 * de missão, nota, orientação, localização, arquivos, contatos ou dados de tela.
 */
export async function sendAssistancePush(recipientId: number, missionId: number, event: AssistancePushEvent) {
  const db = await getDb();
  if (!db) return;

  const devices = await db
    .select({ expoPushToken: pushDevices.expoPushToken })
    .from(pushDevices)
    .where(and(eq(pushDevices.userId, recipientId), eq(pushDevices.deliveryMode, "remote"), eq(pushDevices.isActive, true)));
  if (devices.length === 0) return;

  const copy = copyByEvent[event];
  const messages = devices.map((device) => ({
    to: device.expoPushToken,
    sound: null,
    title: copy.title,
    body: copy.body,
    channelId: "movo-assistance",
    data: { route: `/assistance/${missionId}`, missionId },
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    if (!response.ok) return;
    const payload = await response.json() as { data?: ExpoTicket[] };
    const invalidTokens = (payload.data ?? [])
      .map((ticket, index) => ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered" ? devices[index]?.expoPushToken : undefined)
      .filter((token): token is string => Boolean(token));
    for (const expoPushToken of invalidTokens) {
      await db.update(pushDevices).set({ isActive: false }).where(eq(pushDevices.expoPushToken, expoPushToken));
    }
  } catch {
    // A entrega de push não deve interromper a transação da assistência; a notificação interna permanece disponível.
  }
}
