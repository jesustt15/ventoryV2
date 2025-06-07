"use client"

import { Checkbox } from "@radix-ui/react-checkbox";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import React from "react";
import {z} from "zod";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { ArchiveRestore, CheckCircle2Icon, ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, MoreHorizontalIcon, PlusIcon, User2Icon, WrenchIcon, XCircleIcon } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ComputadorForm from "./ComputadorForm";
import Link from "next/link";

export const computadorSchema = z.object({
    serial: z.string().min(1, "El nombre es requerido"),
    modeloId: z.string().min(1, "La Marca es Requerida"),
    estado: z.string().min(1, "El Estado de dispositivo es requerido"),
    nsap: z.string().nullable(),
    host: z.string().nullable(),
    sisOperativo: z.string().nullable(),
    arquitectura: z.string().nullable(),
    ram: z.string().nullable(),
    almacenamiento: z.string().nullable(),
    procesador: z.string().nullable(),
    sapVersion: z.string().nullable(),
    officeVersion: z.string().nullable(),
})

export type ComputadorFormData = z.infer<typeof computadorSchema>

// Type for Modelo objects from API (assuming it includes an 'id' and 'marca' might be an object)
export interface Computador {
    id: string; // Or number, depending on your API
    serial: string;
    estado: string;
    nsap?: string;
    host?: string;
    sisOperativo?: string;
    arquitectura?: string;
    ram?: string;
    almacenamiento?: string;
    procesador?: string;
    sapVersion?: string;
    officeVersion?: string;  
    modelo: { id: string; nombre: string }; // Assuming 'marca' is an object in the fetched data
}



interface ComputadorTableProps {
  data: Computador[]
}

