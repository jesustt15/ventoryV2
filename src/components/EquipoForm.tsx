'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select'; // Lo mantendremos para el segundo dropdown si también necesita ser "creatable"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Importamos los componentes del Select de Shadcn
import {
    Select as ShadcnSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import { PlusIcon, UploadIcon, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from "sonner"; // Usando sonner como en tu import

// --- Tipos de datos (sin cambios) ---
interface Marca {
    id: string;
    nombre: string;
}
interface Modelo {
    id: string;
    nombre: string;
    marcaId: string;
    tipo: string;
}
interface OptionType {
    value: string;
    label: string;
}
interface EquipoFormData {
    marcaId: string;
    modeloId: string;
    serial: string;
    estado: string;
    nombre: string; 
    tipo: string;// Nombre descriptivo del equipo
    img?: File | null;
}

// --- Estilos para que react-select se vea como Shadcn (sin cambios) ---
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


export default function EquipoFormDialog() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // --- Estados para los datos (sin cambios) ---
    const [formData, setFormData] = useState<Partial<EquipoFormData>>({});
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [isLoadingMarcas, setIsLoadingMarcas] = useState(false);
    const [isLoadingModelos, setIsLoadingModelos] = useState(false);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Lógica de fetch y creación (sin cambios) ---
   useEffect(() => {
    const fetchMarcas = async () => {
        setIsLoadingMarcas(true);
        try {
            const response = await fetch('/api/marcas'); // Asegúrate que este endpoint exista
            if (!response.ok) throw new Error('Error al cargar marcas');
            const data: Marca[] = await response.json();
            setMarcas(data);
        } catch (error) {
            toast.error(`No se pudieron cargar las marcas: ${error}`);
         } finally {
            setIsLoadingMarcas(false);
        }

 };

 fetchMarcas();

    }, []);

    useEffect(() => {
        if (!formData.marcaId) {
            setModelos([]);
            setFormData(prev => ({ ...prev, modeloId: undefined, tipo: undefined })); // Limpiar también el tipo
            return;
        }
        const fetchModelos = async () => { 
            setIsLoadingModelos(true);

        try {
            const response = await fetch(`/api/modelos?marcaId=${formData.marcaId}`);
            if (!response.ok) throw new Error('Error al cargar modelos');
            const data: Modelo[] = await response.json();
            setModelos(data);

        } catch (error) {
            toast.error("No se pudieron cargar los modelos para esa marca.");

        } finally {
         setIsLoadingModelos(false);
         }
     };
        fetchModelos();
    }, [formData.marcaId]);

    const handleCreateMarca = async (inputValue: string) => {
     setIsLoadingMarcas(true);
    try {
      const response = await fetch('/api/marcas', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ nombre: inputValue }),

      });

      if (!response.ok) throw new Error('Error al crear la marca');

     

      const nuevaMarca: Marca = await response.json();

      setMarcas(prev => [...prev, nuevaMarca]);

      setFormData(prev => ({ ...prev, marcaId: nuevaMarca.id })); // Seleccionar la nueva marca

      toast.success(`Marca "${nuevaMarca.nombre}" creada.`);

    } catch (error) {

      toast.error(`No se pudo crear la marca: ${error}`);

    } finally {

      setIsLoadingMarcas(false);

    }

  };
    const handleCreateModelo = async (inputValue: string) => {
        if (!formData.marcaId) {
            toast.error("Por favor, selecciona una marca primero.");
            return;
        }
        // VALIDACIÓN: Asegurarse de que se ha seleccionado un tipo para el nuevo modelo
        if (!formData.tipo) {
            toast.error("Por favor, selecciona un tipo para el nuevo modelo.");
            return;
        }

        setIsLoadingModelos(true);
        try {
            const response = await fetch('/api/modelos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: inputValue,
                    marcaId: formData.marcaId,
                    tipo: formData.tipo, // <-- Se envía el tipo seleccionado en el formulario
                }),
            });
             if (!response.ok) throw new Error('Error al crear el modelo');
             
             const nuevoModelo: Modelo = await response.json();
             setModelos(prev => [...prev, nuevoModelo]);
             setFormData(prev => ({ ...prev, modeloId: nuevoModelo.id }));
             toast.success(`Modelo "${nuevoModelo.nombre}" creado con éxito.`);
        } catch (error) {
            toast.error("No se pudo crear el modelo.");
        } finally {
            setIsLoadingModelos(false);
        }
    }

    // --- Handlers de Inputs (sin cambios) ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, img: file }));
            setSelectedImagePreview(URL.createObjectURL(file));
        }
    };
    
    // --- Lógica para el submit del formulario principal ---
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Validación básica
        if (!formData.marcaId || !formData.modeloId || !formData.serial || !formData.estado) {
            toast.error("Por favor, complete todos los campos requeridos.");
            return;
        }

        toast.info("Guardando equipo...");
        
        const dataToSend = new FormData();
        dataToSend.append('nombre', formData.nombre || '');
        dataToSend.append('modeloId', formData.modeloId);
        dataToSend.append('serial', formData.serial);
        dataToSend.append('estado', formData.estado);
        if (formData.img) {
            dataToSend.append('img', formData.img); // La API debe esperar una clave "img"
        }
        
        try {
            const response = await fetch('/api/dispositivos', {
                method: 'POST',
                body: dataToSend,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error del servidor');
            }

            const nuevoEquipo = await response.json();
            toast.success(`Equipo "${nuevoEquipo.nombre || nuevoEquipo.serial}" agregado.`);
            resetForm();
            setIsDialogOpen(false);
            // Aquí puedes llamar a una función para refrescar la lista de equipos en la página principal
            // ej: props.onEquipoAgregado();
        } catch (error: any) {
            toast.error(`Error al guardar: ${error.message}`);
        }
    };

    // --- Resetear el formulario ---
    const resetForm = () => {
        setFormData({});
        setModelos([]);
        setSelectedImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
        }}>
            <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)} className="cyber-button text-black font-semibold">
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
                 <form onSubmit={handleSubmit}>
                     <div className="grid gap-4 py-4">
                      
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                 <Label htmlFor="marca">Marca</Label>
                                 <CreatableSelect
                                    instanceId="marca-select" // ID único para evitar colisiones de hidratación
                                    isClearable
                                    options={marcas.map(m => ({ value: m.id, label: m.nombre }))}
                                    value={formData.marcaId ? { value: formData.marcaId, label: marcas.find(m => m.id === formData.marcaId)?.nombre || '' } : null}
                                    onChange={(option: OptionType | null) => setFormData(prev => ({ ...prev, marcaId: option?.value, modeloId: undefined }))}
                                    onCreateOption={handleCreateMarca}
                                    isLoading={isLoadingMarcas}
                                    placeholder="Seleccionar o crear"
                                    styles={reactSelectStyles}
                                    formatCreateLabel={inputValue => `Crear "${inputValue}"`}
                                 />
                             </div>
                             <div className="grid gap-2">
                                 <Label htmlFor="modelo">Modelo</Label>
                                 <CreatableSelect
                                    instanceId="modelo-select"
                                    isClearable
                                    options={modelos.map(m => ({ value: m.id, label: m.nombre }))}
                                    value={formData.modeloId ? { value: formData.modeloId, label: modelos.find(m => m.id === formData.modeloId)?.nombre || '' } : null}
                                    onChange={(option: OptionType | null) => setFormData(prev => ({ ...prev, modeloId: option?.value }))}
                                    onCreateOption={handleCreateModelo}
                                    isLoading={isLoadingModelos}
                                    isDisabled={!formData.marcaId || isLoadingModelos}
                                    placeholder={!formData.marcaId ? "Selecciona marca" : "Seleccionar o crear"}
                                    styles={reactSelectStyles}
                                    formatCreateLabel={inputValue => `Crear "${inputValue}"`}
                                 />
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="serial">Serial</Label>
                                <Input id="serial" value={formData.serial || ''} onChange={handleInputChange} placeholder="Serial del equipo" />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="tipo">Tipo de Equipo</Label>
                                <ShadcnSelect
                                    value={formData.tipo || ''}
                                    onValueChange={(value) => setFormData(prev => ({...prev, tipo: value}))}
                                >
                                     <SelectTrigger id="tipo" className="w-full">
                                         <SelectValue placeholder="Seleccionar tipo" />
                                     </SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="Telefono Ip">Teléfono IP</SelectItem>
                                         <SelectItem value="Switches">Switches</SelectItem>
                                         <SelectItem value="Mouse">Mouse</SelectItem>
                                         <SelectItem value="Teclado">Teclado</SelectItem>
                                         <SelectItem value="Impresoras">Impresoras</SelectItem>
                                         <SelectItem value="Laptop">Laptop</SelectItem> {/* Añadido por completitud */}
                                         <SelectItem value="Desktop">Desktop</SelectItem> {/* Añadido por completitud */}
                                         <SelectItem value="Monitor">Monitor</SelectItem> {/* Añadido por completitud */}
                                     </SelectContent>
                                 </ShadcnSelect>
                             </div>
                             <div className="grid gap-2">
                                 <Label htmlFor="estado">Estado</Label>
                                 {/* CORRECCIÓN AQUÍ: Usando la sintaxis correcta de Shadcn Select */}
                                 <ShadcnSelect
                                    value={formData.estado || ''}
                                    onValueChange={(value) => setFormData(prev => ({...prev, estado: value}))}
                                >
                                     <SelectTrigger id="estado" className="w-full">
                                         <SelectValue placeholder="Seleccionar estado" />
                                     </SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="Disponible">Disponible</SelectItem>
                                         <SelectItem value="En uso">En uso</SelectItem>
                                         <SelectItem value="En reparación">En reparación</SelectItem>
                                         <SelectItem value="De baja">De baja</SelectItem>
                                     </SelectContent>
                                 </ShadcnSelect>
                             </div>
                         </div>
                     </div>
                     <DialogFooter>
                         <DialogClose asChild>
                             <Button type="button" variant="outline">Cancelar</Button>
                         </DialogClose>
                         <Button type="submit" className="cyber-button text-black font-semibold">
                             GUARDAR EQUIPO
                         </Button>
                     </DialogFooter>
                 </form>
            </DialogContent>
        </Dialog>
    );
}