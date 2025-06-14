import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera } from "@shared/schema";
import VideoFeed from "./video-feed";
import { Button } from "@/components/ui/button";
import { Grid, Layout, LayoutGrid } from "lucide-react";

type GridLayout = "1x1" | "2x2" | "3x3";

interface CameraGridProps {
  cameras: Camera[];
  isLoading?: boolean;
}

export default function CameraGrid({ cameras, isLoading = false }: CameraGridProps) {
  const [layout, setLayout] = useState<GridLayout>("2x2");
  const [isRecordingAll, setIsRecordingAll] = useState(false);
  
  const getColumnsClass = () => {
    switch(layout) {
      case "1x1": return "grid-cols-1";
      case "2x2": return "grid-cols-1 md:grid-cols-2";
      case "3x3": return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      default: return "grid-cols-1 md:grid-cols-2";
    }
  };
  
  // Determine how many cameras to show based on the layout
  const getCameraLimit = () => {
    switch(layout) {
      case "1x1": return 1;
      case "2x2": return 4;
      case "3x3": return 9;
      default: return 4;
    }
  };
  
  const activeCameras = cameras
    .filter(camera => camera.isActive)
    .slice(0, getCameraLimit());
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Cargando cámaras...</p>
      </div>
    );
  }
  
  if (activeCameras.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No hay cámaras activas para mostrar.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Añade cámaras desde la configuración o activa alguna cámara existente.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant={layout === "1x1" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("1x1")}
            className="w-8 h-8 p-0"
          >
            <Layout className="w-4 h-4" />
          </Button>
          <Button 
            variant={layout === "2x2" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("2x2")}
            className="w-8 h-8 p-0"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button 
            variant={layout === "3x3" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("3x3")}
            className="w-8 h-8 p-0"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          variant={isRecordingAll ? "destructive" : "default"}
          size="sm"
          onClick={() => setIsRecordingAll(!isRecordingAll)}
        >
          {isRecordingAll ? "Detener Grabación" : "Grabar Todo"}
        </Button>
      </div>
      
      <div className={`grid ${getColumnsClass()} gap-4`}>
        {activeCameras.map(camera => (
          <VideoFeed 
            key={camera.id} 
            camera={camera} 
            isRecordingAll={isRecordingAll}
          />
        ))}
      </div>
    </div>
  );
}