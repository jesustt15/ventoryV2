import { z } from "zod";

export const usuarioSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    departamentoId: z.string().min(1, "El departamento es requerido"),
    apellido: z.string().min(1, "El apellido es requerido"),
    cargo: z.string().nullable(),
    ced: z.string().nullable(),
    legajo: z.number().nullable(),
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;

export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    cargo: string;
    ced: string;
    legajo: number;
    departamento: {
        id: string;
        nombre: string;
        gerencia: { nombre?: string };
    };
}
