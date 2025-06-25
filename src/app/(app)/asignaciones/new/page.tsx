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
import { useRouter } from 'next/router';

interface Activo {
    value: string; // id
    label: string; // nombre descriptivo
    type: 'Computador' | 'Dispositivo';
    asignadoA?: string;
}
interface Target {
    value: string; // id
    label: string; // nombre
}

export default function AsignacionesPage() {
    const [equiposDisponibles, setEquiposDisponibles] = useState<Activo[]>([]);
    const [equiposAsignados, setEquiposAsignados] = useState<Activo[]>([]);
    const [usuarios, setUsuarios] = useState<Target[]>([]);
    const [departamentos, setDepartamentos] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedEquipo, setSelectedEquipo] = useState<Activo | null>(null);
    const [asignarA, setAsignarA] = useState<'Usuario' | 'Departamento'>('Usuario');
    const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
    const [notas, setNotas] = useState('');
    const [gerente, setGerente] = useState('');
    const [motivo, setMotivo] = useState('');
    const [serialC, setSerialC] = useState('');
    const [modeloC, setModeloC] = useState('');
    const [ localidad, setLocalidad ] = useState('');   

    // --- LÓGICA DE FETCH REFACTORIZADA ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resDisponibles, resAsignados, resUsuarios, resDeptos] = await Promise.all([
                fetch('/api/activos?estado=disponible'), // <-- Nuevo endpoint
                fetch('/api/activos?estado=asignado'),   // <-- Nuevo endpoint
                fetch('/api/usuarios'),
                fetch('/api/departamentos'),
            ]);
            
            if(!resDisponibles.ok || !resAsignados.ok) throw new Error("Error cargando activos");
            
            setEquiposDisponibles(await resDisponibles.json());
            setEquiposAsignados(await resAsignados.json());

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

    // --- LÓGICA DE HANDLERS REFACTORIZADA ---
    const handleAsignar = async () => {
        if (!selectedEquipo || !selectedTarget) {
            showToast.warning("Por favor, selecciona un equipo y un destino.");
            return;
        }

        const body = {
            action: 'asignar' as const,
            itemId: selectedEquipo.value,
            itemType: selectedEquipo.type,
            asignarA_id: selectedTarget.value,
            asignarA_type: asignarA,
            notas: notas,
            gerente: gerente,
            motivo: motivo,
            serialC: serialC,
            modeloC: modeloC,
            localidad: localidad,
        };

        try {
            const response = await fetch('/api/asignaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error("La asignación falló.");
            
            showToast.success(`Equipo asignado a ${selectedTarget.label} con éxito.`);
            setSelectedEquipo(null);
            setSelectedTarget(null);
            setNotas('');
            fetchData();// Redirigir a la lista
        } catch (error: any) {
            showToast.error(error.message);
        }
    };

    const handleDesvincular = async (equipo: Activo) => {
        const body = {
            action: 'desvincular' as const,
            itemId: equipo.value,
            itemType: equipo.type,
            notas: `Devolución de ${equipo.asignadoA}`,
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
            fetchData();
        } catch (error: any) {
            showToast.error(error.message);
        }
    };

    // --- RENDERIZADO (sin cambios significativos) ---
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
                        <Label htmlFor="gerente">Gerente</Label>
                        <Textarea id="gerente" value={gerente} onChange={(e) => setGerente(e.target.value)} placeholder="Ej: Carlos Urdaneta..." />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="motivo">Motivo</Label>
                        <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Asignacion" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="modeloC">Modelo Cargador (Opcional)</Label>
                        <Textarea id="modeloC" value={modeloC} onChange={(e) => setModeloC(e.target.value)} placeholder="Ej: Lenovo" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serialC">Serial Cargador(Opcional)</Label>
                        <Textarea id="serialC" value={serialC} onChange={(e) => setSerialC(e.target.value)} placeholder="Ej:CHNN45GHJJ" />
                    </div>

                    
                    <div className="space-y-2">
                        <Label htmlFor="localidad">Localidad</Label>
                        <Textarea id="localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} placeholder="MCP, PZO, ESP, CCS" />
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