import React, { useState } from 'react';
import { ImmigrationForm } from './components/ImmigrationForm';
import { AssessmentResult } from './components/AssessmentResult';
import { analyzeImmigrationProfile } from './services/geminiService';
import { UserProfile, AIAnalysisResult } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'form' | 'result'>('form');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [lastProfile, setLastProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (profile: UserProfile) => {
    setLoading(true);
    setError(null);
    try {
      setLastProfile(profile);
      const analysis = await analyzeImmigrationProfile(profile);
      setResult(analysis);
      setView('result');
    } catch (err: any) {
      setError(err.message || 'Ha ocurrido un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setView('form');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#031247]">
      <main className="flex flex-col items-center px-4 py-10 sm:py-14">
        <div className="max-w-4xl w-full flex flex-col items-center gap-6 text-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-3 rounded-full bg-[#36ccca]/15 px-4 py-2">
              <img src="/sentir-logo.svg" alt="Extranjería Assistant" className="h-10 w-auto" />
            </div>
            <p className="text-base text-[#4a5d7a]">
              Responde en menos de 2 minutos y te mostramos el camino más viable.
            </p>
            {view === 'result' && (
              <button
                onClick={handleReset}
                className="text-sm font-semibold text-[#0e2f76] underline underline-offset-4 hover:text-[#36ccca]"
              >
                Nueva consulta
              </button>
            )}
          </div>

          {error && (
            <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <h4 className="font-bold text-sm uppercase mb-1">Error de procesamiento</h4>
                  <span className="text-sm opacity-90">{error}</span>
                </div>
              </div>
            </div>
          )}

          <div className="w-full">
            {view === 'form' ? (
              <ImmigrationForm onSubmit={handleSubmit} isLoading={loading} />
            ) : (
              result && lastProfile && (
                <AssessmentResult result={result} profile={lastProfile} onReset={handleReset} />
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
