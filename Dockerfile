# Usamos una versión ligera de Node
FROM node:20-alpine

# Directorio de trabajo principal dentro del contenedor
WORKDIR /app

# 1. Instalar dependencias del BACKEND
COPY package*.json ./
RUN npm install

# 2. Instalar dependencias del FRONTEND
# Copiamos solo los archivos de dependencias del cliente primero para aprovechar el caché
COPY client/package*.json ./client/
RUN cd client && npm install

# 3. Copiar el resto del código de la aplicación (incluyendo .env y certificado)
COPY . .

# 4. Construir la versión de producción del cliente
RUN cd client && npm run build

# 5. Exponer el puerto interno (Asegúrate de que coincida con el puerto de tu server.js)
EXPOSE 4000

# 6. El comando para encender la app
CMD ["node", "server.js"]