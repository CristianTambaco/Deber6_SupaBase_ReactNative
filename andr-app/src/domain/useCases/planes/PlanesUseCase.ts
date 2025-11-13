// src/domain/useCases/planes/PlanesUseCase.ts
import { supabase } from "@/src/data/services/supabaseClient";
import { PlanEntrenamiento } from "../../models/PlanEntrenamiento";
import { Rutina } from "../../models/Rutina";

export class PlanesUseCase {
  async obtenerPlanesPorEntrenador(entrenadorId: string): Promise<PlanEntrenamiento[]> {
    try {
      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .select("*")
        .eq("entrenador_id", entrenadorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PlanEntrenamiento[];
    } catch (error) {
      console.error("Error al obtener planes por entrenador:", error);
      return [];
    }
  }

  async obtenerPlanesAsignadosAUsuario(usuarioId: string): Promise<PlanEntrenamiento[]> {
    try {
      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .select(`
          *,
          usuario_plan!inner(usuario_id)
        `)
        .eq("usuario_plan.usuario_id", usuarioId);

      if (error) throw error;
      return data as PlanEntrenamiento[];
    } catch (error) {
      console.error("Error al obtener planes asignados:", error);
      return [];
    }
  }

  async crearPlan(
    nombre: string,
    descripcion: string,
    entrenadorId: string,
    rutinasIds: string[] // Array de IDs de rutinas a incluir
  ): Promise<{ success: boolean; error?: string; plan?: PlanEntrenamiento }> {
    try {
      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .insert({ nombre, descripcion, entrenador_id: entrenadorId })
        .select()
        .single();

      if (error) throw error;

      if (rutinasIds && rutinasIds.length > 0) {
        const planRutinas = rutinasIds.map((id, index) => ({
          plan_id: data.id,
          rutina_id: id,
          orden: index + 1
        }));
        const { error: planRutinaError } = await supabase.from('plan_rutina').insert(planRutinas);
        if (planRutinaError) throw planRutinaError;
      }

      return { success: true, plan: data as PlanEntrenamiento };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async actualizarPlan(id: string, nombre: string, descripcion: string, rutinasIds: string[]): Promise<{ success: boolean; error?: string; plan?: PlanEntrenamiento }> {
    try {
      // Actualizar plan
      const { data, error } = await supabase
        .from("planes_entrenamiento")
        .update({ nombre, descripcion })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Eliminar relaciones actuales
      await supabase.from('plan_rutina').delete().eq('plan_id', id);

      // Insertar nuevas relaciones
      if (rutinasIds && rutinasIds.length > 0) {
        const planRutinas = rutinasIds.map((id, index) => ({
          plan_id: data.id,
          rutina_id: id,
          orden: index + 1
        }));
        const { error: planRutinaError } = await supabase.from('plan_rutina').insert(planRutinas);
        if (planRutinaError) throw planRutinaError;
      }

      return { success: true, plan: data as PlanEntrenamiento };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async eliminarPlan(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("planes_entrenamiento")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async asignarPlanAUsuario(planId: string, usuarioId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("usuario_plan")
        .insert({ plan_id: planId, usuario_id: usuarioId });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async desasignarPlanAUsuario(planId: string, usuarioId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("usuario_plan")
        .delete()
        .match({ plan_id: planId, usuario_id: usuarioId });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}