export function ComputadorTable({}: ComputadorTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [editingComputador, setEditingComputador] = React.useState<Computador | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("")
  const [computadores, setComputadores] = React.useState<Computador[]>([]);

const columns: ColumnDef<Computador>[] = [
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
    accessorKey: "serial",
    header: "Serial",
    cell: ({ row }) => <div>{row.getValue("serial")}</div>,
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string

      return (
        <div className="flex items-center gap-2">
          {estado === "Resguardo" ? (
            <ArchiveRestore className="h-4 w-4 text-blue-300" />
          ) : estado === "En reparación" ? (
            <WrenchIcon className="h-4 w-4 text-amber-500" />
          ) : estado === "Asignado" ?
          (
            <User2Icon className="h-4 w-4 text-green-500" />
          )
          :
          (
            <XCircleIcon className="h-4 w-4 text-destructive" />
          )}
          <span>{estado}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(computador.serial.toString())}>
              Copiar Serial
            </DropdownMenuItem>
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/computadores/${computador.id}/editar`}>
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
      try {
        const computadoresResponse = await fetch('/api/computador');

  
        if (!computadoresResponse.ok) {
          throw new Error(`Error fetching computadores: ${computadoresResponse.status}`);
        }
  
        const computadoresData: Computador[] = await computadoresResponse.json();
        
        setComputadores(computadoresData);

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
  


  //   const handleCreateComputador = async (data: ComputadorFormData) => {
  //   try {
  //       const formData = new FormData();
  //       if (data.serial) formData.append('serial', data.serial);
  //       if (data.modeloId) formData.append('modeloId', data.modeloId);
  //       if (data.estado) formData.append('estado', data.estado);
  //       if (data.nsap !== undefined && data.nsap !== null) formData.append('nsap', data.nsap);
  //       if (data.host !== undefined && data.host !== null) formData.append('host', data.host);
  //       if (data.sisOperativo !== undefined && data.sisOperativo !== null) formData.append('sisOperativo', data.sisOperativo);
  //       if (data.arquitectura !== undefined && data.arquitectura !== null) formData.append('arquitectura', data.arquitectura);
  //       if (data.ram !== undefined && data.ram !== null) formData.append('ram', data.ram);
  //       if (data.almacenamiento !== undefined && data.almacenamiento !== null) formData.append('almacenamiento', data.almacenamiento);
  //       if (data.procesador !== undefined && data.procesador !== null) formData.append('procesador', data.procesador);
  //       if (data.sapVersion !== undefined && data.sapVersion !== null) formData.append('sapVersion', data.sapVersion);
  //       if (data.officeVersion !== undefined && data.officeVersion !== null) formData.append('officeVersion', data.officeVersion);
  //       const dataObj = Object.fromEntries(formData.entries());

  //       const response = await fetch('/api/computador', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify(dataObj),
  //       });

  //   if (!response.ok) {
  //     const errorData = await response.json().catch(() => ({ message: response.statusText }));
  //     throw new Error(errorData.message || `Error creando dispositivo: ${response.statusText}`);
  //   }

  //     showToast.success("Computador creado correctamente 👍",{
  //       duration: 4000,
  //       progress: false,
  //       position: "top-right",
  //       transition: "popUp",
  //       icon: '',
  //       sound: false,  
  //     })
  //     setIsCreateModalOpen(false);
  //     fetchAllData();
  //   } catch (error: any) {
  //      showToast.error("Error en Guardar el Equipo:" + (error.message), {
  //         duration: 4000,
  //         progress: false,
  //         position: "top-right",
  //         transition: "popUp",
  //         icon: '',
  //         sound: false,
  //     });
  //   }
  // };
  //    const handleUpdateComputador = async (data: Partial<ComputadorFormData>) => {
  //   if (!editingComputador) return;

  //   try {
  //     const formData = new FormData();
  //     if (data.serial) formData.append('serial', data.serial);
  //   if (data.modeloId) formData.append('modeloId', data.modeloId);
  //   if (data.estado) formData.append('estado', data.estado);
  //   if (data.nsap !== undefined && data.nsap !== null) formData.append('nsap', data.nsap);
  //   if (data.host !== undefined && data.host !== null) formData.append('host', data.host);
  //   if (data.sisOperativo !== undefined && data.sisOperativo !== null) formData.append('sisOperativo', data.sisOperativo);
  //   if (data.arquitectura !== undefined && data.arquitectura !== null) formData.append('arquitectura', data.arquitectura);
  //   if (data.ram !== undefined && data.ram !== null) formData.append('ram', data.ram);
  //   if (data.almacenamiento !== undefined && data.almacenamiento !== null) formData.append('almacenamiento', data.almacenamiento);
  //   if (data.procesador !== undefined && data.procesador !== null) formData.append('procesador', data.procesador);
  //   if (data.sapVersion !== undefined && data.sapVersion !== null) formData.append('sapVersion', data.sapVersion);
  //   if (data.officeVersion !== undefined && data.officeVersion !== null) formData.append('officeVersion', data.officeVersion);
  //     const dataObj = Object.fromEntries(formData.entries());

  //   // Envía el objeto JSON resultante al endpoint
  //   const response = await fetch('/api/computador', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(dataObj),
  //   });

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({ message: response.statusText }));
  //       throw new Error(errorData.message || `Error actualizando dispositivo: ${response.statusText}`);
  //     }
  //     showToast.success("Computador actualizado correctamente ✨",{
  //       duration: 4000,
  //       progress: false,
  //       position: "top-right",
  //       transition: "popUp",
  //       icon: '',
  //       sound: false,  
  //     })
  //     setIsEditModalOpen(false);
  //     setEditingComputador(null);
  //     await fetchAllData();
  //   } catch (error: any) {
  //    showToast.error("Error en Guardar el Dispositivo:" + (error.message), {
  //         duration: 4000,
  //         progress: false,
  //         position: "top-right",
  //         transition: "popUp",
  //         icon: '',
  //         sound: false,
  //     });
  //   }
  // };

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
          <CardTitle className="text-2xl font-bold">Computadores</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por serial..."
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
                <Link href="/computadores/new">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Agregar Computador
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