import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from './types';

import HomeScreen from '../screens/HomeScreen';
import ErrorCodesScreen from '../screens/ErrorCodesScreen';
import LiveDataScreen from '../screens/LiveDataScreen';
import HiddenFeatureScreen from '../screens/HiddenFeatureScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PerformanceScreen from '../screens/PerformanceScreen';
import FreezeFrameScreen from '../screens/FreezeFrameScreen';
import VehicleInfoScreen from '../screens/VehicleInfoScreen';
import DataLogScreen from '../screens/DataLogScreen';
import LogScreen from '../screens/LogScreen';
import ChangelogScreen from '../screens/ChangelogScreen';
import VehiclesScreen from '../screens/VehiclesScreen';
import TripSummaryScreen from '../screens/TripSummaryScreen';
import TripScreen from '../screens/TripScreen';
import ServiceScreen from '../screens/ServiceScreen';

function withNavProps(Component: React.ComponentType<any>) {
  return function ScreenWithNav(props: any) {
    const navigation =
      useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    return (
      <Component
        {...props}
        onBack={() => navigation.goBack()}
        onNavigate={(screen: string | null) => {
          if (screen === null) {
            navigation.goBack();
          } else {
            navigation.navigate(screen as any);
          }
        }}
      />
    );
  };
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="ErrorCodes"
        component={withNavProps(ErrorCodesScreen)}
      />
      <Stack.Screen name="LiveData" component={withNavProps(LiveDataScreen)} />
      <Stack.Screen
        name="HiddenFeature"
        component={withNavProps(HiddenFeatureScreen)}
      />
      <Stack.Screen name="Settings" component={withNavProps(SettingsScreen)} />
      <Stack.Screen
        name="Performance"
        component={withNavProps(PerformanceScreen)}
      />
      <Stack.Screen
        name="FreezeFrame"
        component={withNavProps(FreezeFrameScreen)}
      />
      <Stack.Screen
        name="VehicleInfo"
        component={withNavProps(VehicleInfoScreen)}
      />
      <Stack.Screen name="DataLog" component={withNavProps(DataLogScreen)} />
      <Stack.Screen name="Log" component={withNavProps(LogScreen)} />
      <Stack.Screen
        name="Changelog"
        component={withNavProps(ChangelogScreen)}
      />
      <Stack.Screen name="Vehicles" component={withNavProps(VehiclesScreen)} />
      <Stack.Screen
        name="TripSummary"
        component={withNavProps(TripSummaryScreen)}
      />
      <Stack.Screen name="Trip" component={withNavProps(TripScreen)} />
      <Stack.Screen name="Service" component={withNavProps(ServiceScreen)} />
    </Stack.Navigator>
  );
}
