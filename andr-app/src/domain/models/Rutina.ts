// src/domain/models/Rutina.ts
export interface Rutina {
  id: string;
  titulo: string;
  descripcion: string;
  entrenador_id: string; // ID del usuario entrenador
  created_at: string;
  // Opcional: incluir ejercicios aquí si se cargan junto con la rutina
  // ejercicios?: Ejercicio[];
}