import { getFormattedSchema } from "@/utils/getSchema";
import Groq from "groq-sdk";
import { PrismaClient, Prisma } from "@prisma/client"; // Importa Prisma
import { NextResponse } from "next/server";

// 1. Usar tu cliente de Prisma existente (Singleton pattern recomendado)
const prisma = new PrismaClient();

// 2. Configurar Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});



export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    // PASO A: Obtener esquema dinámico desde Prisma
    const dbSchema = getFormattedSchema();

    // PASO B: Generar SQL
    const sqlPrompt = `
      Eres un experto en SQL para PostgreSQL.
      Esquema de la base de datos:
      ${dbSchema}
      
      Pregunta: "${question}"
      
      Reglas:
      1. Genera SOLO código SQL.
      2. Nombres de tablas y columnas deben coincidir exactamente con el esquema (ojo con mayúsculas/minúsculas de Prisma).1. Genera SOLO el código SQL puro (sin bloques de código markdown).
      3. Usa "comillas dobles" para TODOS los nombres de tablas y columnas para respetar la case-sensitivity de Prisma.ejemplo:
         - Tabla: "Computador", "ModeloDispositivo"
         - Columna: "modeloId", "serial", "tipo"
      4. Para comparaciones de texto, usa el operador ILIKE para evitar errores de mayúsculas/minúsculas en los valores (ej: "tipo" ILIKE 'desktop').
      5. No inventes columnas que no existen en el esquema.
      6. CRÍTICO: Nunca uses los nombres de las relaciones (ej: "modelo", "usuario", "departamento") en las cláusulas WHERE o JOIN. 
         Usa SIEMPRE la clave foránea correspondiente que termina en "Id" (ej: usa "modeloId" en vez de "modelo", "usuarioId" en vez de "usuario").
      7. Solo SELECT.
    `;

    const sqlCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: sqlPrompt },
        { role: "user", content: question },
      ],
      model: "llama-3.3-70b-versatile", // Modelo muy potente y gratis en Groq
      temperature: 0, // Importante: 0 para máxima precisión en código
    });
    let textSQL = sqlCompletion.choices[0]?.message?.content || "";
    
    // Limpieza extra por si el modelo es "charlatan" y pone markdown
    textSQL = textSQL.replace(/```sql/g, "").replace(/```/g, "").trim();

    console.log("SQL Generado por Groq:", textSQL);
    const data = await prisma.$queryRawUnsafe(textSQL);  



    // PASO D: Humanizar respuesta
    const systemPromptHuman = `
      Actúa como un asistente amable. Tienes estos datos obtenidos de la BD:
      ${JSON.stringify(data, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
      )}
      
      La pregunta original fue: "${question}"
      
      Responde de forma natural y breve en español.
    `;

    const humanCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPromptHuman },
        { role: "user", content: "Genera la respuesta." },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6, // Un poco más creativo para hablar
    });

    const humanAnswer = humanCompletion.choices[0]?.message?.content;

    return NextResponse.json({ answer: humanAnswer, sql: textSQL });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error procesando solicitud" }, { status: 500 });
  }
}
