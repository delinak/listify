import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import NewCollectionScreen from './src/screens/NewCollectionScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#8BA89C'
          }
        }}
      >
        <Stack.Screen 
          name="Home"
          component={HomeScreen} 
        />
        <Stack.Screen 
          name="Collection" 
          component={CollectionScreen}
        />
        <Stack.Screen
          name="NewCollection"
          component={NewCollectionScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; 