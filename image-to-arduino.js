#!/usr/bin/env node
/**
 * Conversor de imágenes a array de bytes PROGMEM para Arduino
 * Convierte imágenes de una carpeta al formato necesario para pantallas OLED
 * 
 * Uso: node image-to-arduino.js <carpeta_imagenes> [ancho] [alto]
 * Ejemplo: node image-to-arduino.js ./img 64 64
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Configuración por defecto
const DEFAULT_WIDTH = 64;
const DEFAULT_HEIGHT = 64;

/**
 * Convierte una imagen a array de bytes monocromo
 */
async function imageToBytes(imagePath, width, height) {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Dibujar imagen escalada
    ctx.drawImage(image, 0, 0, width, height);
    
    // Obtener datos de la imagen
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    
    // Convertir a bytes (1 bit por píxel)
    const bytes = [];
    const totalBytes = (width * height) / 8;
    
    for (let i = 0; i < totalBytes; i++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
            const pixelIndex = (i * 8 + bit) * 4;
            // Convertir a escala de grises y determinar si es blanco o negro
            const r = pixels[pixelIndex];
            const g = pixels[pixelIndex + 1];
            const b = pixels[pixelIndex + 2];
            const brightness = (r + g + b) / 3;
            
            // Si el píxel es más claro que 128, se considera blanco (1)
            if (brightness > 128) {
                byte |= (1 << (7 - bit));
            }
        }
        bytes.push(byte);
    }
    
    return bytes;
}

/**
 * Formatea un array de bytes para código Arduino
 */
function formatBytes(bytes) {
    const formatted = [];
    for (let i = 0; i < bytes.length; i += 16) {
        const chunk = bytes.slice(i, i + 16);
        formatted.push(chunk.join(','));
    }
    return formatted.join(',\n  ');
}

/**
 * Genera el código Arduino completo
 */
function generateArduinoCode(framesData, width, height) {
    const bytesPerFrame = (width * height) / 8;
    
    let code = `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1 // No hay pin de reset
#define SCREEN_ADDRESS 0x3C // Dirección I2C (a veces es 0x3D)

// Código generado automáticamente por image-to-arduino.js

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

/*
Conexión Electrónica
La mayoría de estas pantallas usan el controlador SSD1306 y comunicación I2C (4 pines):
Conexiones:

VCC → 5V del Arduino (o 3.3V según tu pantalla)
GND → GND del Arduino
SCL → A5 (pin de reloj I2C)
SDA → A4 (pin de datos I2C)
*/

int frame = 0; 

// Dimensiones: ${width}x${height} píxeles
// Total de frames: ${framesData.length}
// Bytes por frame: ${bytesPerFrame}

#define FRAME_WIDTH (${width})
#define FRAME_HEIGHT (${height})
#define FRAME_COUNT (${framesData.length})
#define FRAME_DELAY (200)

const byte PROGMEM frames[][${bytesPerFrame}] = {\n`;
    
    framesData.forEach((frame, index) => {
        code += `  // Frame ${index}: ${frame.filename}\n`;
        code += `  {${formatBytes(frame.bytes)}}`;
        if (index < framesData.length - 1) {
            code += ',\n';
        } else {
            code += '\n';
        }
    });
    
    code += '};\n';
    
    code +=`

void setup() {
  Serial.begin(9600);
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("Error al inicializar SSD1306"));
    for(;;);
  }
}

void loop() {
display.clearDisplay();
  display.drawBitmap(32, 0, frames[frame], FRAME_WIDTH, FRAME_HEIGHT, 1);
  display.display();
  frame = (frame + 1) % FRAME_COUNT;
  delay(FRAME_DELAY);
  // Tu código aquí
}`
    return code;
}

/**
 * Procesa todas las imágenes de una carpeta
 */
async function processFolder(folderPath, width, height) {
    // Verificar que la carpeta existe
    if (!fs.existsSync(folderPath)) {
        throw new Error(`La carpeta "${folderPath}" no existe`);
    }
    
    // Leer archivos de la carpeta
    const files = fs.readdirSync(folderPath)
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.bmp', '.gif'].includes(ext);
        })
        .sort(); // Ordenar alfabéticamente
    
    if (files.length === 0) {
        throw new Error(`No se encontraron imágenes en "${folderPath}"`);
    }
    
    console.log(`\nEncontradas ${files.length} imágenes:`);
    files.forEach((file, i) => console.log(`  ${i + 1}. ${file}`));
    console.log('\nProcesando...\n');
    
    // Procesar cada imagen
    const framesData = [];
    for (let i = 0; i < files.length; i++) {
        const filename = files[i];
        const filePath = path.join(folderPath, filename);
        
        console.log(`[${i + 1}/${files.length}] Procesando ${filename}...`);
        
        try {
            const bytes = await imageToBytes(filePath, width, height);
            framesData.push({ filename, bytes });
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
    }
    
    return framesData;
}

/**
 * Función principal
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log(`
Conversor de imágenes a formato PROGMEM para Arduino

Uso: node image-to-arduino.js <carpeta_imagenes> [ancho] [alto] [archivo_salida]

Argumentos:
  carpeta_imagenes  Carpeta que contiene las imágenes a convertir
  ancho            Ancho en píxeles (default: ${DEFAULT_WIDTH})
  alto             Alto en píxeles (default: ${DEFAULT_HEIGHT})
  archivo_salida   Archivo de salida (default: frames.h)

Ejemplos:
  node image-to-arduino.js ./img
  node image-to-arduino.js ./img 64 64
  node image-to-arduino.js ./img 128 64 output.h

Formatos soportados: PNG, JPG, JPEG, BMP, GIF
        `);
        process.exit(0);
    }
    
    const folderPath = args[0];
    const width = parseInt(args[1]) || DEFAULT_WIDTH;
    const height = parseInt(args[2]) || DEFAULT_HEIGHT;
    const outputFile = args[3] || 'oled.ino';
    
    console.log(`
╔════════════════════════════════════════╗
║  Conversor de Imágenes para Arduino    ║
╚════════════════════════════════════════╝

Configuración:
  📁 Carpeta: ${folderPath}
  📐 Dimensiones: ${width}x${height} píxeles
  📝 Salida: ${outputFile}
    `);
    
    try {
        // Procesar imágenes
        const framesData = await processFolder(folderPath, width, height);
        
        if (framesData.length === 0) {
            throw new Error('No se pudo procesar ninguna imagen');
        }
        
        // Generar código
        console.log('\n✅ Generando código Arduino...');
        const code = generateArduinoCode(framesData, width, height);
        
        // Guardar archivo
        fs.writeFileSync(outputFile, code);
        
        console.log(`\n✅ ¡Completado!\n`);
        console.log(`   Frames procesados: ${framesData.length}`);
        console.log(`   Archivo generado: ${outputFile}`);
        console.log(`   Tamaño: ${(code.length / 1024).toFixed(2)} KB\n`);
        
        console.log('📋 Para usar en tu sketch de Arduino:');
        console.log('   1. Copia el contenido del archivo generado');
        console.log('   2. Pégalo antes de setup() en tu código');
        console.log('   3. Usa: display.drawBitmap(x, y, frames[i], FRAME_WIDTH, FRAME_HEIGHT, 1);\n');
        
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}\n`);
        process.exit(1);
    }
}

// Ejecutar
main().catch(console.error);
