// app/progreso/_layout.tsx (Layout para rutas de progreso)
import { Stack } from "expo-router";
export default function ProgresoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="registrar"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}