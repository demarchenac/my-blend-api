import { brotliCompressSync } from "zlib";

export async function imageToRaw(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not fetch image @ imageToRaw");

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const compressed = brotliCompressSync(buffer);
    return compressed.toString("base64");
  } catch (e) {
    throw new Error("Something went wrong whilst fetching the url and parsing it to base 64 @ imageToRaw");
  }
}
