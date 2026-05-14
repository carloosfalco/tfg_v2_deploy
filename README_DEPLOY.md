# TFG Decarb Tool - Deploy

Proyecto limpio y separado para desplegar la app sin afectar a la copia local de desarrollo.

## Estructura

- `backend/`: API FastAPI para calculos, factores y Gemini.
- `frontend/`: app React/Vite.

## Backend en Render

1. Crea un Web Service desde este repositorio.
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Variables de entorno:
   - `GEMINI_API_KEY`: tu clave de Gemini
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `BACKEND_CORS_ORIGINS`: URL final del frontend, por ejemplo `https://tu-app.vercel.app`

Tambien puedes usar el `render.yaml` de la raiz como blueprint.

## Frontend en Vercel

1. Crea un proyecto en Vercel apuntando a `frontend`.
2. Framework preset: Vite.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Variable de entorno:
   - `VITE_API_BASE_URL`: URL del backend Render, por ejemplo `https://tfg-decarb-backend.onrender.com`

## Importante

No subas `.env` reales al repositorio. La API key de Gemini debe vivir solo en las variables de entorno del proveedor.
