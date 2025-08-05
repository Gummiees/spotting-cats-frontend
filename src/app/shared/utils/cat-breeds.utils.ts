/**
 * Searches for cat breeds that match the given query
 * @param query - The search query
 * @returns Array of matching cat breed names
 */
export function searchCatBreeds(query: string, breeds: string[]): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    return breeds;
  }

  return breeds.filter((breed) =>
    breed.toLowerCase().includes(normalizedQuery)
  );
}
