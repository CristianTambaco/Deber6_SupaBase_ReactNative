// app/(tabs)/misPlanes.tsx (Solo para entrenadores)
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
import { usePlanes } from "../../src/presentation/hooks/usePlanes";
import { globalStyles } from "../../src/styles/globalStyles";
import {
  colors,
  fontSize,
  spacing,
} from "../../src/styles/theme";

export default function MisPlanesScreen() {
  const { usuario, esChef: esEntrenador } = useAuth(); // Renombrar para claridad
  const { planes, cargando, cargarPlanes, eliminar } = usePlanes();
  const [refrescando, setRefrescando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (esEntrenador && usuario?.id) {
      cargarPlanes(usuario.id);
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
      await cargarPlanes(usuario.id);
    }
    setRefrescando(false);
  };

  const handleEliminar = (planId: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar este plan? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const resultado = await eliminar(planId);
            if (resultado.success) {
              Alert.alert("Éxito", "Plan eliminado correctamente");
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
        <Text style={globalStyles.title}>Mis Planes</Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary]}
          onPress={() => router.push("/plan/crear")}
        >
          <Text style={globalStyles.buttonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={planes}
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
            No tienes planes creados
          </Text>
        }
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <Text style={styles.tituloPlan}>{item.nombre}</Text>
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
                onPress={() => router.push(`/plan/editar?id=${item.id}`)}
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
  tituloPlan: {
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