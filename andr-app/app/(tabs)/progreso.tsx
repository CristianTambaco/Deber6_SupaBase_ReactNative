// app/(tabs)/progreso.tsx (Solo para usuarios)
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react"; //
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
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

export default function ProgresoScreen() {
  const { usuario, esChef: esEntrenador } = useAuth(); // Renombrar para claridad
  const { progreso, cargando, cargarProgreso } = useProgreso();
  const [refrescando, setRefrescando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!esEntrenador && usuario?.id) { // Solo si es usuario
      cargarProgreso(usuario.id);
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
      await cargarProgreso(usuario.id);
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
      <View style={styles.header}>
        <Text style={globalStyles.title}>Mi Progreso</Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary]}
          onPress={() => router.push("/progreso/registrar")}
        >
          <Text style={globalStyles.buttonText}>+ Registrar</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={progreso}
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
            No has registrado progreso aún
          </Text>
        }
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <Text style={styles.fechaProgreso}>
              {new Date(item.fecha_registro).toLocaleDateString('es-ES')}
            </Text>
            {item.comentarios ? (
              <Text style={globalStyles.textPrimary}>{item.comentarios}</Text>
            ) : (
              <Text style={globalStyles.textSecondary}>Sin comentarios</Text>
            )}
            {item.imagen_progreso_url ? (
              <Image
                source={{ uri: item.imagen_progreso_url }}
                style={styles.imagenProgreso}
              />
            ) : (
              <View style={styles.imagenPlaceholder}>
                <Text style={globalStyles.textTertiary}>Sin foto</Text>
              </View>
            )}
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
  textoNoUsuario: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fechaProgreso: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  imagenProgreso: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  imagenPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
});