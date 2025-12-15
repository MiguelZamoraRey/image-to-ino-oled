# 🖼️ Conversor de Imágenes para Arduino OLED

Script Node.js para convertir imágenes a formato PROGMEM compatible con Arduino y pantallas OLED.

## 📋 Requisitos

- Node.js instalado (versión 14 o superior)
- npm (viene con Node.js)

## 🚀 Instalación

1. Abre una terminal en esta carpeta
2. Instala las dependencias:

```bash
npm install
```

## 💻 Uso

### Sintaxis básica

```bash
node image-to-arduino.js <carpeta_imagenes> [ancho] [alto] [archivo_salida]
```

### Ejemplos

```bash
# Convertir imágenes de la carpeta 'img' (64x64 por defecto)
node image-to-arduino.js ./img

# Especificar dimensiones personalizadas
node image-to-arduino.js ./img 64 64

# Especificar archivo de salida
node image-to-arduino.js ./img 64 64 mis_frames.h

# Pantalla OLED 128x64 completa
node image-to-arduino.js ./img 128 64

# Ver ayuda
node image-to-arduino.js --help
```

## 📁 Estructura de archivos

Organiza tus imágenes así:

```
OLED 128x64/
├── img/
│   ├── frame_001.png
│   ├── frame_002.png
│   ├── frame_003.png
│   └── ...
├── image-to-arduino.js
├── package.json
└── frames.h (archivo generado)
```

## 🎨 Formatos soportados

- PNG
- JPG/JPEG
- BMP
- GIF

## ⚙️ Proceso de conversión

1. **Lee las imágenes**: El script busca todos los archivos de imagen en la carpeta especificada
2. **Redimensiona**: Ajusta cada imagen al tamaño especificado (64x64, 128x64, etc.)
3. **Convierte a monocromo**: Transforma los píxeles a blanco/negro
4. **Genera bytes**: Crea un array de bytes (1 bit por píxel)
5. **Formatea**: Genera código Arduino listo para usar

## 📝 Usar el código generado

### Ejemplo completo para Arduino

```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Pega aquí el contenido de frames.h
#define FRAME_WIDTH (64)
#define FRAME_HEIGHT (64)
#define FRAME_COUNT (...)

const byte PROGMEM frames[][512] = {
  // ... arrays generados ...
};

int currentFrame = 0;

void setup() {
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("Error al inicializar SSD1306"));
    for(;;);
  }
  display.clearDisplay();
}

void loop() {
  display.clearDisplay();
  
  // Mostrar frame centrado (para 64x64 en pantalla 128x64)
  display.drawBitmap(32, 0, frames[currentFrame], 
                     FRAME_WIDTH, FRAME_HEIGHT, 1);
  
  display.display();
  
  currentFrame = (currentFrame + 1) % FRAME_COUNT;
  delay(42); // ~24 FPS
}
```

## 🎯 Consejos

### Para mejores resultados:

1. **Imágenes simples**: Usa dibujos con contornos claros
2. **Alto contraste**: Blanco y negro funcionan mejor
3. **Sin degradados**: Las pantallas OLED son monocromáticas
4. **Resolución correcta**: Prepara las imágenes al tamaño final antes

### Preparar imágenes:

- Usa editores como GIMP, Photoshop o Paint.NET
- Convierte a escala de grises
- Ajusta el contraste
- Aumenta el brillo si es necesario
- Guarda como PNG para mejor calidad

## 📐 Tamaños comunes

| Pantalla | Dimensiones | Bytes/Frame | Uso típico |
|----------|-------------|-------------|------------|
| OLED 64x64 | 64×64 | 512 bytes | Iconos, animaciones pequeñas |
| OLED 128x64 | 128×64 | 1024 bytes | Pantalla completa |
| OLED 128x32 | 128×32 | 512 bytes | Banners, texto extendido |

## 🐛 Solución de problemas

### Error: "Cannot find module 'canvas'"
```bash
npm install
```

### Error: "La carpeta no existe"
Verifica que la ruta sea correcta:
```bash
# Desde la carpeta del script
node image-to-arduino.js ./img

# Con ruta absoluta
node image-to-arduino.js "C:/Users/migue/Desktop/Arduino y electronica/Arduino projects/OLED 128x64/img"
```

### Las imágenes se ven mal
- Aumenta el contraste de las imágenes originales
- Usa imágenes en blanco y negro puro
- Prueba diferentes umbrales editando el script (línea: `if (brightness > 128)`)

### Memoria insuficiente en Arduino
- Reduce el número de frames
- Usa imágenes más pequeñas
- Considera usar `PROGMEM` correctamente (el script ya lo hace)

## 🔧 Personalización

### Cambiar el umbral de brillo

Edita la línea 48 en `image-to-arduino.js`:

```javascript
// Valor entre 0-255 (default: 128)
if (brightness > 128) {  // Cambiar este número
    byte |= (1 << (7 - bit));
}
```

- Valores más bajos (ej: 100) = más píxeles blancos
- Valores más altos (ej: 180) = más píxeles negros

### Invertir colores

Cambia el operador:
```javascript
if (brightness < 128) {  // Menor en vez de mayor
    byte |= (1 << (7 - bit));
}
```

## 📚 Recursos útiles

- [Image2cpp Online](https://javl.github.io/image2cpp/) - Alternativa web
- [Wokwi Animator](https://animator.wokwi.com/) - Crear animaciones
- [Adafruit GFX](https://learn.adafruit.com/adafruit-gfx-graphics-library) - Documentación

## 📄 Licencia

MIT - Úsalo libremente en tus proyectos

---

¿Dudas? Revisa el código o modifica según necesites. ¡Feliz programación! 🚀
