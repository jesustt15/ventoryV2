"use client"

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
import React, { useState } from "react";
import { showToast } from "nextjs-toast-notify";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import TableRowSkeleton from "@/utils/loading";
import { Usuario } from "@/types/usuario";
import { createUsuarioColumns } from "@/lib/table/usuarios-columns";
import { TableToolbar } from "@/components/table/table-toolbar";
import { TablePagination } from "@/components/table/table-pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

interface UsuarioTableProps {
  data: Usuario[];
}

export function UsuarioTable({ }: UsuarioTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    {}
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setLoading] = useState(false);

  // Función para manejar la eliminación (pasada a las columnas)
  const handleDelete = async ({ id }: { id: string }) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el usuario.");
      }

      showToast.success("Usuario eliminado correctamente.");
      fetchAllData();
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast.error("No se pudo eliminar el usuario.");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const usuariosResponse = await fetch("/api/usuarios");

      if (!usuariosResponse.ok) {
        throw new Error(`Error fetching usuarios: ${usuariosResponse.status}`);
      }

      const usuariosData: Usuario[] = await usuariosResponse.json();

      setUsuarios(usuariosData);
      setLoading(false);
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

  // Crear columnas usando la factory
  const columns = React.useMemo(
    () => createUsuarioColumns({ usuarios, isDeleting, handleDelete }),
    [usuarios, isDeleting]
  );

  const table = useReactTable({
    data: usuarios,
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
      globalFilter: searchQuery,
    },
    onGlobalFilterChange: setSearchQuery,
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;

      const search = filterValue.toLowerCase();
      const nombre = row.getValue("nombre")?.toString().toLowerCase() || "";
      const apellido = row.getValue("apellido")?.toString().toLowerCase() || "";
      const cargo = row.getValue("cargo")?.toString().toLowerCase() || "";

      return (
        nombre.includes(search) ||
        apellido.includes(search) ||
        cargo.includes(search)
      );
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Usuarios</h2>
      </div>
      <TableToolbar
        table={table}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por nombre..."
        addButton={
          <Button asChild>
            <Link href="/usuarios/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar Usuario
            </Link>
          </Button>
        }
        columnLabels={{
          legajo: "Legajo",
          ced: "Cédula",
          departamentoNombre: "Departamento",
          gerenciaNombre: "Gerencia",
          cargo: "Cargo",
          nombre: "Nombre",
          apellido: "Apellido",
        }}
      />

      <Card className="border-none shadow-md">
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
                        ? "No se encontraron usuarios con ese filtro."
                        : "No hay usuarios registrados."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination table={table} />
        </CardContent>
      </Card>
    </div>
  );
}

