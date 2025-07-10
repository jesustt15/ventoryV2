"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Select from 'react-select'; // react-select es ideal para buscar en listas largas
import { showToast } from 'nextjs-toast-notify';
import { ArrowRightLeftIcon, Undo2, XCircle } from 'lucide-react';
import { reactSelectStyles } from '@/utils/reactSelectStyles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';

interface Activo {
    value: string; // id
    label: string; // nombre descriptivo
    type: 'Computador' | 'Dispositivo' | 'LineaTelefonica' ; // tipo de activo
    asignadoA?: string;
}
interface Target {
    value: string; // id
    label: string; // nombre
}

export default function AsignacionesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
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
    // --- NUEVOS ESTADOS PARA LA SELECCIÓN GUIADA ---
    const [assetType, setAssetType] = useState<'Computador' | 'Dispositivo' | 'LineaTelefonica' | ''>('');
    const [marcas, setMarcas] = useState<Target[]>([]);
    const [selectedMarca, setSelectedMarca] = useState<Target | null>(null);
    const [modelos, setModelos] = useState<Target[]>([]);
    const [selectedModelo, setSelectedModelo] = useState<Target | null>(null);
     const [proveedores, setProveedores] = useState<{value: string, label: string}[]>([]);
    const [selectedProveedor, setSelectedProveedor] = useState<Target | null>(null);
    const [activosDisponibles, setActivosDisponibles] = useState<Activo[]>([]);

  
   const fetchData = useCallback(async () => {
        setLoading(true);
        const equipoId = searchParams.get('equipoId');

        try {
            // Siempre necesitamos los usuarios y departamentos para los dropdowns
            const [resUsuarios, resDeptos, resProveedores] = await Promise.all([
                fetch('/api/usuarios'),
                fetch('/api/departamentos'),
                fetch('/api/proveedores'),
            ]);
            const usuariosData = await resUsuarios.json();
            const deptosData = await resDeptos.json();
            const proveedoresData = await resProveedores.json();
            setUsuarios(usuariosData.map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido}` })));
            setDepartamentos(deptosData.map((d: any) => ({ value: d.id, label: d.nombre })));
            setProveedores(proveedoresData.map((p: any) => ({ value: p.id, label: p.nombre })));

            // Lógica condicional para el equipo
            if (equipoId) {
                // Si hay un ID en la URL, buscamos solo ese equipo.
                const resEquipo = await fetch(`/api/activos/${equipoId}`);
                if (!resEquipo.ok) {
                    showToast.error("El equipo preseleccionado no se encontró o ya está asignado.");
                    // Limpiamos el parámetro de la URL para evitar bucles
                    router.replace('/asignaciones', { scroll: false }); 
                    // Y cargamos la lista normal de disponibles
                    const resDisponibles = await fetch('/api/activos?estado=disponible');
                    setEquiposDisponibles(await resDisponibles.json());
                } else {
                    const equipoData = await resEquipo.json();
                    // Ponemos el equipo preseleccionado en el estado `selectedEquipo`
                    setSelectedEquipo(equipoData);
                }
            } else {
                // Si no hay ID, cargamos todos los equipos disponibles como antes
                const resDisponibles = await fetch('/api/activos?estado=disponible');
                if(!resDisponibles.ok) throw new Error("Error cargando activos disponibles");
                setEquiposDisponibles(await resDisponibles.json());
            }

            // Siempre cargamos la lista de asignados para la otra pestaña
            const resAsignados = await fetch('/api/activos?estado=asignado');
            if(!resAsignados.ok) throw new Error("Error cargando activos asignados");
            setEquiposAsignados(await resAsignados.json());

        } catch (error) {
            showToast.error("Error al cargar los datos.");
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [searchParams, router]); // Dependemos de searchParams para re-evaluar

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    // 1. Cargar datos iniciales (marcas, usuarios, deptos)
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [resMarcas, resUsuarios, resDeptos] = await Promise.all([
                    fetch('/api/marcas'),
                    fetch('/api/usuarios'),
                    fetch('/api/departamentos'),
                ]);
                setMarcas((await resMarcas.json()).map((m: any) => ({ value: m.id, label: m.nombre })));
               const usuariosData = await resUsuarios.json();
                const deptosData = await resDeptos.json();
                setUsuarios(usuariosData.map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido}` })));
                setDepartamentos(deptosData.map((d: any) => ({ value: d.id, label: d.nombre })));
                } catch (e) { 
                    showToast.error("Error al cargar los datos.");
                    console.error("Error fetching data:", e);
                } finally {
                    setLoading(false);
                }
        };
        fetchInitialData();
    }, []);

useEffect(() => {
        if (!selectedMarca) { setModelos([]); return; }
        const fetchModelos = async () => {
            const res = await fetch(`/api/modelos?marcaId=${selectedMarca.value}`);
            setModelos((await res.json()).map((m: any) => ({ value: m.id, label: m.nombre })));
        };
        fetchModelos();
    }, [selectedMarca]);

    // 4. Cargar activos finales cuando se selecciona un MODELO
    useEffect(() => {
        if (!selectedModelo) { setActivosDisponibles([]); return; }
        const fetchActivos = async () => {
            // ¡ESTA ES LA LLAMADA CORRECTA!
            const res = await fetch(`/api/activos?modeloId=${selectedModelo.value}`);
            setActivosDisponibles(await res.json());
        };
        fetchActivos();
    }, [selectedModelo]);

    // 5. Cargar líneas telefónicas cuando se selecciona un PROVEEDOR
    useEffect(() => {
        if (!selectedProveedor) { setActivosDisponibles([]); return; }
        const fetchLineas = async () => {
             // ¡ESTA ES LA LLAMADA CORRECTA!
            const res = await fetch(`/api/activos?proveedor=${selectedProveedor.value}`);
            setActivosDisponibles(await res.json());
        };
        fetchLineas();
    }, [selectedProveedor]);

