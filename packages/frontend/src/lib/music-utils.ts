/**
 * Standardized error handler for music-related operations
 * Logs to console and shows user-friendly alert
 */
export function handleMusicError(error: unknown, fallbackMessage: string): void {
  const errorMessage = error instanceof Error ? error.message : fallbackMessage;
  console.error(`${fallbackMessage}:`, error);
  alert(errorMessage);
}
