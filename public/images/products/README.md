# Carpeta de Imágenes Oficiales de Productos (Vite + Vercel)

Esta carpeta (`public/images/products/`) es la ubicación estándar recomendada para almacenar las imágenes de tus productos cuando despliegas en Vercel.

## ¿Cómo funciona en Vercel?
- Todo archivo colocado dentro de `public/` es servido automáticamente por Vite y Vercel en la raíz del dominio (`/`).
- Por ejemplo, el archivo `public/images/products/cono-doble.jpg` se accede directamente en el navegador y en el código como:
  `/images/products/cono-doble.jpg`

## Ventajas sobre Base64:
1. **Rendimiento ultra rápido**: No infla el bundle JavaScript (Base64 agranda los archivos un 33%).
2. **Caché CDN de Vercel**: Las imágenes se almacenan en el Edge de Vercel y cargan al instante para tus clientes.
3. **Mantenimiento limpio**: Para cambiar una foto, solo reemplazas el archivo con el mismo nombre, sin tocar una sola línea de código.

## Nombres de archivo configurados en el catálogo:
- `cassata-clasica.jpg` (Cassata Siciliana - Activa)
- `cassata-napolitana.jpg` (Cassata Napolitana - Activa)
- `cassata-frutos-del-bosque.jpg` (Cassata Frutos del Bosque - Activa)
- `cono-artesanal.jpg` (Helado Individual - Esperando foto oficial)
- `tarrina-mediana.jpg` (Helado Individual - Esperando foto oficial)
- `paleta-artesanal.jpg` (Helado Individual - Esperando foto oficial)
- `copa-tulipan-especial.jpg` (Especialidad - Esperando foto oficial)
- `banana-split-deluxe.jpg` (Especialidad - Esperando foto oficial)
- `affogato-italiano.jpg` (Especialidad - Esperando foto oficial)
- `waffle-con-helado.jpg` (Especialidad - Esperando foto oficial)
- `milkshake-supremo.jpg` (Especialidad - Esperando foto oficial)
