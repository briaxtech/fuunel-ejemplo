import React, { useState } from 'react';
import { ImmigrationForm, FORM_STORAGE_KEY } from './components/ImmigrationForm';
import { analyzeImmigrationProfile } from './services/geminiService';
import { sendToWebhook } from './services/webhookService';
import { ContactInfo, UserProfile } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'form' | 'thankyou'>('form');
  const [loading, setLoading] = useState(false);
  const [lastProfile, setLastProfile] = useState<UserProfile | null>(null);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FORM_STORAGE_KEY);
    }
  };

  const handleSubmit = async (profile: UserProfile, contactInfo: ContactInfo) => {
    setLoading(true);
    setError(null);
    try {
      setLastProfile(profile);
      setContact(contactInfo);
      const analysis = await analyzeImmigrationProfile(profile);
      await sendToWebhook({
        profile,
        analysis,
        contact: contactInfo,
        action: analysis.nextStepAction,
        timestamp: new Date().toISOString(),
      });
      clearDraft();
      setView('thankyou');
    } catch (err: any) {
      setError(err.message || 'Ha ocurrido un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    clearDraft();
    setView('form');
    setError(null);
    setLastProfile(null);
    setContact(null);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#031247]">
      <main className="flex flex-col items-center px-4 py-10 sm:py-14">
        <div className="max-w-4xl w-full flex flex-col items-center gap-6 text-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-3 rounded-full bg-[#36ccca]/15 px-7 py-5">
              <img src="/sentir-logo.svg" alt="Extranjeria Assistant" className="h-24 w-auto" />
            </div>
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
              <div className="card-shell overflow-hidden animate-fade-in">
                <div className="border-b border-[#d5dfec] bg-gradient-to-r from-[#e6f8f9] via-white to-[#f4f7fb] px-6 py-6 sm:px-10">
                  <h2 className="text-3xl font-semibold text-[#031247]">Solicitud recibida</h2>
                  <p className="text-base text-[#4a5d7a]">
                    {`Gracias${lastProfile ? `, ${lastProfile.firstName}` : ''}. Revisaremos tu caso y te enviaremos el informe y los pasos siguientes por correo.`}
                  </p>
                </div>
                <div className="p-6 sm:p-10 space-y-6">
                  <div className="flex items-start gap-3 bg-[#f0f5ff] border border-[#d5dfec] rounded-xl p-4 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#36ccca]/20 text-[#0e2f76]">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#031247]">Todo listo.</p>
                      <p className="text-[#4a5d7a] text-sm">
                        {contact?.email ? `Te escribiremos a ${contact.email} y, si hace falta, te llamaremos al ${contact.phone || 'telefono facilitado'}.` : 'Te escribiremos pronto con tu dictamen y los pasos sugeridos.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#d5dfec] bg-white p-4 text-left shadow-sm">
                    <p className="font-semibold text-[#031247] mb-2">Que haremos ahora</p>
                    <ul className="space-y-2 text-sm text-[#4a5d7a]">
                      <li>- Revisar tus datos y armar el dictamen completo.</li>
                      <li>- Enviarte el desglose y el siguiente paso por email.</li>
                      <li>- Contactarte si necesitamos aclarar algun punto.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={handleReset}
                      className="action-btn w-full md:w-auto px-8"
                    >
                      Crear otra consulta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
