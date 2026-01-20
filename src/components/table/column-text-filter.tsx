import { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { FilterIcon } from "lucide-react";

interface ColumnTextFilterProps<TData> {
    label: string;
    column: Column<TData, unknown>;
    placeholder?: string;
}

export function ColumnTextFilter<TData>({
    label,
    column,
    placeholder = "Buscar...",
}: ColumnTextFilterProps<TData>) {
    const isFilterActive = !!column.getFilterValue();

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
                <PopoverContent className="w-56 p-2">
                    <Input
                        placeholder={placeholder}
                        value={(column.getFilterValue() as string) ?? ""}
                        onChange={(e) => column.setFilterValue(e.target.value)}
                        className="h-8 w-full"
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
