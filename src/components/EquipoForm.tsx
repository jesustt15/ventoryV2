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
import { reactSelectStyles } from '@/utils/reactSelectStyles';

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
    nsap?: string; 
    ubicacion?: string;
    mac?: string;// Optional field
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
        mac: '',
        ubicacion: '',
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
                    ubicacion: '',
                    mac: '',
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
                                <Label htmlFor="ubicacion">Ubicación</Label>
                                <Input id="ubicacion" value={formData.ubicacion || ''} onChange={handleInputChange} placeholder="Ej: Edificio 1, Oficina de Gerencia" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="mac">MAC</Label>
                                <Input id="mac" value={formData.mac || ''} onChange={handleInputChange} placeholder="Ej: a1:b2:c3:d4:f4:g5" />
                            </div>
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
