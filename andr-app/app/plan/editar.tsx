// app/plan/editar.tsx (Solo para entrenadores)
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { usePlanes } from "../../src/presentation/hooks/usePlanes";
import { useRutinas } from "../../src/presentation/hooks/useRutinas";
import { globalStyles } from "../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../src/styles/theme";
import { supabase } from "../../src/data/services/supabaseClient"; // Importar cliente Supabase directamente
import { PlanEntrenamiento } from "../../src/domain/models/PlanEntrenamiento"; // Asegúrate de importar el modelo

export default function EditarPlanScreen() {
  const { id } = useLocalSearchParams();
  const { usuario, esChef: esEntrenador } = useAuth();
  // Solo necesitamos las funciones de actualización y carga de rutinas del hook
  const { actualizar } = usePlanes();
  const { rutinas: rutinasDisponibles, cargarRutinas } = useRutinas();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [rutinasSeleccionadas, setRutinasSeleccionadas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoPlan, setCargandoPlan] = useState(true); // Nuevo estado para carga inicial del plan
  const [cargandoRutinas, setCargandoRutinas] = useState(true); // Nuevo estado para carga de rutinas
  const [plan, setPlan] = useState<PlanEntrenamiento | null>(null); // Estado local para el plan específico

  // Cargar el plan específico al montar el componente
  useEffect(() => {
    const cargarPlanEspecifico = async () => {
      if (!id || !usuario?.id) return; // Asegurarse de tener id y usuario

      try {
        // Consulta directa a Supabase para obtener el plan por ID
        const { data, error } = await supabase
          .from("planes_entrenamiento")
          .select("*") // <-- IMPORTANTE: Solo seleccionamos los campos de 'planes_entrenamiento'
          .eq("id", id)
          .eq("entrenador_id", usuario.id) // Asegurar que solo el dueño puede verlo
          .single(); // Esperamos un solo resultado

        if (error) {
            if (error.code === 'PGRST116') { // Código para "Row not found"
                Alert.alert("Error", "Plan no encontrado o no tienes permiso para editarlo.");
            } else {
                Alert.alert("Error", "No se pudo cargar el plan: " + error.message);
            }
            console.error("Error al cargar el plan:", error);
            router.push("/(tabs)/misPlanes"); // Volver si no se encuentra
            return;
        }

        if (data) {
          setPlan(data as PlanEntrenamiento);
          setNombre(data.nombre);
          setDescripcion(data.descripcion);
          // Cargar las rutinas asociadas a este plan específico
          const rutinasAsociadas = await cargarRutinasAsociadas(data.id);
          setRutinasSeleccionadas(rutinasAsociadas.map(r => r.id));
        }
      } catch (err) {
        console.error("Error inesperado al cargar el plan:", err);
        Alert.alert("Error", "Ocurrió un error inesperado al cargar el plan.");
        router.push("/(tabs)/misPlanes");
      } finally {
        setCargandoPlan(false); // Dejar de mostrar el indicador de carga del plan
      }
    };

    cargarPlanEspecifico();
  }, [id, usuario?.id]);

  // Cargar rutinas disponibles del entrenador
  useEffect(() => {
    const cargarRutinasEntrenador = async () => {
        if (esEntrenador && usuario?.id) {
            await cargarRutinas(usuario.id);
            setCargandoRutinas(false); // Actualizar estado de carga de rutinas
        }
    };
    cargarRutinasEntrenador();
  }, [esEntrenador, usuario?.id, cargarRutinas]);

  // Función auxiliar para cargar rutinas asociadas a un plan
  const cargarRutinasAsociadas = async (planId: string) => {
    try {
      // Consulta explícita para obtener las rutinas asociadas
      // Usamos un JOIN explícito con select
      const { data, error } = await supabase
        .from("rutinas")
        .select(`
          id,
          titulo,
          descripcion
        `) // Solo seleccionamos los campos que necesitamos
        .in(
          "id",
          // Primero obtenemos los IDs de las rutinas desde plan_rutina
          await getRutinaIdsForPlan(planId)
        );

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error al cargar rutinas asociadas:", error);
      return [];
    }
  };

  // Función auxiliar para obtener los IDs de las rutinas de un plan
  const getRutinaIdsForPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from("plan_rutina")
        .select("rutina_id")
        .eq("plan_id", planId);

      if (error) throw error;
      // Devolvemos un array de strings con los IDs
      return data.map(item => item.rutina_id);
    } catch (error) {
      console.error("Error al obtener IDs de rutinas para el plan:", error);
      return [];
    }
  };

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

  // Si aún está cargando el plan o las rutinas, mostramos el indicador
  if (cargandoPlan || cargandoRutinas) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.textSecondary}>Cargando plan y rutinas...</Text>
      </View>
    );
  }

  // Si no se encontró el plan (por ejemplo, si el ID es inválido o no pertenece al usuario)
  if (!plan) {
     return (
        <View style={globalStyles.containerCentered}>
            <Text style={globalStyles.textSecondary}>Plan no encontrado</Text>
            <TouchableOpacity
            style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
            onPress={() => router.push("/(tabs)/misPlanes")}
            >
            <Text style={globalStyles.buttonText}>Volver a Planes</Text>
            </TouchableOpacity>
        </View>
     );
  }

  const toggleRutina = (id: string) => {
    if (rutinasSeleccionadas.includes(id)) {
      setRutinasSeleccionadas(rutinasSeleccionadas.filter(rId => rId !== id));
    } else {
      setRutinasSeleccionadas([...rutinasSeleccionadas, id]);
    }
  };

  const handleGuardar = async () => {
    if (!nombre || !descripcion) {
      Alert.alert("Error", "Completa todos los campos obligatorios (nombre y descripción).");
      return;
    }
    setCargando(true);
    const resultado = await actualizar(
      plan.id,
      nombre,
      descripcion,
      rutinasSeleccionadas // <-- Este array se pasa al caso de uso
    );
    setCargando(false);
    if (resultado.success) {
      Alert.alert("Éxito", "Plan actualizado correctamente", [
        { text: "OK", onPress: () => router.push("/(tabs)/misPlanes") },
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo actualizar");
    }
  };

  // --- NUEVO: Botón para asignar plan a usuarios ---
  const handleAsignar = () => {
    if (id) {
      router.push(`/plan/${id}/asignar`);
    } else {
      Alert.alert("Error", "ID de plan no disponible.");
    }
  };

  return (
    <View style={globalStyles.container}> 
      <View style={globalStyles.contentPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/misPlanes")}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Editar Plan</Text>
        </View>
        <TextInput
          style={globalStyles.input}
          placeholder="Nombre del plan"
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          style={[globalStyles.input, globalStyles.inputMultiline]}
          placeholder="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={4}
        />
        <Text style={globalStyles.subtitle}>Selecciona Rutinas:</Text>
        {rutinasDisponibles.length === 0 ? (
          <Text style={globalStyles.emptyState}>No tienes rutinas para asignar</Text>
        ) : (
          <FlatList
            data={rutinasDisponibles}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: spacing.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  globalStyles.card,
                  rutinasSeleccionadas.includes(item.id) && styles.rutinaSeleccionada
                ]}
                onPress={() => toggleRutina(item.id)}
              >
                <Text style={styles.nombreRutina}>{item.titulo}</Text>
                <Text style={globalStyles.textSecondary}>{item.descripcion}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Botón para asignar el plan a usuarios */}
        <TouchableOpacity
          style={[
            globalStyles.button,
            globalStyles.buttonSecondary,
            styles.botonAsignar,
          ]}
          onPress={handleAsignar}
        >
          <Text style={globalStyles.buttonText}>👤 Asignar a Usuarios</Text>
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
  textoNoChef: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  rutinaSeleccionada: {
    backgroundColor: colors.primaryLight,
  },
  nombreRutina: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  botonGuardar: {
    padding: spacing.lg,
  },
  // Estilo para el botón de asignar
  botonAsignar: {
    padding: spacing.lg,
    marginTop: spacing.md,
  },
});