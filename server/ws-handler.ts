import { Server as HttpServer } from "http";
import WebSocket, { WebSocketServer } from "ws";

interface RecordingSession {
  id: string;
  cameraId: number;
  startTime: string;
  isActive: boolean;
  frames: any[];
}

// Mantener un registro global de sesiones activas
const activeSessions = new Map<number, RecordingSession>();

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Broadcast del estado actual de las sesiones a todos los clientes
  const broadcastSessionsState = () => {
    const activeSessionsData = Array.from(activeSessions.values())
      .filter(session => session.isActive)
      .map(({ cameraId, startTime }) => ({ cameraId, startTime }));

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'sessions_state',
          sessions: activeSessionsData
        }));
      }
    });
  };

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established");
    let selectedCamera: any = null;
    let currentSession: RecordingSession | null = null;

    // QoS monitoring
    const startTime = Date.now();
    let lastPing = startTime;
    let packetsSent = 0;
    let packetsReceived = 0;

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
        packetsSent++;
      }
    }, 1000);

    // Enviar estado inicial de sesiones al conectar
    const initialSessions = Array.from(activeSessions.values())
      .filter(session => session.isActive)
      .map(({ cameraId, startTime }) => ({ cameraId, startTime }));

    ws.send(JSON.stringify({
      type: 'sessions_state',
      sessions: initialSessions
    }));

    ws.on('pong', () => {
      packetsReceived++;
      const latency = Date.now() - lastPing;
      lastPing = Date.now();

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'connection_test',
          latency,
          packetLoss: 1 - (packetsReceived / packetsSent)
        }));
      }
    });

    let frameCount = 0;
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN && selectedCamera) {
        try {
          const frame = {
            type: 'frame',
            frameNumber: frameCount++,
            timestamp: new Date().toISOString(),
            data: "mock-frame-data"
          };

          if (currentSession?.isActive) {
            currentSession.frames.push(frame);
          }

          ws.send(JSON.stringify(frame));
        } catch (error) {
          console.error("Error sending frame:", error);
        }
      }
    }, 1000 / 30);

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'camera_select':
            selectedCamera = data.camera;
            // Si hay una sesión activa para esta cámara, restaurarla
            if (activeSessions.has(selectedCamera.id)) {
              currentSession = activeSessions.get(selectedCamera.id)!;
              ws.send(JSON.stringify({
                type: 'session_restored',
                session: {
                  startTime: currentSession.startTime,
                  isActive: currentSession.isActive
                }
              }));
            }

            if (data.action === 'test_connection') {
              setTimeout(() => {
                ws.send(JSON.stringify({
                  type: 'connection_test',
                  latency: Math.random() * 50 + 10,
                  packetLoss: Math.random() * 0.1
                }));
              }, 100);
            }
            break;

          case 'start_recording':
            if (!selectedCamera) break;

            const sessionId = `${selectedCamera.id}-${Date.now()}`;
            currentSession = {
              id: sessionId,
              cameraId: selectedCamera.id,
              startTime: new Date().toISOString(),
              isActive: true,
              frames: []
            };
            activeSessions.set(selectedCamera.id, currentSession);
            broadcastSessionsState();
            console.log(`Started recording session ${sessionId}`);
            break;

          case 'stop_recording':
            if (currentSession && selectedCamera) {
              currentSession.isActive = false;
              activeSessions.delete(selectedCamera.id);
              broadcastSessionsState();
              console.log(`Stopped recording session ${currentSession.id}`);
              currentSession = null;
            }
            break;

          case 'get_sessions_state':
            const sessions = Array.from(activeSessions.values())
              .filter(session => session.isActive)
              .map(({ cameraId, startTime }) => ({ cameraId, startTime }));

            ws.send(JSON.stringify({
              type: 'sessions_state',
              sessions
            }));
            break;
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    ws.on("close", () => {
      clearInterval(interval);
      clearInterval(pingInterval);
      // No eliminar la sesión al cerrar la conexión
      // Solo marcar que esta conexión ya no está activa
      currentSession = null;
      console.log("WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clearInterval(interval);
      clearInterval(pingInterval);
      currentSession = null;
    });
  });

  return wss;
}