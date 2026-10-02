import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware para recibir imágenes en base64
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API para guardar imágenes reales directamente en public/imagenes/
  app.post('/api/save-catalog-image', (req, res) => {
    try {
      const { fileName, base64Data } = req.body;
      if (!fileName || !base64Data) {
        return res.status(400).json({ error: 'Faltan parámetros fileName o base64Data' });
      }

      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const targetDir = path.join(__dirname, 'public', 'imagenes');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = path.join(targetDir, fileName);
      fs.writeFileSync(targetPath, buffer);
      console.log(`[Upload] Imagen guardada en disco: ${targetPath}`);

      // Auto-eliminar fondo blanco para dejar la paleta transparente sobre el azul
      if (!fileName.includes('logo')) {
        try {
          const tmp = `${targetPath}.tmp.png`;
          execSync(`convert "${targetPath}" -bordercolor white -border 1x1 -alpha set -channel RGBA -fuzz 10% -fill none -floodfill +0+0 white -shave 1x1 -trim +repage "${tmp}" && mv "${tmp}" "${targetPath}"`);
        } catch (e) {
          console.warn('Auto transparency skipped:', e);
        }
      }

      // Guardar alias automáticos para evitar errores por tildes o z/s
      if (fileName.includes('crema-frambue')) {
        fs.writeFileSync(path.join(targetDir, 'crema-frambuesa.png'), buffer);
        fs.writeFileSync(path.join(targetDir, 'crema-frambueza.png'), buffer);
      }
      if (fileName.includes('paleta-cassat')) {
        fs.writeFileSync(path.join(targetDir, 'paleta-cassata.png'), buffer);
        fs.writeFileSync(path.join(targetDir, 'paleta-cassatta.png'), buffer);
      }
      if (fileName.includes('colo-colo')) {
        fs.writeFileSync(path.join(targetDir, 'colo-colo-pina.png'), buffer);
        fs.writeFileSync(path.join(targetDir, 'colo-colo-piña.png'), buffer);
      }
      if (fileName.includes('2-palos') || fileName.includes('dos-palos')) {
        fs.writeFileSync(path.join(targetDir, '2-palos-frambuesa.png'), buffer);
        fs.writeFileSync(path.join(targetDir, 'dos-palos-frambuesa.png'), buffer);
      }
      if (fileName.includes('logo_joly') || fileName.includes('logo-joly')) {
        fs.writeFileSync(path.join(targetDir, 'logo_joly_recortado.png'), buffer);
        fs.writeFileSync(path.join(targetDir, 'logo_joly.png'), buffer);
        fs.writeFileSync(path.join(__dirname, 'public', 'logo_joly_recortado.png'), buffer);
      }

      return res.json({
        success: true,
        fileName,
        path: `/imagenes/${fileName}`,
        bytes: buffer.length
      });
    } catch (err: any) {
      console.error('[Upload Error]', err);
      return res.status(500).json({ error: err.message || 'Error guardando archivo' });
    }
  });

  // Servir archivos estáticos de public e imágenes
  app.use('/imagenes', express.static(path.join(__dirname, 'public', 'imagenes')));
  app.use(express.static(path.join(__dirname, 'public')));

  // Montar Vite middlewares en desarrollo
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Servidor Panda Helados listo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
