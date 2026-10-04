type AssistanceMetricRecord = {
  id: number;
  requesterId: number;
  status: "pending" | "accepted" | "declined" | "closed";
  isExpired?: boolean;
};

/**
 * Calcula indicadores exclusivamente a partir do histórico já visível e das escolhas
 * guardadas no dispositivo. Nenhuma avaliação ou métrica é enviada ao servidor.
 */
export function getPrivateAssistanceMetrics(
  records: AssistanceMetricRecord[],
  userId: number | undefined,
  archivedIds: number[],
  ratings: Record<string, number>,
) {
  const ownRecords = records.filter((record) => record.requesterId === userId);
  const ownIds = new Set(ownRecords.map((record) => record.id));
  const ownRatings = Object.entries(ratings)
    .filter(([requestId, rating]) => ownIds.has(Number(requestId)) && Number.isInteger(rating) && rating >= 1 && rating <= 5)
    .map(([, rating]) => rating);

  return {
    totalSent: ownRecords.length,
    responded: ownRecords.filter((record) => record.status !== "pending" || record.isExpired).length,
    closed: ownRecords.filter((record) => record.status === "closed").length,
    archived: archivedIds.filter((id) => ownIds.has(id)).length,
    rated: ownRatings.length,
    averageUsefulness: ownRatings.length ? ownRatings.reduce((sum, rating) => sum + rating, 0) / ownRatings.length : null,
  };
}
