import React from 'react';

interface TopBarFretControlProps {
  currentFret: number;
  onFretChange: (fret: number) => void;
  className?: string;
}

export const TopBarFretControl: React.FC<TopBarFretControlProps> = ({
  currentFret,
  onFretChange,
  className = '',
}) => {
  const handleFretInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Permitir borrar todo para escribir limpio
    if (raw === '') {
      onFretChange(0);
      return;
    }

    // Remover cualquier carácter no numérico y quitar ceros a la izquierda
    const sanitized = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (sanitized === '') {
      onFretChange(0);
      return;
    }

    const parsed = parseInt(sanitized, 10);

    if (!isNaN(parsed) && parsed >= 0 && parsed <= 24) {
      onFretChange(parsed);
    }
  };

  const handleFretInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Auto-seleccionar todo el texto al hacer clic para que al teclear reemplace directamente
    e.target.select();
  };

  return (
    <div className={`flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-800 ${className}`}>
      <span className="text-[11px] font-bold text-slate-400 uppercase">Traste:</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={currentFret.toString()}
        onChange={handleFretInputChange}
        onFocus={handleFretInputFocus}
        className="w-10 text-center text-xs font-mono font-bold bg-slate-800 text-cyan-300 rounded-lg py-0.5 border border-slate-700 focus:outline-none focus:border-cyan-400"
      />
    </div>
  );
};
