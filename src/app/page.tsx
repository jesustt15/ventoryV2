'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowRight, Cpu, Eye, EyeOff, Lock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingLogin } from '@/utils/LoadingLogin';



type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  update: () => void;
  draw: (context: CanvasRenderingContext2D, allParticles: Particle[]) => void;
};


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();


   useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    // Nos aseguramos que el canvas y el contexto existan antes de continuar
    if (!canvas || !ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = 150;

    class ParticleImpl implements Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.opacity = Math.random() * 0.5 + 0.2;

        const colors = [
          `rgba(6, 182, 212, ${this.opacity})`,   // cyan
          `rgba(59, 130, 246, ${this.opacity})`,  // blue
          `rgba(147, 51, 234, ${this.opacity})`, // purple
          `rgba(16, 185, 129, ${this.opacity})`,  // emerald
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > (canvas?.width ?? 0)) this.x = 0;
        if (this.x < 0) this.x = canvas?.width ?? 0;
        if (this.y > (canvas?.height ?? 0)) this.y = 0;
        if (this.y < 0) this.y = canvas?.height ?? 0;
      }

      draw(context: CanvasRenderingContext2D, allParticles: Particle[]) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();

        allParticles.forEach((particle) => {
          const dx = this.x - particle.x;
          const dy = this.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            context.strokeStyle = `rgba(6, 182, 212, ${0.1 * (1 - distance / 100)})`;
            context.lineWidth = 0.5;
            context.beginPath();
            context.moveTo(this.x, this.y);
            context.lineTo(particle.x, particle.y);
            context.stroke();
          }
        });
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new ParticleImpl());
    }

    let animationFrameId: number;
    function animate() {
      if (!canvas) return;
      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.update();
        particle.draw(ctx!, particles);
      }

      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId); // Limpiamos la animación
    };
  }, []);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // Redirección al dashboard si el login es exitoso
        window.location.href = '/dashboard'; 
        router.refresh(); // Refresca la página para que el middleware actúe
      } else {
        const data = await res.json();
        setError(data.message || 'Error al iniciar sesión.');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background particle effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />

      {/* Geometric background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            VENTORY
          </CardTitle>
          <p className="text-slate-400 text-sm mt-2">Sistema de Inventario de Equipos</p>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300 text-sm font-medium">
                Nombre de Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Ingrese su usuario"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
             {error && (
              <div className="flex items-center p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/50 rounded-md">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Iniciar Sesión
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <div className="text-center">
              <p className="text-xs text-slate-500">Sistema seguro de autenticación</p>
              <div className="flex items-center justify-center mt-2 space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">Conexión segura</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading overlay */}
      {isLoading && (
          <LoadingLogin  message='AUTENTICANDO...' />
      )}

      {/* Floating elements */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-cyan-500/20 rounded-full animate-bounce delay-0"></div>
      <div className="absolute top-20 right-20 w-3 h-3 bg-blue-500/20 rounded-full animate-bounce delay-300"></div>
      <div className="absolute bottom-20 left-20 w-5 h-5 bg-purple-500/20 rounded-full animate-bounce delay-700"></div>
      <div className="absolute bottom-10 right-10 w-2 h-2 bg-emerald-500/20 rounded-full animate-bounce delay-1000"></div>
    </div>
  )
}


