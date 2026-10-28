import type { Metadata } from 'next';
import './globals.css';
import { GlobalNavbar } from '@/components/navigation/GlobalNavbar';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'SoundLab Studio — Entorno de Práctica: Batería, Bajo y Guitarra',
  description: 'Plataforma minimalista y de alto rendimiento para el estudio de batería (pentagrama y Runway) y cuerdas (bajo y guitarra con tablatura profesional).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-700 dark:selection:text-cyan-200 transition-colors duration-200">
        <ThemeProvider>
          <div className="relative min-h-screen flex flex-col justify-between">
            {/* Subtle Ambient Radial Glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-100 transition-opacity">
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/5 blur-[120px] rounded-full" />
              <div className="absolute top-1/3 -right-40 w-[500px] h-[300px] bg-fuchsia-500/3 blur-[140px] rounded-full" />
              <div className="absolute bottom-10 left-1/4 w-[600px] h-[250px] bg-cyan-600/5 blur-[130px] rounded-full" />
            </div>

            {/* Barra de Navegación Global */}
            <GlobalNavbar />

            <div className="relative z-10 flex-1 flex flex-col">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
