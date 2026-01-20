import { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterIcon } from "lucide-react";

interface ColumnFilterHeaderProps<TData> {
    label: string;
    column: Column<TData, unknown>;
    options: string[] | { value: string; label: string }[];
    placeholder?: string;
}

export function ColumnFilterHeader<TData>({
    label,
    column,
    options,
    placeholder = "Todos",
}: ColumnFilterHeaderProps<TData>) {
    const isFilterActive = !!column.getFilterValue();

    // Normalizar opciones a formato uniforme
    const normalizedOptions = options.map((opt) =>
        typeof opt === "string" ? { value: opt, label: opt } : opt
    );

    return (
        <div className="flex items-center">
            <span>{label}</span>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-5 w-5 p-0 ml-1 ${isFilterActive ? "text-[#00FFFF]" : "text-muted-foreground"
                            }`}
                    >
                        <FilterIcon className="h-3 w-3" />
                        {isFilterActive && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#00FFFF]"></span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                    <select
                        value={(column.getFilterValue() as string) ?? ""}
                        onChange={(e) => column.setFilterValue(e.target.value)}
                        className="h-8 w-full border rounded text-sm px-2 py-1"
                    >
                        <option value="">{placeholder}</option>
                        {normalizedOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </PopoverContent>
            </Popover>
        </div>
    );
}
