"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Phone,
  Calendar,
  MapPin,
  Building,
  Mail,
  Shield,
  Activity,
  Edit,
  MoreHorizontal,
  Download,
  RefreshCw,
  Hexagon,
  PhoneIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useParams } from "next/navigation"
import Loading from "@/utils/loading"
import { formatDate } from "@/utils/formatDate"
import { useRouter } from "next/navigation"
import { showToast } from "nextjs-toast-notify"


interface DeptoProfileData {
  id: string;
  nombre: string;
  gerencia: string;
  ceco: string;
  sociedad: string;
  estadisticas: {
    totalComputadores: number;
    totalDispositivos: number;
    totalLineas: number;
    totalActivos: number;
  };
  computadores: any[]; // Deberías tipar esto más estrictamente
  dispositivos: any[];
  lineasTelefonicas: any[];
}


const statusConfig = {
  operativo: { label: "Operativo", color: "green", bgColor: "bg-green-500/20", textColor: "text-green-400" },
  mantenimiento: { label: "En Mantenimiento", color: "amber", bgColor: "bg-amber-500/20", textColor: "text-amber-400" },
  reparacion: { label: "En Reparación", color: "orange", bgColor: "bg-orange-500/20", textColor: "text-orange-400" },
  inactivo: { label: "Inactivo", color: "red", bgColor: "bg-red-500/20", textColor: "text-red-400" },
  activo: { label: "Activo", color: "green", bgColor: "bg-green-500/20", textColor: "text-green-400" },
}

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("computers")

  const router = useRouter();
  const params = useParams();
  const deptoId = params.id; // Obtiene el ID del usuario desde la URL

  const [deptoData, setDeptoData] = useState<DeptoProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (deptoId) {
      const fetchDeptoData = async () => {
        try {
          const response = await fetch(`/api/departamentos/${deptoId}/asigned`);
          if (!response.ok) {
            throw new Error('No se pudo cargar la información del usuario.');
          }
          const data = await response.json();
          setDeptoData(data);
        } catch (error) {
          console.error(error);
          // Manejar el error, quizás mostrar un toast o un mensaje
        } finally {
          setLoading(false);
        }
      };
      fetchDeptoData();
    }
  }, [deptoId]);



  const handleExportToExcel = async () => {
    if (!deptoData) return;
    
    setIsExporting(true);
    try {
      // Preparar datos de computadores
      const computadoresData = deptoData.computadores.map((comp) => ({
        tipo: "Computador",
        serial: comp.serial,
        marca: comp.modelo?.marca?.nombre || "N/A",
        modelo: comp.modelo?.nombre || "N/A",
        ubicacion: comp.ubicacion || "N/A",
        fechaAsignacion: formatDate(comp.fechaAsignacion),
        asignadoA: comp.usuario 
          ? `${comp.usuario.nombre} ${comp.usuario.apellido}`
          : "Departamento",
      }));

      // Preparar datos de dispositivos
      const dispositivosData = deptoData.dispositivos.map((disp) => ({
        tipo: "Dispositivo",
        serial: disp.serial,
        marca: disp.marca || "N/A",
        modelo: disp.modelo?.nombre || "N/A",
        ubicacion: disp.ubicacion || "N/A",
        fechaAsignacion: formatDate(disp.fechaAsignacion),
        asignadoA: disp.usuario 
          ? `${disp.usuario.nombre} ${disp.usuario.apellido}`
          : "Departamento",
      }));

      // Preparar datos de líneas telefónicas
      const lineasData = deptoData.lineasTelefonicas.map((linea) => ({
        tipo: "Línea Telefónica",
        serial: linea.numero,
        marca: "N/A",
        modelo: linea.tipo || "N/A",
        ubicacion: "N/A",
        fechaAsignacion: formatDate(linea.fechaAsignacion),
        asignadoA: "Departamento",
      }));

      const allData = [...computadoresData, ...dispositivosData, ...lineasData];

      // Enviar al endpoint
      const response = await fetch("/api/departamentos/export-asignados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          data: allData,
          departamento: deptoData.nombre,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar el archivo Excel");
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deptoData.nombre}_asignados_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast.success(`Excel generado con ${allData.length} registros`);
    } catch (error: any) {
      console.error(error);
      showToast.error(error.message || "Error al exportar a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <Loading  />;
  }

  if (!deptoData) {
    return <div>Departamento no encontrado.</div>;
  }


  return (
    <div className="space-y-6 p-4">

        {/* depto Info Section */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* depto Profile Card */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-muted/50 p-6 border-b">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 border-2 border-primary/50">
                      <AvatarFallback className="bg-muted text-primary text-2xl">
                        {deptoData.nombre[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {deptoData.nombre}
                    </h2>
                    <Badge className="bg-primary/10 text-primary border-primary/20">{deptoData.gerencia}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Cards */}
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Total Activos"
                value={deptoData.estadisticas.totalActivos}
                icon={Monitor}
                color="cyan"
                description="Asignados"
              />
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-muted p-1">
              <TabsTrigger
                value="computers"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Computadores ({deptoData.computadores.length})
              </TabsTrigger>
              <TabsTrigger value="devices" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                Dispositivos ({deptoData.dispositivos.length})
              </TabsTrigger>
              <TabsTrigger value="phones" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                Líneas Telefónicas ({deptoData.lineasTelefonicas.length})
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              onClick={handleExportToExcel}
              disabled={isExporting || deptoData.estadisticas.totalActivos === 0}
              
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exportando..." : "Exportar Todo a Excel"}
            </Button>
          </div>

          <TabsContent value="computers" className="mt-0">
            <div className="grid gap-6">
              {deptoData.computadores.map((computador) => (
                <Card key={computador.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1">
                        <img
                          src={computador.modelo.img || "/placeholder.svg"}
                          alt={computador.modelo.nombre}
                          className="w-full h-48 object-cover rounded-md border"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {computador.modelo.nombre}
                            </h3>
                            <p className="text-sm text-muted-foreground">ID: {computador.id}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Número de Serie</p>
                            <p className="text-sm text-foreground font-mono">{computador.serial}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Fecha de Asignación</p>
                            <p className="text-sm text-foreground">{formatDate(computador.fechaAsignacion)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Ubicación</p>
                            <p className="text-sm text-foreground">{computador.ubicacion}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Asignado A</p>
                            <p className="text-sm text-foreground font-semibold">
                              {/* Lógica condicional para mostrar el asignado */}
                              {computador.usuario 
                                ? `${computador.usuario.nombre} ${computador.usuario.apellido}`
                                : computador.departamentoId 
                                  ? `Asignado directamente al departamento`
                                  : "En resguardo / Sin asignar"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="devices" className="mt-0">
            <div className="grid gap-6">
              {deptoData.dispositivos.map((dispositivo) => {
                // No DeviceIcon needed
                return (
                  <Card key={dispositivo.id}>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                          <img
                            src={dispositivo.modelo.img || "/placeholder.svg"}
                            alt={dispositivo.modelo.nombre}
                            className="w-full h-48 object-cover rounded-md border"
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <PhoneIcon className="h-6 w-6 text-primary mr-2" />
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {dispositivo.marca} {dispositivo.modelo.nombre}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {dispositivo.tipo} • ID: {dispositivo.id}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Número de Serie</p>
                              <p className="text-sm text-foreground font-mono">{dispositivo.serial}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Fecha de Asignación</p>
                              <p className="text-sm text-foreground">{formatDate(dispositivo.fechaAsignacion)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Ubicación</p>
                              <p className="text-sm text-foreground">{dispositivo.ubicacion}</p>
                            </div>
                            <div>
                            <p className="text-xs text-muted-foreground mb-1">Asignado A</p>
                            <p className="text-sm text-foreground font-semibold">
                              {dispositivo.usuario 
                                ? `${dispositivo.usuario.nombre} ${dispositivo.usuario.apellido}`
                                : dispositivo.departamentoId 
                                  ? `Asignado directamente al departamento`
                                  : "En resguardo / Sin asignar"}
                            </p>
                          </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="phones" className="mt-0">
            <div className="grid gap-6">
              {deptoData.lineasTelefonicas.map((linea) => {

                return (
                  <Card key={linea.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <PhoneIcon className="h-6 w-6 text-primary mr-2" />
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{linea.numero}</h3>
                            <p className="text-sm text-muted-foreground">
                              {linea.tipo} • ID: {linea.id}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Fecha de Asignación</p>
                          <p className="text-sm text-foreground">{formatDate(linea.fechaAsignacion)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
    </div>
  )
}

// Componente para las tarjetas de estadísticas
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string
  value: number
  icon: any
  color: string
  description: string
}) {
  const getColorClasses = () => {
    switch (color) {
      case "cyan":
        return "text-primary"
      case "green":
        return "text-green-500"
      case "purple":
        return "text-purple-500"
      case "amber":
        return "text-amber-500"
      default:
        return "text-primary"
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">{title}</div>
          <Icon className={`h-4 w-4 ${getColorClasses()}`} />
        </div>
        <div className="text-xl font-bold text-foreground mb-1">{value.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  )
}
