import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser is required to extract body from POST request
  app.use(express.json());

  // API routes FIRST
  app.post("/api/send-booking", async (req, res) => {
    try {
      const body = req.body;
      const mockRequest = {
        json: async () => body,
      } as unknown as Request;

      const mockContext = {
        request: mockRequest,
        env: process.env,
      };

      const { onRequestPost } = await import("./functions/api/send-booking.ts");
      const response = await onRequestPost(mockContext);
      
      const responseText = await response.text();
      const contentType = response.headers.get("content-type") || "application/json";
      
      res.status(response.status);
      res.setHeader("Content-Type", contentType);
      res.send(responseText);
    } catch (error: any) {
      console.error("Error in Express adapter for send-booking:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/sifalo-pay", async (req, res) => {
    try {
      const body = req.body;
      const mockRequest = {
        json: async () => body,
      } as unknown as Request;

      const mockContext = {
        request: mockRequest,
        env: process.env,
      };

      const { onRequestPost } = await import("./functions/api/sifalo-pay.ts");
      const response = await onRequestPost(mockContext);
      
      const responseText = await response.text();
      const contentType = response.headers.get("content-type") || "application/json";
      
      res.status(response.status);
      res.setHeader("Content-Type", contentType);
      res.send(responseText);
    } catch (error: any) {
      console.error("Error in Express adapter for sifalo-pay:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
