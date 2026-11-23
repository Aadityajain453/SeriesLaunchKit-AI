
export function getEstimatedVideoProgress(video) {
  if (!video) return 0;

  if (video.status === 'completed') return 100;

  if (!['queued', 'processing'].includes(video.status)) {
    return 0;
  }

  const createdAt = new Date(video.createdAt).getTime();
  const elapsedMs = Number.isFinite(createdAt)
    ? Math.max(0, Date.now() - createdAt)
    : 0;

  const estimatedProgress = Math.min(
    95,
    Math.max(
      2,
      Math.round(2 + 93 * (1 - Math.exp(-elapsedMs / 180000)))
    )
  );

  return Math.max(
    estimatedProgress,
    Math.min(Number(video.progress) || 0, 95)
  );
}
