// app/plan/crear.tsx (Solo para entrenadores)
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
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
import {
  colors,
  fontSize,
  spacing,
} from "../../src/styles/theme";

export default function CrearPlanScreen() {
  const { usuario, esEntrenador: esEntrenador } = useAuth();
  const { crear: crearPlan } = usePlanes();
  const { rutinas: rutinasDisponibles, cargarRutinas } = useRutinas();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [rutinasSeleccionadas, setRutinasSeleccionadas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (esEntrenador && usuario?.id) {
      cargarRutinas(usuario.id);
    }
  }, [esEntrenador, usuario?.id]);

  const toggleRutina = (id: string) => {
    if (rutinasSeleccionadas.includes(id)) {
      setRutinasSeleccionadas(rutinasSeleccionadas.filter(rId => rId !== id));
    } else {
      setRutinasSeleccionadas([...rutinasSeleccionadas, id]);
    }
  };

  const handleCrear = async () => {
    if (!nombre || !descripcion || rutinasSeleccionadas.length === 0) {
      Alert.alert("Error", "Completa todos los campos y selecciona al menos una rutina");
      return;
    }
    if (!usuario) {
        Alert.alert("Error", "Usuario no autenticado");
        return;
    }
    setCargando(true);
    const resultado = await crearPlan(nombre, descripcion, usuario.id, rutinasSeleccionadas);
    setCargando(false);
    if (resultado.success) {
      Alert.alert("Éxito", "Plan creado correctamente", [
        {
          text: "OK",
          onPress: () => {
            setNombre("");
            setDescripcion("");
            setRutinasSeleccionadas([]);
            router.push("/(tabs)/misPlanes");
          },
        },
      ]);
    } else {
      Alert.alert("Error", resultado.error || "No se pudo crear el plan");
    }
  };

  if (!esEntrenador) {
    return (
      <View style={globalStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)")}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={globalStyles.containerCentered}>
          <Text style={styles.textoNoEntrenador}>
            Esta sección es solo para entrenadores 🏋️‍♂️
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: spacing.md }]}>
      <View style={globalStyles.contentPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/misPlanes")}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Nuevo Plan</Text>
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
            styles.botonCrear,
          ]}
          onPress={handleCrear}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonText}>Crear Plan</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.sm,
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
  rutinaSeleccionada: {
    backgroundColor: colors.primaryLight,
  },
  nombreRutina: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  botonCrear: {
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
});