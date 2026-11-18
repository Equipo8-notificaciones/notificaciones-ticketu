// ============================================================================
// modules/checkin/types.ts
// ----------------------------------------------------------------------------
// Tipos de datos para el módulo de Check-in (Grupo 5)
// ============================================================================

export type ScanStatus = 'accepted' | 'rejected' | 'invalid';

export interface TicketQrData {
  id_entrada: string;
  id_evento: string;
  nombre_usuario?: string;
  nombre_evento?: string;
  direccion?: string;
  hora_inicio?: string;
  hora_cierre?: string;
  fecha?: string;
  tipo_entrada?: string;
  estado_pago?: string;
}

export interface ScanResultInfo {
  status: ScanStatus;
  rawContent: string;
  ticket?: Partial<TicketQrData>;
  motivo?: string;
  mensaje?: string;
  timestamp?: string;
}

