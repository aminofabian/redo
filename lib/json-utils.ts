/**
 * Utilities for safely handling JSON serialization and deserialization with BigInt values
 */

/**
 * Safely stringify values that may contain BigInt by converting BigInt to strings
 */
export function safeJSONStringify(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    // Convert BigInt to string format
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}

/**
 * Safely parse JSON that may contain stringified BigInt values
 */
export function safeJSONParse(text: string): any {
  return JSON.parse(text, (key, value) => {
    // Convert string to BigInt if it matches a pattern like a large numeric string
    if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
      return BigInt(value);
    }
    return value;
  });
}
