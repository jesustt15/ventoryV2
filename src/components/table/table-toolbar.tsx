import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnsIcon } from "lucide-react";
import { ReactNode } from "react";

interface TableToolbarProps<TData> {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    table: Table<TData>;
    addButton?: ReactNode;
    columnLabels?: Record<string, string>;
}

export function TableToolbar<TData>({
    searchValue,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    table,
    addButton,
    columnLabels = {},
}: TableToolbarProps<TData>) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
                <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="max-w-sm border-primary/20"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            <ColumnsIcon className="h-4 w-4 mr-2" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Columnas
                            </span>
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
                                        {columnLabels[column.id] || column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {addButton}
        </div>
    );
}
