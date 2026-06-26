# Pasarela de Pagos

Servicio encargado de transferencias entre usuarios, cambio de moneda
(compra/venta de USD) y pago de servicios.

Este servicio **no tiene acceso directo a la base de datos**.
Toda consulta o modificación de saldo se hace a través del Proxy,
que a su vez habla con el Backend.

## Variables de entorno (.env)

- PORT: puerto en el que corre este servicio
- PROXY_URL: URL del Proxy
- EXTERNAL_DOLAR_API: API externa de cotización del dólar
- EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS: configuración SMTP (Mailtrap)

## Endpoints

### POST /api/operaciones/transferir
Inicia una transferencia entre usuarios. Genera un código de
confirmación de 6 dígitos y lo envía por mail.

**Body:**
```json
{
  "usuario_origen_id": "string",
  "destino_cvu": "string",
  "monto": "number",
  "moneda": "ARS | USD",
  "email_origen": "string"
}
```
**Respuesta exitosa:**
```json
{ "status": "pending_confirmation" }
```

### POST /api/operaciones/confirmar-transferencia
Confirma una transferencia pendiente usando el código recibido por mail.
Si la operación falla en el medio, se revierte automáticamente.

**Body:**
```json
{ "codigo": "string" }
```
**Respuesta exitosa:**
```json
{ "status": "success" }
```

### POST /api/operaciones/cambio
Compra o venta de dólares. Vuelve a consultar la cotización oficial
en el servidor (no confía en el precio enviado por el Frontend).

**Body:**
```json
{
  "usuario_id": "string",
  "tipo": "compra | venta",
  "monto_usd": "number"
}
```
**Respuesta exitosa (compra):**
```json
{
  "status": "success",
  "operacion": "compra",
  "monto_usd": 10,
  "costo_ars": 12200,
  "cotizacion_usada": 1220
}
```

### POST /api/operaciones/pagar
Pago de un servicio (luz, gas, etc.). Descuenta el monto de la
cuenta en pesos del usuario.

**Body:**
```json
{
  "usuario_id": "string",
  "servicio": "string",
  "monto": "number"
}
```
**Respuesta exitosa:**
```json
{
  "status": "pagado",
  "comprobante": {
    "servicio": "Luz",
    "monto": 1500,
    "fecha": "2026-06-26T..."
  }
}
```

## Comunicación interna con el Proxy

Este servicio nunca habla directo con el Backend. Usa estas rutas
internas a través del Proxy:

- `GET {PROXY_URL}/api/interno/saldo/:usuario_id` → consulta de saldo
- `POST {PROXY_URL}/api/interno/actualizar-saldo` → resta/suma saldo
  - Body: `{ "usuario_id": "string", "moneda": "ARS|USD", "monto": "number" }`
  - `monto` negativo resta, positivo suma.