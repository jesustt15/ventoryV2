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
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkUpdateResult } from "@/types/bulk-update";

interface BulkUpdateResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BulkUpdateResult | null;
}

function rowKey(item: { serial: string; excelRow?: number }, index: number) {
  return `${item.excelRow ?? "—"}:${item.serial}:${index}`;
}

export function BulkUpdateResultModal({
  isOpen,
  onClose,
  result,
}: BulkUpdateResultModalProps) {
  if (!result) return null;

  const { summary, results } = result;

  const equiposActualizados = results.filter((r) => r.updated);
  const sinCambios = results.filter((r) => r.found && !r.updated);
  const equiposNoEncontrados = results.filter((r) => !r.found);
  const usuariosNoEncontrados = results.filter((r) => r.usuarioExiste === false);
  const incongruenciasUsuarios = results.filter(
    (r) => r.found && r.usuarioExcel && r.usuarioExiste && r.warning?.includes("Incongruencia"),
  );

  const hasWarnings =
    summary.usuariosNoEncontrados > 0 || summary.incongruenciasUsuarios > 0;

  const unchangedCount = summary.unchanged ?? sinCambios.length;
  const notFoundRows = summary.notFoundRows ?? summary.notFound;
  const showExcelRow = results.some((r) => r.excelRow != null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Resultado de carga masiva</DialogTitle>
          <DialogDescription>
            Detalle por fila del archivo y del inventario (seriales normalizados para coincidir con la base de datos).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {summary.totalRows}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Filas en Excel</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/40 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {summary.updated}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Actualizados</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                {unchangedCount}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Sin cambios</div>
            </div>
            {summary.created !== undefined && summary.created > 0 && (
              <div className="bg-cyan-50 dark:bg-cyan-950/40 p-3 rounded-lg">
                <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                  {summary.created}
                </div>
                <div className="text-xs text-cyan-600 dark:text-cyan-400">Creados</div>
              </div>
            )}
            <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {summary.notFound}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">Seriales no resueltos</div>
              {notFoundRows > summary.notFound && (
                <div className="text-[10px] text-red-500 mt-1 leading-tight">
                  {notFoundRows} filas en Excel (repetidos u homónimos)
                </div>
              )}
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/40 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {summary.usuariosNoEncontrados + summary.incongruenciasUsuarios}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">Alertas usuario</div>
            </div>
          </div>

          {(summary.marcasCreadas || summary.modelosCreados) && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Marcas y modelos creados</AlertTitle>
              <AlertDescription>
                Se crearon {summary.marcasCreadas || 0} marcas nuevas y{" "}
                {summary.modelosCreados || 0} modelos nuevos automáticamente.
              </AlertDescription>
            </Alert>
          )}

          {hasWarnings && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atención: usuarios en el Excel</AlertTitle>
              <AlertDescription>
                {summary.usuariosNoEncontrados} referencias a usuarios inexistentes y{" "}
                {summary.incongruenciasUsuarios} incongruencias con la asignación actual. Revisa las
                pestañas correspondientes.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
              <TabsTrigger value="resumen" className="text-xs sm:text-sm">
                Actualizados
                {equiposActualizados.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {equiposActualizados.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sin-cambios" className="text-xs sm:text-sm">
                Sin cambios
                {sinCambios.length > 0 && (
                  <Badge variant="outline" className="ml-1">
                    {sinCambios.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="usuarios-no-encontrados" className="text-xs sm:text-sm">
                Usuario inexistente
                {summary.usuariosNoEncontrados > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {summary.usuariosNoEncontrados}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="incongruencias" className="text-xs sm:text-sm">
                Incongruencias
                {summary.incongruenciasUsuarios > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {summary.incongruenciasUsuarios}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="no-encontrados" className="text-xs sm:text-sm">
                Serial no resuelto
                {summary.notFound > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {summary.notFound}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumen">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {equiposActualizados.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Ninguna fila generó actualización de campos en base de datos.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {equiposActualizados.map((item, i) => (
                      <li key={rowKey(item, i)} className="flex flex-wrap items-start gap-2">
                        {showExcelRow && item.excelRow != null && (
                          <span className="text-xs tabular-nums text-muted-foreground w-10 shrink-0">
                            F{item.excelRow}
                          </span>
                        )}
                        <span className="font-mono text-xs bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded shrink-0">
                          {item.serial}
                        </span>
                        <span className="text-muted-foreground">{item.message}</span>
                        {item.warning ? (
                          <span className="text-amber-700 dark:text-amber-400 text-xs w-full">
                            {item.warning}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sin-cambios">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {sinCambios.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay equipos encontrados sin cambios de datos.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {sinCambios.map((item, i) => (
                      <li key={rowKey(item, i)} className="flex flex-wrap items-start gap-2">
                        {showExcelRow && item.excelRow != null && (
                          <span className="text-xs tabular-nums text-muted-foreground w-10 shrink-0">
                            F{item.excelRow}
                          </span>
                        )}
                        <MinusCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                          {item.serial}
                        </span>
                        <span className="text-muted-foreground">{item.message}</span>
                        {item.warning ? (
                          <span className="text-amber-700 dark:text-amber-400 text-xs w-full">
                            {item.warning}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="usuarios-no-encontrados">
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {showExcelRow && <TableHead className="w-14">Fila</TableHead>}
                      <TableHead>Serial</TableHead>
                      <TableHead>Usuario en Excel</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Mensaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosNoEncontrados.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={showExcelRow ? 5 : 4}
                          className="text-center text-muted-foreground"
                        >
                          No hay usuarios no encontrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      usuariosNoEncontrados.map((item, i) => (
                        <TableRow key={rowKey(item, i)}>
                          {showExcelRow && (
                            <TableCell className="tabular-nums text-muted-foreground text-xs">
                              {item.excelRow ?? "—"}
                            </TableCell>
                          )}
                          <TableCell className="font-mono text-xs">{item.serial}</TableCell>
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

            <TabsContent value="incongruencias">
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {showExcelRow && <TableHead className="w-14">Fila</TableHead>}
                      <TableHead>Serial</TableHead>
                      <TableHead>Usuario en Excel</TableHead>
                      <TableHead>Usuario actual en BD</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incongruenciasUsuarios.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={showExcelRow ? 5 : 4}
                          className="text-center text-muted-foreground"
                        >
                          No hay incongruencias de usuarios
                        </TableCell>
                      </TableRow>
                    ) : (
                      incongruenciasUsuarios.map((item, i) => (
                        <TableRow key={rowKey(item, i)}>
                          {showExcelRow && (
                            <TableCell className="tabular-nums text-muted-foreground text-xs">
                              {item.excelRow ?? "—"}
                            </TableCell>
                          )}
                          <TableCell className="font-mono text-xs">{item.serial}</TableCell>
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
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">Reasignar manualmente</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="no-encontrados">
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {showExcelRow && <TableHead className="w-14">Fila</TableHead>}
                      <TableHead>Serial (normalizado)</TableHead>
                      <TableHead>Usuario en Excel</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposNoEncontrados.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={showExcelRow ? 4 : 3}
                          className="text-center text-muted-foreground"
                        >
                          Todos los seriales se resolvieron en la base de datos
                        </TableCell>
                      </TableRow>
                    ) : (
                      equiposNoEncontrados.map((item, i) => (
                        <TableRow key={rowKey(item, i)}>
                          {showExcelRow && (
                            <TableCell className="tabular-nums text-muted-foreground text-xs">
                              {item.excelRow ?? "—"}
                            </TableCell>
                          )}
                          <TableCell className="font-mono text-xs">{item.serial}</TableCell>
                          <TableCell>{item.usuarioExcel || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-md">
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
