// app/rutina/editar.tsx (Solo para entrenadores)
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

export default function EditarRutinaScreen() {
  const { id } = useLocalSearchParams();
  const { usuario, esChef: esEntrenador } = useAuth();
  // Solo necesitamos las funciones de actualización y subida de archivos del hook
  const { actualizar, seleccionarImagen, tomarFoto } = useRutinas();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoRutina, setCargandoRutina] = useState(true); // Nuevo estado para carga inicial
  const [rutina, setRutina] = useState<Rutina | null>(null); // Estado local para la rutina específica

  // Cargar la rutina específica al montar el componente
  useEffect(() => {
    const cargarRutinaEspecifica = async () => {
      if (!id || !usuario?.id) return; // Asegurarse de tener id y usuario

      try {
        // Consulta directa a Supabase para obtener la rutina por ID
        const { data, error } = await supabase
          .from("rutinas")
          .select("*")
          .eq("id", id)
          .eq("entrenador_id", usuario.id) // Asegurar que solo el dueño puede verla (si RLS lo permite, este filtro es redundante pero seguro)
          .single(); // Esperamos un solo resultado

        if (error) {
            if (error.code === 'PGRST116') { // Código para "Row not found"
                Alert.alert("Error", "Rutina no encontrada o no tienes permiso para editarla.");
            } else {
                Alert.alert("Error", "No se pudo cargar la rutina: " + error.message);
            }
            console.error("Error al cargar la rutina:", error);
            router.push("/(tabs)/misRutinas"); // Volver si no se encuentra
            return;
        }

        if (data) {
          setRutina(data as Rutina);
          setTitulo(data.titulo);
          setDescripcion(data.descripcion);
        }
      } catch (err) {
        console.error("Error inesperado al cargar la rutina:", err);
        Alert.alert("Error", "Ocurrió un error inesperado al cargar la rutina.");
        router.push("/(tabs)/misRutinas");
      } finally {
        setCargandoRutina(false); // Dejar de mostrar el indicador de carga
      }
    };

    cargarRutinaEspecifica();
  }, [id, usuario?.id]);

  // Validar que el usuario es el dueño (opcional si RLS ya lo impide)
  // Ya se verifica en la consulta con eq("entrenador_id", usuario.id)
  // y en la RLS de Supabase.

  if (!esEntrenador) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoNoChef}>
          Esta sección es solo para entrenadores 🏋️‍♂️
        </Text>
      </View>
    );
  }

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
            onPress={() => router.push("/(tabs)/misRutinas")}
            >
            <Text style={globalStyles.buttonText}>Volver a Rutinas</Text>
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
          }
        },
      },
      {
        text: "🖼️ Galería",
        onPress: async () => {
          const uri = await seleccionarImagen();
          if (uri) {
            setImagenUri(uri);
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
        { text: "OK", onPress: () => router.push("/(tabs)/misRutinas") },
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo actualizar");
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/misRutinas")}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Editar Rutina</Text>
        </View>
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
  textoNoChef: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  botonGuardar: {
    padding: spacing.lg,
  },
});