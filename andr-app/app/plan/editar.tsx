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

export default function EditarPlanScreen() {
  const { id } = useLocalSearchParams();
  const { usuario, esChef: esEntrenador } = useAuth();
  const { planes, actualizar } = usePlanes();
  const { rutinas: rutinasDisponibles, cargarRutinas } = useRutinas();
  const router = useRouter();
  const plan = planes.find((p) => p.id === id);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [rutinasSeleccionadas, setRutinasSeleccionadas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);

  // Cargar datos del plan al iniciar
  useEffect(() => {
    if (plan) {
      setNombre(plan.nombre);
      setDescripcion(plan.descripcion);
      // Aquí necesitarías cargar las rutinas asociadas al plan
      // Por simplicidad, asumiremos que se carga desde `plan`
      // Si `plan` no incluye rutinas, necesitas una nueva función en PlanesUseCase
      // para obtener las rutinas de un plan específico.
      // Por ahora, inicializamos vacío.
      setRutinasSeleccionadas([]); // Deberías cargar las actuales aquí
    }
  }, [plan]);

  useEffect(() => {
    if (esEntrenador && usuario?.id) {
      cargarRutinas(usuario.id);
    }
  }, [esEntrenador, usuario?.id]);

  // Validar que el usuario es el dueño
  if (!plan) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.textSecondary}>Plan no encontrado</Text>
      </View>
    );
  }
  if (plan.entrenador_id !== usuario?.id) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoError}>
          No tienes permiso para editar este plan
        </Text>
        <TouchableOpacity
          style={[globalStyles.button, globalStyles.buttonPrimary]}
          onPress={() => router.back()}
        >
          <Text style={globalStyles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!esEntrenador) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={styles.textoNoChef}>
          Esta sección es solo para entrenadores 🏋️‍♂️
        </Text>
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
    if (!nombre || !descripcion || rutinasSeleccionadas.length === 0) {
      Alert.alert("Error", "Completa todos los campos y selecciona al menos una rutina");
      return;
    }
    setCargando(true);
    const resultado = await actualizar(
      plan.id,
      nombre,
      descripcion,
      rutinasSeleccionadas
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

  return (
    <ScrollView style={globalStyles.container}>
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
  textoError: {
    fontSize: fontSize.lg,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
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
});