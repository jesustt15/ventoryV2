"use client";

import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import React from "react";
import { Button } from "./ui/button";
import { PlusIcon, UploadIcon, DownloadIcon } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import TableRowSkeleton from "@/utils/loading";
import { Computador } from "@/types/computador";
import { createComputadorColumns } from "@/lib/table/computador-columns";
import { TableToolbar } from "@/components/table/table-toolbar";
import { TablePagination } from "@/components/table/table-pagination";
import { ImageModal } from "@/components/table/image-modal";

interface ComputadorTableProps {
  data: Computador[];
}

export function ComputadorTable({ }: ComputadorTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [computadores, setComputadores] = React.useState<Computador[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const isAdmin = useIsAdmin();
  const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);
  const [currentImage, setCurrentImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleDelete = async ({ id }: { id: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/computador/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el computador.");
      }

      showToast.success("Computador eliminado correctamente.");
      fetchAllData();
    } catch (error) {
      console.error(error);
      showToast.error("No se pudo eliminar el computador.");
    } finally {
      setIsLoading(false);
    }
  };

  const columns = createComputadorColumns({
    computadores,
    isLoading,
    loading,
    handleDelete,
    setCurrentImage,
    setIsImageModalOpen,
  });

  const table = useReactTable({
    data: computadores,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const computadoresResponse = await fetch("/api/computador");

      if (!computadoresResponse.ok) {
        throw new Error(
          `Error fetching computadores: ${computadoresResponse.status}`
        );
      }

      const computadoresData: Computador[] = await computadoresResponse.json();

      setComputadores(computadoresData);
      setIsLoading(false);
    } catch (error: any) {
      showToast.error("¡Error en Cargar!" + error.message, {
        duration: 4000,
        progress: false,
        position: "top-right",
        transition: "popUp",
        icon: "",
        sound: true,
      });
    }
  };

  React.useEffect(() => {
    fetchAllData();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/computadores/bulk-update", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Error al procesar el archivo.");
      }

      const updated = data?.summary?.updated ?? 0;
      const notFound = data?.summary?.notFound ?? 0;

      showToast.success(
        `Actualización completada. Actualizados: ${updated}, No encontrados: ${notFound}`
      );

      await fetchAllData();
    } catch (error: any) {
      console.error(error);
      showToast.error(error.message || "Error al actualizar desde Excel.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  React.useEffect(() => {
    if (searchQuery) {
      table.getColumn("serial")?.setFilterValue(searchQuery);
    } else {
      table.getColumn("serial")?.setFilterValue("");
    }
  }, [table, searchQuery]);

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      // Obtener las filas filtradas
      const filteredRows = table.getFilteredRowModel().rows;
      
      // Preparar los datos para exportar
      const dataToExport = filteredRows.map((row) => {
        const computador = row.original;
        return {
          serial: computador.serial,
          marca: computador.modelo?.marca?.nombre || "N/A",
          modelo: computador.modelo?.nombre || "N/A",
          tipo: computador.modelo?.tipo || "N/A",
          host: computador.host || "N/A",
          sede: computador.sede || "N/A",
          estado: computador.estado,
          asignadoA: computador.estado === "Asignado" 
            ? (computador.usuario 
                ? `${computador.usuario.nombre} ${computador.usuario.apellido || ""}`.trim()
                : computador.departamento?.nombre || computador.ubicacion || "N/A")
            : "N/A",
          sisOperativo: computador.sisOperativo || "N/A",
          procesador: computador.procesador || computador.modelo?.procesadorDefault || "N/A",
          ram: computador.ram || computador.modelo?.ramDefault || "N/A",
          almacenamiento: computador.almacenamiento || computador.modelo?.almacenamientoDefault || "N/A",
          nsap: computador.nsap || "N/A",
          macWifi: computador.macWifi || "N/A",
          macEthernet: computador.macEthernet || "N/A",
        };
      });

      // Enviar los datos al endpoint de exportación
      const response = await fetch("/api/computadores/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: dataToExport }),
      });

      if (!response.ok) {
        throw new Error("Error al generar el archivo Excel");
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `computadores_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast.success(`Excel generado con ${dataToExport.length} registros`);
    } catch (error: any) {
      console.error(error);
      showToast.error(error.message || "Error al exportar a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const columnLabels: Record<string, string> = {
    serial: "Serial",
    estado: "Estado",
    modelo: "Modelo",
    host: "Host",
    sisOperativo: "Sistema Operativo",
    marcaNombre: "Marca",
    tipo: "Tipo",
    sede: "Sede",
    "modelo.img": "Imagen",
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl font-bold">Computadores</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Actualización masiva:</span>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    document
                      .querySelector<HTMLInputElement>(
                        'input[type="file"][accept=".xlsx,.xls"]'
                      )
                      ?.click()
                  }
                  disabled={isUploading}
                >
                  <UploadIcon className="mr-1 h-3 w-3" />
                  {isUploading ? "Subiendo..." : "Subir Excel"}
                </Button>
              </label>
            </div>
          </div>
          <TableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar por serial..."
            table={table}
            columnLabels={columnLabels}
            addButton={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportToExcel}
                  disabled={isExporting || computadores.length === 0}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  {isExporting ? "Exportando..." : "Exportar Excel"}
                </Button>
                {isAdmin && (
                  <Button asChild>
                    <Link href="/computadores/new">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Agregar Computador
                    </Link>
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRowSkeleton
                    key={`skeleton-${index}`}
                    columnCount={columns.length || 5}
                  />
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {searchQuery
                      ? "No se encontraron computadores con ese filtro."
                      : "No hay computadores registrados."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination table={table} />
      </CardContent>
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={currentImage}
        title="Imagen del Modelo"
      />
    </Card>
  );
}
