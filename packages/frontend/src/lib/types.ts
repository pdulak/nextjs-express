export interface User {
  id: number;
  name: string;
  email: string;
  permissions: string[];
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  createdAt: string;
  permissions: string[];
}

export interface PermissionItem {
  id: number;
  name: string;
  code: string;
}

export interface FeatureFlags {
  registrationActive: boolean;
  forgotPasswordActive: boolean;
}

export interface BloodPressureRecord {
  id: number;
  dateTime: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}
