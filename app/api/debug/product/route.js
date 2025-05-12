// Add this helper function
function bigIntSafeSerializer(data) {
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}

// Then use it when returning your response
export async function GET() {
  // ...your existing code
  
  // Replace regular Response.json with this:
  const jsonData = bigIntSafeSerializer(yourData);
  return new Response(jsonData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
} 