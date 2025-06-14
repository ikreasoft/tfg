import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Configuración</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">
              Ajustes generales del sistema de monitorización (En desarrollo)
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
