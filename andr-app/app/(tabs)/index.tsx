// app/(tabs)/index.tsx (Pantalla principal según rol)
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useRutinas } from "../../src/presentation/hooks/useRutinas";
import { usePlanes } from "../../src/presentation/hooks/usePlanes";
import { globalStyles } from "../../src/styles/globalStyles";
import {
  borderRadius,
  colors,
  fontSize,
  spacing,
} from "../../src/styles/theme";

export default function HomeScreen() {
  const { usuario, cerrarSesion } = useAuth();
  const { rutinas: rutinasEntrenador, cargarRutinas } = useRutinas();
  const { planes: planesEntrenador, cargarPlanes } = usePlanes();
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const router = useRouter();

  React.useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      if (usuario?.rol === "entrenador") {
        await Promise.all([
          cargarRutinas(usuario.id),
          cargarPlanes(usuario.id)
        ]);
      }
      // Para usuario, no hay nada específico en Home, podría redirigir o mostrar mensaje
      setCargando(false);
    };
    cargarDatos();
  }, [usuario, cargarRutinas, cargarPlanes]);

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/login");
  };

  if (!usuario) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleRefresh = async () => {
    setRefrescando(true);
    if (usuario.rol === "entrenador") {
      await Promise.all([
        cargarRutinas(usuario.id),
        cargarPlanes(usuario.id)
      ]);
    }
    setRefrescando(false);
  };

  const mostrarContenidoEntrenador = () => (
    <>
      <Text style={styles.sectionTitle}>Tus Rutinas</Text>
      {rutinasEntrenador.length === 0 ? (
        <Text style={globalStyles.emptyState}>No tienes rutinas creadas</Text>
      ) : (
        <FlatList
          data={rutinasEntrenador.slice(0, 3)} // Mostrar solo las 3 primeras
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[globalStyles.card, styles.rutinaCard]}
              onPress={() => router.push(`/rutina/editar?id=${item.id}`)}
            >
              <Text style={styles.tituloReceta}>{item.titulo}</Text>
              <Text style={globalStyles.textSecondary} numberOfLines={2}>
                {item.descripcion}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
      <TouchableOpacity
        style={[globalStyles.button, globalStyles.buttonSecondary, styles.verMasButton]}
        onPress={() => router.push("/(tabs)/misRutinas")}
      >
        <Text style={globalStyles.buttonText}>Ver todas las rutinas</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Tus Planes</Text>
      {planesEntrenador.length === 0 ? (
        <Text style={globalStyles.emptyState}>No tienes planes creados</Text>
      ) : (
        <FlatList
          data={planesEntrenador.slice(0, 3)} // Mostrar solo las 3 primeras
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[globalStyles.card, styles.rutinaCard]}
              onPress={() => router.push(`/plan/editar?id=${item.id}`)}
            >
              <Text style={styles.tituloReceta}>{item.nombre}</Text>
              <Text style={globalStyles.textSecondary} numberOfLines={2}>
                {item.descripcion}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
      <TouchableOpacity
        style={[globalStyles.button, globalStyles.buttonSecondary, styles.verMasButton]}
        onPress={() => router.push("/(tabs)/misPlanes")}
      >
        <Text style={globalStyles.buttonText}>Ver todos los planes</Text>
      </TouchableOpacity>
    </>
  );

  const mostrarContenidoUsuario = () => (
    <View style={globalStyles.containerCentered}>
      <Text style={styles.saludo}>¡Hola, {usuario.nombre || usuario.email}!</Text>
      <Text style={globalStyles.textSecondary}>Bienvenido a tu panel de usuario.</Text>
      <Text style={globalStyles.textSecondary}>Revisa tus rutinas asignadas o registra tu progreso.</Text>
      <TouchableOpacity
        style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.lg }]}
        onPress={() => router.push("/(tabs)/rutinasAsignadas")}
      >
        <Text style={globalStyles.buttonText}>Ver Rutinas Asignadas</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[globalStyles.button, globalStyles.buttonSecondary, { marginTop: spacing.sm }]}
        onPress={() => router.push("/(tabs)/progreso")}
      >
        <Text style={globalStyles.buttonText}>Mi Progreso</Text>
      </TouchableOpacity>
    </View>
  );

  if (cargando) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.header}>
        <View>
          <Text style={styles.saludo}>¡Hola!</Text>
          <Text style={globalStyles.textSecondary}>{usuario.email}</Text>
          <Text style={styles.rol}>
            {usuario.rol === "entrenador" ? "🏋️‍♂️ Entrenador" : "🏃‍♂️ Usuario"}
            {/* {usuario.rol === "entrenador" ? "🏃‍♂️ Usuario" : "🏋️‍♂️ Entrenador" } */}


          </Text>
        </View>
        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonDanger,
            styles.botonCerrar,
          ]}
          onPress={handleCerrarSesion}
        >
          <Text style={globalStyles.buttonText}>Salir</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={[]}
        ListHeaderComponent={usuario?.rol === "entrenador" ? mostrarContenidoEntrenador : mostrarContenidoUsuario}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <Text style={globalStyles.emptyState}>
            No hay datos disponibles
          </Text>
        }
        renderItem={() => null} // No renderiza items de la lista, solo el header
        keyExtractor={() => "header"} // Clave única para el header
      />
    </View>
  );
}

const styles = StyleSheet.create({
  saludo: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  rol: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs / 2,
    fontWeight: "500",
  },
  botonCerrar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginVertical: spacing.md,
  },
  rutinaCard: {
    width: 200,
  },
  tituloReceta: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  verMasButton: {
    marginVertical: spacing.md,
  },
});