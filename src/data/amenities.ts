import type { Amenity } from '@/types';
import {
  AirVent, Wifi, Car, CookingPot, Waves, Sun, Eye, ShieldCheck, ArrowUpDown, WashingMachine, Tv, Flame,
  type LucideIcon,
} from 'lucide-react';

export const amenityInfo: Record<Amenity, { label: string; icon: LucideIcon }> = {
  ar: { label: 'Ar-condicionado', icon: AirVent },
  wifi: { label: 'Wi-Fi', icon: Wifi },
  garagem: { label: 'Garagem', icon: Car },
  cozinha: { label: 'Cozinha completa', icon: CookingPot },
  piscina: { label: 'Piscina', icon: Waves },
  varanda: { label: 'Varanda', icon: Sun },
  'vista-mar': { label: 'Vista para o mar', icon: Eye },
  portaria: { label: 'Portaria 24h', icon: ShieldCheck },
  elevador: { label: 'Elevador', icon: ArrowUpDown },
  lavanderia: { label: 'Lavanderia', icon: WashingMachine },
  tv: { label: 'TV', icon: Tv },
  churrasqueira: { label: 'Churrasqueira', icon: Flame },
};
