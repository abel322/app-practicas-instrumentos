# 🥁 Drum Lab — Runway & Partitura de Batería

Aplicación web moderna, minimalista y de alto rendimiento para el estudio interactivo de batería, construida con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Prisma ORM** y **Web Audio API**.

---

## ✨ Características Principales

1. **Pentagrama Formal de Percusión (SVG)**:
   - Notación estándar de 5 líneas con clave neutral de percusión y numeradores de compás (`4/4`, `6/8`).
   - Ubicaciones verticales estandarizadas:
     - Platillos (`Hi-Hat cerrado/abierto`, `Ride`, `Crash`) con cabezas en cruz (`✕`).
     - Tambores (`Caja`, `Bombo`, `Toms`) con cabezas ovaladas formales.
   - Plicas hacia arriba con vigas continuas (*beams*) para semicorcheas.
   - Articulaciones dinámicas: acentos marcados (`>`).
   - Notación de Sticking por colores: `R` (Cian), `L` (Fucsia), `K` (Esmeralda / Bombo).

2. **Línea de Tiempo Runway**:
   - Cabezal de escaneo luminoso animado a tiempo real con glow y partículas de impacto.
   - Sincronización precisa mediante reloj interno de Web Audio API y `requestAnimationFrame`.
   - Loop continuo y fluido sin latencia entre compases.

3. **Motor de Audio Nativo (Web Audio API)**:
   - Síntesis analógica/acústica pura sin dependencias externas pesadas ni problemas de carga de samples.
   - Sonidos punchy para Bombo, Caja con bordonera, Hi-Hat abierto/cerrado, Ride y Toms.
   - Metrónomo digital configurable con clics diferenciados de downbeat (1600 Hz / 920 Hz).

4. **Diseño Dark Minimalist & UX**:
   - Paleta profunda (`zinc-950`), microinteracciones con Framer Motion y glassmorphism sobrio.
   - Sin registros ni pantallas de edición innecesarias: directo a la práctica.
   - Atajos de teclado para bateristas:
     - <kbd>Espacio</kbd>: Reproducir / Pausar.
     - <kbd>Esc</kbd>: Detener y volver al inicio.
     - <kbd>M</kbd>: Alternar Metrónomo.
     - <kbd>↑</kbd> / <kbd>↓</kbd>: Ajustar tempo (±5 BPM).

---

## 🚀 Pila Tecnológica

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS & Vanilla CSS tokens
- **Animaciones**: Framer Motion
- **ORM & Base de Datos**: Prisma ORM & PostgreSQL
- **Audio**: Web Audio API nativo

---

## 🛠️ Instalación y Puesta en Marcha

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/abel322/app-practicas-instrumentos.git
   cd app-practicas-instrumentos
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```

4. Generar el cliente de Prisma:
   ```bash
   npx prisma generate
   ```

5. (Opcional) Migrar y poblar la base de datos PostgreSQL:
   ```bash
   npx prisma db push
   npm run seed
   ```
   *Nota: La aplicación cuenta con un fallback automático a los datos de seed, por lo que funciona plenamente incluso sin un servidor PostgreSQL local levantado.*

6. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del Código

```text
├── prisma/
│   ├── schema.prisma              # Modelo DrumExercise
│   └── seed.ts                    # Script de población de base de datos
├── app/
│   ├── globals.css                # Estilos globales y tokens
│   ├── layout.tsx                 # Layout principal
│   ├── page.tsx                   # Catálogo de ejercicios (Server Component)
│   └── practice/[slug]/page.tsx   # Reproductor de práctica y Runway
├── components/
│   ├── catalog/                   # Tarjetas y filtros con animaciones
│   └── practice/                  # Pentagrama SVG, barra de transporte y leyenda
├── lib/
│   ├── prisma.ts                  # Cliente Prisma singleton con fallback
│   ├── drumAudioEngine.ts         # Motor de síntesis Web Audio
│   └── seedData.ts                # Colección rítmica predefinida
└── types/
    └── drum.ts                    # Definiciones TypeScript de notas y ejercicios
```
