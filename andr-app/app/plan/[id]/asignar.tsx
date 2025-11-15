// app/plan/[id]/asignar.tsx (Asignar plan a usuarios - Solo para entrenadores)
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../src/presentation/hooks/useAuth";
import { usePlanes } from "../../../src/presentation/hooks/usePlanes";
import { globalStyles } from "../../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../../src/styles/theme";
import { supabase } from "../../../src/data/services/supabaseClient";
import { Usuario } from "../../../src/domain/models/Usuario";

export default function AsignarPlanScreen() {
  const { id: planId } = useLocalSearchParams<{ id: string }>();
  const { usuario, esEntrenador: esEntrenador } = useAuth();
  const { asignarPlan, desasignarPlan } = usePlanes(); // Usamos las funciones del hook
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Record<string, boolean>>({});
  const [usuariosAsignados, setUsuariosAsignados] = useState<Record<string, boolean>>({});

  useEffect(() => {
  // --- VALIDACIÓN INICIAL: Verifica rol y parámetros ---
  // if (!esEntrenador) {
  //   Alert.alert("Acceso Denegado", "Solo los entrenadores pueden asignar planes.");
  //   router.replace("/(tabs)/misPlanes");
  //   return;
  // }

  // Validar que planId y usuario estén definidos y sean válidos
  if (!planId || !usuario) { // <-- Primero verifica que usuario exista


    // Alert.alert("Error", "ID de plan o usuario no válido.");
    
    return;
  }

  // Ahora, dentro de este bloque, TypeScript sabe que `usuario` no es null
  cargarDatos(usuario); // <-- Pasamos el usuario como argumento
}, [planId, usuario, esEntrenador]); // <-- Dependencias correctas

// Modificar la función cargarDatos para recibir el usuario
// Modificar la función cargarDatos para recibir el usuario
  const cargarDatos = async (usuario: Usuario) => { // <-- Tipado explícito
    try {
      setCargando(true);
      // 1. Cargar todos los usuarios no entrenadores (excluyendo al actual)
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, email, nombre, rol")
        .neq("id", usuario.id) // <-- Ahora es seguro, porque `usuario` es de tipo `Usuario`
        .neq("rol", "entrenador"); // Excluir a otros entrenadores
      if (usuariosError) throw usuariosError;

      // 2. Cargar usuarios ya asignados a este plan
      const { data: asignadosData, error: asignadosError } = await supabase
        .from("usuario_plan")
        .select("usuario_id")
        .eq("plan_id", planId); // Ahora está garantizado que planId existe
      if (asignadosError) throw asignadosError;

      const asignadosMap: Record<string, boolean> = {};
      asignadosData.forEach((item) => {
        asignadosMap[item.usuario_id] = true;
      });

      // Inicializar estados
      setUsuarios(usuariosData as Usuario[]);
      setUsuariosAsignados(asignadosMap);

      // Inicializar usuariosSeleccionados basado en asignados
      const seleccionadosInit: Record<string, boolean> = {};
      usuariosData.forEach((u) => {
        seleccionadosInit[u.id] = asignadosMap[u.id] || false; // Si está asignado, inicialmente está seleccionado
      });
      setUsuariosSeleccionados(seleccionadosInit);
    } catch (error) {
      console.error("Error al cargar datos para asignar plan:", error);
      Alert.alert("Error", "No se pudieron cargar los usuarios o la asignación actual.");
    } finally {
      setCargando(false);
    }
  };

  const toggleUsuario = (userId: string) => {
    // Permitir seleccionar/deseleccionar cualquier usuario
    setUsuariosSeleccionados((prev) => ({
      ...prev,
      [userId]: !prev[userId], // Cambiar el estado de selección
    }));
  };

  const handleGuardar = async () => {
    const idsSeleccionados = Object.entries(usuariosSeleccionados)
      .filter(([id, isSelected]) => isSelected && !usuariosAsignados[id]) // Solo nuevos seleccionados
      .map(([id]) => id);

    const idsADesasignar = Object.entries(usuariosAsignados)
      .filter(([id, isAsignado]) => isAsignado && !usuariosSeleccionados[id]) // Asignados pero no seleccionados ahora
      .map(([id]) => id);

    if (idsSeleccionados.length === 0 && idsADesasignar.length === 0) {
      Alert.alert("Sin cambios", "No se han realizado cambios en las asignaciones.");
      return;
    }

    setCargando(true);
    let exitos = 0;
    let errores = 0;

    // Asignar nuevos
    for (const userId of idsSeleccionados) {
      const resultado = await asignarPlan(planId, userId);
      if (resultado.success) {
        exitos++;
      } else {
        console.error(`Error al asignar plan ${planId} a usuario ${userId}:`, resultado.error);
        errores++;
      }
    }

    // Desasignar quitados
    for (const userId of idsADesasignar) {
      const resultado = await desasignarPlan(planId, userId);
      if (resultado.success) {
        exitos++;
      } else {
        console.error(`Error al desasignar plan ${planId} a usuario ${userId}:`, resultado.error);
        errores++;
      }
    }

    setCargando(false);

    if (errores > 0) {
      Alert.alert(
        "Problemas",
        `Se asignaron/desasignaron ${exitos} usuarios, pero hubo ${errores} errores.`
      );
    } else if (exitos > 0) {
      Alert.alert("Éxito", `Se asignaron/desasignaron ${exitos} usuarios correctamente.`, [
        { text: "OK", onPress: () => router.push(`/plan/editar?id=${planId}`) },
      ]);
    } else {
      Alert.alert("Éxito", "No se realizaron cambios.", [
        { text: "OK", onPress: () => router.push(`/plan/editar?id=${planId}`) },
      ]);
    }
  };

  if (!esEntrenador) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoNoEntrenador}>
          Esta sección es solo para entrenadores 🏋️‍♂️
        </Text>
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.textSecondary}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push(`/plan/editar?id=${planId}`)}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Asignar Plan</Text>
        </View>
        <Text style={globalStyles.textSecondary}>
          Selecciona los usuarios a los que quieres asignar este plan.
        </Text>
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm, marginVertical: spacing.md }}
          renderItem={({ item }) => {
            const estaSeleccionado = usuariosSeleccionados[item.id];
            const estaAsignado = usuariosAsignados[item.id];
            return (
              <TouchableOpacity
                style={[
                  globalStyles.card,
                  estaSeleccionado && styles.usuarioSeleccionado,
                  // No deshabilitar si ya está asignado, permitir deselección
                  // estaAsignado && styles.usuarioDeshabilitado, // Eliminado
                ]}
                onPress={() => toggleUsuario(item.id)} // Permitir tocar siempre
                // disabled={estaAsignado} // Eliminado
              >
                <View style={styles.usuarioInfo}>
                  <Text style={styles.usuarioNombre}>{item.nombre || item.email}</Text>
                  <Text style={globalStyles.textSecondary}>{item.email}</Text>
                </View>
                <View style={styles.estadoAsignacion}>
                  {estaAsignado ? (
                    <Text style={styles.estadoAsignado}>Asignado</Text>
                  ) : estaSeleccionado ? (
                    <Text style={styles.estadoSeleccionado}>Seleccionado</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
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
            <Text style={globalStyles.buttonText}>Guardar Asignaciones</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  textoNoEntrenador: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  usuarioSeleccionado: {
    backgroundColor: colors.primaryLight,
  },
  usuarioDeshabilitado: {
    opacity: 0.6, // Hacer visualmente deshabilitado
  },
  usuarioInfo: {
    flex: 1,
  },
  usuarioNombre: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  estadoAsignacion: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  estadoAsignado: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600',
  },
  estadoSeleccionado: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: '600',
  },
  botonGuardar: {
    padding: spacing.lg,
    marginTop: spacing.md,
  },
});