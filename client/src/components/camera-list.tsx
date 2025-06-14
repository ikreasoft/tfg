import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera as CameraIcon, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const cameraSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  type: z.string().min(1, "El tipo es obligatorio"),
  url: z.string().min(1, "La URL es obligatoria"),
  username: z.string().optional(),
  password: z.string().optional(),
  config: z.object({
    resolution: z.string().optional(),
    framerate: z.number().min(1).max(60).optional(),
    quality: z.number().min(1).max(100).optional(),
  }).optional(),
});

type CameraFormValues = z.infer<typeof cameraSchema>;

interface CameraListProps {
  onCameraSelect: (camera: Camera) => void;
  activeCameras?: Camera[];
}

export default function CameraList({ onCameraSelect, activeCameras = [] }: CameraListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: cameras = [], isLoading } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
    refetchInterval: 10000,
  });

  const form = useForm<CameraFormValues>({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      name: "",
      type: "rtsp",
      url: "",
      username: "",
      password: "",
      config: {
        resolution: "1280x720",
        framerate: 30,
        quality: 80,
      },
    },
  });

  const handleAddCamera = async (data: CameraFormValues) => {
    try {
      await apiRequest("/api/cameras", "POST", {
        ...data,
        userId: user?.id,
        isActive: true,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      
      toast({
        title: "Cámara agregada",
        description: `La cámara ${data.name} ha sido agregada correctamente.`,
      });
      
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar la cámara. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h2 className="text-sm font-medium">Cámaras Disponibles</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Añadir Cámara IP</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddCamera)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Cámara entrada principal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rtsp">RTSP</SelectItem>
                          <SelectItem value="http">HTTP</SelectItem>
                          <SelectItem value="onvif">ONVIF</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="rtsp://192.168.1.100:554/stream1" />
                      </FormControl>
                      <FormDescription>
                        URL completa de la cámara (incluyendo protocolo, IP, puerto y ruta)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuario (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="admin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.resolution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resolución</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona resolución" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="640x480">640x480</SelectItem>
                          <SelectItem value="1280x720">1280x720 (720p)</SelectItem>
                          <SelectItem value="1920x1080">1920x1080 (1080p)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      'Agregar cámara'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : cameras.length > 0 ? (
          cameras.map((camera) => (
            <Button
              key={camera.id}
              variant={activeCameras.some(c => c.id === camera.id) ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => onCameraSelect(camera)}
            >
              <CameraIcon className="h-4 w-4" />
              <div className="flex flex-col items-start text-left">
                <span>{camera.name}</span>
                <span className="text-xs text-muted-foreground">
                  {camera.type}://{camera.url.split('://')[1] || camera.url}
                </span>
              </div>
            </Button>
          ))
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No hay cámaras disponibles.
          </div>
        )}
      </CardContent>
    </Card>
  );
}