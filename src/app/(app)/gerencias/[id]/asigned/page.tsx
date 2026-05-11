"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Building2, Download, Monitor, PhoneIcon, Smartphone } from "lucide-react";
import { showToast } from "nextjs-toast-notify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/utils/formatDate";
import Loading from "@/utils/loading";

interface GerenciaAssignedData {
  id: string;
  nombre: string;
  gerente: {
    id: string;
    nombre: string;
    apellido: string;
    cargo: string;
  } | null;
  departamentos: Array<{ id: string; nombre: string }>;
  estadisticas: {
    totalDepartamentos: number;
    totalComputadores: number;
    totalDispositivos: number;
    totalLineas: number;
    totalActivos: number;
  };
  computadores: any[];
  dispositivos: any[];
  lineasTelefonicas: any[];
}

export default function GerenciaAsignedPage() {
  const params = useParams();
  const gerenciaId = params.id;
  const [activeTab, setActiveTab] = useState("computers");
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState<GerenciaAssignedData | null>(null);

  useEffect(() => {
    if (!gerenciaId) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/gerencias/${gerenciaId}/asigned`);
        if (!response.ok) {
          throw new Error("No se pudo cargar la información de la gerencia.");
        }
        const result = await response.json();
        setData(result);
      } catch (error: any) {
        showToast.error(error.message || "Error al cargar la gerencia");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gerenciaId]);

  const handleExport = async () => {
    if (!data) return;

    setIsExporting(true);
    try {
      const computadoresData = data.computadores.map((comp) => ({
        tipo: "Computador",
        serial: comp.serial,
        marca: comp.modelo?.marca?.nombre || "N/A",
        modelo: comp.modelo?.nombre || "N/A",
        departamento: comp.departamento?.nombre || "N/A",
        fechaAsignacion: formatDate(comp.fechaAsignacion),
      }));

      const dispositivosData = data.dispositivos.map((disp) => ({
        tipo: "Dispositivo",
        serial: disp.serial,
        marca: disp.modelo?.marca?.nombre || "N/A",
        modelo: disp.modelo?.nombre || "N/A",
        departamento: disp.departamento?.nombre || "N/A",
        fechaAsignacion: formatDate(disp.fechaAsignacion),
      }));

      const lineasData = data.lineasTelefonicas.map((linea) => ({
        tipo: "Línea Telefónica",
        serial: linea.numero,
        marca: "N/A",
        modelo: linea.proveedor || "N/A",
        departamento: "N/A",
        fechaAsignacion: formatDate(linea.fechaAsignacion),
      }));

      const allData = [...computadoresData, ...dispositivosData, ...lineasData];

      const response = await fetch("/api/departamentos/export-asignados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: allData,
          departamento: data.nombre,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar el archivo Excel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.nombre}_asignados_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast.success(`Excel generado con ${allData.length} registros`);
    } catch (error: any) {
      showToast.error(error.message || "Error al exportar");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <Loading />;
  if (!data) return <div>Gerencia no encontrada.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="text-2xl font-semibold">{data.nombre}</h2>
            <Badge variant="outline" className="w-fit">
              {data.gerente ? `${data.gerente.nombre} ${data.gerente.apellido}` : "Sin gerente asociado"}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Departamentos: {data.departamentos.map((d) => d.nombre).join(", ") || "Sin departamentos"}
            </div>
          </CardContent>
        </Card>
        <StatCard title="Total Activos" value={data.estadisticas.totalActivos} icon={Monitor} />
        <StatCard title="Departamentos" value={data.estadisticas.totalDepartamentos} icon={Building2} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="computers">Computadores ({data.computadores.length})</TabsTrigger>
            <TabsTrigger value="devices">Dispositivos ({data.dispositivos.length})</TabsTrigger>
            <TabsTrigger value="phones">Líneas ({data.lineasTelefonicas.length})</TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={handleExport} disabled={isExporting || data.estadisticas.totalActivos === 0}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        </div>

        <TabsContent value="computers" className="space-y-3">
          {data.computadores.map((computador) => (
            <Card key={computador.id}>
              <CardContent className="p-4">
                <div className="font-medium">{computador.modelo?.nombre || "Computador"}</div>
                <div className="text-sm text-muted-foreground">
                  Serial: {computador.serial} | Departamento: {computador.departamento?.nombre || "N/A"} | Fecha:{" "}
                  {formatDate(computador.fechaAsignacion)}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="devices" className="space-y-3">
          {data.dispositivos.map((dispositivo) => (
            <Card key={dispositivo.id}>
              <CardContent className="p-4">
                <div className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  {dispositivo.modelo?.nombre || "Dispositivo"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Serial: {dispositivo.serial} | Departamento: {dispositivo.departamento?.nombre || "N/A"} | Fecha:{" "}
                  {formatDate(dispositivo.fechaAsignacion)}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="phones" className="space-y-3">
          {data.lineasTelefonicas.map((linea) => (
            <Card key={linea.id}>
              <CardContent className="p-4">
                <div className="font-medium flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4" />
                  {linea.numero}
                </div>
                <div className="text-sm text-muted-foreground">
                  Proveedor: {linea.proveedor || "N/A"} | Fecha: {formatDate(linea.fechaAsignacion)}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: any }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
