import express from "express";
import path from "path";
import { onRequestPost as handleDailyRoom } from "./functions/api/daily-room";
import { onRequestPost as handleSendBooking } from "./functions/api/send-booking";
import { onRequestPost as handleSifaloPay } from "./functions/api/sifalo-pay";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body parser is required to extract body from POST request
  app.use(express.json());

  // Direct APK download endpoint for https://app.barbaar.org/download
  app.get(["/DOWNLOAD", "/download", "/DOWNLOAD.apk", "/download.apk", "/barbaar-wellness-native.apk", "/Barbaar-Wellness-APK.apk"], (req, res) => {
    const apkPath = path.join(process.cwd(), "public", "Barbaar-Wellness-APK.apk");
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.download(apkPath, "Barbaar-Wellness-APK.apk", (err) => {
      if (err && !res.headersSent) {
        res.sendFile(apkPath);
      }
    });
  });

  // API routes FIRST
  app.post("/api/daily-room", async (req, res) => {
    try {
      const body = req.body;
      const mockRequest = {
        json: async () => body,
      } as unknown as Request;

      const mockContext = {
        request: mockRequest,
        env: process.env,
      };

      const response = await handleDailyRoom(mockContext);
      
      const responseText = await response.text();
      const contentType = response.headers.get("content-type") || "application/json";
      
      res.status(response.status);
      res.setHeader("Content-Type", contentType);
      res.send(responseText);
    } catch (error: any) {
      console.error("Error in Express adapter for daily-room:", error);
      const cleanId = (req.body?.bookingId || "session").replace(/[^a-zA-Z0-9_-]/g, "");
      res.json({ url: `https://barbaar.daily.co/session-${cleanId}` });
    }
  });

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

      const response = await handleSendBooking(mockContext);
      
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

      const response = await handleSifaloPay(mockContext);
      
      const responseText = await response.text();
      const contentType = response.headers.get("content-type") || "application/json";
      
      res.status(response.status);
      res.setHeader("Content-Type", contentType);
      res.send(responseText);
    } catch (error: any) {
      console.error("Error in Express adapter for sifalo-pay:", error);
      res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
