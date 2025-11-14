// src/domain/models/Rutina.ts
export interface Rutina {
  id: string;
  titulo: string;
  descripcion: string;
  entrenador_id: string; // ID del usuario entrenador
  created_at: string;
  imagen_demo_url?: string; // Opcional, porque puede ser null
}