import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { Buffer } from "node:buffer";
import pLimit from "p-limit";
import pRetry from "p-retry";

const anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

// Helper function to check if error is rate limit or quota violation
export function isRateLimitError(error: unknown): boolean {
    const errorMsg =
          error instanceof Error ? error.message : String(error);
    return (
          errorMsg.includes("429") ||
          errorMsg.includes("rate limit") ||
          errorMsg.includes("quota")
        );
}

// Process prompts in batches with rate limiting and retry logic
export async function processBatch(
    prompts: string[],
    concurrency: number = 5
  ): Promise<string[]> {
    const limit = pLimit(concurrency);

  const processingPromises = prompts.map((prompt) =>
        limit(() =>
                pRetry(
                          async () => {
                                      try {
                                                    const response = await anthropicClient.messages.create({
                                                                    model: ANTHROPIC_MODEL,
                                                                    max_tokens: 8192,
                                                                    messages: [{ role: "user", content: prompt }],
                                                    });
                                                    const block = response.content[0];
                                                    return block.type === "text" ? block.text : "";
                                      } catch (error: unknown) {
                                                    // Check if it's a rate limit error
                                        if (isRateLimitError(error)) {
                                                        throw error; // Rethrow to trigger p-retry
                                        }
                                                    // For non-rate-limit errors, throw immediately (don't retry)
                                        throw new pRetry.AbortError(
                                                        error instanceof Error ? error : new Error(String(error))
                                                      );
                                      }
                          },
                  {
                              retries: 7,
                              minTimeout: 2000,
                              maxTimeout: 128000,
                              factor: 2,
                  }
                        )
                  )
                                           );

  return await Promise.all(processingPromises);
}

// Image generation - not supported with Anthropic API
// Anthropic does not provide image generation capabilities.
// If image generation is required, consider integrating a separate image API.
export async function generateImageBuffer(
    prompt: string,
    size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
  ): Promise<Buffer> {
    throw new Error(
          "Image generation is not supported. Anthropic does not provide image generation. Please use a dedicated image generation service."
        );
}

// Image editing - not supported with Anthropic API
export async function editImages(
    imageFiles: string[],
    prompt: string,
    outputPath?: string
  ): Promise<Buffer> {
    throw new Error(
          "Image editing is not supported. Anthropic does not provide image editing. Please use a dedicated image generation service."
        );
}
