// app/(tabs)/misRutinas.tsx (Solo para entrenadores)
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react"; // 
import {
  ActivityIndicator,
  Alert,
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

export default function MisRutinasScreen() {
  const { usuario, esChef: esEntrenador } = useAuth(); // Renombrar para claridad
  const { rutinas, cargando, cargarRutinas, eliminar } = useRutinas();
  const [refrescando, setRefrescando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (esEntrenador && usuario?.id) {
      cargarRutinas(usuario.id);
    }
  }, [esEntrenador, usuario?.id]);

  if (!esEntrenador) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoNoChef}>
          Esta sección es solo para entrenadores 🏋️‍♂️
        </Text>
      </View>
    );
  }

  const handleRefresh = async () => {
    setRefrescando(true);
    if (usuario?.id) {
      await cargarRutinas(usuario.id);
    }
    setRefrescando(false);
  };

  const handleEliminar = (rutinaId: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const resultado = await eliminar(rutinaId);
            if (resultado.success) {
              Alert.alert("Éxito", "Rutina eliminada correctamente");
              // Recargar no es necesario si el hook lo hace internamente
            } else {
              Alert.alert("Error", resultado.error || "No se pudo eliminar");
            }
          },
        },
      ]
    );
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
      <View style={styles.header}>
        <Text style={globalStyles.title}>Mis Rutinas</Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary]}
          onPress={() => router.push("/rutina/crear")}
        >
          <Text style={globalStyles.buttonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>
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
            No tienes rutinas creadas
          </Text>
        }
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <Text style={styles.tituloRutina}>{item.titulo}</Text>
            <Text style={globalStyles.textSecondary} numberOfLines={2}>
              {item.descripcion}
            </Text>
            <View style={styles.botonesAccion}>
              <TouchableOpacity
                style={[
                  globalStyles.button,
                  globalStyles.buttonSecondary,
                  styles.botonAccion,
                ]}
                onPress={() => router.push(`/rutina/editar?id=${item.id}`)}
              >
                <Text style={globalStyles.buttonText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  globalStyles.button,
                  globalStyles.buttonDanger,
                  styles.botonAccion,
                ]}
                onPress={() => handleEliminar(item.id)}
              >
                <Text style={globalStyles.buttonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  textoNoChef: {
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
  botonesAccion: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  botonAccion: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
});