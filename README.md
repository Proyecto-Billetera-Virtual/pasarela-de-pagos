# Pasarela de Pagos

## Requisitos

- **Docker** y **Docker Compose** instalados.

### Instalar Docker

| Sistema | Comando / instrucción |
|---|---|
| **Linux (Debian/Ubuntu)** | `sudo apt install docker.io docker-compose-v2 && sudo systemctl enable --now docker` |
| **Linux (Arch)** | `sudo pacman -S docker docker-compose` |
| **macOS** | Descargar e instalar [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **Windows** | Descargar e instalar [Docker Desktop](https://www.docker.com/products/docker-desktop/) |

Verificar con `docker --version`.

## Docker

### Construir
```bash
docker build -t billetera-pasarela .
```

### Ejecutar
```bash
docker rm -f pasarela 2>/dev/null
docker run -d --name pasarela \
  -e PROXY_URL=http://IP_DEL_PROXY:8080 \
  -e EMAIL_HOST=smtp.gmail.com \
  -e EMAIL_PORT=587 \
  -e "EMAIL_USER=TU_EMAIL" \
  -e "EMAIL_PASS=TU_PASSWORD" \
  -p 6000:6000 \
  billetera-pasarela
```

Reemplazar `IP_DEL_PROXY` por la IP donde corre el proxy, y `TU_EMAIL`/`TU_PASSWORD` por credenciales SMTP reales. Crear un archivo `.env` a partir de `.env.example` para no exponer datos sensibles.

Para probar todo local, usá `./start.sh` en la raíz del proyecto.

### Variables de entorno
| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor | `6000` |
| `PROXY_URL` | URL del proxy | `http://localhost:8080` |
| `EXTERNAL_DOLAR_API` | API de cotización del dólar | `https://dolarapi.com/v1/dolares/oficial` |
| `EMAIL_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `EMAIL_PORT` | Puerto SMTP | `587` |
| `EMAIL_USER` | Usuario SMTP | *(obligatorio)* |
| `EMAIL_PASS` | Contraseña SMTP | *(obligatorio)* |
