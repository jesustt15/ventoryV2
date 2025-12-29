# Usa una imagen base de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias (como usuario root)
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# ----> INICIO DE LA CORRECCIÓN <----
# Cambia la propiedad de TODOS los archivos en /app al usuario 'node'.
# Esto incluye node_modules y el resto de tu código.
RUN chown -R node:node /app
# ----> FIN DE LA CORRECCIÓN <----

# Ahora sí, cambia al usuario no-root
USER node

# Construye la aplicación para producción (ahora 'node' es el propietario y tiene permisos)
RUN npm run build

# Expone el puerto en el que corre la aplicación Next.js
EXPOSE 3000

# Comando para iniciar la aplicación en modo de producción
CMD ["npm", "start"]