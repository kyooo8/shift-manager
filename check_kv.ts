/// <reference lib="deno.unstable" />

try {
  // KVストアを開く
  const kv = await Deno.openKv();

  console.log("Fetching all keys and values from Deno KV:");

  // すべてのキーと値を取得
  for await (const entry of kv.list({ prefix: [] })) {
    console.log("Key:", entry.key, "Value:", entry.value);
  }

  kv.close();
} catch (error) {
  console.error("Error accessing Deno KV:", error);
}
