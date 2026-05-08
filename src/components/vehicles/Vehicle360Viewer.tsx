import { KeyboardEvent, PointerEvent, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { getVehicleImage } from '@/data/vehicle-images';
import type { Vehicle } from '@/types/domain';

interface Vehicle360ViewerProps {
  vehicle: Vehicle;
  frames?: string[];
}

export function Vehicle360Viewer({ vehicle, frames }: Vehicle360ViewerProps) {
  const imageFrames = useMemo(() => {
    const primary = getVehicleImage(vehicle.id) || vehicle.photoUrl || '';
    const usableFrames = (frames ?? []).filter(Boolean);
    return usableFrames.length >= 2 ? usableFrames : primary ? [primary] : [];
  }, [frames, vehicle.id, vehicle.photoUrl]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const moveFrame = (direction: number) => {
    if (imageFrames.length < 2) return;
    setFrameIndex(current => (current + direction + imageFrames.length) % imageFrames.length);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX === null || imageFrames.length < 2) return;
    const delta = event.clientX - dragStartX;
    if (Math.abs(delta) < 24) return;
    moveFrame(delta > 0 ? 1 : -1);
    setDragStartX(event.clientX);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') moveFrame(1);
    if (event.key === 'ArrowLeft') moveFrame(-1);
  };

  if (imageFrames.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-secondary/40 text-xs text-muted-foreground">
        360° viewer unavailable: no approved vehicle images.
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model} 360 degree vehicle viewer`}
      tabIndex={0}
      className="group relative overflow-hidden rounded-lg border border-border bg-secondary/30 outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
      onPointerDown={event => setDragStartX(event.clientX)}
      onPointerMove={onPointerMove}
      onPointerUp={() => setDragStartX(null)}
      onPointerLeave={() => setDragStartX(null)}
      onKeyDown={onKeyDown}
    >
      <img
        src={imageFrames[frameIndex]}
        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        className="h-56 w-full select-none object-cover sm:h-72"
        draggable={false}
        loading="lazy"
      />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-md bg-background/85 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur">
        <span className="inline-flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5 text-gold" /> Drag, swipe, or use arrow keys</span>
        <span>{imageFrames.length >= 2 ? `${frameIndex + 1}/${imageFrames.length}` : 'single-image fallback'}</span>
      </div>
    </div>
  );
}

export default Vehicle360Viewer;
