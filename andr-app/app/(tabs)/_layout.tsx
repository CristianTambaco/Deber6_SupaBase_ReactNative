// app/(tabs)/_layout.tsx (Agrega nuevas pestañas)
import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "../../src/presentation/hooks/useAuth";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { usuario } = useAuth();

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
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      {/* Solo mostrar pestañas según rol */}
      {usuario?.rol === "entrenador" && (
        <>
          <Tabs.Screen
            name="misRutinas"
            options={{
              title: "Mis Rutinas",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="figure.run" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="misPlanes"
            options={{
              title: "Mis Planes",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="list.bullet.rectangle" color={color} />
              ),
            }}
          />
        </>
      )}
      {usuario?.rol === "usuario" && (
        <>
          <Tabs.Screen
            name="rutinasAsignadas"
            options={{
              title: "Rutinas",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="figure.run" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="progreso"
            options={{
              title: "Mi Progreso",
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="chart.bar.fill" color={color} />
              ),
            }}
          />
        </>
      )}
    </Tabs>
  );
}