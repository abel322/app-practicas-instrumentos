# 🎶 SoundLab Studio — Entorno de Práctica Multi-Instrumento (Drum Lab & Strings Lab)

Plataforma web moderna, minimalista y de alto rendimiento para el estudio interactivo de instrumentos: **Batería** (pentagrama y Runway), **Bajo eléctrico** (4 cuerdas con tablatura interactiva) y **Guitarra** (6 cuerdas con tablatura profesional).

Construida con **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Prisma ORM** y **Web Audio API**.

---

## 🚀 Arquitectura y Módulos

### 1. 🥁 Drum Lab Runway (`/` o `/drums`)
- Pentagrama formal de percusión de 5 líneas con clave neutral y métricas (`4/4`, `6/8`).
- Ubicaciones verticales estandarizadas: Platillos en cruz (`✕`), Bombo, Caja y Toms en cabezas ovaladas.
- Plicas hacia arriba con vigas (*beams*) continuas para semicorcheas.
- Sticking por colores: `R` (Cian), `L` (Fucsia), `K` (Esmeralda / Bombo) y símbolos de acento (`>`).
- Cabezal de escaneo óptico **Runway** sincronizado a tiempo real con Web Audio API.

### 2. 🎸 Strings Lab: Bajo y Guitarra (`/strings`)
- **Bajo (4 Cuerdas)**: Tablatura interactiva con afinación estándar (`G, D, A, E`).
- **Guitarra (6 Cuerdas)**: Tablatura de 6 líneas con afinación estándar (`e, B, G, D, A, E`).
- Números de traste con fondo enmascarado para máxima legibilidad sobre las cuerdas.
- Insignias de técnicas profesionales:
  - **S**: Slap (Golpe de pulgar)
  - **P**: Pop (Tirón)
  - **X**: Ghost Note (Nota fantasma percusiva)
  - **H**: Hammer-on (Ligadura ascendente)
  - **/**: Slide (Glisando)
  - **~**: Vibrato
- Motor de síntesis analógica de cuerda pulsada (*plucked string synthesis*) con ataque rápido y decaimiento cálido.
- Cabezal de escaneo **Runway** sincronizado con detección de traste activo y destello luminoso.

### 3. 🌐 Navegación Global (`GlobalNavbar`)
- Encabezado minimalista sticky con soporte para pantallas táctiles y móviles.
- Píldoras animadas con **Framer Motion** para alternar al instante entre **Batería** y **Cuerdas**.
- Menú hamburguesa colapsable en dispositivos móviles.

---

## 📁 Rutas de la Aplicación

- `/` o `/drums`: Catálogo interactivo de ejercicios de batería.
- `/practice/[slug]`: Reproductor de práctica y partitura formal Runway para batería.
- `/strings`: Catálogo de ejercicios para Bajo y Guitarra con filtros de instrumento y categoría.
- `/strings/practice/[slug]`: Reproductor de tablatura profesional con Runway y sintetizador de cuerdas.

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
   *Nota: La aplicación cuenta con un fallback automático seguro en memoria, por lo que opera al 100% incluso sin base de datos activa localmente.*

6. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🎹 Atajos de Teclado Universales

- <kbd>Espacio</kbd>: Reproducir / Pausar práctica.
- <kbd>Esc</kbd>: Detener y volver al inicio del compás.
- <kbd>M</kbd>: Alternar Metrónomo encendido/apagado.
- <kbd>↑</kbd> / <kbd>↓</kbd>: Ajustar tempo (±5 BPM).
