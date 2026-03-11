// Script para reemplazar colores fijos por variables de tema en el dashboard
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src/app/(app)/dashboard/page.tsx');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// Mapeo de reemplazos
const replacements = [
  // Fondo y bordes
  { from: 'bg-slate-900/50', to: 'bg-card' },
  { from: 'bg-slate-900', to: 'bg-card' },
  { from: 'bg-slate-800/50', to: 'bg-muted' },
  { from: 'bg-slate-800', to: 'bg-muted' },
  { from: 'bg-slate-700/50', to: 'bg-muted/50' },
  { from: 'bg-slate-700', to: 'bg-muted' },
  { from: 'border-slate-700/50', to: 'border-border/50' },
  { from: 'border-slate-700', to: 'border-border' },
  
  // Textos
  { from: 'text-slate-100', to: 'text-card-foreground' },
  { from: 'text-slate-200', to: 'text-foreground' },
  { from: 'text-slate-300', to: 'text-foreground/80' },
  { from: 'text-slate-400', to: 'text-muted-foreground' },
  { from: 'text-slate-500', to: 'text-muted-foreground/80' },
  
  // Colores específicos (mantener algunos para contraste)
  { from: 'text-cyan-500', to: 'text-primary' },
  { from: 'text-cyan-400', to: 'text-primary' },
  { from: 'text-green-400', to: 'text-green-500' },
  { from: 'text-amber-400', to: 'text-amber-500' },
  { from: 'text-purple-400', to: 'text-purple-500' },
  { from: 'text-red-400', to: 'text-red-500' },
  
  // Gradientes
  { from: 'from-slate-800', to: 'from-muted' },
  { from: 'to-slate-900', to: 'to-card' },
];

// Aplicar reemplazos
replacements.forEach(({ from, to }) => {
  const regex = new RegExp(from, 'g');
  content = content.replace(regex, to);
});

// Escribir el archivo corregido
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Colores del dashboard actualizados para soportar tema claro/oscuro');
console.log('Cambios aplicados:');
replacements.forEach(({ from, to }) => {
  console.log(`  ${from} → ${to}`);
});