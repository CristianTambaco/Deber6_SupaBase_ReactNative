// app/progreso/registrar.tsx (Solo para usuarios)
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useProgreso } from "../../src/presentation/hooks/useProgreso";
import { globalStyles } from "../../src/styles/globalStyles";
import {
  borderRadius,
  colors,
  fontSize,
  spacing,
} from "../../src/styles/theme";

export default function RegistrarProgresoScreen() {
  const { rutinaId } = useLocalSearchParams(); // Opcional: ID de la rutina relacionada
  const { usuario, esEntrenador: esEntrenador } = useAuth();
  const { registrar, seleccionarImagen, tomarFoto } = useProgreso();
  const router = useRouter();
  const [comentarios, setComentarios] = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  if (esEntrenador) {
    return (
      <View style={globalStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)")}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={globalStyles.containerCentered}>
          <Text style={styles.textoNoUsuario}>
            Esta sección es solo para usuarios 🏃‍♂️
          </Text>
        </View>
      </View>
    );
  }

  const handleSeleccionarImagen = async () => {
    Alert.alert("Agregar Foto", "¿Cómo quieres agregar la foto de progreso?", [
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

  const handleRegistrar = async () => {
  if (!comentarios && !imagenUri) {
    Alert.alert("Error", "Ingresa comentarios o sube una foto");
    return;
  }
  if (!usuario) {
      Alert.alert("Error", "Usuario no autenticado");
      return;
  }
  setCargando(true);
  // Convertir null a undefined para ambos parámetros
  const resultado = await registrar(
    usuario.id,
    comentarios,
    imagenUri !== null ? imagenUri : undefined, // <-- Conversión aquí
    // rutinaId !== null ? rutinaId : undefined      // <-- Ya estaba correcto
  );
  setCargando(false);
  if (resultado.success) {
    Alert.alert("Éxito", "Progreso registrado correctamente", [
      {
        text: "OK",
        onPress: () => {
          setComentarios("");
          setImagenUri(null);
          router.push("/(tabs)/progreso");
        },
      },
    ]);
  } else {
    Alert.alert("Error", resultado.error || "No se pudo registrar el progreso");
  }
};

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/progreso")}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Registrar Progreso</Text>
        </View>
        <TextInput
          style={[globalStyles.input, globalStyles.inputMultiline]}
          placeholder="Comentarios sobre tu progreso..."
          value={comentarios}
          onChangeText={setComentarios}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonSecondary]}
          onPress={handleSeleccionarImagen}
        >
          <Text style={globalStyles.buttonText}>
            {imagenUri ? "📷 Cambiar Foto" : "📷 Agregar Foto de Progreso"}
          </Text>
        </TouchableOpacity>
        {imagenUri && (
          <Image source={{ uri: imagenUri }} style={styles.vistaPrevia} />
        )}
        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonPrimary,
            styles.botonCrear,
          ]}
          onPress={handleRegistrar}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>Registrar</Text>
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
  textoNoUsuario: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  vistaPrevia: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
  },
  botonCrear: {
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
});