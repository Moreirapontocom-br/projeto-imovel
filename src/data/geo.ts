import type { LatLng } from '@/types';

// Bairros com centro aproximado (para chips, filtros e enquadramento do mapa).
export const neighborhoods: { name: string; center: LatLng; blurb: string }[] = [
  { name: 'Barra', center: { lat: -13.0075, lng: -38.5290 }, blurb: 'Orla, Farol e Porto da Barra' },
  { name: 'Ondina', center: { lat: -13.0095, lng: -38.5130 }, blurb: 'Prédios de frente para o mar' },
  { name: 'Rio Vermelho', center: { lat: -13.0110, lng: -38.4920 }, blurb: 'Bares, cultura e vida noturna' },
  { name: 'Graça', center: { lat: -13.0005, lng: -38.5240 }, blurb: 'Residencial e arborizado' },
  { name: 'Vitória', center: { lat: -12.9952, lng: -38.5268 }, blurb: 'Vista da Baía de Todos-os-Santos' },
  { name: 'Campo Grande', center: { lat: -12.9871, lng: -38.5212 }, blurb: 'Avenida tradicional e praça' },
  { name: 'Pituba', center: { lat: -13.0008, lng: -38.4611 }, blurb: 'Condomínios e tranquilidade' },
  { name: 'Pelourinho', center: { lat: -12.9718, lng: -38.5094 }, blurb: 'Centro Histórico' },
];

export interface Circuit {
  id: 'dodo' | 'osmar' | 'batatinha';
  name: string;
  route: string;
  color: string;
  path: LatLng[];
}

// Traçados ILUSTRATIVOS e aproximados, só para referência visual no protótipo.
// Antes de publicar, substituir pela geometria oficial divulgada pela organização do Carnaval.
export const circuits: Circuit[] = [
  {
    id: 'dodo',
    name: 'Circuito Dodô',
    route: 'Barra – Ondina',
    color: '#BC8733',
    path: [
      { lat: -13.0101, lng: -38.5318 }, { lat: -13.0100, lng: -38.5290 },
      { lat: -13.0097, lng: -38.5260 }, { lat: -13.0096, lng: -38.5232 },
      { lat: -13.0098, lng: -38.5205 }, { lat: -13.0102, lng: -38.5178 },
      { lat: -13.0103, lng: -38.5150 }, { lat: -13.0100, lng: -38.5124 },
      { lat: -13.0096, lng: -38.5100 },
    ],
  },
  {
    id: 'osmar',
    name: 'Circuito Osmar',
    route: 'Campo Grande – Castro Alves',
    color: '#061B37',
    path: [
      { lat: -12.9878, lng: -38.5222 }, { lat: -12.9851, lng: -38.5205 },
      { lat: -12.9826, lng: -38.5186 }, { lat: -12.9800, lng: -38.5165 },
      { lat: -12.9776, lng: -38.5143 }, { lat: -12.9755, lng: -38.5128 },
    ],
  },
  {
    id: 'batatinha',
    name: 'Circuito Batatinha',
    route: 'Centro Histórico',
    color: '#1767A1',
    path: [
      { lat: -12.9745, lng: -38.5121 }, { lat: -12.9738, lng: -38.5101 },
      { lat: -12.9729, lng: -38.5089 }, { lat: -12.9716, lng: -38.5081 },
    ],
  },
];

export interface Poi { id: string; name: string; kind: 'marco' | 'praia' | 'servico' | 'cultura'; location: LatLng }

// Pontos de interesse com localização aproximada.
export const pois: Poi[] = [
  { id: 'farol', name: 'Farol da Barra', kind: 'marco', location: { lat: -13.0105, lng: -38.5326 } },
  { id: 'porto', name: 'Praia do Porto da Barra', kind: 'praia', location: { lat: -13.0030, lng: -38.5335 } },
  { id: 'cristo', name: 'Morro do Cristo', kind: 'marco', location: { lat: -13.0104, lng: -38.5236 } },
  { id: 'ondina', name: 'Praia de Ondina', kind: 'praia', location: { lat: -13.0107, lng: -38.5105 } },
  { id: 'santana', name: 'Largo de Santana', kind: 'cultura', location: { lat: -13.0119, lng: -38.4893 } },
  { id: 'campo', name: 'Praça do Campo Grande', kind: 'marco', location: { lat: -12.9862, lng: -38.5214 } },
  { id: 'castro', name: 'Praça Castro Alves', kind: 'cultura', location: { lat: -12.9752, lng: -38.5127 } },
  { id: 'lacerda', name: 'Elevador Lacerda', kind: 'marco', location: { lat: -12.9741, lng: -38.5133 } },
  { id: 'pelo', name: 'Largo do Pelourinho', kind: 'cultura', location: { lat: -12.9714, lng: -38.5079 } },
  { id: 'shop-barra', name: 'Shopping Barra', kind: 'servico', location: { lat: -12.9995, lng: -38.5226 } },
];
