import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  email: z.string().email('Digite um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      setIsSubmitting(true);
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Falha ao criar conta. Tente novamente.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Loading overlay during registration */}
      {isSubmitting && (
        <Loading fullScreen size="lg" text="Criando conta..." />
      )}

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#3575DF] rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">
            MyFreela
          </h2>
          <p className="text-gray-300 text-lg">
            Crie sua conta para começar
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 border border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="rounded-lg bg-red-900/30 border border-red-800 p-4 animate-shake">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-red-300 font-medium">{error}</div>
                </div>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nome
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  {...register('name')}
                  id="name"
                  type="text"
                  autoComplete="name"
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-3 py-3 bg-gray-700 text-gray-200 border ${
                    errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed placeholder:text-gray-500`}
                  placeholder="Seu nome completo"
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-400 flex items-center animate-fadeIn">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-3 py-3 bg-gray-700 text-gray-200 border ${
                    errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed placeholder:text-gray-500`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-400 flex items-center animate-fadeIn">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-3 py-3 bg-gray-700 text-gray-200 border ${
                    errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed placeholder:text-gray-500`}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-400 flex items-center animate-fadeIn">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-3 py-3 bg-gray-700 text-gray-200 border ${
                    errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed placeholder:text-gray-500`}
                  placeholder="Repita sua senha"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400 flex items-center animate-fadeIn">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white font-semibold bg-[#3575DF] hover:bg-[#2d66c8] focus:outline-none focus:ring-2 focus:ring-offset-2 ring-offset-gray-800 focus:ring-[#3575DF] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Criando conta...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Criar Conta
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-300">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Sistema de gerenciamento de freelas
          </p>
        </div>
      </div>
    </div>
  );
}
