import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrderProvider } from '../context/OrderContext';
import DashboardScreen from '../screens/DashboardScreen';
import BookingFlowScreen from '../screens/BookingFlowScreen';

const Stack = createNativeStackNavigator();

function BookingStackScreen(props) {
  return (
    <OrderProvider>
      <BookingFlowScreen {...props} />
    </OrderProvider>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Booking" component={BookingStackScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
