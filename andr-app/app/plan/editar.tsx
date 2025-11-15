// app/plan/editar.tsx (Ver para todos, editar solo dueño)
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
  const { usuario } = useAuth(); // Quitamos 'esEntrenador'
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
  const [esPropietario, setEsPropietario] = useState(false); // <-- NUEVO ESTADO: Si el usuario actual es el dueño

  // Cargar el plan específico al montar el componente
  useEffect(() => {
    const cargarPlanEspecifico = async () => {
      if (!id || !usuario?.id) return; // Asegurarse de tener id y usuario

      try {
        // Consulta directa a Supabase para obtener el plan por ID
        // IMPORTANTE: Esta consulta DEBE tener RLS activadas en Supabase
        // para que solo devuelva el plan si el usuario tiene permiso (por ejemplo, si es el dueño o está asignado).
        // Asumiremos que RLS permite verlo si está asignado o es pública.
        // La verificación de propietario se hará después.
        const { data, error } = await supabase
          .from("planes_entrenamiento")
          .select("*") // <-- IMPORTANTE: Solo seleccionamos los campos de 'planes_entrenamiento'
          .eq("id", id)
          .single(); // Esperamos un solo resultado

        if (error) {
            if (error.code === 'PGRST116') { // Código para "Row not found" o RLS denegada
                Alert.alert("Error", "Plan no encontrado o no tienes permiso para verlo.");
            } else {
                Alert.alert("Error", "No se pudo cargar el plan: " + error.message);
            }
            console.error("Error al cargar el plan:", error);
            router.push("/(tabs)/misPlanes"); // O a donde corresponda si no se puede ver
            return;
        }

        if (data) {
          setPlan(data as PlanEntrenamiento);
          // Asegurar que siempre haya un string válido
          setNombre(data.nombre ?? "");
          setDescripcion(data.descripcion ?? "");
          // Cargar las rutinas asociadas a este plan específico
          const rutinasAsociadas = await cargarRutinasAsociadas(data.id);
          setRutinasSeleccionadas(rutinasAsociadas.map(r => r.id));
          // Verificar si el usuario actual es el propietario
          setEsPropietario(data.entrenador_id === usuario.id); // <-- Añadir esta línea
        }
      } catch (err) {
        console.error("Error inesperado al cargar el plan:", err);
        Alert.alert("Error", "Ocurrió un error inesperado al cargar el plan.");
        router.push("/(tabs)/misPlanes"); // O a donde corresponda
      } finally {
        setCargandoPlan(false); // Dejar de mostrar el indicador de carga del plan
      }
    };

    cargarPlanEspecifico();
  }, [id, usuario?.id]);

  // Cargar rutinas disponibles del entrenador (solo si es el propietario)
  useEffect(() => {
    const cargarRutinasEntrenador = async () => {
        if (esPropietario && usuario?.id) { // Solo cargar si es propietario
            await cargarRutinas(usuario.id);
            setCargandoRutinas(false); // Actualizar estado de carga de rutinas
        } else {
            setCargandoRutinas(false); // Si no es propietario, no hay rutinas para cargar desde su lista
        }
    };
    cargarRutinasEntrenador();
  }, [esPropietario, usuario?.id, cargarRutinas]); // Añadir esPropietario a las dependencias

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

  // --- REMOVIDO: if (!esEntrenador) ---

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
            onPress={() => router.push("/(tabs)/misPlanes")} // O a donde corresponda
            >
            <Text style={globalStyles.buttonText}>Volver</Text>
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
        { text: "OK", onPress: () => router.push("/(tabs)/misPlanes") }, // O a donde corresponda
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo actualizar");
    }
  };

  // --- NUEVO: Botón para asignar plan a usuarios (solo si es propietario) ---
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
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
          {/* Asegurar que siempre se renderice un string válido */}
          <Text style={globalStyles.title}>
            Plan: {plan.nombre ? plan.nombre : "Plan sin título"}
          </Text>
        </View>
        {/* Mostrar campos de edición solo si es el propietario */}
        {esPropietario ? (
          <>
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

            {/* Botón para asignar el plan a usuarios (solo si es propietario) */}
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
          </>
        ) : (
          // Mostrar información en modo solo lectura si no es el propietario
          <View>
            <Text style={globalStyles.textPrimary}>{plan.descripcion}</Text>
            <Text style={styles.textoNoPermitido}>No tienes permiso para editar este plan.</Text>
            {/* Opcional: Mostrar rutinas asociadas en modo lectura */}
            {/* <Text style={globalStyles.subtitle}>Rutinas del Plan:</Text>
            {rutinasSeleccionadas.length > 0 ? (
              <FlatList
                data={rutinasSeleccionadas} // Necesitarías cargar los objetos Rutina completos
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: spacing.sm }}
                renderItem={({ item }) => (
                  <View style={globalStyles.card}>
                    <Text style={styles.nombreRutina}>{item.titulo}</Text>
                    <Text style={globalStyles.textSecondary}>{item.descripcion}</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={globalStyles.textSecondary}>No hay rutinas asociadas.</Text>
            )} */}
          </View>
        )}
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
  botonGuardar: {
    padding: spacing.lg,
    marginTop: spacing.md, // Espacio si es propietario
  },
  // Estilo para el botón de asignar
  botonAsignar: {
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  textoNoPermitido: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  // 👇 NUEVOS ESTILOS QUE FALTABAN
  rutinaSeleccionada: {
    backgroundColor: colors.primaryLight,
  },
  nombreRutina: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});