/**
 * Utility function to safely stringify JSON that might contain BigInt values
 */
export function safeJsonStringify(data: any): string {
  return JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  );
} 