import type {NativeStackScreenProps} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  LiveData: undefined;
  ErrorCodes: undefined;
  HiddenFeature: undefined;
  Settings: undefined;
  Performance: undefined;
  FreezeFrame: undefined;
  VehicleInfo: undefined;
  DataLog: undefined;
  Log: undefined;
  Changelog: undefined;
  Vehicles: undefined;
  TripSummary: undefined;
  Trip: { tripId: string };
  Service: undefined;
  AIDiagnostic: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
