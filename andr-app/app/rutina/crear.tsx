// app/rutina/crear.tsx (Solo para entrenadores)
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import {
  borderRadius,
  colors,
  fontSize,
  spacing,
} from "../../src/styles/theme";

// 👇 IMPORTACIÓN CORRECTA DE ImagePicker
import * as ImagePicker from 'expo-image-picker';

export default function CrearRutinaScreen() {
  const { usuario, esEntrenador: esEntrenador } = useAuth();
  const { crear, seleccionarImagen, tomarFoto, subirFotoProgreso } = useRutinas();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // --- NUEVA FUNCIÓN: Mostrar opciones para agregar imagen o video ---
  const handleSeleccionarImagenOVideo = async () => {
    Alert.alert("Agregar Imagen/Video", "¿Cómo quieres agregar la demostración?", [
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
          // Permitir seleccionar tanto imágenes como videos
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, // <-- PERMITIR TODOS LOS TIPOS DE MEDIOS
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
          if (!result.canceled) {
            setImagenUri(result.assets[0].uri);
          }
        },
      },
    ]);
  };

  const handleCrear = async () => {
    if (!titulo || !descripcion) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    if (!usuario) {
        Alert.alert("Error", "Usuario no autenticado");
        return;
    }
    setCargando(true);
    // PASO 1: Subir la imagen/video si existe
    let nuevaUrlImagen: string | undefined = undefined;
    if (imagenUri) {
      // Usar el método del hook para subir la imagen/video
      const urlSubida = await subirFotoProgreso(imagenUri);
      nuevaUrlImagen = urlSubida;
    }
    // PASO 2: Crear la rutina con los datos
    const resultado = await crear(titulo, descripcion, usuario.id, nuevaUrlImagen);
    setCargando(false);
    if (resultado.success) {
      Alert.alert("Éxito", "Rutina creada correctamente", [
        {
          text: "OK",
          onPress: () => {
            setTitulo("");
            setDescripcion("");
            setImagenUri(null);
            router.push("/(tabs)/misRutinas");
          },
        },
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo crear la rutina");
    }
  };

  if (!esEntrenador) {
    return (
      <View style={globalStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)")}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={globalStyles.containerCentered}>
          <Text style={styles.textoNoEntrenador}>
            Esta sección es solo para entrenadores 🏋️‍♂️
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/misRutinas")}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Nueva Rutina</Text>
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
          onPress={handleSeleccionarImagenOVideo} // 👈 Cambiado a la nueva función
        >
          <Text style={globalStyles.buttonText}>
            📷 Agregar Imagen/Video Demostrativo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonPrimary,
            styles.botonCrear,
          ]}
          onPress={handleCrear}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>Crear Rutina</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.sm,
  },
  botonVolver: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  textoNoEntrenador: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  botonCrear: {
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
});