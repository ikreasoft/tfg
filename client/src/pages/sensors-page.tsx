import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SensorsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sensores</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sensores Zigbee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">
              Integración con sensores SONOFF SNZB-04 vía Zigbee 3.0 USB Dongle Plus
              (En desarrollo)
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
