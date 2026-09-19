import { Redirect, Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';

function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{symbol}</Text>;
}

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (!loading && !session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => <TabIcon symbol="🚗" color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <TabIcon symbol="🧾" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ventures"
        options={{
          title: 'Ventures',
          tabBarIcon: ({ color }) => <TabIcon symbol="💼" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <TabIcon symbol="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon symbol="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}
