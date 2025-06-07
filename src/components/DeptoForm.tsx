'use client'

import { useState, useEffect, FormEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose, // Asegúrate de tener DialogClose si quieres un botón Cancelar explícito
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import CreatableSelect from 'react-select/creatable';
import { showToast } from 'nextjs-toast-notify'; // Asumo que es la librería que usas (antes sonner)
// Eliminamos los imports de Avatar, ImageIcon y ShadcnSelect ya que no se usarán para imagen o tipo aquí.

// Interfaces
interface Gerencia {
    id: string;
    nombre: string;
}

interface OptionType {
    value: string;
    label: string;
    __isNew__?: boolean; // Para CreatableSelect
}

// Asumimos que DepartamentoFormData se importa y ya incluye gerenciaId
// Si no, deberías definirlo así o similar donde corresponda:
// export interface DepartamentoFormData {
//   id?: string; // opcional, si es para edición
//   nombre: string;
//   ceco: string;
//   sociedad: string;
//   gerenciaId: string; // Esencial para preseleccionar y guardar
// }
import { DepartamentoFormData } from './depto-table'; // Asegúrate que esta defina gerenciaId

interface DepartamentoFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void; // onSubmit seguirá recibiendo FormData
    gerencias: Gerencia[];
    initialData?: DepartamentoFormData & { gerenciaId?: string } | null; // Asegurar que initialData pueda tener gerenciaId
}

// Estilos de react-select (sin cambios)
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
        color: state.isSelected ? 'hsl(var(--accent-foreground))' : 'hsl(var(--popover-foreground))',
        cursor: 'pointer',
        '&:hover': {
            background: 'hsl(var(--accent))',
            color: 'hsl(var(--accent-foreground))',
        }
    }),
}

const DepartamentoForm: React.FC<DepartamentoFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    gerencias = [],
    initialData,
}) => {
    const [nombre, setNombre] = useState('');
    const [ceco, setCeco] = useState('');
    const [sociedad, setSociedad] = useState('');
    const [selectedGerencia, setSelectedGerencia] = useState<OptionType | null>(null);
    const [allGerencias, setAllGerencias] = useState<Gerencia[]>(gerencias); // Para manejar las gerencias creadas dinámicamente
    const [isLoadingGerencias, setIsLoadingGerencias] = useState(false);
    const [isCreatingGerencia, setIsCreatingGerencia] = useState(false);


    const isEditing = !!initialData  // Es edición si initialData tiene un ID

    useEffect(() => {
        setAllGerencias(gerencias); // Sincronizar con las props cuando cambien
    }, [gerencias]);

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setNombre(initialData.nombre || '');
                setCeco(initialData.ceco || '');
                setSociedad(initialData.sociedad || '');

                // Corregir la lógica para preseleccionar la gerencia
                if (initialData.gerenciaId) {
                    const gerenciaActual = allGerencias.find(g => g.id === initialData.gerenciaId);
                    if (gerenciaActual) {
                        setSelectedGerencia({ value: gerenciaActual.id, label: gerenciaActual.nombre });
                    } else {
                        setSelectedGerencia(null); // Si no se encuentra, no preseleccionar
                    }
                } else {
                    setSelectedGerencia(null);
                }

            } else {
                // Resetear para creación
                setNombre('');
                setCeco('');
                setSociedad('');
                setSelectedGerencia(null);
            }
        }
    }, [isOpen, initialData, isEditing, allGerencias]); // allGerencias en dependencias

    const handleCreateGerencia = async (inputValue: string) => {
            setIsCreatingGerencia(true);
            // Create a temporary option for the user to see
            const newGerenciaOption: OptionType = {
                value: inputValue, // For a new brand, value and label can be the same initially
                label: inputValue,
                __isNew__: true, // Flag it as a new brand
            };
            setSelectedGerencia(newGerenciaOption);
            setIsCreatingGerencia(false); // This is a quick operation, no need for long loading
            showToast.success(`Gerencia"${inputValue}" lista para ser creada.`, { position: "top-right" });
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!nombre.trim() || !ceco.trim() || !sociedad.trim() || !selectedGerencia) {
            showToast.warning("Todos los campos son requeridos, incluyendo la gerencia.", { position: "top-right" });
            return;
        }

        const formDataToSubmit = new FormData();
        formDataToSubmit.append('nombre', nombre.trim());
        formDataToSubmit.append('ceco', ceco.trim());
        formDataToSubmit.append('sociedad', sociedad.trim());

        if (selectedGerencia.__isNew__) {
            // If it's a new brand, send the name for the backend to create
            formDataToSubmit.append('gerenciaNombre', selectedGerencia.label);
        } else {
            // If it's an existing brand, send its ID
            formDataToSubmit.append('gerenciaId', selectedGerencia.value);
        }

        
        onSubmit(formDataToSubmit);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(openValue) => {
            if (!openValue) onClose();
        }}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Departamento" : "Crear Nuevo Departamento"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifique los detalles del Departamento aquí." : "Complete los detalles para el nuevo departamento."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4"> {/* Aumentado el gap general */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre" className="text-right">Nombre</Label>
                        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="col-span-3" placeholder="Nombre del Departamento"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ceco" className="text-right">CECO</Label>
                        <Input id="ceco" value={ceco} onChange={(e) => setCeco(e.target.value)} className="col-span-3" placeholder="Centro de Costo"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sociedad" className="text-right">Sociedad</Label>
                        <Input id="sociedad" value={sociedad} onChange={(e) => setSociedad(e.target.value)} className="col-span-3" placeholder="Sociedad a la que pertenece"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gerencia-select" className="text-right">Gerencia</Label>
                        <div className="col-span-3"> {/* Contenedor para CreatableSelect */}
                            <CreatableSelect
                                instanceId="gerencia-creatable-select"
                                styles={reactSelectStyles}
                                options={allGerencias.map(g => ({ value: g.id, label: g.nombre }))}
                                value={selectedGerencia}
                                onChange={(option) => setSelectedGerencia(option as OptionType | null)}
                                onCreateOption={handleCreateGerencia} // Se llama al crear nueva opción
                                placeholder="Seleccionar o crear Gerencia"
                                isClearable
                                isLoading={isLoadingGerencias}
                                formatCreateLabel={(inputValue) => `Crear nueva gerencia: "${inputValue}"`}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">{isEditing ? "Guardar Cambios" : "Crear Departamento"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DepartamentoForm;