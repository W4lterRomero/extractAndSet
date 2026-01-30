# Video Webhook App

Aplicación web para enviar URLs de video a workflows de n8n.

## 🚀 Despliegue Rápido (Easypanel)

1. Crea un nuevo servicio en Easypanel
2. Conecta este repositorio o sube la carpeta
3. Configura las variables de entorno:

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `WEBHOOK_URL` | URL del webhook de n8n | ✅ |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos | ❌ |

4. Deploy! 🎉

## 🐳 Docker Local

```bash
# Build
docker build -t video-webhook-app .

# Run
docker run -d -p 3000:3000 \
  -e WEBHOOK_URL=https://tu-n8n.com/webhook/xxx \
  --name video-webhook \
  video-webhook-app
```

## 🔒 Seguridad

- ✅ Helmet.js (headers de seguridad)
- ✅ Rate limiting (100 req/15min)
- ✅ CORS configurable
- ✅ Validación de URLs
- ✅ Usuario non-root en Docker

## 📁 Estructura

```
video-webhook-app/
├── server.js         # Express backend
├── public/
│   ├── index.html    # UI principal
│   ├── styles.css    # Estilos dark premium
│   └── app.js        # Lógica del frontend
├── Dockerfile
└── docker-compose.yml
```
