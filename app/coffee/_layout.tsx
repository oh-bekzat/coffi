import { Stack } from "expo-router";

export default function CoffeeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

// not sure it's necessary