import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@radix-ui/react-checkbox";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
} from "@/components/ui/alert-dialog";
import {
    ArchiveRestore,
    MoreHorizontalIcon,
    User2Icon,
    WrenchIcon,
    XCircleIcon,
    EyeIcon,
    ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { handleGenerateAndDownloadQR } from "@/utils/qrCode";
import { Computador } from "@/types/computador";
import { ColumnFilterHeader } from "@/components/table/column-filter-header";

interface CreateComputadorColumnsOptions {
    computadores: Computador[];
    isLoading: boolean;
    loading: boolean;
    handleDelete: (params: { id: string }) => Promise<void>;
    setCurrentImage: (url: string) => void;
    setIsImageModalOpen: (open: boolean) => void;
}

export function createComputadorColumns({
    computadores,
    isLoading,
    loading,
    handleDelete,
    setCurrentImage,
    setIsImageModalOpen,
}: CreateComputadorColumnsOptions): ColumnDef<Computador>[] {
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
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Seleccionar fila"
                    onClick={(e) => e.stopPropagation()}
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
            accessorFn: (row) => row.modelo?.marca?.nombre ?? "Sin marca",
            id: "marcaNombre",
            header: ({ column }) => {
                const uniqueMarcas = Array.from(
                    new Set(
                        computadores
                            .map((c) => c.modelo?.marca?.nombre)
                            .filter(Boolean) as string[]
                    )
                ).sort();

                return (
                    <ColumnFilterHeader
                        label="Marca"
                        column={column}
                        options={uniqueMarcas}
                        placeholder="Todas las marcas"
                    />
                );
            },
            cell: ({ row }) => {
                const marcaNombre = row.original.modelo?.marca?.nombre;
                return <div>{marcaNombre || "Sin marca"}</div>;
            },
        },
        {
            accessorKey: "modelo.nombre",
            header: ({ column }) => {
                const uniqueModelos = Array.from(
                    new Set(
                        computadores
                            .map((c) => c.modelo?.nombre)
                            .filter(Boolean) as string[]
                    )
                ).sort();

                return (
                    <ColumnFilterHeader
                        label="Modelo"
                        column={column}
                        options={uniqueModelos}
                        placeholder="Todos los modelos"
                    />
                );
            },
        },
        {
            id: "tipo",
            accessorFn: (row) => row.modelo?.tipo,
            header: ({ column }) => {
                const uniqueTipos = Array.from(
                    new Set(
                        computadores.map((c) => c.modelo?.tipo).filter(Boolean) as string[]
                    )
                ).sort();

                return (
                    <ColumnFilterHeader
                        label="Tipo"
                        column={column}
                        options={uniqueTipos}
                        placeholder="Todos"
                    />
                );
            },
            cell: ({ row }) => {
                const tipo = row.original.modelo?.tipo;
                return <div>{tipo || "N/A"}</div>;
            },
        },
        {
            accessorKey: "sede",
            header: ({ column }) => {
                const estadosUnicos = ["PZO", "MCPA", "CCS", "ESP"];

                return (
                    <ColumnFilterHeader
                        label="Sede"
                        column={column}
                        options={estadosUnicos}
                        placeholder="Todos"
                    />
                );
            },
            cell: ({ row }) => {
                const sede = row.getValue("sede") as string;
                return (
                    <div className="flex items-center gap-2">
                        <span>{sede}</span>
                    </div>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            id: "modelo.img",
            header: "Imagen",
            accessorFn: (row) => row.modelo?.img,
            cell: ({ row }) => {
                const imageUrl = row.getValue("modelo.img") as string | undefined;
                return (
                    <div className="flex items-center justify-center">
                        {imageUrl ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImage(imageUrl);
                                    setIsImageModalOpen(true);
                                }}
                            >
                                <EyeIcon className="h-5 w-5 text-primary" />
                            </Button>
                        ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "estado",
            header: ({ column }) => {
                const estadosUnicos = ["Resguardo", "En reparación", "Asignado", "Inactivo"];

                return (
                    <ColumnFilterHeader
                        label="Estado / Asignado a"
                        column={column}
                        options={estadosUnicos}
                        placeholder="Todos"
                    />
                );
            },
            cell: ({ row }) => {
                const estado = row.getValue("estado") as string;
                const data = row.original;

                let textoMostrar = estado;

                if (estado === "Asignado") {
                    if (data.usuario && data.usuario.nombre) {
                        textoMostrar =
                            data.usuario.nombre +
                            (data.usuario.apellido ? ` ${data.usuario.apellido}` : "");
                    } else if (data.departamento && data.departamento.nombre) {
                        textoMostrar = data.departamento.nombre;
                    } else if (data.ubicacion) {
                        textoMostrar = data.ubicacion;
                    }
                }

                return (
                    <div className="flex items-center gap-2">
                        {estado === "Resguardo" ? (
                            <ArchiveRestore className="h-4 w-4 text-blue-300" />
                        ) : estado === "En reparación" ? (
                            <WrenchIcon className="h-4 w-4 text-amber-500" />
                        ) : estado === "Asignado" ? (
                            <User2Icon className="h-4 w-4 text-green-500" />
                        ) : (
                            <XCircleIcon className="h-4 w-4 text-destructive" />
                        )}

                        <span className="truncate max-w-[150px]" title={textoMostrar}>
                            {textoMostrar}
                        </span>
                    </div>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const computador = row.original;

                return (
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => {
                                        navigator.clipboard.writeText(computador.serial.toString());
                                        showToast.success("¡Serial copiado!", {
                                            progress: false,
                                            position: "bottom-center",
                                            transition: "popUp",
                                        });
                                    }}
                                >
                                    Copiar Serial
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/computadores/${computador.id}/details`}>
                                        Ver detalles
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/computadores/${computador.id}/editar`}>
                                        Editar Computador
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        handleGenerateAndDownloadQR({
                                            equipoId: computador.id,
                                            modelo: computador.modelo.nombre,
                                            serial: computador.serial,
                                            nsap: computador.nsap ?? "N/A",
                                        })
                                    }
                                    disabled={loading}
                                >
                                    {loading ? "Generando..." : "Descargar Sticker"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás segur@?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente
                                    el computador y borrará sus datos de nuestros servidores.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={isLoading}
                                    onClick={() => handleDelete({ id: computador.id })}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isLoading ? "Eliminando..." : "Sí, eliminar"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                );
            },
        },
    ];
}
