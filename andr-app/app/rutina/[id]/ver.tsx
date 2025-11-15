// app/rutina/[id]/ver.tsx (Pantalla de detalle de rutina - para entrenadores y usuarios)
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../src/presentation/hooks/useAuth";
import { globalStyles } from "../../../src/styles/globalStyles";
import { colors, fontSize, spacing } from "../../../src/styles/theme";
import { supabase } from "../../../src/data/services/supabaseClient";
import { Rutina } from "../../../src/domain/models/Rutina";
import { Ejercicio } from "../../../src/domain/models/Ejercicio"; // Asegúrate de tener el modelo

export default function VerRutinaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuth();
  const router = useRouter();

  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [esAsignada, setEsAsignada] = useState(false); // Nuevo estado para verificar asignación

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "ID de rutina no válido.");
      router.back();
      return;
    }
    cargarRutinaEspecifica(id);
  }, [id]);

  // Función para cargar la rutina y verificar si está asignada
  const cargarRutinaEspecifica = async (rutinaId: string) => {
    try {
      setCargando(true);

      // 1. Cargar la rutina
      const { data: rutinaData, error: rutinaError } = await supabase
        .from("rutinas")
        .select("*")
        .eq("id", rutinaId)
        .single();

      if (rutinaError) {
        if (rutinaError.code === 'PGRST116') { // Row not found
          Alert.alert("Error", "Rutina no encontrada.");
        } else {
          Alert.alert("Error", "No se pudo cargar la rutina: " + rutinaError.message);
        }
        console.error("Error al cargar la rutina:", rutinaError);
        router.back(); // Volver si no se encuentra
        return;
      }

      if (!rutinaData) {
        Alert.alert("Error", "Rutina no encontrada.");
        router.back();
        return;
      }

      setRutina(rutinaData as Rutina);

      // 2. Cargar ejercicios de la rutina (si la tabla 'ejercicios' existe y está relacionada)
      // Asumiendo que tienes una tabla 'ejercicios' con columna 'rutina_id'
      // Si no tienes esta tabla, puedes omitir esta parte
      const { data: ejerciciosData, error: ejerciciosError } = await supabase
        .from("ejercicios") // Reemplaza con el nombre correcto de tu tabla de ejercicios
        .select("*")
        .eq("rutina_id", rutinaId)
        .order("orden", { ascending: true }); // Ordenar por un campo 'orden' si existe

      if (ejerciciosError) {
        console.error("Error al cargar ejercicios:", ejerciciosError);
        // No es crítico, la rutina se puede mostrar sin ejercicios
      } else {
        setEjercicios(ejerciciosData as Ejercicio[]);
      }

      // 3. Verificar si la rutina está asignada al usuario actual (si es un usuario)
      if (usuario && usuario.rol === "usuario") {
        const { data: asignacionesData, error: asignacionesError } = await supabase
          .from("usuario_plan") // Asumiendo que las rutinas se asignan a través de planes
          .select(`
            plan_id
          `)
          .eq("usuario_id", usuario.id);

        if (asignacionesError) {
          console.error("Error al verificar asignaciones:", asignacionesError);
          // Si falla, asumimos que no está asignada para evitar bloquear la vista
          setEsAsignada(false);
        } else {
          const planIdsAsignados = asignacionesData.map(item => item.plan_id);
          // Consulta para ver si la rutina está en alguno de los planes asignados
          const { data: rutinasEnPlanesData, error: rutinasEnPlanesError } = await supabase
            .from("plan_rutina") // Tabla intermedia entre plan y rutina
            .select("rutina_id")
            .in("plan_id", planIdsAsignados)
            .eq("rutina_id", rutinaId);

          if (rutinasEnPlanesError) {
            console.error("Error al verificar rutinas en planes:", rutinasEnPlanesError);
            setEsAsignada(false);
          } else {
             setEsAsignada(rutinasEnPlanesData.length > 0);
          }
        }
      } else if (usuario && usuario.rol === "entrenador") {
        // Si es entrenador, verificar si es suya
        setEsAsignada(rutinaData.entrenador_id === usuario.id);
      }

    } catch (error) {
      console.error("Error inesperado al cargar la rutina:", error);
      Alert.alert("Error", "Ocurrió un error inesperado.");
      router.back();
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.textSecondary}>Cargando rutina...</Text>
      </View>
    );
  }

  if (!rutina) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.textSecondary}>Rutina no encontrada</Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={globalStyles.buttonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Validar acceso (Opcional: puede hacerse también en RLS de Supabase)
  // const esPropia = rutina.entrenador_id === usuario?.id;
  // const puedeVer = esPropia || esAsignada;
  // if (!puedeVer) {
  //   return (
  //     <View style={globalStyles.containerCentered}>
  //       <Text style={globalStyles.textSecondary}>No tienes permiso para ver esta rutina.</Text>
  //       <TouchableOpacity
  //         style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
  //         onPress={() => router.push("/(tabs)/rutinasAsignadas")}
  //       >
  //         <Text style={globalStyles.buttonText}>Volver a Rutinas Asignadas</Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.contentPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>{rutina.titulo}</Text>
        </View>

        <Text style={globalStyles.textPrimary}>{rutina.descripcion}</Text>

        {/* Vista previa de la imagen/video demostrativo */}
        {rutina.imagen_demo_url ? (
          <Image source={{ uri: rutina.imagen_demo_url }} style={styles.imagenDemo} />
        ) : (
          <View style={styles.imagenPlaceholder}>
            <Text style={globalStyles.textTertiary}>No hay demostración disponible</Text>
          </View>
        )}

        {/* Botón para registrar progreso (solo si es una rutina asignada al usuario) */}
        {esAsignada && usuario?.rol === "usuario" && (
          <TouchableOpacity
            style={[globalStyles.button, globalStyles.buttonPrimary, styles.botonProgreso]}
            onPress={() => router.push(`/progreso/registrar?rutinaId=${rutina.id}`)}
          >
            <Text style={globalStyles.buttonText}>Registrar Progreso</Text>
          </TouchableOpacity>
        )}

        {/* Listado de Ejercicios (si existen) */}
        {ejercicios.length > 0 && (
          <>
            <Text style={globalStyles.subtitle}>Ejercicios:</Text>
            <View style={styles.listaEjercicios}>
              {ejercicios.map((ejercicio) => (
                <View key={ejercicio.id} style={globalStyles.card}>
                  <Text style={styles.nombreEjercicio}>{ejercicio.nombre}</Text>
                  {ejercicio.descripcion && (
                    <Text style={globalStyles.textSecondary}>{ejercicio.descripcion}</Text>
                  )}
                  <View style={styles.detalleEjercicio}>
                    {ejercicio.series && <Text style={styles.textoDetalle}>S: {ejercicio.series}</Text>}
                    {ejercicio.repeticiones && <Text style={styles.textoDetalle}>R: {ejercicio.repeticiones}</Text>}
                  </View>
                  {/* Vista previa de video/demo del ejercicio si existe */}
                  {ejercicio.video_demo_url && (
                    <Image source={{ uri: ejercicio.video_demo_url }} style={styles.imagenDemoEjercicio} />
                  )}
                  {ejercicio.imagen_demo_url && (
                    <Image source={{ uri: ejercicio.imagen_demo_url }} style={styles.imagenDemoEjercicio} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
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
  imagenDemo: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: spacing.lg,
    backgroundColor: colors.borderLight,
  },
  imagenPlaceholder: {
    width: "100%",
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: spacing.lg,
    backgroundColor: colors.borderLight,
  },
  botonProgreso: {
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  listaEjercicios: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  nombreEjercicio: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  detalleEjercicio: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  textoDetalle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  imagenDemoEjercicio: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginTop: spacing.sm,
    backgroundColor: colors.borderLight,
  },
});