import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { Usuario } from "@/types/usuario";
import { ColumnFilterHeader } from "@/components/table/column-filter-header";
import { ColumnTextFilter } from "@/components/table/column-text-filter";

interface CreateUsuarioColumnsOptions {
    usuarios: Usuario[];
    isDeleting: boolean;
    handleDelete: (params: { id: string }) => Promise<void>;
}

export function createUsuarioColumns({
    usuarios,
    isDeleting,
    handleDelete,
}: CreateUsuarioColumnsOptions): ColumnDef<Usuario>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
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
            header: ({ column }) => (
                <ColumnTextFilter label="Nombre" column={column} placeholder="Buscar..." />
            ),
            cell: ({ row }) => <div>{row.getValue("nombre")}</div>,
        },
        {
            accessorKey: "apellido",
            header: ({ column }) => (
                <ColumnTextFilter label="Apellido" column={column} placeholder="Buscar..." />
            ),
            cell: ({ row }) => <div>{row.getValue("apellido")}</div>,
        },
        {
            accessorFn: (row) => row.departamento?.gerencia?.nombre ?? "Sin gerencia",
            id: "gerenciaNombre",
            header: ({ column }) => {
                const uniqueGerencias = Array.from(
                    new Set(
                        usuarios
                            .map((u) => u.departamento?.gerencia?.nombre)
                            .filter(Boolean) as string[]
                    )
                ).sort();

                return (
                    <ColumnFilterHeader
                        label="Gerencia"
                        column={column}
                        options={uniqueGerencias}
                        placeholder="Todas"
                    />
                );
            },
            cell: ({ row }) => {
                const gerenciaNombre = row.original.departamento?.gerencia?.nombre;
                return <div>{gerenciaNombre || "Sin gerencia"}</div>;
            },
            filterFn: (row, id, value) => {
                // Si el filtro es un array (del selector múltiple), verificamos si incluye el valor
                if (Array.isArray(value)) {
                    if (value.length === 0) return true;
                    return value.includes(row.getValue(id));
                }
                // Fallback para filtro simple de string
                return value ? value === row.getValue(id) : true;
            },
        },
        {
            accessorFn: (row) => row.departamento?.nombre ?? "Sin departamento",
            id: "departamentoNombre",
            header: ({ column }) => {
                const uniqueDepartamentos = Array.from(
                    new Set(
                        usuarios
                            .map((u) => u.departamento?.nombre)
                            .filter(Boolean) as string[]
                    )
                ).sort();

                return (
                    <ColumnFilterHeader
                        label="Departamento"
                        column={column}
                        options={uniqueDepartamentos}
                        placeholder="Todos"
                    />
                );
            },
            cell: ({ row }) => {
                const departamentoNombre = row.original.departamento?.nombre;
                return <div>{departamentoNombre || "Sin departamento"}</div>;
            },
            filterFn: (row, id, value) => {
                if (Array.isArray(value)) {
                    if (value.length === 0) return true;
                    return value.includes(row.getValue(id));
                }
                return value ? value === row.getValue(id) : true;
            },
        },
        {
            accessorKey: "legajo",
            header: "Legajo",
        },
        {
            accessorKey: "cargo",
            header: ({ column }) => (
                <ColumnTextFilter
                    label="Cargo"
                    column={column}
                    placeholder="Buscar Cargo..."
                />
            ),
            filterFn: (row, id, value) => {
                if (!value) return true;
                const cellValue = row.getValue(id) as string;
                if (!cellValue) return false;
                return cellValue.toLowerCase().startsWith(value.toLowerCase());
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const usuario = row.original;

                return (
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() =>
                                        navigator.clipboard.writeText(usuario.legajo.toString())
                                    }
                                >
                                    Copiar Legajo
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/usuarios/${usuario.id}/asigned`}>
                                        Ver Asignados
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/usuarios/${usuario.id}/editar`}>
                                        Editar Usuario
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        Eliminar Usuario
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente
                                    al usuario y borrará sus datos de nuestros servidores.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={isDeleting}
                                    onClick={() => handleDelete({ id: usuario.id })}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                );
            },
        },
    ];
}
