import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { settingsService } from '../services/settingsService';
import { Layout } from '../components/layout';
import { Toggle } from '../components/common';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdatePreferencesRequest,
  UserSettings,
} from '../types/settings';

type Tab = 'profile' | 'security' | 'preferences';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Preferences Form State
  const [preferencesForm, setPreferencesForm] = useState({
    defaultTaxPercentage: 0,
  });
  const [taxPercentageDisplay, setTaxPercentageDisplay] = useState('0,00');
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');
  const [preferencesSuccess, setPreferencesSuccess] = useState('');

  const formatDecimalInput = (rawValue: string): { display: string; numeric: number } => {
    const digits = rawValue.replace(/\D/g, '');
    const numeric = parseInt(digits || '0', 10) / 100;
    const display = numeric.toFixed(2).replace('.', ',');
    return { display, numeric };
  };

  // User Settings State
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [userSettingsLoading, setUserSettingsLoading] = useState(false);

  // Initialize forms with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
      });
      const taxValue = user.defaultTaxPercentage || 0;
      setPreferencesForm({
        defaultTaxPercentage: taxValue,
      });
      setTaxPercentageDisplay(taxValue.toFixed(2).replace('.', ','));
      loadUserSettings();
    }
  }, [user]);

  // Load user settings
  const loadUserSettings = async () => {
    try {
      const settings = await settingsService.getUserSettings();
      setUserSettings(settings);
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  // Handle toggle change for allowFutureDateHourRecords
  const handleAllowFutureDatesToggle = async (checked: boolean) => {
    try {
      setUserSettingsLoading(true);
      const updatedSettings = await settingsService.updateUserSettings({
        allowFutureDateHourRecords: checked,
      });
      setUserSettings(updatedSettings);
      setPreferencesSuccess('Configuração atualizada com sucesso');
      setTimeout(() => setPreferencesSuccess(''), 3000);
    } catch (error: any) {
      setPreferencesError(
        error.response?.data?.error || 'Erro ao atualizar configuração'
      );
      setTimeout(() => setPreferencesError(''), 3000);
    } finally {
      setUserSettingsLoading(false);
    }
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const data: UpdateProfileRequest = {};

      if (profileForm.name !== user?.name) {
        data.name = profileForm.name;
      }

      if (profileForm.email !== user?.email) {
        data.email = profileForm.email;
      }

      if (Object.keys(data).length === 0) {
        setProfileError('Nenhuma alteração detectada');
        setProfileLoading(false);
        return;
      }

      const response = await settingsService.updateProfile(data);
      setProfileSuccess(response.message);

      // Update user in AuthContext
      if (updateUser) {
        updateUser(response.user);
      }
    } catch (error: any) {
      setProfileError(
        error.response?.data?.message || 'Erro ao atualizar perfil'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    // Validate password length
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);

    try {
      const data: ChangePasswordRequest = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      };

      const response = await settingsService.changePassword(data);
      setPasswordSuccess(response.message);

      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setPasswordError(
        error.response?.data?.message || 'Erro ao alterar senha'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Preferences Update
  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreferencesError('');
    setPreferencesSuccess('');
    setPreferencesLoading(true);

    try {
      const data: UpdatePreferencesRequest = {
        defaultTaxPercentage: preferencesForm.defaultTaxPercentage,
      };

      const response = await settingsService.updatePreferences(data);
      setPreferencesSuccess(response.message);

      // Update user in AuthContext
      if (updateUser) {
        updateUser(response.user);
      }
    } catch (error: any) {
      setPreferencesError(
        error.response?.data?.message || 'Erro ao atualizar preferências'
      );
    } finally {
      setPreferencesLoading(false);
    }
  };

  const tabs = [
    {
      id: 'profile' as Tab,
      label: 'Perfil',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: 'security' as Tab,
      label: 'Segurança',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      id: 'preferences' as Tab,
      label: 'Preferências',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações do Perfil
            </h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>

              {/* Error Message */}
              {profileError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
                  {profileError}
                </div>
              )}

              {/* Success Message */}
              {profileSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md text-sm">
                  {profileSuccess}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {profileLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Alterar Senha
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  Senha Atual
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  Nova Senha
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Mínimo de 6 caracteres
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>

              {/* Error Message */}
              {passwordError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
                  {passwordError}
                </div>
              )}

              {/* Success Message */}
              {passwordSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md text-sm">
                  {passwordSuccess}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Preferências do Sistema
            </h2>
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              {/* Default Tax Percentage */}
              <div>
                <label
                  htmlFor="defaultTaxPercentage"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  Porcentagem de Imposto Padrão
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    id="defaultTaxPercentage"
                    value={taxPercentageDisplay}
                    onChange={(e) => {
                      const { display, numeric } = formatDecimalInput(e.target.value);
                      setTaxPercentageDisplay(display);
                      setPreferencesForm({
                        ...preferencesForm,
                        defaultTaxPercentage: numeric,
                      });
                    }}
                    className="w-32 px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Este valor será usado como padrão ao criar novos faturamentos
                </p>
              </div>

              {/* Theme Preference */}
              <div className="pt-4 border-t dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Tema Padrão
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Escolha o tema padrão ao acessar o sistema
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                      !isDark
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${!isDark ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>Claro</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fundo branco</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                      isDark
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isDark ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>Escuro</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fundo escuro</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Allow Future Date Hour Records Toggle */}
              <div className="pt-4 border-t dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Registro de Horas
                </h3>
                {userSettings && (
                  <Toggle
                    label="Permitir registro de horas em datas futuras"
                    description="Quando ativado, você poderá registrar horas em datas futuras. Quando desativado, apenas datas passadas e presente serão permitidas."
                    checked={userSettings.allowFutureDateHourRecords}
                    onChange={handleAllowFutureDatesToggle}
                    disabled={userSettingsLoading}
                  />
                )}
              </div>

              {/* Error Message */}
              {preferencesError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
                  {preferencesError}
                </div>
              )}

              {/* Success Message */}
              {preferencesSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md text-sm">
                  {preferencesSuccess}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={preferencesLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {preferencesLoading ? 'Salvando...' : 'Salvar Preferências'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
}
