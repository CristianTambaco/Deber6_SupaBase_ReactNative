// src/domain/models/PlanEntrenamiento.ts
export interface PlanEntrenamiento {
  id: string;
  nombre: string;
  descripcion: string;
  entrenador_id: string; // ID del usuario entrenador
  created_at: string;
  // Opcional: incluir rutinas aquí si se cargan junto con el plan
  // rutinas?: Rutina[];
}