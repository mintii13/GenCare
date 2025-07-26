/**
 * Removes null, undefined, and empty string properties from an object.
 * This is useful for cleaning up query parameters before sending them to an API.
 * @param query The object to clean.
 * @returns A new object with only the properties that have a value.
 */
export const cleanQuery = <T extends object>(query?: T): Partial<T> => {
  if (!query) return {};
  const cleanedQuery: Partial<T> = {};
  for (const key in query) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      const value = query[key];
      // We also check for 'all' because some filters use it as a default value to not filter.
      if (value !== null && value !== undefined && value !== '' && value !== 'all') {
        cleanedQuery[key] = value;
      }
    }
  }
  return cleanedQuery;
}; 