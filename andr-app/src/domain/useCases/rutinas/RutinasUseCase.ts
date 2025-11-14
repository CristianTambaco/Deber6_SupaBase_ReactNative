// src/domain/useCases/rutinas/RutinasUseCase.ts
import { supabase } from "@/src/data/services/supabaseClient";
import { Rutina } from "../../models/Rutina";
import { Ejercicio } from "../../models/Ejercicio";
import * as ImagePicker from 'expo-image-picker';

export class RutinasUseCase {
  async obtenerRutinasPorEntrenador(entrenadorId: string): Promise<Rutina[]> {
    try {
      const { data, error } = await supabase
        .from("rutinas")
        .select("*")
        .eq("entrenador_id", entrenadorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Rutina[];
    } catch (error) {
      console.error("Error al obtener rutinas por entrenador:", error);
      return [];
    }
  }

  async obtenerRutinasAsignadasAUsuario(usuarioId: string): Promise<Rutina[]> {
    try {
      // Esta consulta es más compleja, requiere joins con usuario_plan, plan_rutina y rutinas
      const { data, error } = await supabase
        .from("rutinas")
        .select(`
          *,
          plan_rutina!inner(
            plan_id,
            planes_entrenamiento!inner(
              usuario_plan!inner(usuario_id)
            )
          )
        `)
        .eq("plan_rutina.planes_entrenamiento.usuario_plan.usuario_id", usuarioId);

      if (error) throw error;

      // Filtrar y devolver solo las rutinas únicas si es necesario
      const rutinasMap = new Map();
      data.forEach(item => {
        if (!rutinasMap.has(item.id)) {
          rutinasMap.set(item.id, item as Rutina);
        }
      });
      return Array.from(rutinasMap.values());
    } catch (error) {
      console.error("Error al obtener rutinas asignadas:", error);
      return [];
    }
  }

  async crearRutina(
    titulo: string,
    descripcion: string,
    entrenadorId: string,
    imagen_demo_url?: string // <-- Nuevo parámetro opcional
  ): Promise<{ success: boolean; error?: string; rutina?: Rutina }> {
    try {
      const { data, error } = await supabase
        .from("rutinas")
        .insert({
          titulo,
          descripcion,
          entrenador_id: entrenadorId,
          imagen_demo_url: imagen_demo_url, // <-- Guardar la URL de la imagen
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, rutina: data as Rutina };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async actualizarRutina(id: string, titulo: string, descripcion: string): Promise<{ success: boolean; error?: string; rutina?: Rutina }> {
    try {
      const { data, error } = await supabase
        .from("rutinas")
        .update({ titulo, descripcion })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, rutina: data as Rutina };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async eliminarRutina(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("rutinas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Método para subir video (similar a subir imagen)
  private async subirVideo(uri: string, bucketName: string = "rutinas-videos"): Promise<string> {
     // Similar a subirImagen, pero con contentType adecuado para video
     try {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`; // Asumiendo MP4
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, arrayBuffer, {
            contentType: "video/mp4", // Ajusta según el tipo real
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        return publicUrl;
      } catch (error) {
        console.error("Error al subir video:", error);
        throw error;
      }
  }

  // Método para subir imagen (similar a RecipesUseCase)
  private async subirImagen(uri: string, bucketName: string = "rutinas-fotos"): Promise<string> {
    // (Implementación copiada de RecipesUseCase.subirImagen, cambiando bucketName)
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, arrayBuffer, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);
      return publicUrl;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      throw error;
    }
  }

  // Métodos públicos para usar en los hooks o UI
  async subirVideoDemostrativo(uri: string): Promise<string> {
    return this.subirVideo(uri, "rutinas-videos");
  }

  async subirFotoProgreso(uri: string): Promise<string> {
      return this.subirImagen(uri, "rutinas-fotos");
  }

  async seleccionarVideo(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Necesitamos permisos para acceder a tus videos');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Solo videos
        allowsEditing: false, // Generalmente no se editan videos aquí
        quality: 0.7, // Ajusta según necesidad
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error("Error al seleccionar video:", error);
      return null;
    }
  };

  async seleccionarImagen(): Promise<string | null> {
    // Similar a la función en RecipesUseCase
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Necesitamos permisos para acceder a tus fotos');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      return null;
    }
  };

  async tomarFoto(): Promise<string | null> {
    try {
      // PASO 1: Pedir permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Necesitamos permisos para usar la cámara");
        return null;
      }
      // PASO 2: Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Permitir recortar
        aspect: [4, 3], // Proporción 4:3
        quality: 0.8, // Calidad 80% (balance tamaño/calidad)
      });
      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error("Error al tomar foto:", error);
      return null;
    }
  }
}