// Tipos de domínio compartilhados por catálogo, mapa, checkout, cliente e admin.

export type PropertyStatus = 'disponivel' | 'reservado' | 'pendente' | 'bloqueado';

export type Amenity =
  | 'ar' | 'wifi' | 'garagem' | 'cozinha' | 'piscina' | 'varanda'
  | 'vista-mar' | 'portaria' | 'elevador' | 'lavanderia' | 'tv' | 'churrasqueira';

export interface LatLng { lat: number; lng: number }

export interface Property {
  id: string;
  title: string;
  type: 'Apartamento' | 'Studio' | 'Cobertura' | 'Casa' | 'Loft' | 'Sobrado';
  neighborhood: string;
  summary: string;
  description: string;
  location: LatLng;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  guests: number;
  areaM2: number;
  nightly: number;
  cleaningFee: number;
  minNights: number;
  amenities: Amenity[];
  photos: { src: string; alt: string }[];
  highlight?: string;
}

export interface DateRange { start: string; end: string } // ISO yyyy-mm-dd, end = dia do check-out

export interface AvailabilityBlock extends DateRange {
  id: string;
  propertyId: string;
  kind: 'reserva' | 'bloqueio';
  reservationId?: string;
  note?: string;
}

export type ReservationStatus = 'pendente' | 'confirmada' | 'cancelada';
export type PaymentMethod = 'pix' | 'cartao';

export interface Installment {
  n: number;
  label: string;
  dueDate: string;
  amount: number;
  status: 'pago' | 'aberto' | 'atrasado';
}

export interface Reservation {
  id: string;
  code: string;
  propertyId: string;
  clientId: string;
  range: DateRange;
  guests: number;
  total: number;
  method: PaymentMethod;
  installments: Installment[];
  status: ReservationStatus;
  createdAt: string;
  contractId?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  document: string;
  createdAt: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  body: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  reservationId: string;
  templateId: string;
  status: 'rascunho' | 'enviado' | 'assinado-demo';
  createdAt: string;
}

export interface CartItem {
  id: string;
  propertyId: string;
  range: DateRange;
  guests: number;
}

export interface PaymentTerms {
  downPaymentPercent: number;
  maxInstallments: number;
  cardInterestPercentMonth: number;
  pixDiscountPercent: number;
  pixMaxInstallments: number;
  serviceFeePercent: number;
}

export type Role = 'visitante' | 'cliente' | 'admin';
