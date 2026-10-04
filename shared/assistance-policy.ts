export type AssistanceStatus = "pending" | "accepted" | "declined" | "closed";

export function canRespondToAssistanceRequest(
  status: AssistanceStatus,
  expiresAt: Date,
  recipientId: number,
  actorId: number,
  now = new Date(),
) {
  return status === "pending" && expiresAt > now && recipientId === actorId;
}

export function canSendAssistanceGuidance(
  status: AssistanceStatus,
  recipientId: number,
  actorId: number,
) {
  return status === "accepted" && recipientId === actorId;
}

export function canCloseAssistanceRequest(
  status: AssistanceStatus,
  requesterId: number,
  recipientId: number,
  actorId: number,
) {
  return status === "accepted" && (requesterId === actorId || recipientId === actorId);
}
