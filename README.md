# 🤖 WhatsApp Bot Base — Multidevice

Bot de WhatsApp multidevice con Baileys, conexión QR, sistema de comandos modular y sin depender de ninguna plataforma específica.

## ⚡ Requisitos

- Node.js 18 o superior
- npm o pnpm

## 🚀 Instalación

```bash
cd whatsapp-bot
npm install
```

## ▶️ Uso

```bash
npm start
```

Al iniciar, verás el QR en la terminal. Escanéalo desde WhatsApp:
> **WhatsApp → Dispositivos vinculados → Vincular dispositivo**

La sesión se guarda en la carpeta `session/`. La próxima vez que inicies, no pedirá QR.

## ⚙️ Configuración

Edita `src/lib/config.js`:

```js
export const BOT_CONFIG = {
    name: 'MiBot',        // Nombre del bot
    prefix: '!',          // Prefijo de comandos
    owner: ['521XXXXXXXXXX@s.whatsapp.net'],  // Tu número
    selfReply: false,     // true = el bot responde sus propios mensajes
    showNotFound: true,   // true = avisa cuando el comando no existe
    logLevel: 'silent',   // 'silent' | 'info' | 'debug'
    version: '1.0.0'
};
```

## 📋 Comandos incluidos

### ⚙️ Básicos
| Comando | Alias | Descripción |
|---------|-------|-------------|
| `!ping` | `!p` | Latencia del bot |
| `!help` | `!menu`, `!ayuda` | Menú de comandos |
| `!info` | `!about` | Información del bot |
| `!uptime` | `!ut` | Tiempo activo |

### 🎮 Diversión
| Comando | Alias | Descripción |
|---------|-------|-------------|
| `!8ball` | `!bola8` | Bola mágica |
| `!chiste` | `!joke` | Chiste aleatorio |
| `!verdad` | `!truth` | Pregunta verdad |
| `!reto` | `!dare` | Reto aleatorio |
| `!dado` | `!roll` | Lanza un dado |
| `!moneda` | `!flip` | Cara o cruz |
| `!elige` | `!choose` | Elige entre opciones |

### 🛠️ Utilidades
| Comando | Alias | Descripción |
|---------|-------|-------------|
| `!clima [ciudad]` | `!weather` | Clima de una ciudad |
| `!calcular [op]` | `!calc` | Calculadora |
| `!traducir [lang] [texto]` | `!trad` | Traducir texto |
| `!perfil` | `!yo` | Tu perfil de WA |
| `!sticker` | `!s` | Convertir imagen a sticker |

### 👥 Grupo (solo en grupos)
| Comando | Alias | Descripción |
|---------|-------|-------------|
| `!todos [msg]` | `!all` | Mencionar a todos |
| `!infogrupo` | `!ginfo` | Info del grupo |
| `!link` | `!invitar` | Link de invitación |
| `!admins` | `!admin` | Lista de admins |

## ➕ Agregar comandos

Crea un archivo en `src/commands/`, por ejemplo `src/commands/mimodulo.js`:

```js
export default [
    {
        name: 'saludar',
        aliases: ['hola', 'hi'],
        description: 'Saluda al usuario',
        category: 'mimodulo',
        // groupOnly: true,    // Solo en grupos
        // privateOnly: true,  // Solo en privado
        async run({ sock, msg, jid, pushName, args }) {
            await sock.sendMessage(jid, {
                text: `¡Hola, ${pushName}! 👋`
            }, { quoted: msg });
        }
    }
];
```

El cargador detecta automáticamente cualquier `.js` en `src/commands/`.

## 📁 Estructura

```
whatsapp-bot/
├── src/
│   ├── index.js          # Punto de entrada
│   ├── connection.js     # Conexión Baileys + QR
│   ├── handler.js        # Manejo de mensajes
│   ├── lib/
│   │   ├── config.js     # Configuración
│   │   ├── utils.js      # Utilidades
│   │   └── banner.js     # Banner de inicio
│   └── commands/
│       ├── index.js      # Cargador de comandos
│       ├── basicos.js    # ping, help, info, uptime
│       ├── diversion.js  # 8ball, chiste, dado, etc.
│       ├── utilidades.js # clima, calc, traducir, etc.
│       └── grupo.js      # todos, infogrupo, link, admins
├── session/              # Sesión guardada (auto-generada)
├── package.json
└── .gitignore
```

## 🔄 Reconexión automática

El bot se reconecta solo ante desconexiones. Si la sesión se invalida, borra la carpeta `session/` y vuelve a iniciar para escanear el QR.

## 📌 Notas

- Compatible con cualquier VPS, servidor o PC con Node.js 18+
- No requiere configuración adicional de Replit u otras plataformas
- Multidevice real usando la API oficial de Baileys
