import type { Express, Request, Response } from "express";

// Note: Image generation is not available via Anthropic API.
// This route is preserved for API compatibility but returns a 501 Not Implemented.
export function registerImageRoutes(app: Express): void {
    app.post("/api/generate-image", async (req: Request, res: Response) => {
          return res.status(501).json({
                  error: "Image generation is not supported. The application has been migrated to Anthropic, which does not provide image generation. Please integrate a dedicated image generation service if needed.",
          });
    });
}
