# Hoja de Ruta: Despliegue en Entorno Web Seguro

Esta directriz conforma la **Fase 5 de Calidad y Despliegue**. Define los pasos que el administrador de sistemas de JOR Ingenieros debe ejecutar tras validar la arquitectura en `localhost` local.

## 1. Migración del Entorno
Actualmente el Frontend corre leyendo archivos en plano (`file:///`) o mediante un live-server pequeño, y tu GeoServer reside en `http://localhost:8080/geoserver/`.
Al pasar a un Servidor Privado Virtual (VPS) (Ej. AWS EC2, DigitalOcean o Azure):

1. Instalar **PostgreSQL 15+ y PostGIS 3+** en el servidor de Producción. Ejecutar el script `01_schema_predios.sql` que construimos.
2. Levantar el tomcat con **GeoServer 2.23+**. 
3. Re-conectar el Data Store de GeoServer a esta nueva Base de Datos.

## 2. Puesta en Producción (Frontend)
Debes copiar toda la carpeta `/portal/` construida a tu directorio público del servidor.
- Directorio típico Linux Nginx: `/var/www/geoportal/portal/`

## 3. Protocolos de Seguridad (Ley 1192 Sensibilidad de Información)
Por la naturaleza confidencial de las tasaciones y geometrías, **nunca** debes exponer Tomcat (Puerto 8080) directamente al exterior.

- **Paso Obligatorio:** Hemos adjuntado el archivo de configuración `nginx_geoportal.conf`. Instala el demonio **NGINX** e inicializa este archivo en `/etc/nginx/sites-available/`.
- **Efecto:** NGINX actuará como Proxy Inverso. Encriptará las comunicaciones del cliente en HTTPS (Evitando rastreo SSL/Migración insegura) y atrapará todas las consultas del mapa, redirigiéndolas al GeoServer interno bloqueando intromisiones (`WFS-T`).
- Actualiza manualmente el archivo `portal/js/map.js`, cambiando la línea `http://localhost:8080/geoserver/portal_jor/wms` por: `https://geoportal.joringenieros.com/geoserver/portal_jor/wms`.

## 4. Performance: Mosaicos GWC
Al momento de escalar el geoportal a más de 5,000 predios:
1. Ir al panel admin de GeoServer -> "Caching Defaults".
2. Habilitar la creación directa de GeoWebCache para la capa `portal_jor:predios`.
3. Esto aliviará en un 95% el consumo de CPU de tu base PostgreSQL al leer la vista gráfica desde el mapa.
