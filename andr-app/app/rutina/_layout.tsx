// app/rutina/_layout.tsx (Layout para rutas de rutina)
import { Stack } from "expo-router";
export default function RutinaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="crear"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="editar"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}