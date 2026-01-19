/**
 * Utility functions for detecting placeholder values in wedding data.
 * Placeholders use bracket notation like [Bride's Name] to indicate unfilled data.
 */

/**
 * Checks if a string value is a placeholder (starts with '[' or is empty/null)
 */
export function isPlaceholder(value: string | null | undefined): boolean {
  if (!value || value.trim() === '') return true
  return value.trim().startsWith('[')
}

/**
 * Checks if coordinates are valid (not the default 0,0 placeholder)
 */
export function isValidCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false
  }
  // (0, 0) is in the ocean - used as placeholder for "not set"
  return !(lat === 0 && lng === 0)
}

/**
 * Checks if a hashtag is a placeholder
 */
export function isPlaceholderHashtag(hashtag: string | null | undefined): boolean {
  if (!hashtag || hashtag.trim() === '') return true
  // Check for bracket notation in hashtag like [#YourHashtag]
  return hashtag.includes('[') || hashtag.includes(']')
}
