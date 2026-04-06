import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 100);
    const exitTimer = setTimeout(() => setPhase('exit'), 2200);
    const completeTimer = setTimeout(onComplete, 2700);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        phase === 'exit' ? 'animate-splash-out' : ''
      }`}
    >
      {/* Ambient gold glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(42 65% 55% / 0.3), transparent 70%)',
          }}
        />
      </div>

      {/* Logo */}
      <div className="animate-splash-logo relative z-10">
        <img
          src="/logo.jpg"
          alt="Door Step Auto"
          className="w-28 h-28 rounded-2xl shadow-2xl"
          style={{ boxShadow: '0 0 60px hsl(42 65% 55% / 0.2)' }}
        />
      </div>

      {/* Brand text */}
      <div className="animate-splash-text relative z-10 mt-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
          AutoRep AI
        </h1>
        <p className="text-sm text-muted-foreground mt-1 tracking-widest uppercase">
          Automotive Sales Intelligence
        </p>
      </div>

      {/* Loading bar */}
      <div className="animate-splash-text relative z-10 mt-8 w-48 h-0.5 bg-border/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, hsl(42 65% 55%), hsl(42 80% 70%))',
            animation: 'splash-loading 2s ease-in-out forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes splash-loading {
          0% { width: 0%; }
          60% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
