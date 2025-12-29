export const formatDate = (dateInput: any) => {
  let date: Date;

  // Si no hay fecha, retorna un fallback
  if (!dateInput) {
    return "Fecha no disponible";
  }

  // Caso 1: Ya es un string (como en AsignacionesTable)
  if (typeof dateInput === "string") {
    date = new Date(dateInput);
  }
  // Caso 2: Es un objeto Timestamp (como de Firebase)
  // Comprobamos si tiene un método .toDate()
  else if (typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  }
  // Caso 3: Ya es un objeto Date
  else if (dateInput instanceof Date) {
    date = dateInput;
  }
  // Si no es nada de lo anterior, es inválido
  else {
    console.error("Formato de fecha no reconocido:", dateInput);
    return "Fecha Inválida";
  }

  // Comprobación final por si el string original era inválido
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  // Si todo salió bien, la formateamos
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};