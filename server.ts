import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
