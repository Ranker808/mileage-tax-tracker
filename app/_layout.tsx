import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/hooks/useAuth';
import { colors } from '../src/lib/theme';
// Imported for its side effect: TaskManager.defineTask() must run
// unconditionally at module load so the OS can re-associate a background
// location wake-up with this handler even after the app was killed and
// relaunched, whether or not auto-tracking is currently turned on.
import '../src/lib/backgroundLocationTask';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerTitleStyle: { fontWeight: '800', color: colors.ink },
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="trip/new" options={{ title: 'Log Trip', presentation: 'modal' }} />
            <Stack.Screen name="trip/track" options={{ title: 'Track Trip', presentation: 'modal' }} />
            <Stack.Screen name="trip/pending" options={{ title: 'Detected Trips' }} />
            <Stack.Screen name="trip/[id]" options={{ title: 'Trip' }} />
            <Stack.Screen name="venture/new" options={{ title: 'New Venture', presentation: 'modal' }} />
            <Stack.Screen name="venture/[id]" options={{ title: 'Venture' }} />
            <Stack.Screen name="expense/new" options={{ title: 'Log Expense', presentation: 'modal' }} />
            <Stack.Screen name="expense/[id]" options={{ title: 'Expense' }} />
            <Stack.Screen name="odometer/new" options={{ title: 'Odometer Reading', presentation: 'modal' }} />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
