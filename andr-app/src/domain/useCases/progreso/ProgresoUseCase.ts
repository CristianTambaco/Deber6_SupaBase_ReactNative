// src/domain/useCases/progreso/ProgresoUseCase.ts
import { supabase } from "@/src/data/services/supabaseClient";
import { Progreso } from "../../models/Progreso";
import * as ImagePicker from 'expo-image-picker';

export class ProgresoUseCase {
  async obtenerProgresoPorUsuario(usuarioId: string): Promise<Progreso[]> {
    try {
      const { data, error } = await supabase
        .from("progreso")
        .select("*")
        .eq("usuario_id", usuarioId)
        .order("fecha_registro", { ascending: false })
        .order("created_at", { ascending: false }); // Segundo criterio por hora

      if (error) throw error;
      return data as Progreso[];
    } catch (error) {
      console.error("Error al obtener progreso por usuario:", error);
      return [];
    }
  }

  async registrarProgreso(
    usuarioId: string,
    comentarios: string,
    imagenUri?: string,
    rutinaId?: string,
    planId?: string
  ): Promise<{ success: boolean; error?: string; progreso?: Progreso }> {
    try {
      let imagenUrl: string | null = null;
      if (imagenUri) {
        imagenUrl = await this.subirImagen(imagenUri, "rutinas-fotos");
      }

      const { data, error } = await supabase
        .from("progreso")
        .insert({
          usuario_id: usuarioId,
          comentarios,
          imagen_progreso_url: imagenUrl,
          rutina_id: rutinaId,
          plan_id: planId,
          fecha_registro: new Date().toISOString().split('T')[0] // Fecha actual en formato YYYY-MM-DD
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, progreso: data as Progreso };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Método para subir imagen (similar a RutinasUseCase)
  private async subirImagen(uri: string, bucketName: string = "rutinas-fotos"): Promise<string> {
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

  async seleccionarImagen(): Promise<string | null> {
    // Similar a la función en RutinasUseCase
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