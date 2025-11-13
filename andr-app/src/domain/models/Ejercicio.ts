// src/domain/models/Ejercicio.ts (Opcional)
export interface Ejercicio {
  id: string;
  rutina_id: string; // ID de la rutina a la que pertenece
  nombre: string;
  descripcion?: string;
  series?: number;
  repeticiones?: number;
  video_demo_url?: string; // URL del video del ejercicio
  imagen_demo_url?: string; // URL de la imagen del ejercicio
  orden: number;
}