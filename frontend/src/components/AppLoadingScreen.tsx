import Loading from './Loading';

interface AppLoadingScreenProps {
  text?: string;
}

export default function AppLoadingScreen({ text = 'Carregando...' }: AppLoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-gray-900">
      {/* Logo - mesmo padrão da tela de Login */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-[#3575DF] rounded-2xl flex items-center justify-center shadow-lg">
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">MyFreela</h2>
        <h5 className="text-1xl font-normal text-gray-900 dark:text-white mt-2">Sistema Gerencial</h5>
      </div>

      <Loading size="lg" text={text} />
    </div>
  );
}
