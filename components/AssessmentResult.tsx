import React, { useState } from 'react';
import { AIAnalysisResult, NextStepAction, UserProfile } from '../types';
import { sendToWebhook } from '../services/webhookService';

interface AssessmentResultProps {
  result: AIAnalysisResult;
  profile: UserProfile;
  onReset: () => void;
}

const ProbabilityBadge: React.FC<{ level: string }> = ({ level }) => {
  let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
  if (level === 'Alta') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 border';
  if (level === 'Media') colorClass = 'bg-amber-50 text-amber-700 border-amber-200 border';
  if (level === 'Baja') colorClass = 'bg-rose-50 text-rose-700 border-rose-200 border';

  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${colorClass}`}>
      VIABILIDAD: {level.toUpperCase()}
    </span>
  );
};

const buildReference = (profile: UserProfile, title?: string) => {
  const base = `${profile.firstName}|${profile.lastName}|${profile.nationality}|${title || ''}`.toUpperCase();
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  const suffix = (hash % 90000 + 10000).toString().padStart(5, '0').slice(0, 5);
  return `#${suffix}`;
};

export const AssessmentResult: React.FC<AssessmentResultProps> = ({ result, profile, onReset }) => {
  const [contactForm, setContactForm] = useState({ email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const refCode = buildReference(profile, result.recommendations[0]?.title);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSending(true);
    try {
      await sendToWebhook({
        profile,
        analysis: result,
        contact: {
          email: contactForm.email,
          phone: result.nextStepAction === NextStepAction.SCHEDULE_CONSULTATION ? contactForm.phone : undefined,
        },
        action: result.nextStepAction,
        summaryPreview: result.summary,
        referenceCode: refCode,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'No se pudo enviar la solicitud.');
    } finally {
      setSending(false);
    }
  };

  const isScheduleAction = result.nextStepAction === NextStepAction.SCHEDULE_CONSULTATION;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20 text-left">
      
      {/* Summary Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10 mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">Dictamen Preliminar</h2>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mt-2">Informe de viabilidad jurídica</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-semibold uppercase tracking-wide">
            <span className="block text-slate-400">Ref. expediente</span>
            <span className="text-slate-700">{refCode}</span>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-6">
          <p className="text-lg leading-relaxed text-slate-700 font-light text-left">
            {result.summary}
          </p>
        </div>
      </div>

      {/* Critical Advice */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl mb-10 shadow-sm mx-2 md:mx-0">
        <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center font-serif">
          <span className="mr-2 text-2xl">⚠️</span>
          Aviso Importante
        </h3>
        <p className="text-amber-800 leading-relaxed">
          {result.criticalAdvice}
        </p>
      </div>

      {/* Recommendations Grid */}
      <div className="mb-12 px-2 md:px-0">
        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4 flex items-center gap-3">
          <span className="inline-block h-[1px] w-6 bg-brand-500" />
          Vías Legales Detectadas
        </h3>
        <div className="grid grid-cols-1 gap-8">
          {result.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-2xl text-brand-800">
                      {rec.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                        <span>Plantilla</span>
                        <span className="text-brand-900">{rec.templateKey}</span>
                      </span>
                    </div>
                  </div>
                  <ProbabilityBadge level={rec.probability} />
                </div>

                <div className="mt-6 border-l-4 border-brand-500/70 bg-brand-50/60 px-5 py-4 rounded-r-xl text-slate-700 leading-relaxed">
                  {rec.description}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <div className="rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-[0_6px_20px_rgba(3,18,71,0.05)]">
                    <p className="font-bold text-slate-900 mb-4 uppercase tracking-wide text-xs flex items-center gap-2">
                      <span className="text-brand-700">›</span> Requisitos esenciales
                    </p>
                    <ul className="space-y-3">
                      {rec.requirements.map((req, rIdx) => (
                        <li key={rIdx} className="flex items-start text-slate-700 text-sm leading-relaxed">
                          <span className="text-brand-600 mr-2 mt-0.5">›</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 shadow-[0_6px_20px_rgba(3,18,71,0.03)]">
                    <p className="font-bold text-slate-900 mb-4 uppercase tracking-wide text-xs flex items-center gap-2">
                      <span className="text-brand-600">📁</span> Documentación inicial
                    </p>
                    <ul className="space-y-3">
                      {rec.documents && rec.documents.length > 0 ? (
                        rec.documents.map((doc, dIdx) => (
                          <li key={dIdx} className="flex items-start text-slate-700 text-sm leading-relaxed">
                            <span className="text-slate-400 mr-2 mt-0.5">•</span>
                            {doc}
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 text-sm italic">Se detallará en consulta.</li>
                      )}
                    </ul>
                    <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs uppercase tracking-wide">
                      <span className="text-slate-500 font-semibold">Plazo estimado</span>
                      <span className="text-slate-900 font-bold">{rec.estimatedTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION SECTION - DYNAMIC */}
      <div id="action-plan" className="mt-16 pt-10 border-t-2 border-slate-100">
        <h3 className="text-3xl font-serif font-bold text-center text-slate-900 mb-2">
          {isScheduleAction ? 'Próximo Paso: Formalizar Trámite' : 'Próximo Paso: Preparar Expediente'}
        </h3>
        <p className="text-center text-slate-500 mb-10 max-w-2xl mx-auto">
          {result.actionReasoning}
        </p>

        <div
          className={`max-w-2xl mx-auto rounded-3xl shadow-xl overflow-hidden ${
            isScheduleAction
              ? 'bg-gradient-to-br from-[#0b2f4f] via-[#0c2344] to-[#0a1a33] text-white border border-[#0f2745]'
              : 'bg-white border border-slate-200'
          }`}
        >
          
          {submitted ? (
            <div className="p-16 text-center animate-fade-in">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h4 className={`text-2xl font-serif font-bold mb-4 ${isScheduleAction ? 'text-white' : 'text-slate-900'}`}>
                {isScheduleAction ? '¡Solicitud Recibida!' : '¡Plan Guardado!'}
              </h4>
              <p className={`text-lg mb-8 ${isScheduleAction ? 'text-brand-100' : 'text-slate-600'}`}>
                {isScheduleAction 
                  ? 'Un abogado especialista revisará tu perfil y te contactará en las próximas 24 horas para confirmar tu cita.' 
                  : 'Te hemos enviado la lista de requisitos a tu correo. Cuando los tengas todos, vuelve a contactarnos.'}
              </p>
              <button onClick={onReset} className="text-sm font-bold underline opacity-80 hover:opacity-100">
                Volver al inicio
              </button>
            </div>
          ) : (
            <div className="p-8 md:p-12">
              <div className="mb-8">
                  <h4 className={`text-xl font-bold ${isScheduleAction ? 'text-white' : 'text-slate-900'}`}>
                    {isScheduleAction ? 'Solicitar Cita con Experto' : 'Guardar Requisitos y Contactar Luego'}
                  </h4>
                  <p className={`text-sm ${isScheduleAction ? 'text-brand-200' : 'text-slate-500'}`}>
                    {isScheduleAction ? 'Tu perfil es viable. No pierdas tiempo y asegura tu plaza.' : 'No inicies el trámite sin tener todo listo. Guárdate esta guía.'}
                  </p>
                </div>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 uppercase tracking-wide ${isScheduleAction ? 'text-brand-200' : 'text-slate-500'}`}>
                    Tu Correo Electrónico
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="ejemplo@correo.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({...prev, email: e.target.value}))}
                    className={`w-full px-5 py-4 rounded-xl outline-none focus:ring-2 transition-all text-lg ${
                      isScheduleAction 
                        ? 'bg-[#0f2745] border border-[#15345a] text-white placeholder-brand-300 focus:ring-brand-400' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-brand-500'
                    }`}
                  />
                </div>
                
                {isScheduleAction && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-semibold mb-2 uppercase tracking-wide text-brand-200">
                      Teléfono Móvil
                    </label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+34 600 000 000"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({...prev, phone: e.target.value}))}
                      className="w-full px-5 py-4 rounded-xl bg-[#0f2745] border border-[#15345a] text-white placeholder-brand-300 focus:ring-brand-400 outline-none focus:ring-2 transition-all text-lg"
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={sending}
                  className={`w-full py-5 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all mt-6 ${
                    isScheduleAction 
                      ? 'bg-gradient-to-r from-brand-400 to-brand-500 text-brand-900 hover:opacity-95' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {sending
                    ? 'Enviando...'
                    : isScheduleAction
                      ? 'Confirmar Solicitud de Cita'
                      : 'Enviarme la Guía por Correo'}
                </button>

                {submitError && (
                  <p className={`text-sm mt-4 ${isScheduleAction ? 'text-brand-100' : 'text-amber-700'}`}>
                    {submitError}
                  </p>
                )}
              </form>
              
              <p className={`text-xs text-center mt-6 ${isScheduleAction ? 'text-brand-300' : 'text-slate-400'}`}>
                Tus datos están protegidos y solo se usarán para esta gestión.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
