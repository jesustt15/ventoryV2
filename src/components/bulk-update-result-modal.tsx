"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkUpdateResult } from "@/types/bulk-update";

interface BulkUpdateResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BulkUpdateResult | null;
}

export function BulkUpdateResultModal({
  isOpen,
  onClose,
  result,
}: BulkUpdateResultModalProps) {
  if (!result) return null;

  const { summary, results } = result;

  // Filtrar resultados por categoría
  const equiposActualizados = results.filter((r) => r.updated);
  const equiposNoEncontrados = results.filter((r) => !r.found);
  const usuariosNoEncontrados = results.filter((r) => r.usuarioExiste === false);
  const incongruenciasUsuarios = results.filter(
    (r) => r.found && r.usuarioExcel && r.usuarioExiste && r.warning?.includes("Incongruencia")
  );

  const hasWarnings =
    summary.usuariosNoEncontrados > 0 || summary.incongruenciasUsuarios > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Resultado de Carga Masiva</DialogTitle>
          <DialogDescription>
            Resumen de la actualización masiva de computadores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen General */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {summary.totalRows}
              </div>
              <div className="text-sm text-blue-600">Filas procesadas</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {summary.updated}
              </div>
              <div className="text-sm text-green-600">Actualizados</div>
            </div>
            {summary.created !== undefined && (
              <div className="bg-cyan-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-cyan-700">
                  {summary.created}
                </div>
                <div className="text-sm text-cyan-600">Creados</div>
              </div>
            )}
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-700">
                {summary.notFound}
              </div>
              <div className="text-sm text-red-600">No encontrados</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {summary.usuariosNoEncontrados + summary.incongruenciasUsuarios}
              </div>
              <div className="text-sm text-yellow-600">Alertas de usuarios</div>
            </div>
          </div>

          {/* Alertas adicionales para dispositivos */}
          {(summary.marcasCreadas || summary.modelosCreados) && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Marcas y Modelos Creados</AlertTitle>
              <AlertDescription>
                Se crearon {summary.marcasCreadas || 0} marcas nuevas y {summary.modelosCreados || 0} modelos nuevos automáticamente.
              </AlertDescription>
            </Alert>
          )}

          {/* Alertas de Usuarios */}
          {hasWarnings && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atención: Problemas con usuarios</AlertTitle>
              <AlertDescription>
                Se encontraron {summary.usuariosNoEncontrados} usuarios no existentes y{" "}
                {summary.incongruenciasUsuarios} incongruencias. Revisa las pestañas
                para más detalles.
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs con detalles */}
          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="usuarios-no-encontrados">
                Usuarios no encontrados
                {summary.usuariosNoEncontrados > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {summary.usuariosNoEncontrados}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="incongruencias">
                Incongruencias
                {summary.incongruenciasUsuarios > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {summary.incongruenciasUsuarios}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="no-encontrados">
                Equipos no encontrados
                {summary.notFound > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {summary.notFound}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab: Resumen */}
            <TabsContent value="resumen">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {equiposActualizados.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Equipos actualizados ({equiposActualizados.length})
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {equiposActualizados.map((item) => (
                          <li key={item.serial} className="flex items-start gap-2">
                            <span className="font-mono text-xs bg-green-100 px-2 py-1 rounded">
                              {item.serial}
                            </span>
                            <span className="text-muted-foreground">{item.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab: Usuarios no encontrados */}
            <TabsContent value="usuarios-no-encontrados">
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Usuario en Excel</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Mensaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosNoEncontrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No hay usuarios no encontrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      usuariosNoEncontrados.map((item) => (
                        <TableRow key={item.serial}>
                          <TableCell className="font-mono text-xs">
                            {item.serial}
                          </TableCell>
                          <TableCell>{item.usuarioExcel || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <XCircle className="h-3 w-3" />
                              No existe
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.warning}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Tab: Incongruencias */}
            <TabsContent value="incongruencias">
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Usuario en Excel</TableHead>
                      <TableHead>Usuario Actual en BD</TableHead>
                      <TableHead>Acción Requerida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incongruenciasUsuarios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No hay incongruencias de usuarios
                        </TableCell>
                      </TableRow>
                    ) : (
                      incongruenciasUsuarios.map((item) => (
                        <TableRow key={item.serial}>
                          <TableCell className="font-mono text-xs">
                            {item.serial}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.usuarioExcel || "N/A"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {item.usuarioActual || "Sin asignar"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                              <span className="text-muted-foreground">
                                Reasignar manualmente
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Tab: Equipos no encontrados */}
            <TabsContent value="no-encontrados">
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Usuario en Excel</TableHead>
                      <TableHead>Mensaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposNoEncontrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Todos los equipos fueron encontrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      equiposNoEncontrados.map((item) => (
                        <TableRow key={item.serial}>
                          <TableCell className="font-mono text-xs">
                            {item.serial}
                          </TableCell>
                          <TableCell>{item.usuarioExcel || "N/A"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.message}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
