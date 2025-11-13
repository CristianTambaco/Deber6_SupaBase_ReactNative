// src/domain/models/Progreso.ts
export interface Progreso {
  id: string;
  usuario_id: string; // ID del usuario que registra el progreso
  rutina_id?: string; // ID de la rutina relacionada (opcional)
  plan_id?: string;   // ID del plan relacionado (opcional)
  fecha_registro: string; // Date string
  comentarios?: string;
  imagen_progreso_url?: string; // URL de la imagen subida
  created_at: string;
}