// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "@/components/haptic-tab";
// Importa MaterialIcons en lugar de IconSymbol si quieres íconos universales
import { MaterialIcons } from "@expo/vector-icons"; // 👈 Importa MaterialIcons
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio", // Cambiado a "Inicio" para ser más claro
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={28} color={color} /> // 👈 Icono Material 'home'
          ),
        }}
      />
      {/* 
        ⚠️ COMENTADO O ELIMINADO: La pestaña 'explore' ya no se muestra.
        <Tabs.Screen
          name="explore"
          options={{
            title: "Nueva Receta",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="restaurant-menu" size={28} color={color} /> // 👈 Icono Material 'restaurant-menu'
            ),
          }}
        />
      */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="message" size={28} color={color} /> // 👈 Icono Material 'message'
          ),
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title: "Mi Progreso",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="timeline" size={28} color={color} /> // 👈 Icono Material 'timeline' (o 'bar-chart' si prefieres)
          ),
        }}
      />
      <Tabs.Screen
        name="misPlanes"
        options={{
          title: "Mis Planes",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="list" size={28} color={color} /> //  Icono Material 'list'
          ),
        }}
      />
      <Tabs.Screen
        name="misRutinas"
        options={{
          title: "Mis Rutinas",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="fitness-center" size={28} color={color} /> // 👈 Icono Material 'fitness-center'
          ),
        }}
      />
      <Tabs.Screen
        name="rutinasAsignadas"
        options={{
          title: "Rutinas Asig.",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="assignment" size={28} color={color} /> // 👈 Icono Material 'assignment'
          ),
        }}
      />
    </Tabs>
  );
}