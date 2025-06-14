import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Activity, Users, Camera, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface SystemStats {
  activeSessions: number;
  connectedUsers: number;
  activeCameras: number;
  activeSensors: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    activeSessions: 0,
    connectedUsers: 0,
    activeCameras: 0,
    activeSensors: 0
  });

  // WebSocket connection for real-time stats
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'sessions_state') {
          setStats(prev => ({
            ...prev,
            activeSessions: data.sessions.length,
            activeCameras: new Set(data.sessions.map((s: any) => s.cameraId)).size
          }));
        } else if (data.type === 'system_stats') {
          setStats(prev => ({
            ...prev,
            connectedUsers: data.connectedUsers,
            activeSensors: data.activeSensors
          }));
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'get_sessions_state' }));
    };

    return () => {
      ws.close();
    };
  }, []);

  const statCards = [
    {
      title: "Sesiones Activas",
      value: stats.activeSessions.toString(),
      icon: Activity,
      description: "Monitorización en curso",
    },
    {
      title: "Usuarios Conectados",
      value: stats.connectedUsers.toString(),
      icon: Users,
      description: "En el sistema",
    },
    {
      title: "Cámaras Activas",
      value: stats.activeCameras.toString(),
      icon: Camera,
      description: "En funcionamiento",
    },
    {
      title: "Sensores Activos",
      value: stats.activeSensors.toString(),
      icon: Radio,
      description: "Conectados",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Bienvenido, {user?.username}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Actividad de Sensores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
                Chart placeholder
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Sesiones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
                List placeholder
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}