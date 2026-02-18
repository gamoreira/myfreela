import api from './api';
import type {
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
  GetUserSettingsResponse,
  UpdateUserSettingsRequest,
  UpdateUserSettingsResponse,
  UserSettings,
} from '../types/settings';

export const settingsService = {
  /**
   * Update user profile (name and email)
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const response = await api.put<UpdateProfileResponse>('/auth/profile', data);
    return response.data;
  },

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const response = await api.put<ChangePasswordResponse>('/auth/password', data);
    return response.data;
  },

  /**
   * Update user preferences (default tax percentage)
   */
  async updatePreferences(data: UpdatePreferencesRequest): Promise<UpdatePreferencesResponse> {
    const response = await api.put<UpdatePreferencesResponse>('/auth/preferences', data);
    return response.data;
  },

  /**
   * Get user settings (currency, dateFormat, theme, allowFutureDateHourRecords)
   */
  async getUserSettings(): Promise<UserSettings> {
    const response = await api.get<GetUserSettingsResponse>('/settings');
    return response.data.settings;
  },

  /**
   * Update user settings
   */
  async updateUserSettings(data: UpdateUserSettingsRequest): Promise<UserSettings> {
    const response = await api.put<UpdateUserSettingsResponse>('/settings', data);
    return response.data.settings;
  },
};
