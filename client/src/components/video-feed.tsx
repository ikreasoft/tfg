import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Video, PauseCircle, PlayCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Camera, Recording } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface QoSMetrics {
  latency: number;
  fps: number;
  packetLoss: number;
  connectionQuality: 'good' | 'fair' | 'poor';
}

interface VideoFeedProps {
  camera: Camera;
  isRecordingAll?: boolean;
  compact?: boolean;
  onRecordingStatusChange?: (isRecording: boolean) => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0')
  ].join(':');
}

export default function VideoFeed({
  camera,
  isRecordingAll = false,
  compact = false,
  onRecordingStatusChange
}: VideoFeedProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qosMetrics, setQosMetrics] = useState<QoSMetrics | null>(null);
  const { user } = useAuth();
  const timerRef = useRef<number | null>(null);

  // Efecto para gestionar la conexión WebSocket
  useEffect(() => {
    if (!user || !camera.isActive) return;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/camera/${camera.id}`;

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("WebSocket connected for camera:", camera.id);
          setIsConnected(true);
          setError(null);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Actualizar datos de QoS
            if (data.type === 'qos') {
              setQosMetrics(data.metrics);
            }
            
            // Procesar frame de video
            if (data.type === 'frame') {
              // Aquí procesaríamos los frames, pero en una implementación real 
              // esto se haría con un stream de video real
            }
          } catch (err) {
            console.error('Error processing websocket message:', err);
          }
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket disconnected for camera:", camera.id);
          setIsConnected(false);
          // Intentar reconectar después de 3 segundos
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current.onerror = (event) => {
          console.error("WebSocket error for camera:", camera.id, event);
          setError("Failed to connect to video stream");
        };

      } catch (err) {
        console.error("WebSocket connection error for camera:", camera.id, err);
        setError("Failed to establish video connection");
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, camera]);

  // Efecto para control de grabación global
  useEffect(() => {
    if (isRecordingAll && !isRecording && isConnected) {
      handleStartRecording();
    }
  }, [isRecordingAll, isConnected]);

  // Timer para la duración de la grabación
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      const filename = `recording_${camera.name}_${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`;
      const response = await apiRequest('/api/recordings', 'POST', {
        filename,
        cameraId: camera.id,
      });
      
      const recordingData = response as unknown as Recording;
      
      setIsRecording(true);
      setRecordingId(recordingData.id);
      if (onRecordingStatusChange) onRecordingStatusChange(true);
      
      // Envía un mensaje al servidor para iniciar la grabación
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ 
          action: 'startRecording', 
          recordingId: recordingData.id 
        }));
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recordingId) return;
    
    try {
      await apiRequest(`/api/recordings/${recordingId}`, 'PATCH', {
        isActive: false,
        endTime: new Date().toISOString()
      });
      
      setIsRecording(false);
      setRecordingId(null);
      if (onRecordingStatusChange) onRecordingStatusChange(false);
      
      // Envía un mensaje al servidor para detener la grabación
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ 
          action: 'stopRecording', 
          recordingId 
        }));
      }
      
      // Actualiza la lista de grabaciones
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setError('Failed to stop recording');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  return (
    <Card className={`relative overflow-hidden ${compact ? 'h-40' : 'aspect-video'}`}>
      {!isConnected && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <p className="text-muted-foreground">Conectando a {camera.name}...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        style={{ display: isConnected ? 'block' : 'none' }}
      />

      {/* Overlay de información */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 flex justify-between items-center">
        <div className="text-sm truncate">
          {camera.name}
          {qosMetrics && (
            <span className="text-xs ml-2 text-gray-300">
              {qosMetrics.fps} FPS | {qosMetrics.latency}ms
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="animate-pulse h-2 w-2 bg-white rounded-full"></span>
              {formatDuration(recordingTime)}
            </span>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={toggleRecording}
          >
            {isRecording ? 
              <PauseCircle className="h-5 w-5" /> : 
              <Video className="h-5 w-5" />
            }
          </Button>
        </div>
      </div>
    </Card>
  );
}