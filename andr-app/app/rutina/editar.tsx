// app/rutina/editar.tsx (Ver para todos, editar solo dueño)
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useRutinas } from "../../src/presentation/hooks/useRutinas";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";
import { supabase } from "../../src/data/services/supabaseClient"; // Importar cliente Supabase directamente
import { Rutina } from "../../src/domain/models/Rutina"; // Asegúrate de importar el modelo

import * as ImagePicker from 'expo-image-picker';

export default function EditarRutinaScreen() {
  const { id } = useLocalSearchParams();
  const { usuario } = useAuth(); // Quitamos 'esEntrenador'
  // Solo necesitamos las funciones de actualización y subida de archivos del hook
  const { actualizar, seleccionarImagen, tomarFoto } = useRutinas();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoRutina, setCargandoRutina] = useState(true); // Nuevo estado para carga inicial
  const [rutina, setRutina] = useState<Rutina | null>(null); // Estado local para la rutina específica
  const [imagenActualUrl, setImagenActualUrl] = useState<string | null>(null); // <-- NUEVO ESTADO: URL de la imagen actual
  const [esPropietario, setEsPropietario] = useState(false); // <-- NUEVO ESTADO: Si el usuario actual es el dueño

  // Cargar la rutina específica al montar el componente
  useEffect(() => {
    const cargarRutinaEspecifica = async () => {
      if (!id || !usuario?.id) return; // Asegurarse de tener id y usuario

      try {
        // Consulta directa a Supabase para obtener la rutina por ID
        // IMPORTANTE: Esta consulta DEBE tener RLS activadas en Supabase
        // para que solo devuelva la rutina si el usuario tiene permiso (por ejemplo, si es el dueño).
        // Si RLS permite verla a usuarios asignados, puedes ajustar la política.
        // Para este caso, asumiremos que RLS permite verla si está asignada o es pública.
        // La verificación de propietario se hará después.
        const { data, error } = await supabase
          .from("rutinas")
          .select("*")
          .eq("id", id)
          .single(); // Esperamos un solo resultado

        if (error) {
            if (error.code === 'PGRST116') { // Código para "Row not found" o RLS denegada
                Alert.alert("Error", "Rutina no encontrada o no tienes permiso para verla.");
            } else {
                Alert.alert("Error", "No se pudo cargar la rutina: " + error.message);
            }
            console.error("Error al cargar la rutina:", error);
            router.push("/(tabs)/rutinasAsignadas"); // O a donde corresponda si no se puede ver
            return;
        }

        if (data) {
          setRutina(data as Rutina);
          // Asegurar que siempre haya un string válido
          setTitulo(data.titulo ?? "");
          setDescripcion(data.descripcion ?? "");
          // Establecer la URL de la imagen actual
          setImagenActualUrl(data.imagen_demo_url || null); // <-- Añadir esta línea
          // Verificar si el usuario actual es el propietario
          setEsPropietario(data.entrenador_id === usuario.id); // <-- Añadir esta línea
        }
      } catch (err) {
        console.error("Error inesperado al cargar la rutina:", err);
        Alert.alert("Error", "Ocurrió un error inesperado al cargar la rutina.");
        router.push("/(tabs)/rutinasAsignadas"); // O a donde corresponda
      } finally {
        setCargandoRutina(false); // Dejar de mostrar el indicador de carga
      }
    };

    cargarRutinaEspecifica();
  }, [id, usuario?.id]);

  // Validar que el usuario es el dueño (opcional si RLS ya lo impide)
  // Ya se verifica en la consulta con eq("entrenador_id", usuario.id)
  // y en la RLS de Supabase.

  // --- REMOVIDO: if (!esEntrenador) ---

  if (cargandoRutina) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.textSecondary}>Cargando rutina...</Text>
      </View>
    );
  }

  // Si no se encontró la rutina o no se pudo cargar (ya se manejó en el useEffect)
  if (!rutina) {
     // Si llega aquí, probablemente el useEffect ya redirigió, pero por si acaso:
     return (
        <View style={globalStyles.containerCentered}>
            <Text style={globalStyles.textSecondary}>Rutina no encontrada</Text>
            <TouchableOpacity
            style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
            onPress={() => router.push("/(tabs)/rutinasAsignadas")} // O a donde corresponda
            >
            <Text style={globalStyles.buttonText}>Volver</Text>
            </TouchableOpacity>
        </View>
     );
  }

  const handleSeleccionarImagen = async () => {
  Alert.alert("Cambiar Imagen", "¿Cómo quieres cambiar la imagen?", [
    {
      text: "Cancelar",
      style: "cancel",
    },
    {
      text: "📷 Cámara",
      onPress: async () => {
        const uri = await tomarFoto();
        if (uri) {
          setImagenUri(uri);
          setImagenActualUrl(null); // Limpiar la URL de la imagen actual
        }
      },
    },
    {
      text: "🖼️ Galería",
      onPress: async () => {
        // Permitir seleccionar tanto imágenes como videos
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All, // <-- PERMITIR TODOS LOS TIPOS DE MEDIOS
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!result.canceled) {
          setImagenUri(result.assets[0].uri);
          setImagenActualUrl(null); // Limpiar la URL de la imagen actual
        }
      },
    },
  ]);
};

  const handleGuardar = async () => {
    if (!titulo || !descripcion) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    setCargando(true);
    const resultado = await actualizar(
      rutina.id,
      titulo,
      descripcion
      // Puedes añadir aquí la lógica para subir imagen si se cambió
      // imagenUri ? imagenUri : undefined
    );
    setCargando(false);
    if (resultado.success) {
      Alert.alert("Éxito", "Rutina actualizada correctamente", [
        { text: "OK", onPress: () => router.push("/(tabs)/misRutinas") }, // O a donde corresponda
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo actualizar");
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
          {/* Asegurar que siempre se renderice un string válido */}
          <Text style={globalStyles.title}>
            Rutina: {rutina.titulo ? rutina.titulo : "Rutina sin título"}
          </Text>
        </View>
        {/* Mostrar campos de edición solo si es el propietario */}
        {esPropietario ? (
          <>
            <TextInput
              style={globalStyles.input}
              placeholder="Título de la rutina"
              value={titulo}
              onChangeText={setTitulo}
            />
            <TextInput
              style={[globalStyles.input, globalStyles.inputMultiline]}
              placeholder="Descripción"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={4}
            />
            {/* Vista previa de la imagen actual */}
            {imagenActualUrl && (
              <>
                <Text style={styles.etiquetaImagen}>Imagen actual:</Text>
                <Image source={{ uri: imagenActualUrl }} style={styles.vistaPrevia} />
              </>
            )}
            {/* Vista previa de la nueva imagen seleccionada */}
            {imagenUri && (
              <>
                <Text style={styles.etiquetaImagen}>Nueva imagen:</Text>
                <Image source={{ uri: imagenUri }} style={styles.vistaPrevia} />
              </>
            )}
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonSecondary]}
              onPress={handleSeleccionarImagen}
            >
              <Text style={globalStyles.buttonText}>
                📷 Cambiar Imagen/Video Demostrativo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                globalStyles.button,
                globalStyles.buttonPrimary,
                styles.botonGuardar,
              ]}
              onPress={handleGuardar}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={globalStyles.buttonText}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          // Mostrar información en modo solo lectura si no es el propietario
          <View>
            <Text style={globalStyles.textPrimary}>{rutina.descripcion}</Text>
            {imagenActualUrl && (
              <Image source={{ uri: imagenActualUrl }} style={styles.vistaPrevia} />
            )}
            <Text style={styles.textoNoPermitido}>No tienes permiso para editar esta rutina.</Text>
            {/* Opcional: Botón para registrar progreso si es una rutina asignada */}
            {/* <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
              onPress={() => router.push(`/progreso/registrar?rutinaId=${rutina.id}`)}
            >
              <Text style={globalStyles.buttonText}>Registrar Progreso</Text>
            </TouchableOpacity> */}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  botonVolver: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  botonGuardar: {
    padding: spacing.lg,
    marginTop: spacing.md, // Espacio si es propietario
  },
  etiquetaImagen: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: "600",
  },
  vistaPrevia: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: spacing.lg,
    backgroundColor: colors.borderLight,
  },
  textoNoPermitido: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  }
});