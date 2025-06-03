"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import CreatableSelect from 'react-select/creatable';
import { ImageIcon, UploadIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { showToast } from "nextjs-toast-notify";
import {
    Select as ShadcnSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ModeloFormData } from "./modelos-table";

interface ModeloFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void; // Un solo callback para crear y editar
  marcas: { id: string; nombre: string }[];
  initialData?: ModeloFormData | null;
}
interface Marca {
  id: string;
  nombre: string;
}

interface OptionType {
  value: string;
  label: string;
}

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

const ModeloForm: React.FC<ModeloFormProps> = ({
   isOpen,
   onClose,
   onSubmit,
   marcas: marcasProps = [],
   initialData,
}) => {
   const [nombre, setNombre] = useState('');
 const [selectedMarca, setSelectedMarca] = useState<OptionType | null>(null);
 const [selectedTipo, setSelectedTipo] = useState<string>('');
 const [selectedImage, setSelectedImage] = useState<File | null>(null); // This holds the actual File
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null); // This holds the blob URL for preview

  // 3. Determina si estamos en modo edición basado en initialData
  const isEditing = !!initialData;

  // 4. useEffect para rellenar el formulario cuando initialData cambie (¡ESTO ES CLAVE!)
  useEffect(() => {
    if (isEditing && initialData) {
      setNombre(initialData.nombre);
      const marcaInicial = marcasProps.find(m => m.id === initialData.marca);
      setSelectedMarca(marcaInicial ? { value: marcaInicial.id, label: marcaInicial.nombre } : null);
      setSelectedTipo(initialData.tipo);
      setSelectedImagePreview(initialData.img);
      setSelectedImage(null); // No podemos pre-cargar un archivo, solo su preview
    } else {
      // Limpiar el formulario para el modo creación
      setNombre('');
      setSelectedMarca(null);
      setSelectedTipo('');
      setSelectedImage(null);
      setSelectedImagePreview(null);
    }
  }, [initialData, isEditing, marcasProps]);


 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
   const file = e.target.files[0];
   setSelectedImage(file);
   setSelectedImagePreview(URL.createObjectURL(file));
  }
 };

 const handleSubmit = async (event: FormEvent) => {
  event.preventDefault();

  if (!selectedMarca || !selectedTipo || !nombre) {
   showToast.warning("Por Favor Complete los Campos", {
                duration: 4000,
                progress: false,
                position: "top-right",
                transition: "popUp",
                icon: '',
                sound: false,
            });
   return;
  }

        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('marcaId', selectedMarca.value); // Use 'marcaId' as per your backend
        formData.append('tipo', selectedTipo);

        if (selectedImage) {
            formData.append('img', selectedImage); // Append the actual File object here!
        } else if (selectedImagePreview) {
           
        }
        await onSubmit(formData);
 };

  return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Modelo" : "Crear Nuevo Modelo"}</DialogTitle>
           <DialogDescription>
              {isEditing ? "Modifique los detalles del modelo aquí." : "Complete los detalles para el nuevo modelo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="img" className="text-right">
                Imagen
              </Label>
              <Input
                type="file"
                id="img"
                name="img"
                onChange={handleImageChange}
                className="col-span-3"
              />
            </div>
            {selectedImagePreview && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Vista previa</Label>
                <Avatar className="col-span-3 w-24 h-24">
                  <AvatarImage src={selectedImagePreview} alt="Vista previa" />
                  <AvatarFallback>
                    <ImageIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="marcaId" className="text-right">
                Marca
              </Label>
               <CreatableSelect
                    id="marca"
                    className="col-span-3"
                    isClearable
                    placeholder="Seleccione o cree una marca"
                    options={marcasProps.map(m => ({ value: m.id, label: m.nombre }))}
                    value={selectedMarca}
                    onChange={setSelectedMarca}
                    styles={reactSelectStyles}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipo" className="text-right">Tipo de Equipo</Label>
               <ShadcnSelect value={selectedTipo} onValueChange={setSelectedTipo}>
                      <SelectTrigger id="tipo" className="col-span-3">
                          <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Telefono Ip">Teléfono IP</SelectItem>
                          <SelectItem value="Switches">Switches</SelectItem>
                          <SelectItem value="Mouse">Mouse</SelectItem>
                          <SelectItem value="Teclado">Teclado</SelectItem>
                          <SelectItem value="Impresoras">Impresoras</SelectItem>
                          <SelectItem value="Laptop">Laptop</SelectItem>
                          <SelectItem value="Desktop">Desktop</SelectItem>
                          <SelectItem value="Monitor">Monitor</SelectItem>
                      </SelectContent>
                  </ShadcnSelect>
              </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEditing ? "Guardar Cambios" : "Crear Modelo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModeloForm;
