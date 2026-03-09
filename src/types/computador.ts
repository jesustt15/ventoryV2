import { z } from "zod";

// Zod Schema para validación de formularios
export const computadorSchema = z.object({
    serial: z.string().min(1, "El nombre es requerido"),
    modeloId: z.string().min(1, "La Marca es Requerida"),
    estado: z.string().min(1, "El Estado de dispositivo es requerido"),
    nsap: z.string().nullable(),
    host: z.string().nullable(),
    ubicacion: z.string().nullable(),
    sisOperativo: z.string().nullable(),
    arquitectura: z.string().nullable(),
    ram: z.string().nullable(),
    sede: z.string().nullable(),
    almacenamiento: z.string().nullable(),
    procesador: z.string().nullable(),
    sapVersion: z.string().nullable(),
    officeVersion: z.string().nullable(),
    macWifi: z.string().nullable(),
    macEthernet: z.string().nullable(),
});

export type ComputadorFormData = z.infer<typeof computadorSchema>;

// Interfaces para tipos de datos
export interface Computador {
    id: string;
    serial: string;
    estado: string;
    nsap?: string;
    host?: string;
    ubicacion: string;
    sisOperativo?: string;
    arquitectura?: string;
    macWifi?: string;
    macEthernet?: string;
    ram?: string;
    sede?: string;
    almacenamiento?: string;
    procesador?: string;
    sapVersion?: string;
    officeVersion?: string;
    modelo: {
        id: string;
        nombre: string;
        img?: string;
        marca: { nombre: string };
        tipo: string;
        procesadorDefault?: string | null;
        ramDefault?: string | null;
        almacenamientoDefault?: string | null;
    };
    usuario?: {
        id: string;
        nombre: string;
        apellido?: string;
    } | null;
    departamento?: {
        id: string;
        nombre: string;
    } | null;
}
