import { showToast } from "nextjs-toast-notify";
import QRCode from 'qrcode';

/**
 * Genera un código QR que contiene el serial y el modelo de un equipo y lo descarga.
 * @param {object} params - Los parámetros para generar el QR.
 * @param {string} params.equipoId - El ID del equipo, usado para el nombre del archivo.
 * @param {string} params.serial - El número de serial del equipo.
 * @param {string} params.modelo - El modelo del equipo.
 * @param {string} params.nsap - El numero a fijodel equipo.
 */
export const handleGenerateAndDownloadQR = async ({ equipoId, serial, modelo, nsap }: { equipoId: string, serial: string, modelo: string, nsap: string }) => {
  // 1. Combina el serial y el modelo en un solo string.
  // Puedes usar el formato que prefieras. Un JSON o un texto simple funcionan bien.
  const qrContent = `Serial: ${serial}\nModelo: ${modelo}\nN° AF: ${nsap}`;

  try {
    // 2. Genera el QR a partir del string con los datos del equipo.
    const qrCodeDataURL = await QRCode.toDataURL(qrContent, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H' // Alta corrección de errores para mayor fiabilidad
    });

    // 3. Crea un enlace <a> en memoria para iniciar la descarga.
    const downloadLink = document.createElement('a');
    downloadLink.href = qrCodeDataURL;
    
    // 4. Define el nombre del archivo que se descargará.
    downloadLink.download = `QR_Equipo_${serial}.png`; // Usar el serial en el nombre es más descriptivo

    // 5. Simula un clic en el enlace para abrir el diálogo de descarga.
    document.body.appendChild(downloadLink); // Necesario para Firefox
    downloadLink.click();
    document.body.removeChild(downloadLink); // Limpia el DOM

    showToast.success("Código QR generado y listo para descargar.");

  } catch (err) {
    console.error('Error al generar el código QR:', err);
    showToast.error("No se pudo generar el código QR.");
  }
}