// Nota: Necesitarás una lógica similar para 'LineaTelefonica' que use proveedores en lugar de marcas/modelos.

        // AÑADIDO: Función para limpiar la preselección
    const handleClearPreselection = () => {
        setSelectedEquipo(null);
        router.replace('/asignaciones', { scroll: false });
    };

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
        <div className="p-2 md:p-8">
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
                        <Label>1. Selecciona el Tipo de Activo</Label>
                        <Select
                            instanceId="asset-type-select"
                            options={[
                                { value: "Computador", label: "Computador" },
                                { value: "Dispositivo", label: "Dispositivo" },
                                { value: "LineaTelefonica", label: "Línea Telefónica" }
                            ]}
                            value={
                                assetType
                                    ? { value: assetType, label: assetType === "LineaTelefonica" ? "Línea Telefónica" : assetType }
                                    : null
                            }
                            onChange={(option) => setAssetType(option ? option.value as typeof assetType : '')}
                            placeholder="Elige un tipo..."
                            isClearable
                            styles={reactSelectStyles}
                        />
                    </div>

                    {/* --- Renderizado Condicional para Computador/Dispositivo --- */}
                    {(assetType === 'Computador' || assetType === 'Dispositivo') && (
                        <div className="space-y-4 animate-in fade-in-0">
                            <div className="space-y-2">
                                <Label>2. Selecciona la Marca</Label>
                                <Select
                                    instanceId="marca-select"
                                    options={marcas}
                                    value={selectedMarca}
                                    onChange={setSelectedMarca}
                                    placeholder="Buscar marca..."
                                    styles={reactSelectStyles}
                                    isClearable
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>3. Selecciona el Modelo</Label>
                                <Select
                                    instanceId="modelo-select"
                                    options={modelos}
                                    value={selectedModelo}
                                    onChange={setSelectedModelo}
                                    placeholder="Buscar modelo..."
                                    isClearable
                                    isDisabled={!selectedMarca}
                                    styles={reactSelectStyles}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>4. Selecciona el Activo Específico (por Serial)</Label>
                                <Select
                                    instanceId="activo-select"
                                    options={equiposDisponibles}
                                    value={selectedEquipo}
                                    onChange={setSelectedEquipo}
                                    placeholder="Buscar serial..."
                                    isClearable
                                    isDisabled={!selectedModelo}
                                    styles={reactSelectStyles}
                                />
                            </div>
                        </div>
                    )}

                    {/* --- Renderizado Condicional para Líneas Telefónicas (Ejemplo) --- */}
                    {assetType === 'LineaTelefonica' && (
                        <div className="space-y-4 animate-in fade-in-0">
                            {/* Aquí irían los Selects para Proveedor y luego para el Número */}
                        </div>
                    )}

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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <Label htmlFor="gerente">Gerente</Label>
                            <Input id="gerente" value={gerente} onChange={(e) => setGerente(e.target.value)} placeholder="Ej: Carlos Urdaneta..." />
                        </div>

                    <div className="space-y-2">
                        <Label htmlFor="motivo">Motivo<span className="text-destructive">*</span></Label>
                            <select
                                id="motivo"
                                className="w-full h-10 border rounded-md px-2 bg-[hsl(var(--background))] border-[hsl(var(--input))] focus:ring-1 focus:ring-[hsl(var(--ring))] focus:outline-none"
                                value={motivo || ''}
                                onChange={(e) => setMotivo(e.target.value)}
                                required
                            >
                                <option value="" disabled>Seleccionar Motivo...</option>
                                <option value="Nueva Asignacion">Nueva Asignacion</option>
                                <option value="Reposicion por Renovación">Reposicion por Renovación</option>
                                <option value="Reposicion por Pérdida">Reposicion por Pérdida</option>
                                <option value="Reposicion por Robo">Reposicion por Robo</option>
                                <option value="Traspaso">Traspaso</option>
                                <option value="Prestámo IT">Prestámo IT</option>
                            </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="modeloC">Modelo Cargador (Opcional)</Label>
                        <Input id="modeloC" value={modeloC} onChange={(e) => setModeloC(e.target.value)} placeholder="Ej: Lenovo" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serialC">Serial Cargador(Opcional)</Label>
                        <Input id="serialC" value={serialC} onChange={(e) => setSerialC(e.target.value)} placeholder="Ej:CHNN45GHJJ" />
                    </div>

                    
                    <div className="space-y-2">
                        <Label htmlFor="localidad">Localidad<span className="text-destructive">*</span></Label>
                            <select
                                id="localidad"
                                className="w-full h-10 border rounded-md px-2 bg-[hsl(var(--background))] border-[hsl(var(--input))] focus:ring-1 focus:ring-[hsl(var(--ring))] focus:outline-none"
                                value={localidad || ''}
                                onChange={(e) => setLocalidad(e.target.value)}
                                required
                            >
                                <option value="" disabled>Seleccionar localidad...</option>
                                <option value="MCP">Macapaima</option>
                                <option value="PZO">Puerto Ordaz</option>
                                <option value="CCS">Caracas</option>
                                <option value="ESP">La Esperanza</option>
                            </select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="notas">Notas Adicionales (Opcional)</Label>
                        <Input id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: Equipo de reemplazo temporal..." />
                    </div>

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