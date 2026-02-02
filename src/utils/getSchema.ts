import { Prisma } from "@prisma/client";

export function getFormattedSchema() {
  // Accedemos a los modelos definidos en Prisma
  const models = Prisma.dmmf.datamodel.models;

  // Convertimos el objeto JSON complejo en un string simple para la IA
  const schemaDescription = models.map((model) => {
    const fields = model.fields
      .map((field: { name: any; type: any; isRequired: any; }) => {
        // Ejemplo: "- id (Int)" o "- email (String)"
        return `- ${field.name} (${field.type}${field.isRequired ? "" : ", opcional"})`;
      })
      .join("\n      ");

    return `Tabla: ${model.name}\n      Campos:\n      ${fields}`;
  }).join("\n\n");

  return schemaDescription;
}