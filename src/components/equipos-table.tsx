"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ColumnsIcon,
  FilterIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PlusIcon,
  ServerIcon,
  UploadIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"

export const dispositivoSchema = z.object({
  id: z.string(),
  serial: z.string(),
  estado: z.string(),
  modeloId: z.string(),
  usuarioId: z.string().nullable(),
  departamentoId: z.string().nullable(),
  img: z.string().nullable(),
})

export type Dispositivo = z.infer<typeof dispositivoSchema>

export const columns: ColumnDef<Dispositivo>[] = [
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
    accessorKey: "id",
    header: "ID",
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
          {estado === "Activo" ? (
            <CheckCircle2Icon className="h-4 w-4 text-green-500" />
          ) : estado === "Resguardo" ? (
            <WrenchIcon className="h-4 w-4 text-amber-500" />
          ) : (
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
      const equipo = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(equipo.serial.toString())}>
              Copiar Serial
            </DropdownMenuItem>
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem>Editar equipo</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Eliminar equipo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface EquiposTableProps {
  data: Dispositivo[]
}

export function EquiposTable({ data }: EquiposTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [estadoFilter, setEstadoFilter] = React.useState<string[]>(["Activo", "Mantenimiento", "Inactivo"])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)
  const [marca, setMarca] = React.useState("");
  const [modelo, setModelo] = React.useState("");
  const [serial, setSerial] = React.useState("");
  const [tipo, setTipo] = React.useState("");
  const [estado, setEstado] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const table = useReactTable({
    data,
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

  // Aplicar filtro de estado
  React.useEffect(() => {
    table.getColumn("estado")?.setFilterValue(estadoFilter)
  }, [table, estadoFilter])

  // Aplicar filtro de búsqueda
  React.useEffect(() => {
    if (searchQuery) {
      table.getColumn("serial")?.setFilterValue(searchQuery)
    } else {
      table.getColumn("serial")?.setFilterValue("")
    }
  }, [table, searchQuery])

   const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Equipos</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar equipos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm border-primary/20"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto flex gap-1">
                    <FilterIcon className="h-4 w-4" />
                    <span>Filtros</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="font-medium">Estado</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="activo"
                        checked={estadoFilter.includes("Activo")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEstadoFilter([...estadoFilter, "Activo"])
                          } else {
                            setEstadoFilter(estadoFilter.filter((f) => f !== "Activo"))
                          }
                        }}
                      />
                      <label
                        htmlFor="activo"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Activo
                      </label>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mantenimiento"
                        checked={estadoFilter.includes("Mantenimiento")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEstadoFilter([...estadoFilter, "Mantenimiento"])
                          } else {
                            setEstadoFilter(estadoFilter.filter((f) => f !== "Mantenimiento"))
                          }
                        }}
                      />
                      <label
                        htmlFor="mantenimiento"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Mantenimiento
                      </label>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="inactivo"
                        checked={estadoFilter.includes("Inactivo")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEstadoFilter([...estadoFilter, "Inactivo"])
                          } else {
                            setEstadoFilter(estadoFilter.filter((f) => f !== "Inactivo"))
                          }
                        }}
                      />
                      <label
                        htmlFor="inactivo"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Inactivo
                      </label>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
                            : column.id === "tipo"
                              ? "Tipo"
                              : column.id === "estado"
                                ? "Estado"
                                : column.id === "Modelo"
                                  ? "Modelo"
                                  : column.id === "marca"
                                    ? "Marca"
                                    : column.id === "usuario"
                                      ? "Usuario"
                                      : column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Dialog>
                <DialogTrigger asChild>
                  <Button className="cyber-button text-black font-semibold">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    AGREGAR EQUIPO
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px] cyber-card">
                  <DialogHeader>
                    <DialogTitle className="glow-text">AGREGAR NUEVO EQUIPO</DialogTitle>
                    <DialogDescription>
                      Complete los detalles del nuevo equipo. Incluya una imagen para mejor identificación.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Upload de imagen */}
                    <div className="grid gap-2">
                      <Label htmlFor="imagen">Imagen del Equipo</Label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full cyber-card hover:glow-border"
                          >
                            <UploadIcon className="h-4 w-4 mr-2" />
                            Seleccionar Imagen
                          </Button>
                        </div>
                        {selectedImage && (
                          <Avatar className="h-16 w-16 border-2 border-primary">
                            <AvatarImage src={selectedImage || "/placeholder.svg"} alt="Preview" />
                            <AvatarFallback>
                              <ImageIcon className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="marca">Marca</Label>
                        <Input id="marca" placeholder="Marca del equipo" className="glow-border" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="modelo">Modelo</Label>
                        <Input id="modelo" placeholder="Modelo del equipo" className="glow-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="serial">Serial</Label>
                        <Input id="serial" placeholder="Nombre del equipo" className="glow-border" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tipo">Tipo</Label>
                        <Select>
                          <SelectTrigger id="tipo" className="glow-border">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent className="cyber-card">
                            <SelectItem value="Impresora">Impresora</SelectItem>
                            <SelectItem value="Switches">Switches</SelectItem>
                            <SelectItem value="AP">Access Point</SelectItem>
                            <SelectItem value="Almacenamiento">Almacenamiento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Select>
                          <SelectTrigger id="estado" className="glow-border">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent className="cyber-card">
                            <SelectItem value="Activo">Activo</SelectItem>
                            <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                            <SelectItem value="Inactivo">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="cyber-button text-black font-semibold">
                      GUARDAR EQUIPO
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
