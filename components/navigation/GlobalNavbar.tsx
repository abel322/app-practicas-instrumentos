'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Drum, Music, Menu, X, Sparkles, AudioWaveform, Plus } from 'lucide-react';

export const GlobalNavbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determinar pestaña activa
  const isDrumsActive = pathname === '/' || pathname.startsWith('/drums') || pathname.startsWith('/practice');
  const isStringsActive = pathname.startsWith('/strings');
  const isFretboardActive = pathname.startsWith('/fretboard') || pathname.startsWith('/harmonics');
  const isBuilderActive = pathname.startsWith('/admin');

  const navLinks = [
    {
      name: 'Batería (Drum Lab)',
      href: '/',
      icon: Drum,
      active: isDrumsActive,
      badge: 'Runway',
      badgeClass: 'bg-white/10 text-zinc-400',
    },
    {
      name: 'Cuerdas (Bajo / Guitarra)',
      href: '/strings',
      icon: Music,
      active: isStringsActive,
      badge: 'Tablatura',
      badgeClass: 'bg-white/10 text-zinc-400',
    },
    {
      name: '🎸 Diapasón & Armonía',
      href: '/fretboard',
      icon: Sparkles,
      active: isFretboardActive,
      badge: 'EXPLORADOR',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    },
    {
      name: 'Studio Builder',
      href: '/admin/builder',
      icon: Plus,
      active: isBuilderActive,
      badge: 'Editor',
      badgeClass: 'bg-white/10 text-zinc-400',
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-zinc-950/80 border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Marca / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-zinc-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
            <AudioWaveform className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
              SOUNDLAB <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold">STUDIO</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">Entorno de Práctica Musical</span>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900/60 border border-white/5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors select-none ${
                  link.active ? 'text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.active && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-xl bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{link.name}</span>
                <span
                  className={`relative z-10 text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase font-bold transition-colors ${
                    link.active ? 'bg-zinc-950/20 text-zinc-950' : link.badgeClass
                  }`}
                >
                  {link.badge}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Indicador de Estado del Sistema */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-zinc-400">Web Audio Listo</span>
        </div>

        {/* Botón Hamburguesa Móvil */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
          aria-label="Abrir menú de navegación"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menú Desplegable Móvil (Framer Motion) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-b border-white/10 bg-zinc-950/95 backdrop-blur-2xl px-4 py-4 overflow-hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all ${
                      link.active
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span>{link.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${link.badgeClass}`}>
                      {link.badge}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
