import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Drum Lab — Entorno de Práctica y Runway para Bateristas',
  description: 'Plataforma minimalista y de alto rendimiento para el estudio de rudimentos, grooves y técnica de batería con partitura formal SVG y escaneo Runway en tiempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="relative min-h-screen flex flex-col justify-between">
          {/* Subtle Ambient Radial Glow */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/5 blur-[120px] rounded-full" />
            <div className="absolute top-1/3 -right-40 w-[500px] h-[300px] bg-fuchsia-500/3 blur-[140px] rounded-full" />
            <div className="absolute bottom-10 left-1/4 w-[600px] h-[250px] bg-cyan-600/5 blur-[130px] rounded-full" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
