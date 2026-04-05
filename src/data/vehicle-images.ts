import rav4 from '@/assets/vehicles/rav4-xle.jpg';
import crv from '@/assets/vehicles/crv-exl.jpg';
import tucson from '@/assets/vehicles/tucson-preferred.jpg';
import f150 from '@/assets/vehicles/f150-xlt.jpg';
import equinox from '@/assets/vehicles/equinox-lt.jpg';
import camry from '@/assets/vehicles/camry-se.jpg';
import rogue from '@/assets/vehicles/rogue-sv.jpg';
import sportage from '@/assets/vehicles/sportage-xline.jpg';

export const vehicleImages: Record<string, string> = {
  'veh-1': rav4,
  'veh-2': crv,
  'veh-3': tucson,
  'veh-4': f150,
  'veh-5': equinox,
  'veh-6': camry,
  'veh-7': rogue,
  'veh-8': sportage,
};

export function getVehicleImage(vehicleId: string): string {
  return vehicleImages[vehicleId] || '';
}
