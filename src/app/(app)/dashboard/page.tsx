"use client"

import { useState, useRef, useEffect } from "react"
import {
  Users,
  Monitor,
  Cpu,
  UserCheck,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  Building,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useQuery } from "@tanstack/react-query"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import Link from "next/link"

const fetchDashboardData = async () => {
  // La URL debe coincidir con la ruta de tu API.
  const response = await fetch("/api/dashboard/");
  if (!response.ok) {
    throw new Error("Error al cargar los datos del dashboard.");
  }
  return response.json();
};

// --- Componentes para estados de UI ---
const LoadingSkeleton = () => (
  <div className="flex items-center justify-center min-h-screen bg-black text-cyan-400">
    <div className="text-center">
      <Cpu className="h-12 w-12 mx-auto animate-pulse" />
      <p className="mt-4 text-lg">Cargando estadísticas del sistema...</p>
    </div>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-black text-red-500">
    <div className="text-center">
      <p className="text-lg font-bold">¡Oops! Algo salió mal.</p>
      <p className="mt-2">{message}</p>
    </div>
  </div>
);

export default function InventoryDashboard() {
  const [timeRange, setTimeRange] = useState("30d")
  const [currentTime, setCurrentTime] = useState(new Date())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isAdmin = useIsAdmin();

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Particle effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Particle[] = []
    const particleCount = 80

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * (canvas?.width ?? 0)
        this.y = Math.random() * (canvas?.height ?? 0)
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.color = `rgba(${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 150}, ${Math.floor(Math.random() * 55) + 200}, ${Math.random() * 0.3 + 0.1})`
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (!canvas) return

        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.update()
        particle.draw()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "registration":
        return Monitor
      case "assignment":
        return UserCheck
      case "maintenance":
        return Shield
      case "user":
        return Users
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "registration":
        return "text-green-500"
      case "assignment":
        return "text-blue-500"
      case "maintenance":
        return "text-amber-500"
      case "user":
        return "text-purple-500"
      default:
        return "text-slate-500"
    }
  }

   const {
    data: dashboardData, // Los datos de la API estarán aquí
    isLoading, // Será `true` mientras se obtienen los datos
    isError, // Será `true` si la petición falla
    error, // Contendrá el objeto de error
  } = useQuery({
    queryKey: ["dashboardData"], // Clave única para esta consulta
    queryFn: fetchDashboardData, // Función que se ejecutará para obtener los datos
    refetchInterval: 300000, // Opcional: Vuelve a cargar los datos cada 5 minutos
  });

   if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorDisplay message={error.message} />;
  }
  console.log(dashboardData.totalUsers, dashboardData.totalDevices, dashboardData.totalComputers);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background particle effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-20" />

      <div className="container mx-auto p-4 relative z-10">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Usuarios"
            value={dashboardData.totalUsers}
            trend={dashboardData.trends.users}
            icon={Users}
            color="cyan"
            description="Usuarios registrados"
          />
          <StatCard
            title="Dispositivos Totales"
            value={dashboardData.totalDevices}
            trend={dashboardData.trends.devices}
            icon={Monitor}
            color="blue"
            description="Todos los dispositivos"
          />
          <StatCard
            title="Computadores Totales"
            value={dashboardData.totalComputers}
            trend={dashboardData.trends.computers}
            icon={Cpu}
            color="purple"
            description="Total de computadores"
          />
          <StatCard
            title="Computadores Asignados"
            value={dashboardData.assignedComputers}
            trend={dashboardData.trends.assigned}
            icon={UserCheck}
            color="green"
            description="En uso activo"
          />
          <StatCard
            title="Computadores en Resguardo"
            value={dashboardData.storedComputers}
            trend={dashboardData.trends.stored}
            icon={Shield}
            color="amber"
            description="Resguardados"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Charts and Analytics */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-slate-800/50 p-1 mb-6">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                >
                  Resumen
                </TabsTrigger>
                <TabsTrigger
                  value="departments"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                >
                  Departamentos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <div className="grid gap-6">
                  {/* Assignment Overview */}
                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-700/50 pb-3">
                      <CardTitle className="text-slate-100 flex items-center">
                        <PieChart className="mr-2 h-5 w-5 text-cyan-500" />
                        Estado de Computadores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-400">Asignados</span>
                              <span className="text-sm text-green-400">
                                {dashboardData.assignedComputers} (
                                {Math.round((dashboardData.assignedComputers / dashboardData.totalComputers) * 100)}%)
                              </span>
                            </div>
                            <Progress
                              value={(dashboardData.assignedComputers / dashboardData.totalComputers) * 100}
                              className="h-3 bg-slate-700"
                            >
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                style={{
                                  width: `${(dashboardData.assignedComputers / dashboardData.totalComputers) * 100}%`,
                                }}
                              />
                            </Progress>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-400">En Resguardo</span>
                              <span className="text-sm text-amber-400">
                                {dashboardData.storedComputers} (
                                {Math.round((dashboardData.storedComputers / dashboardData.totalComputers) * 100)}%)
                              </span>
                            </div>
                            <Progress
                              value={(dashboardData.storedComputers / dashboardData.totalComputers) * 100}
                              className="h-3 bg-slate-700"
                            >
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                style={{
                                  width: `${(dashboardData.storedComputers / dashboardData.totalComputers) * 100}%`,
                                }}
                              />
                            </Progress>
                          </div>
                          
                          {/* Quick Actions - Moved here */}
                          <div className="pt-4">
                            <h3 className="text-sm font-semibold text-cyan-400 mb-3">Acciones Rápidas</h3>
                            {isAdmin && (
                                <div className="grid grid-cols-2 gap-2">
                                <Link
                                  href="/dispositivos"
                                  className="h-auto py-2 px-2 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center space-y-1"
                                >
                                  <Monitor className="h-4 w-4 text-cyan-500" />
                                  <span className="text-xs text-white">Nuevo Dispositivo</span>
                                </Link>

                                <Link
                                  href="/usuarios"
                                  className="h-auto py-2 px-2 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center space-y-1"
                                >
                                  <Users className="h-4 w-4 text-blue-500" />
                                  <span className="text-xs text-white">Nuevo Usuario</span>
                                </Link>

                                <Link
                                  href="/asignaciones/new"
                                  className="h-auto py-2 px-2 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center space-y-1 rounded-md"
                                >
                                  <UserCheck className="h-4 w-4 text-green-500" />
                                  <span className="text-xs text-white">Asignar</span>
                                </Link>

                                <Link
                                  href="/computadores"
                                  className="h-auto py-2 px-2 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center space-y-1 rounded-md"
                                >
                                  <Cpu className="h-4 w-4 text-purple-500" />
                                  <span className="text-xs text-white">Nuevo Computador</span>
                                </Link>
                              </div>
                            )}
                           
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          <div className="relative w-48 h-48">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="rgb(51 65 85)" strokeWidth="8" fill="none" />
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="url(#gradient1)"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${(dashboardData.assignedComputers / dashboardData.totalComputers) * 251.2} 251.2`}
                                strokeLinecap="round"
                              />
                              <defs>
                                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="rgb(34 197 94)" />
                                  <stop offset="100%" stopColor="rgb(16 185 129)" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-slate-100">
                                  {Math.round((dashboardData.assignedComputers / dashboardData.totalComputers) * 100)}%
                                </div>
                                <div className="text-xs text-slate-400">Asignados</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Recent Activity - Horizontal layout */}
                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-700/50 pb-3">
                      <CardTitle className="text-slate-100 text-base flex items-center justify-between">
                        <div className="flex items-center">
                          <Activity className="mr-2 h-4 w-4 text-cyan-500" />
                          Actividad Reciente
                        </div>
                        <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50">
                          {dashboardData.recentActivity.length} Nuevas
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardData.recentActivity.slice(0, 3).map((activity: {
                          id: string | number
                          type: string
                          action: string
                          device: string
                          user: string
                          time: string
                        }) => {
                          const ActivityIcon = getActivityIcon(activity.type)
                          const activityColor = getActivityColor(activity.type)

                          return (
                            <div
                              key={activity.id}
                              className="flex flex-col space-y-2 p-3 bg-slate-800/30 rounded-md border border-slate-700/30"
                            >
                              <div className="flex items-start">
                                <div className={`mt-0.5 p-1 rounded-full bg-slate-800 border border-slate-700`}>
                                  <ActivityIcon className={`h-3 w-3 ${activityColor}`} />
                                </div>
                                <div className="flex-1 min-w-0 ml-2">
                                  <p className="text-xs font-medium text-slate-200">{activity.action}</p>
                                  <p className="text-xs text-slate-400">{activity.device}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">{activity.user}</p>
                                <p className="text-xs text-slate-500">{activity.time}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="departments" className="mt-0">
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-slate-700/50 pb-3">
                    <CardTitle className="text-slate-100 flex items-center">
                      <Building className="mr-2 h-5 w-5 text-cyan-500" /> 
                      Distribución por Departamentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                      {dashboardData.departmentStats.map((dept: any) => (
                        <div key={dept.name} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-300 font-medium">{dept.name}</span>
                            <span className="text-cyan-400 font-mono">{dept.percentage}%</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                              <div 
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full" 
                                style={{ width: `${dept.percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex space-x-4 text-xs text-slate-400">
                              <span>{dept.computers} comp.</span>
                              <span>{dept.users} users</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Time and Additional Info */}
          <div className="col-span-12 lg:col-span-4">
            <div className="space-y-6">
              {/* System Time */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 border-b border-slate-700/50">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1 font-mono">TIEMPO DEL SISTEMA</div>
                      <div className="text-2xl font-mono text-cyan-400 mb-1">{formatTime(currentTime)}</div>
                      <div className="text-sm text-slate-400">{formatDate(currentTime)}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Última Actualización</div>
                        <div className="text-sm font-mono text-slate-200">Hace 2 min</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Estado</div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></div>
                          <div className="text-sm font-mono text-slate-200">Online</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department Stats Summary */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                  <CardTitle className="text-slate-100 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-cyan-500" />
                    Resumen Departamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {dashboardData.departmentStats.slice(0, 3).map((dept: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-slate-200">{dept.name}</h3>
                          <p className="text-xs text-slate-400">
                            {dept.users} usuarios • {dept.computers} computadores
                          </p>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                          {dept.percentage}%
                        </Badge>
                      </div>
                    ))}
                    <Button variant="link" className="text-cyan-400 p-0 text-xs">
                      Ver todos los departamentos →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para las tarjetas de estadísticas
function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  description,
}: {
  title: string
  value: number
  trend: number
  icon: any
  color: string
  description: string
}) {
  const getColorClasses = () => {
    switch (color) {
      case "cyan":
        return "from-cyan-500 to-blue-500 border-cyan-500/30 text-cyan-500"
      case "blue":
        return "from-blue-500 to-indigo-500 border-blue-500/30 text-blue-500"
      case "purple":
        return "from-purple-500 to-pink-500 border-purple-500/30 text-purple-500"
      case "green":
        return "from-green-500 to-emerald-500 border-green-500/30 text-green-500"
      case "amber":
        return "from-amber-500 to-orange-500 border-amber-500/30 text-amber-500"
      default:
        return "from-cyan-500 to-blue-500 border-cyan-500/30 text-cyan-500"
    }
  }

  const colorClasses = getColorClasses()

  return (
    <Card className={`bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden relative`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-slate-400">{title}</div>
          <Icon className={`h-5 w-5 ${colorClasses.split(" ")[2]}`} />
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold text-slate-100">{value.toLocaleString()}</div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">{description}</div>
            <div className={`flex items-center text-xs ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend)}%
            </div>
          </div>
        </div>

        <div
          className={`absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-10 blur-xl ${colorClasses.split(" ")[0]} ${colorClasses.split(" ")[1]}`}
        ></div>
      </CardContent>
    </Card>
  )
}
