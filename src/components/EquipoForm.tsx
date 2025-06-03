'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from 'react-select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import { showToast } from "nextjs-toast-notify";

// Define the interface for a single Modelo
interface Modelo {
    id: string;
    nombre: string;
}

// Define the structure for form data. Use Partial for initial state.
export interface DispositivoFormData {
    id?: string; // Add ID for editing purposes
    modeloId: string;
    serial: string;
    estado: string;
    nsap?: string;   // Optional field
}

// Define the props for the component
interface DispositivoFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: DispositivoFormData | null;
}

// Define the option type for react-select
interface OptionType {
    value: string;
    label: string;
}

// Styles for react-select (remains unchanged)
const reactSelectStyles = {
    control: (base: any, state: { isFocused: boolean }) => ({
        ...base,
        minHeight: '40px',
        background: 'hsl(var(--background))',
        borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--input))',
        borderWidth: '1px',
        boxShadow: state.isFocused ? `0 0 0 1px hsl(var(--ring))` : 'none',
        '&:hover': {
            borderColor: 'hsl(var(--input))',
        },
    }),
    valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
    input: (base: any) => ({ ...base, color: 'hsl(var(--foreground))', margin: '0', padding: '0' }),
    placeholder: (base: any) => ({ ...base, color: 'hsl(var(--muted-foreground))' }),
    singleValue: (base: any) => ({ ...base, color: 'hsl(var(--foreground))' }),
    menu: (base: any) => ({
        ...base,
        background: 'hsl(var(--popover))',
        color: 'hsl(var(--popover-foreground))',
        borderRadius: 'var(--radius)',
        border: '1px solid hsl(var(--border))',
        zIndex: 50,
    }),
    option: (base: any, state: { isSelected: boolean; isFocused: boolean }) => ({
        ...base,
        background: state.isSelected ? 'hsl(var(--accent))' : state.isFocused ? 'hsl(var(--accent))' : 'transparent',
        color: 'hsl(var(--accent-foreground))',
        cursor: 'pointer',
    }),
};

// The refactored EquipoForm component
const DispositivoForm: React.FC<DispositivoFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
}) => {
    // 1. Determine if we are in "edit mode"
    const isEditing = !!initialData;

    // 2. State for form data and the list of models
    const [formData, setFormData] = useState<DispositivoFormData>({
        modeloId: '',
        serial: '',
        estado: '',
        nsap: '',
    });
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [isLoadingModelos, setIsLoadingModelos] = useState(false);

    // 3. useEffect to fetch models once when the component can be shown
    useEffect(() => {
        const fetchModelos = async () => {
            setIsLoadingModelos(true);
            try {
                const response = await fetch('/api/modelos');
                if (!response.ok) throw new Error('Error al cargar modelos');
                const data: Modelo[] = await response.json();
                setModelos(data);
            } catch (error) {
                showToast.error("¡Error en Cargar Modelos!", { position: "top-right" });
            } finally {
                setIsLoadingModelos(false);
            }
        };

        if (isOpen && modelos.length === 0) {
            fetchModelos();
        }

        if (isOpen) {
            if (isEditing && initialData) {
                setFormData(initialData);
            } else {
                // Reset form for "create" mode or when dialog closes
                setFormData({
                    modeloId: '',
                    serial: '',
                    estado: '',
                    nsap: '',
                });
            }
        }
    }, [initialData, isEditing, isOpen]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSelectChange = (option: OptionType | null) => {
        setFormData(prev => ({ ...prev, modeloId: option?.value ?? '' }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!formData.modeloId || !formData.serial || !formData.estado) {
            showToast.warning("Por favor complete los campos obligatorios.", { position: "top-right" });
            return;
        }

        // Call the onSubmit prop passed from the parent component
        await onSubmit(formData);
    };
    
    // Helper to find the selected model option for the Select component
    const modeloOptions = modelos.map(modelo => ({ value: modelo.id, label: modelo.nombre }));
    const selectedModelValue = modeloOptions.find(option => option.value === formData.modeloId) || null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[525px] cyber-card">
                <DialogHeader>
                    {/* 5. Dynamic Title and Description */}
                    <DialogTitle className="glow-text">
                        {isEditing ? 'EDITAR EQUIPO' : 'AGREGAR NUEVO EQUIPO'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Modifique los detalles del equipo.' : 'Complete los detalles del nuevo equipo.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Modelo Select */}
                            <div className="grid gap-2">
                                <Label htmlFor="modeloId">Modelo</Label>
                                <Select
                                    id="modeloId"
                                    options={modeloOptions}
                                    value={selectedModelValue}
                                    onChange={handleSelectChange}
                                    placeholder="Seleccionar modelo"
                                    isSearchable
                                    isLoading={isLoadingModelos}
                                    styles={reactSelectStyles}
                                />
                            </div>

                            {/* Serial Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="serial">Serial</Label>
                                <Input id="serial" value={formData.serial || ''} onChange={handleInputChange} placeholder="Serial del equipo" />
                            </div>

                            {/* NSAP Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="nsap">Ficha SAP (Opcional)</Label>
                                <Input id="nsap" value={formData.nsap || ''} onChange={handleInputChange} placeholder="N° de Ficha SAP" />
                            </div>
                            

                            {/* Estado Select */}
                            <div className="grid gap-2">
                                <Label htmlFor="estado">Estado</Label>
                                <select
                                    id="estado"
                                    className="w-full h-10 border rounded-md px-2 bg-[hsl(var(--background))] border-[hsl(var(--input))]"
                                    value={formData.estado || ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Seleccionar estado</option>
                                    <option value="Resguardo">Resguardo</option>
                                    <option value="Asignado">Asignado</option>
                                    <option value="En reparación">En reparación</option>
                                    <option value="De baja">De baja</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        {/* 6. Dynamic Button Text */}
                        <Button type="submit" className="cyber-button text-black font-semibold">
                            {isEditing ? 'GUARDAR CAMBIOS' : 'GUARDAR EQUIPO'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default DispositivoForm;
