"use client"

import { Checkbox } from "@radix-ui/react-checkbox";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import React from "react";
import {z} from "zod";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { ArchiveRestore, ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, ImageIcon, MoreHorizontalIcon, PlusIcon, User2Icon, WrenchIcon, XCircleIcon } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const usuarioSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    departamentoId: z.string().min(1, "La Marca es Requerida"),
    apellido: z.string().min(1, "El Estado de dispositivo es requerido"),
    cargo: z.string().nullable(),
    ced: z.string().nullable(),
    legajo: z.number().nullable(),
})

export type UsuarioFormData = z.infer<typeof usuarioSchema>

// Type for Modelo objects from API (assuming it includes an 'id' and 'marca' might be an object)
export interface Usuario {
    id: string; // Or number, depending on your API
    nombre: string;
    apellido: string;
    cargo: string;
    ced: string;
    legajo: number;
    departamento: { id: string; nombre: string;  gerencia: { nombre?: string } }; // Assuming 'marca' is an object in the fetched data
}



interface UsuarioTableProps {
  data: Usuario[]
}

export function UsuarioTable({}: UsuarioTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchQuery, setSearchQuery] = React.useState("")
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);

const columns: ColumnDef<Usuario>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
    cell: ({ row }) => <div>{row.getValue("serial")}</div>,
  },  {
      accessorFn: (row) => row.departamento?.gerencia?.nombre ?? "Sin gerencia",
      id: "gerenciaNombre", // El ID único para la columna sigue siendo importante
      header: "Gerencia",
      // CORRECCIÓN: Usamos `row.original` dentro de la celda para una mayor fiabilidad
      cell: ({ row }) => {
          // `row.original` es el objeto `Dispositivo` completo para esta fila
          const gerenciaNombre = row.original.departamento?.gerencia?.nombre;
          return <div>{gerenciaNombre || "Sin marca"}</div>;
      },
    },
    {
      accessorKey: "legajo",
      header: "Legajo",
    },
  {
    accessorKey: "departamento.nombre",
    header: "Departamento",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const computador = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(computador.legajo.toString())}>
              Copiar Serial
            </DropdownMenuItem>
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/usuarios/${computador.id}/editar`}>
                  Editar equipo
              </Link>
              </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Eliminar equipo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

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
    },
  });

    const fetchAllData = async () => {
      try {
        const usuariosResponse = await fetch('/api/usuarios');

  
        if (!usuariosResponse.ok) {
          throw new Error(`Error fetching usuarios: ${usuariosResponse.status}`);
        }
  
        const usuariosData: Usuario[] = await usuariosResponse.json();
        
        setUsuarios(usuariosData);

      } catch (error: any) {
        showToast.error("¡Error en Cargar!"+ (error.message), {
            duration: 4000,
            progress: false,
            position: "top-right",
            transition: "popUp",
            icon: '',
            sound: true,
        });
      }
    };
  
    React.useEffect(() => {
      fetchAllData();
    }, []);
  

React.useEffect(() => {
    if (searchQuery) {
      table.getColumn("serial")?.setFilterValue(searchQuery)
    } else {
      table.getColumn("serial")?.setFilterValue("")
    }
  }, [table, searchQuery])

return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Usuarios</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm border-primary/20"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    <ColumnsIcon className="h-4 w-4 mr-2" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Columnas</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id === "serial"
                              ? "Serial"
                              : column.id === "estado"
                                ? "Estado"
                                : column.id === "modelo"
                                  ? "Modelo"
                                    : column.id === "host"
                                        ? "Host"
                                            : column.id === "sisOperativo"
                                                ? "Sistema Operativo"    
                                                    : column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button asChild>
                <Link href="/usuarios/new">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Agregar Usuario
                </Link>
            </Button>
          </div>
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
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between space-x-2 py-4 px-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s)
            seleccionada(s).
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

}