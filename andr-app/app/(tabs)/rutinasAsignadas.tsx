// app/(tabs)/rutinasAsignadas.tsx (Solo para usuarios)
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react"; // 
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useRutinas } from "../../src/presentation/hooks/useRutinas";
import { globalStyles } from "../../src/styles/globalStyles";
import {
  colors,
  fontSize,
  spacing,
} from "../../src/styles/theme";

export default function RutinasAsignadasScreen() {
  const { usuario, esEntrenador: esEntrenador } = useAuth(); // Renombrar para claridad
  const { rutinas, cargando, cargarRutinasAsignadas } = useRutinas();
  const [refrescando, setRefrescando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!esEntrenador && usuario?.id) { // Solo si es usuario
      cargarRutinasAsignadas(usuario.id);
    }
  }, [esEntrenador, usuario?.id]);

  if (esEntrenador) { // Si es entrenador, redirigir o mostrar mensaje
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoNoUsuario}>
          Esta sección es solo para usuarios 🏃‍♂️
        </Text>
      </View>
    );
  }

  const handleRefresh = async () => {
    setRefrescando(true);
    if (usuario?.id) {
      await cargarRutinasAsignadas(usuario.id);
    }
    setRefrescando(false);
  };

  if (cargando) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Rutinas Asignadas</Text>
      <FlatList
        data={rutinas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <Text style={globalStyles.emptyState}>
            No tienes rutinas asignadas
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={globalStyles.card}
            onPress={() => router.push({ // 👈 CORRECCIÓN AQUÍ
              pathname: '/rutina/[id]/ver', // Ruta definida en los archivos
              params: { id: item.id }, // Parámetro dinámico
            })}
          >
            <Text style={styles.tituloRutina}>{item.titulo}</Text>
            <Text style={globalStyles.textSecondary} numberOfLines={2}>
              {item.descripcion}
            </Text>
            <TouchableOpacity
              style={[
                globalStyles.button,
                globalStyles.buttonSecondary,
                { marginTop: spacing.sm }
              ]}
              onPress={() => router.push(`/progreso/registrar?rutinaId=${item.id}`)} // Opción para registrar progreso por rutina
            >
              <Text style={globalStyles.buttonText}>Registrar Progreso</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  textoNoUsuario: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tituloRutina: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
});