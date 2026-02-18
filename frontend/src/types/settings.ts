import { User } from './auth';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UpdatePreferencesRequest {
  defaultTaxPercentage: number;
}

export interface UpdatePreferencesResponse {
  message: string;
  user: User;
}

export interface UserSettings {
  id: string;
  userId: string;
  currency: string;
  dateFormat: string;
  theme: 'light' | 'dark';
  allowFutureDateHourRecords: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetUserSettingsResponse {
  settings: UserSettings;
}

export interface UpdateUserSettingsRequest {
  currency?: string;
  dateFormat?: string;
  theme?: 'light' | 'dark';
  allowFutureDateHourRecords?: boolean;
}

export interface UpdateUserSettingsResponse {
  message: string;
  settings: UserSettings;
}
