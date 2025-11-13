// app/plan/_layout.tsx (Layout para rutas de plan)
import { Stack } from "expo-router";
export default function PlanLayout() {
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