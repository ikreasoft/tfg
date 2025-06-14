import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Camera, Recording, Sensor } from "@shared/schema";
import { format } from "date-fns";
import { Download, Settings, ChevronDown, Plus, Video, LayoutGrid } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/sidebar";
import { useState } from "react";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [activeView, setActiveView] = useState<"cameras" | "sensors" | "sessions">("cameras");

  const { data: cameras = [], isLoading: camerasLoading } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
    refetchInterval: 10000,
  });

  const { data: sensors = [], isLoading: sensorsLoading } = useQuery<Sensor[]>({
    queryKey: ["/api/sensors"],
    refetchInterval: 10000,
  });

  const { data: recordings = [], isLoading: recordingsLoading } = useQuery<Recording[]>({
    queryKey: ["/api/recordings"],
    refetchInterval: 5000,
  });

  const handleDownload = async (recordingId: number, filename: string) => {
    try {
      const response = await fetch(`/api/recordings/${recordingId}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading recording:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-8">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Bienvenido, {user?.username}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium">Sesiones Activas</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold">
                  {recordings.filter(r => r.isActive).length}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">
                  Monitorización en curso
                </span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium">Usuarios Conectados</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold">1</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  En el sistema
                </span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium">Cámaras Activas</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold">
                  {cameras.filter(c => c.isActive).length}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">
                  En funcionamiento
                </span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium">Sensores Activos</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold">
                  {sensors.filter(s => s.isActive).length}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">
                  Conectados
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant={activeView === "cameras" ? "default" : "outline"} 
                  onClick={() => setActiveView("cameras")}
                  className="gap-2"
                >
                  <Video className="h-4 w-4" />
                  Cámaras
                </Button>
                <Button 
                  variant={activeView === "sensors" ? "default" : "outline"}
                  onClick={() => setActiveView("sensors")}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Sensores
                </Button>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Añadir Dispositivo
              </Button>
            </div>

            {activeView === "cameras" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Cámaras Disponibles</h2>
                {camerasLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando cámaras...</p>
                ) : cameras.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cameras.map(camera => (
                      <div key={camera.id} className="border rounded-lg overflow-hidden">
                        <div className="aspect-video bg-secondary/30 relative flex items-center justify-center">
                          <div className="text-center">
                            <h3 className="font-medium">{camera.name}</h3>
                            <p className="text-sm text-muted-foreground">{camera.url}</p>
                          </div>
                          <div className="absolute top-2 right-2">
                            <div className={`h-2 w-2 rounded-full ${camera.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm">Estado: {camera.isActive ? 'Activa' : 'Inactiva'}</p>
                          <p className="text-sm">Tipo: {camera.type}</p>
                          <p className="text-sm">Resolución: {camera.config?.resolution || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No se encontraron cámaras registradas</p>
                )}
              </div>
            )}

            {activeView === "sensors" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Sensores Conectados</h2>
                {sensorsLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando sensores...</p>
                ) : sensors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sensors.map(sensor => (
                      <div key={sensor.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{sensor.name}</h3>
                            <p className="text-sm text-muted-foreground">Tipo: {sensor.type}</p>
                          </div>
                          <div className={`h-3 w-3 rounded-full ${sensor.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <div className="mt-3 space-y-1 text-sm">
                          <p>Protocolo: {sensor.config?.protocol}</p>
                          <p>Dirección: {sensor.config?.address}</p>
                          <p>Intervalo: {sensor.config?.interval}s</p>
                          {sensor.config?.unit && <p>Unidad: {sensor.config.unit}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No se encontraron sensores registrados</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Grabaciones Recientes</h2>
            <div className="space-y-2">
              {recordingsLoading ? (
                <p className="text-sm text-muted-foreground">Cargando grabaciones...</p>
              ) : recordings.length > 0 ? (
                recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="p-4 border rounded-lg flex justify-between items-center bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{recording.filename}</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Inicio: {format(new Date(recording.startTime), 'dd/MM/yyyy HH:mm')}</p>
                        {recording.endTime && (
                          <p>Fin: {format(new Date(recording.endTime), 'dd/MM/yyyy HH:mm')}</p>
                        )}
                        <p className="text-xs">
                          Estado: {recording.isActive ? (
                            <span className="text-green-600">Activa</span>
                          ) : (
                            <span className="text-blue-600">Completada</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(recording.id, recording.filename)}
                      disabled={recording.isActive}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No se encontraron grabaciones</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
