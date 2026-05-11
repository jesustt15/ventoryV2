"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { showToast } from "nextjs-toast-notify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Loading from "@/utils/loading";

interface GerenteOption {
  value: string;
  label: string;
  cargo?: string;
}

interface Gerencia {
  id: string;
  nombre: string;
  gerenteId: string | null;
  gerente: {
    id: string;
    nombre: string;
    apellido: string;
    cargo: string;
  } | null;
}

interface GerenciaFormState {
  nombre: string;
  gerenteId: string;
}

const initialFormState: GerenciaFormState = {
  nombre: "",
  gerenteId: "",
};

export function GerenciasTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [gerencias, setGerencias] = useState<Gerencia[]>([]);
  const [gerentes, setGerentes] = useState<GerenteOption[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGerencia, setEditingGerencia] = useState<Gerencia | null>(null);
  const [formState, setFormState] = useState<GerenciaFormState>(initialFormState);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [gerenciasResponse, gerentesResponse] = await Promise.all([fetch("/api/gerencias"), fetch("/api/gerentes")]);
      if (!gerenciasResponse.ok) {
        throw new Error("No se pudieron cargar las gerencias.");
      }
      if (!gerentesResponse.ok) {
        throw new Error("No se pudieron cargar los gerentes.");
      }

      const gerenciasData: Gerencia[] = await gerenciasResponse.json();
      const gerentesData: GerenteOption[] = await gerentesResponse.json();

      setGerencias(gerenciasData);
      setGerentes(gerentesData);
    } catch (error: any) {
      showToast.error(error.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openCreateModal = () => {
    setEditingGerencia(null);
    setFormState(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (gerencia: Gerencia) => {
    setEditingGerencia(gerencia);
    setFormState({
      nombre: gerencia.nombre,
      gerenteId: gerencia.gerenteId || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingGerencia(null);
    setFormState(initialFormState);
  };

  const handleSave = async () => {
    if (!formState.nombre.trim()) {
      showToast.warning("El nombre de la gerencia es requerido");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        nombre: formState.nombre.trim(),
        gerenteId: formState.gerenteId || null,
      };

      const response = await fetch(editingGerencia ? `/api/gerencias/${editingGerencia.id}` : "/api/gerencias", {
        method: editingGerencia ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error guardando gerencia" }));
        throw new Error(errorData.message || "Error guardando gerencia");
      }

      showToast.success(editingGerencia ? "Gerencia actualizada correctamente" : "Gerencia creada correctamente");
      closeModal();
      await fetchAllData();
    } catch (error: any) {
      showToast.error(error.message || "No se pudo guardar la gerencia");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Esta acción eliminará la gerencia. ¿Deseas continuar?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/gerencias/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("No se pudo eliminar la gerencia.");
      }
      showToast.success("Gerencia eliminada correctamente");
      await fetchAllData();
    } catch (error: any) {
      showToast.error(error.message || "No se pudo eliminar la gerencia");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Gerencia>[] = [
    {
      accessorKey: "nombre",
      header: "Gerencia",
    },
    {
      id: "gerente",
      header: "Gerente Asociado",
      cell: ({ row }) => {
        const gerente = row.original.gerente;
        return gerente ? `${gerente.nombre} ${gerente.apellido}` : "Sin gerente";
      },
    },
    {
      id: "cargoGerente",
      header: "Cargo",
      cell: ({ row }) => row.original.gerente?.cargo || "-",
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const gerencia = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/gerencias/${gerencia.id}/asigned`}>Ver asignados</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditModal(gerencia)}>Editar gerencia</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isDeleting}
                onClick={() => handleDelete(gerencia.id)}
                className="text-destructive focus:text-destructive"
              >
                Eliminar gerencia
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: gerencias,
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

  useEffect(() => {
    table.getColumn("nombre")?.setFilterValue(searchQuery);
  }, [searchQuery, table]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Gerencias</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Filtrar por gerencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm border-primary/20"
            />
            <Button onClick={openCreateModal}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar Gerencia
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No hay gerencias registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGerencia ? "Editar Gerencia" : "Nueva Gerencia"}</DialogTitle>
            <DialogDescription>Define el nombre de la gerencia y opcionalmente su gerente asociado.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nombre-gerencia">Nombre</Label>
              <Input
                id="nombre-gerencia"
                value={formState.nombre}
                onChange={(e) => setFormState((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej. Gerencia de Tecnología"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gerente-id">Gerente</Label>
              <select
                id="gerente-id"
                value={formState.gerenteId}
                onChange={(e) => setFormState((prev) => ({ ...prev, gerenteId: e.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sin gerente asignado</option>
                {gerentes.map((gerente) => (
                  <option key={gerente.value} value={gerente.value}>
                    {gerente.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
