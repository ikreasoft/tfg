import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SessionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sesiones</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">
              Aquí podrás ver y retomar sesiones anteriores (En desarrollo)
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
