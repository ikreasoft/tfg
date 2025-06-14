import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./ws-handler";
import { storage } from "./storage";

// Middleware para verificar autenticación
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  app.get("/api/healthcheck", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Rutas para cámaras
  app.get("/api/cameras", isAuthenticated, async (req, res) => {
    try {
      const cameras = await storage.getCameras(req.user!.id);
      res.json(cameras);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/cameras/:id", isAuthenticated, async (req, res) => {
    try {
      const camera = await storage.getCamera(parseInt(req.params.id));
      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }
      if (camera.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      res.json(camera);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/cameras", isAuthenticated, async (req, res) => {
    try {
      const camera = await storage.createCamera({
        ...req.body,
        userId: req.user!.id
      });
      res.status(201).json(camera);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/cameras/:id", isAuthenticated, async (req, res) => {
    try {
      const cameraId = parseInt(req.params.id);
      const camera = await storage.getCamera(cameraId);
      
      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }
      
      if (camera.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const updatedCamera = await storage.updateCamera(cameraId, req.body);
      res.json(updatedCamera);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Rutas para sensores
  app.get("/api/sensors", isAuthenticated, async (req, res) => {
    try {
      const sensors = await storage.getSensors(req.user!.id);
      res.json(sensors);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/sensors/:id", isAuthenticated, async (req, res) => {
    try {
      const sensor = await storage.getSensor(parseInt(req.params.id));
      if (!sensor) {
        return res.status(404).json({ error: "Sensor not found" });
      }
      if (sensor.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      res.json(sensor);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/sensors", isAuthenticated, async (req, res) => {
    try {
      const sensor = await storage.createSensor({
        ...req.body,
        userId: req.user!.id
      });
      res.status(201).json(sensor);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/sensors/:id", isAuthenticated, async (req, res) => {
    try {
      const sensorId = parseInt(req.params.id);
      const sensor = await storage.getSensor(sensorId);
      
      if (!sensor) {
        return res.status(404).json({ error: "Sensor not found" });
      }
      
      if (sensor.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const updatedSensor = await storage.updateSensor(sensorId, req.body);
      res.json(updatedSensor);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Rutas para grabaciones
  app.get("/api/recordings", isAuthenticated, async (req, res) => {
    try {
      const recordings = await storage.getRecordings(req.user!.id);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/recordings", isAuthenticated, async (req, res) => {
    try {
      const recording = await storage.createRecording({
        ...req.body,
        userId: req.user!.id,
        startTime: new Date(),
        isActive: true
      });
      res.status(201).json(recording);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/recordings/:id", isAuthenticated, async (req, res) => {
    try {
      const recordingId = parseInt(req.params.id);
      const recording = await storage.getRecording(recordingId);
      
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }
      
      if (recording.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const updatedRecording = await storage.updateRecording(recordingId, req.body);
      res.json(updatedRecording);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/recordings/:id/download", isAuthenticated, async (req, res) => {
    try {
      const recording = await storage.getRecording(parseInt(req.params.id));
      
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }
      
      if (recording.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      if (recording.isActive) {
        return res.status(400).json({ error: "Recording is still active" });
      }

      // En una implementación real, aquí generaríamos o serviríamos el archivo de video
      // Por ahora, solo enviamos un texto de ejemplo
      res.setHeader('Content-Disposition', `attachment; filename="${recording.filename}"`)
         .setHeader('Content-Type', 'text/plain')
         .send("This is a mock video recording file. In a real implementation, this would be video data.");
         
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return httpServer;
}
