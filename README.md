# foodc-cliente

PWA del comensal para FoodC: menú, carrito y envío de pedidos desde el celular, usando el código QR de cada mesa. Sitio estático puro (sin framework, sin bundler), publicado por GitHub Pages.

El backend (Google Apps Script) vive en el repositorio privado [`MelvinRamirez/FoodC`](https://github.com/MelvinRamirez/FoodC). Este repositorio no duplica ningún archivo de ese backend; solo consume sus endpoints HTTP documentados en `openspec/specs/{menu-api,order-api,api-transport}/spec.md` de ese repo.

## Desarrollo local

Requiere Node.js >= 22.

```bash
npm test
```

Para emular el sub-path de GitHub Pages en desarrollo local:

```bash
# desde el directorio padre de foodc-cliente
python3 -m http.server 8000
# abrir http://localhost:8000/foodc-cliente/?table=05
```

## Tailwind CSS

El CSS se genera una vez con el CLI standalone de Tailwind v4 y se commitea (no hay build en el deploy). Binario fijado para este proyecto:

- Versión: **v4.3.3**
- Binario: `tailwindcss-macos-x64` (ajustar a la arquitectura de quien regenere el CSS)
- Descarga:

```bash
mkdir -p bin
curl -sSLo bin/tailwindcss https://github.com/tailwindlabs/tailwindcss/releases/download/v4.3.3/tailwindcss-macos-x64
chmod +x bin/tailwindcss
```

Regenerar el CSS tras cambiar clases en `index.html` o `js/`:

```bash
npm run build:css
```

## Deploy

Resumen de despliegue y procedimiento de bump de caché: pendiente de completar en la unidad de trabajo 3 (shell instalable, service worker y publicación en GitHub Pages).
