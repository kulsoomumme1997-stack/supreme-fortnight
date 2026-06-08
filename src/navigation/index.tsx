import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadSensitivities } from '../storage';

import HomeScreen from '../screens/HomeScreen';
import FoodLogScreen from '../screens/FoodLogScreen';
import LogHistoryScreen from '../screens/LogHistoryScreen';
import IngredientScannerScreen from '../screens/IngredientScannerScreen';
import QuizScreen from '../screens/QuizScreen';
import ModeSelectScreen from '../screens/ModeSelectScreen';
import InsightsScreen from '../screens/InsightsScreen';
import EliminationGuideScreen from '../screens/EliminationGuideScreen';
import SafeFoodsScreen from '../screens/SafeFoodsScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Quiz: undefined;
  FoodLog: undefined;
  LogDetail: { entryId: string };
  ModeSelect: undefined;
  EliminationGuide: undefined;
  SafeFoods: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Scanner: undefined;
  Insights: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    History: '📋',
    Scanner: '🔍',
    Insights: '📊',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name] ?? '•'}</Text>
    </View>
  );
}

function MainTabs() {
  const [mode, setMode] = React.useState<'investigate' | 'manage' | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      loadSensitivities().then((s) => {
        if (active) setMode(s.mode);
      });
      return () => { active = false; };
    }, [])
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerStyle: { backgroundColor: '#6366F1' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="History" component={LogHistoryScreen} options={{ title: 'Food Log' }} />
      <Tab.Screen name="Scanner" component={IngredientScannerScreen} options={{ title: 'Ingredient Scanner' }} />
      {mode === 'investigate' && (
        <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
      )}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#6366F1' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Quiz"
          component={QuizScreen}
          options={{ title: 'Sensitivity Quiz', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="FoodLog"
          component={FoodLogScreen}
          options={{ title: 'Log a Meal', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="ModeSelect"
          component={ModeSelectScreen}
          options={{ title: 'Choose Your Path', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="EliminationGuide"
          component={EliminationGuideScreen}
          options={{ title: 'Elimination Guide', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="SafeFoods"
          component={SafeFoodsScreen}
          options={{ title: 'Safe Foods', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
