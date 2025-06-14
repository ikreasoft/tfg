import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import VideoFeed from "@/components/video-feed";
import CameraList from "@/components/camera-list";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Grid2X2, Grid3X3, Maximize2, Video, VideoOff } from "lucide-react";

interface Camera {
  id: number;
  name: string;
  protocol: "rtsp" | "http";
  ipAddress: string;
  port: string;
  username?: string;
  password?: string;
  path?: string;
}

type GridLayout = "1x1" | "2x2" | "3x3";

export default function CamerasPage() {
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isRecordingAll, setIsRecordingAll] = useState(false);
  const [gridLayout, setGridLayout] = useState<GridLayout>("2x2");
  const [activeCameras, setActiveCameras] = useState<Camera[]>([]);

  const handleCameraSelect = (camera: Camera) => {
    if (gridLayout === "1x1") {
      setSelectedCamera(camera);
      setActiveCameras([camera]);
    } else {
      setSelectedCamera(null);
      if (!activeCameras.find(c => c.id === camera.id)) {
        setActiveCameras(prev => [...prev, camera]);
      }
    }
  };

  const toggleRecordingAll = () => {
    setIsRecordingAll(!isRecordingAll);
  };

  const getGridClass = () => {
    switch (gridLayout) {
      case "1x1":
        return "grid-cols-1";
      case "2x2":
        return "grid-cols-2";
      case "3x3":
        return "grid-cols-3";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Monitorización de Cámaras</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-accent/10 p-1 rounded-lg">
              <Button
                variant={gridLayout === "1x1" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setGridLayout("1x1")}
                className="h-8 w-8"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridLayout === "2x2" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setGridLayout("2x2")}
                className="h-8 w-8"
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridLayout === "3x3" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setGridLayout("3x3")}
                className="h-8 w-8"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant={isRecordingAll ? "destructive" : "default"}
              onClick={toggleRecordingAll}
              className="gap-2"
            >
              {isRecordingAll ? (
                <>
                  <VideoOff className="h-4 w-4" />
                  Detener Grabación
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  Grabar Todo
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-[300px,1fr] gap-8">
          <aside className="space-y-4">
            <CameraList 
              onCameraSelect={handleCameraSelect}
              activeCameras={activeCameras}
            />
          </aside>
          <div className={`grid ${getGridClass()} gap-4 auto-rows-fr`}>
            {gridLayout === "1x1" && selectedCamera ? (
              <VideoFeed 
                selectedCamera={selectedCamera}
                isRecordingAll={isRecordingAll}
              />
            ) : (
              activeCameras.map(camera => (
                <VideoFeed
                  key={camera.id}
                  selectedCamera={camera}
                  isRecordingAll={isRecordingAll}
                  compact={true}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}