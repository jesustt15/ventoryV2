
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Select from 'react-select'; // react-select es ideal para buscar en listas largas
import { Textarea } from '@/components/ui/textarea';
import { showToast } from 'nextjs-toast-notify';
import { ArrowRightLeftIcon, Undo2 } from 'lucide-react';
import { reactSelectStyles } from '@/utils/reactSelectStyles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';

// Interfaces para los datos que cargaremos
interface Equipo {
    value: string;
    label: string;
    type: 'Computador' | 'Dispositivo';
    // Para la lista de asignados, añadimos a quién está asignado
    asignadoA?: string; 
}
interface Target {
    value: string; // id
    label: string; // nombre
}

export default function AsignacionesPage() {
    const [equiposDisponibles, setEquiposDisponibles] = useState<Equipo[]>([]);
    const [equiposAsignados, setEquiposAsignados] = useState<Equipo[]>([]); // <-- Nuevo estado
    const [usuarios, setUsuarios] = useState<Target[]>([]);
    const [departamentos, setDepartamentos] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
    const [asignarA, setAsignarA] = useState<'Usuario' | 'Departamento'>('Usuario');
    const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
    const [notas, setNotas] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resDisponibles, resAsignados,resDisDisponibles, resDisAsignados, resUsuarios, resDeptos] = await Promise.all([
                fetch('/api/computador?asignado=false'),
                fetch('/api/computador?asignado=true'), // <-- Nuevo fetch para los asignados
                fetch('/api/dispositivos?asignado=false'),
                fetch('/api/dispositivos?asignado=true'),
                fetch('/api/usuarios'),
                fetch('/api/departamentos'),
            ]);
            
            const disponiblesData = await resDisponibles.json();
            const asignadosData = await resAsignados.json();
            const dispositivosDisponiblesData = await resDisDisponibles.json();
            console.log("Dispositivos Disponibles:", dispositivosDisponiblesData);
            const dispositivosAsignadosData = await resDisAsignados.json();
            console.log("Dispositivos Asignados:", dispositivosAsignadosData);

            // Mezclar computadores y dispositivos en equiposDisponibles
            const equiposDisponiblesList = [
                ...disponiblesData.map((e: any) => ({
                    value: e.id,
                    label: `${e.modelo.marca.nombre} ${e.modelo.nombre} (Serial: ${e.serial})`,
                    type: 'Computador',
                })),
                ...dispositivosDisponiblesData.map((d: any) => ({
                    value: d.id,
                    label: `${d.modelo.marca.nombre} ${d.modelo.nombre} (Serial: ${d.serial})`,
                    type: 'Dispositivo',
                }))
            ];

            setEquiposDisponibles(equiposDisponiblesList);

            // Mezclar computadores y dispositivos en equiposAsignados
            const equiposAsignadosList = [
                ...asignadosData.map((e: any) => ({
                    value: e.id,
                    label: `${e.modelo.marca.nombre} ${e.modelo.nombre} (Serial: ${e.serial})`,
                    type: 'Computador',
                    asignadoA: (e.usuario ? `${e.usuario.nombre} ${e.usuario.apellido}` : e.departamento?.nombre) ?? 'Destino desconocido',
                })),
                ...dispositivosAsignadosData.map((d: any) => ({
                    value: d.id,
                    label: `${d.modelo.marca.nombre} ${d.modelo.nombre} (Serial: ${d.serial})`,
                    type: 'Dispositivo',
                    asignadoA: (d.usuario ? `${d.usuario.nombre} ${d.usuario.apellido}` : d.departamento?.nombre) ?? 'Destino desconocido',
                }))
            ];

            setEquiposAsignados(equiposAsignadosList); 
            const usuariosData = await resUsuarios.json();
            const deptosData = await resDeptos.json();

            setUsuarios(usuariosData.map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido}` })));
            setDepartamentos(deptosData.map((d: any) => ({ value: d.id, label: d.nombre })));
        } catch (error) {
            showToast.error("Error al cargar los datos.");
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAsignar = async () => {
        if (!selectedEquipo || !selectedTarget) {
            showToast.warning("Por favor, selecciona un equipo y un destino.");
            return;
        }

        const body = {
            equipoId: selectedEquipo.value,
            equipoType: selectedEquipo.type,
            action: 'asignar',
            asignarA_type: asignarA,
            asignarA_id: selectedTarget.value,
            notas: notas,
        };

        try {
            const response = await fetch('/api/asignaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error("La asignación falló.");
            
            showToast.success(`Equipo asignado a ${selectedTarget.label} con éxito.`);
            // Resetear el formulario y refrescar las listas
            setSelectedEquipo(null);
            setSelectedTarget(null);
            setNotas('');
            fetchData();
        } catch (error: any) {
            showToast.error(error.message);
        }
    };

    const handleDesvincular = async (equipo: Equipo) => {
        const body = {
            equipoId: equipo.value,
            equipoType: equipo.type,
            action: 'desvincular',
            notas: `Devolución de ${equipo.asignadoA}`
        };

        try {
            const response = await fetch('/api/asignaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || "La desvinculación falló.");
            }
            
            showToast.success(`Equipo ${equipo.label} desvinculado con éxito.`);
            fetchData(); // Vuelve a cargar todos los datos para refrescar las listas
        } catch (error: any) {
            showToast.error(error.message);
        }
    };

     const targetOptions = asignarA === 'Usuario' ? usuarios : departamentos;
    return (
        <div className="p-4 md:p-8">
            <Tabs defaultValue="asignar" className="max-w-2xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="asignar"><ArrowRightLeftIcon className="mr-2 h-4 w-4" />Asignar Equipo</TabsTrigger>
                    <TabsTrigger value="desvincular"><Undo2 className="mr-2 h-4 w-4" />Desvincular Equipo</TabsTrigger>
                </TabsList>

            <TabsContent value='asignar'>    
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowRightLeftIcon />
                        Realizar Asignación de Equipo
                    </CardTitle>
                    <CardDescription>
                        Selecciona un equipo y asígnalo a un usuario o departamento.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>1. Selecciona un Equipo Disponible</Label>
                        <Select
                            instanceId="sololo"
                            options={equiposDisponibles}
                            value={selectedEquipo}
                            onChange={setSelectedEquipo}
                            styles={reactSelectStyles}
                            placeholder="Buscar por modelo o serial..."
                            isClearable
                            isSearchable
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>2. Elige el Destino de la Asignación</Label>
                        <RadioGroup value={asignarA} onValueChange={(value: any) => setAsignarA(value)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Usuario" id="r-usuario" />
                                <Label htmlFor="r-usuario">Usuario</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Departamento" id="r-depto" />
                                <Label htmlFor="r-depto">Departamento</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>3. Selecciona el {asignarA === 'Usuario' ? 'Usuario' : 'Departamento'} Específico</Label>
                         <Select
                         instanceId="search-combo"
                            options={targetOptions}
                            value={selectedTarget}
                            onChange={setSelectedTarget}
                            styles={reactSelectStyles}
                            placeholder={`Buscar ${asignarA}...`}
                            isClearable
                            isSearchable
                            isDisabled={!selectedEquipo}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="notas">Notas Adicionales (Opcional)</Label>
                        <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: Equipo de reemplazo temporal..." />
                    </div>

                    <Button onClick={handleAsignar} disabled={!selectedEquipo || !selectedTarget} className="w-full">
                        Confirmar Asignación
                    </Button>
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="desvincular">
                     <Card>
                        <CardHeader>
                            <CardTitle>Equipos Asignados</CardTitle>
                            <CardDescription>Selecciona un equipo para desvincularlo y devolverlo a resguardo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? <Spinner /> : 
                                equiposAsignados.length > 0 ? (
                                    equiposAsignados.map((equipo) => (
                                        <div key={equipo.value} className="flex items-center justify-between p-3 bg-card rounded-md border">
                                            <div>
                                                <p className="font-medium text-sm">{equipo.label}</p>
                                                <p className="text-xs text-muted-foreground">Asignado a: {equipo.asignadoA}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleDesvincular(equipo)}>
                                                <Undo2 className="mr-2 h-4 w-4" />
                                                Desvincular
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground p-4">No hay equipos asignados actualmente.</p>
                                )
                            }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}