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

      // Auto-eliminar fondo blanco para dejar la paleta transparente sobre el azul (NO en cassatas ni logos para proteger el helado blanco)
      if (!fileName.includes('logo') && !fileName.includes('cassata')) {
        try {
          const tmp = `${targetPath}.tmp.png`;
          execSync(`convert "${targetPath}" -bordercolor white -border 1x1 -alpha set -channel RGBA -fuzz 10% -fill none -floodfill +0+0 white -shave 1x1 -trim +repage "${tmp}" && mv "${tmp}" "${targetPath}"`);
        } catch (e) {
          console.warn('Auto transparency skipped:', e);
        }
      }

      // Replicar automáticamente en dist/imagenes si existe
      const distDir = path.join(__dirname, 'dist', 'imagenes');
      if (fs.existsSync(distDir)) {
        try {
          fs.copyFileSync(targetPath, path.join(distDir, fileName));
        } catch (e) {}
      }

      // Replicar cassatas que sirven para 1L y 1.8L
      if (fileName.includes('cassata-pina') || fileName.includes('cassata-piña')) {
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-pina.png'));
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-piña.png'));
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-1-8l-pina.png'));
        if (fs.existsSync(distDir)) {
          fs.copyFileSync(targetPath, path.join(distDir, 'cassata-pina.png'));
          fs.copyFileSync(targetPath, path.join(distDir, 'cassata-piña.png'));
          fs.copyFileSync(targetPath, path.join(distDir, 'cassata-1-8l-pina.png'));
        }
      }
      if (fileName.includes('cassata-tradicional') || fileName.includes('cassata-1-8l-cassata')) {
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-tradicional.png'));
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-1-8l-cassata.png'));
        if (fs.existsSync(distDir)) {
          fs.copyFileSync(targetPath, path.join(distDir, 'cassata-tradicional.png'));
          fs.copyFileSync(targetPath, path.join(distDir, 'cassata-1-8l-cassata.png'));
        }
      }
      if (fileName.includes('cassata-trisabor')) {
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-trisabor.png'));
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-1-8l-trisabor.png'));
        if (fs.existsSync(distDir)) {
          fs.copyFileSync(targetPath, path.join(distDir, 'cassata-trisabor.png'));
          fs.copyFileSync(targetPath, path.join(distDir, 'cassata-1-8l-trisabor.png'));
        }
      }
      if (fileName.includes('choco-menta') || fileName.includes('menta-chip') || fileName.includes('menta-chips')) {
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-1-8l-choco-menta-3leches.png'));
        if (fs.existsSync(distDir)) {
          fs.copyFileSync(targetPath, path.join(distDir, 'cassata-1-8l-choco-menta-3leches.png'));
        }
      }
      if (fileName.includes('cassata-crema-frambue')) {
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-crema-frambuesa.png'));
        fs.copyFileSync(targetPath, path.join(targetDir, 'cassata-crema-frambueza.png'));
        if (fs.existsSync(distDir)) {
          fs.copyFileSync(targetPath, path.join(distDir, 'cassata-crema-frambuesa.png'));
        }
      }

      // Si es una cassata, sincronizar también src/assets/cassataImages.ts para que Vercel la incruste directamente
      if (fileName.includes('cassata') || fileName.includes('menta')) {
        try {
          const b64DataUrl = `data:image/png;base64,${cleanBase64}`;
          const cassataFile = path.join(__dirname, 'src', 'assets', 'cassataImages.ts');
          if (fs.existsSync(cassataFile)) {
            let content = fs.readFileSync(cassataFile, 'utf-8');
            if (fileName.includes('pina') || fileName.includes('piña')) {
              content = content.replace(/const IMG_PINA = ".*?";/, `const IMG_PINA = "${b64DataUrl}";`);
            } else if (fileName.includes('tradicional') || fileName.includes('1-8l-cassata')) {
              content = content.replace(/const IMG_TRADICIONAL = ".*?";/, `const IMG_TRADICIONAL = "${b64DataUrl}";`);
            } else if (fileName.includes('trisabor')) {
              content = content.replace(/const IMG_TRISABOR = ".*?";/, `const IMG_TRISABOR = "${b64DataUrl}";`);
            } else if (fileName.includes('choco-menta') || fileName.includes('menta')) {
              content = content.replace(/const IMG_CHOCO_MENTA = ".*?";/, `const IMG_CHOCO_MENTA = "${b64DataUrl}";`);
            } else if (fileName.includes('crema-frambue')) {
              content = content.replace(/const IMG_CREMA_FRAMBUESA = ".*?";/, `const IMG_CREMA_FRAMBUESA = "${b64DataUrl}";`);
            } else if (fileName.includes('frutos-del-bosque')) {
              content = content.replace(/const IMG_FRUTOS_BOSQUE = ".*?";/, `const IMG_FRUTOS_BOSQUE = "${b64DataUrl}";`);
            } else if (fileName.includes('chirimoya')) {
              content = content.replace(/const IMG_CHIRIMOYA = ".*?";/, `const IMG_CHIRIMOYA = "${b64DataUrl}";`);
            }
            fs.writeFileSync(cassataFile, content);
          }
        } catch (e) {
          console.warn('Could not update cassataImages.ts:', e);
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
