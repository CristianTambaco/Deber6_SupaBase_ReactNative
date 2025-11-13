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

export default function EditarRutinaScreen() {
  const { id } = useLocalSearchParams();
  const { usuario, esChef: esEntrenador } = useAuth();
  const { rutinas, actualizar, seleccionarImagen, tomarFoto } = useRutinas();
  const router = useRouter();
  const rutina = rutinas.find((r) => r.id === id);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Cargar datos de la rutina al iniciar
  useEffect(() => {
    if (rutina) {
      setTitulo(rutina.titulo);
      setDescripcion(rutina.descripcion);
    }
  }, [rutina]);

  // Validar que el usuario es el dueño
  if (!rutina) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.textSecondary}>Rutina no encontrada</Text>
      </View>
    );
  }
  if (rutina.entrenador_id !== usuario?.id) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoError}>
          No tienes permiso para editar esta rutina
        </Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary]}
          onPress={() => router.back()}
        >
          <Text style={globalStyles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!esEntrenador) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoNoChef}>
          Esta sección es solo para entrenadores 🏋️‍♂️
        </Text>
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
            {/* Cambiar texto según si hay imagen o no */}
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
  textoError: {
    fontSize: fontSize.lg,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
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