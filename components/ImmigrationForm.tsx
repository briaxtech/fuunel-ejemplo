import React, { useEffect, useRef, useState } from 'react';
import { ContactInfo, EducationLevel, ImmigrationStatus, TimeInSpain, UserProfile } from '../types';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface ImmigrationFormProps {
  onSubmit: (data: UserProfile, contact: ContactInfo) => void;
  isLoading: boolean;
}

export const FORM_STORAGE_KEY = 'immigration-form-cache-v1';
const EXPIRATION_MS = 6 * 60 * 1000;

const PROVINCES = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Baleares",
  "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
  "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca",
  "Jaén", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia",
  "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife",
  "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
  "Vizcaya", "Zamora", "Zaragoza", "Ceuta", "Melilla"
].sort();

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "China", "Colombia", "Costa Rica",
  "Cuba", "Ecuador", "El Salvador", "Estados Unidos", "Filipinas", "Francia", "Guatemala",
  "Honduras", "Italia", "Marruecos", "México", "Nicaragua", "Pakistán", "Panamá", "Paraguay", "Perú",
  "Portugal", "Reino Unido", "República Dominicana", "Rumanía", "Rusia", "Senegal",
  "Ucrania", "Uruguay", "Venezuela", "Otro"
];

const PHONE_CODES = [
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+53", country: "Cuba", flag: "🇨🇺" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻" },
  { code: "+1", country: "Estados Unidos", flag: "🇺🇸" },
  { code: "+63", country: "Filipinas", flag: "🇵🇭" },
  { code: "+33", country: "Francia", flag: "🇫🇷" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹" },
  { code: "+504", country: "Honduras", flag: "🇭🇳" },
  { code: "+39", country: "Italia", flag: "🇮🇹" },
  { code: "+212", country: "Marruecos", flag: "🇲🇦" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
  { code: "+92", country: "Pakistán", flag: "🇵🇰" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+44", country: "Reino Unido", flag: "🇬🇧" },
  { code: "+1", country: "República Dominicana", flag: "🇩🇴" },
  { code: "+40", country: "Rumanía", flag: "🇷🇴" },
  { code: "+7", country: "Rusia", flag: "🇷🇺" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+380", country: "Ucrania", flag: "🇺🇦" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
];

const AGES = Array.from({ length: 83 }, (_, i) => 18 + i); // 18 to 100

const initialData: UserProfile = {
  firstName: '',
  lastName: '',
  nationality: '',
  age: 0,
  educationLevel: '' as EducationLevel,
  entryDate: '',
  currentStatus: ImmigrationStatus.TOURIST,
  timeInSpain: TimeInSpain.LESS_THAN_1_YEAR,
  province: '',
  hasCriminalRecord: null,
  hasFamilyInSpain: null,
  familyDetails: '',
  isEmpadronado: null,
  jobSituation: '',
  comments: ''
};

const initialContact: ContactInfo = {
  email: '',
  phone: ''
};

const ChoiceCard = ({
  selected,
  onClick,
  title,
  icon
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  icon: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left rounded-2xl border bg-white/85 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#36ccca] hover:bg-[#e6f8f9] hover:shadow-md ${selected ? 'border-[#36ccca] bg-[#d9f3f4] shadow-md' : 'border-[#d5dfec]'
      }`}
  >
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xl text-[#0e2f76]">{icon}</span>
        <span className="text-lg font-semibold text-[#031247]">{title}</span>
      </div>
      {selected && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#36ccca]/25 text-[#0e2f76]">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  </button>
);

export const ImmigrationForm: React.FC<ImmigrationFormProps> = ({ onSubmit, isLoading }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<UserProfile>(initialData);
  const [contactData, setContactData] = useState<ContactInfo>(initialContact);
  const [phonePrefix, setPhonePrefix] = useState("+34");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<number>(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage (auto-expires)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.timestamp || Date.now() - parsed.timestamp > EXPIRATION_MS) {
        localStorage.removeItem(FORM_STORAGE_KEY);
        return;
      }
      if (parsed.formData) setFormData(parsed.formData);
      if (parsed.contactData) {
        setContactData(parsed.contactData);
        const phone = parsed.contactData.phone || "";
        const foundPrefix = PHONE_CODES.find(p => phone.startsWith(p.code));
        if (foundPrefix) {
          setPhonePrefix(foundPrefix.code);
          setPhoneNumber(phone.slice(foundPrefix.code.length).trim());
        } else {
          setPhoneNumber(phone);
        }
      }
      if (typeof parsed.step === 'number') setStep(parsed.step);
      setLastSavedAt(parsed.timestamp);
    } catch {
      localStorage.removeItem(FORM_STORAGE_KEY);
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fullPhone = `${phonePrefix} ${phoneNumber}`.trim();
    if (fullPhone !== contactData.phone) {
      setContactData(prev => ({ ...prev, phone: fullPhone }));
    }

    const payload = {
      formData,
      contactData: { ...contactData, phone: fullPhone },
      step,
      timestamp: Date.now()
    };
    setLastSavedAt(payload.timestamp);
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(payload));
  }, [formData, contactData, step, phonePrefix, phoneNumber]);

  // Auto-clear after expiration while page stays open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const timeLeft = Math.max(EXPIRATION_MS - (now - lastSavedAt), 0);
    const timer = window.setTimeout(() => {
      localStorage.removeItem(FORM_STORAGE_KEY);
    }, timeLeft);
    return () => clearTimeout(timer);
  }, [lastSavedAt]);

  // Scroll to top on step change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [step]);

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, contactData);
  };

  // Steps Configuration
  const steps = [
    {
      id: 'intro',
      render: () => (
        <div className="text-center space-y-6 py-4">
          <div className="text-6xl mb-4">🌍</div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#031247] leading-tight">
            Bienvenido a tu nuevo comienzo.
          </h2>
          <p className="text-lg text-[#4a5d7a] leading-relaxed font-light max-w-md mx-auto">
            Analizamos tu situación legal en España y te guiamos hacia tu regularización de forma clara y sencilla.
          </p>
          <button
            onClick={handleNext}
            className="action-btn w-full md:w-auto px-10 py-4"
          >
            Comenzar Consulta
          </button>
        </div>
      )
    },
    {
      id: 'name',
      title: '¿Cuál es tu nombre?',
      description: 'Para poder dirigirnos a ti correctamente.',
      render: () => (
        <div className="space-y-5">
          <Input
            placeholder="Nombre"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Apellidos"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
          />
          <button
            disabled={!formData.firstName || !formData.lastName}
            onClick={handleNext}
            className="action-btn"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'nationality',
      title: `Encantado, ${formData.firstName}.`,
      description: 'Cuéntanos un poco sobre tu origen, edad y nivel de estudios.',
      render: () => (
        <div className="space-y-6">
          <Select
            label="¿Cuál es tu nacionalidad?"
            value={formData.nationality}
            onChange={(e) => updateField('nationality', e.target.value)}
            options={COUNTRIES.map(c => ({ label: c, value: c }))}
            className="text-lg"
          />

          <Select
            label="¿Qué edad tienes?"
            value={formData.age?.toString() || ''}
            onChange={(e) => updateField('age', parseInt(e.target.value))}
            options={AGES.map(a => ({ label: `${a} años`, value: a.toString() }))}
            className="text-lg"
          />

          <Select
            label="Nivel de Estudios"
            value={formData.educationLevel}
            onChange={(e) => updateField('educationLevel', e.target.value)}
            options={Object.values(EducationLevel).map(l => ({ label: l, value: l }))}
            className="text-lg"
          />

          <button
            disabled={!formData.nationality || !formData.age || !formData.educationLevel}
            onClick={handleNext}
            className="action-btn"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'location',
      title: '¿En qué provincia resides?',
      description: 'Es vital, ya que cada Oficina de Extranjería tiene sus propios criterios y tiempos.',
      render: () => (
        <div className="space-y-6">
          <Select
            label="Provincia de residencia"
            options={PROVINCES.map(p => ({ label: p, value: p }))}
            value={formData.province}
            onChange={(e) => updateField('province', e.target.value)}
            className="text-lg"
          />
          <div className="p-4 bg-white/90 rounded-xl border border-[#d5dfec] text-sm text-[#4a5d7a] flex items-start gap-3 shadow-sm">
            <span className="text-xl font-semibold text-[#0e2f76]" aria-hidden="true">i</span>
            <p>Nuestro sistema ajustará las recomendaciones según la situación administrativa de <strong>{formData.province || 'tu zona'}</strong>.</p>
          </div>
          <button
            disabled={!formData.province}
            onClick={handleNext}
            className="action-btn"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'status',
      title: 'Tu situación actual',
      description: 'Selecciona la opción que mejor describa tu estatus legal hoy.',
      render: () => (
        <div className="space-y-6">
          <Select
            options={Object.values(ImmigrationStatus).map(s => ({ label: s, value: s }))}
            value={formData.currentStatus}
            onChange={(e) => updateField('currentStatus', e.target.value)}
            className="text-lg"
          />
          <Select
            label="Tiempo de permanencia en España"
            options={Object.values(TimeInSpain).map(t => ({ label: t, value: t }))}
            value={formData.timeInSpain}
            onChange={(e) => updateField('timeInSpain', e.target.value)}
          />
          <button
            onClick={handleNext}
            className="action-btn"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'entry',
      title: 'Fecha de llegada',
      description: 'Si no recuerdas la fecha exacta, una aproximada servirá.',
      render: () => (
        <div className="space-y-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#d5dfec]">
            <Input
              type="date"
              value={formData.entryDate}
              onChange={(e) => updateField('entryDate', e.target.value)}
              className="border-0 shadow-none focus:ring-0 text-center text-2xl text-[#0e2f76] font-serif"
            />
          </div>
          {formData.entryDate && formData.timeInSpain && (
            (() => {
              const entry = new Date(formData.entryDate);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - entry.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const diffYears = diffDays / 365.25;

              let error = null;
              if ((formData.timeInSpain === TimeInSpain.TWO_TO_THREE_YEARS || formData.timeInSpain === TimeInSpain.MORE_THAN_THREE_YEARS) && diffYears < 2) {
                error = "Has indicado que llevas más de 2 años, pero la fecha seleccionada es menor a 2 años.";
              }

              if (error) {
                return (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    {error}
                  </div>
                );
              }
              return null;
            })()
          )}

          <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-[#4a5d7a] uppercase text-xs ml-1 tracking-wider">Empadronamiento</h4>
            <div className="grid grid-cols-1 gap-3">
              <ChoiceCard
                title="Estoy empadronado"
                icon="✓"
                selected={formData.isEmpadronado === true}
                onClick={() => updateField('isEmpadronado', true)}
              />
              <ChoiceCard
                title="No estoy empadronado"
                icon="✕"
                selected={formData.isEmpadronado === false}
                onClick={() => updateField('isEmpadronado', false)}
              />
            </div>
          </div>

          <button
            disabled={
              !formData.entryDate ||
              formData.isEmpadronado === null ||
              (() => {
                const entry = new Date(formData.entryDate);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - entry.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffYears = diffDays / 365.25;
                if ((formData.timeInSpain === TimeInSpain.TWO_TO_THREE_YEARS || formData.timeInSpain === TimeInSpain.MORE_THAN_THREE_YEARS) && diffYears < 2) {
                  return true;
                }
                return false;
              })()
            }
            onClick={handleNext}
            className="action-btn"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'job',
      title: 'Situación Laboral',
      description: '¿Cuál es tu situación laboral actual?',
      render: () => (
        <div className="space-y-4">
          <ChoiceCard
            title="Estoy trabajando actualmente"
            icon="💼"
            selected={formData.jobSituation === 'working'}
            onClick={() => updateField('jobSituation', 'working')}
          />
          <ChoiceCard
            title="Tengo una oferta de trabajo"
            icon="📄"
            selected={formData.jobSituation === 'offer'}
            onClick={() => updateField('jobSituation', 'offer')}
          />
          <ChoiceCard
            title="No trabajo ni tengo oferta"
            icon="🏠"
            selected={formData.jobSituation === 'none'}
            onClick={() => updateField('jobSituation', 'none')}
          />
          <button
            disabled={!formData.jobSituation}
            onClick={handleNext}
            className="action-btn"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'background',
      title: 'Historial Legal',
      description: 'Esta información es confidencial y necesaria para un análisis real.',
      render: () => (
        <div className="space-y-4">
          <ChoiceCard
            title="Tengo antecedentes"
            icon="✓"
            selected={formData.hasCriminalRecord === true}
            onClick={() => updateField('hasCriminalRecord', true)}
          />
          <ChoiceCard
            title="Sin antecedentes"
            icon="✕"
            selected={formData.hasCriminalRecord === false}
            onClick={() => updateField('hasCriminalRecord', false)}
          />
          <button
            disabled={formData.hasCriminalRecord === null}
            onClick={handleNext}
            className="action-btn"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'family',
      title: 'Vínculos Familiares',
      description: '¿Tienes familiares directos residiendo legalmente en España?',
      render: () => (
        <div className="space-y-6">
          <div className="space-y-3">
            <ChoiceCard
              title="Tengo familia en España"
              icon="✓"
              selected={formData.hasFamilyInSpain === true}
              onClick={() => updateField('hasFamilyInSpain', true)}
            />
            <ChoiceCard
              title="Sin familia en España"
              icon="✕"
              selected={formData.hasFamilyInSpain === false}
              onClick={() => {
                updateField('hasFamilyInSpain', false);
                updateField('familyDetails', '');
              }}
            />
          </div>

          {formData.hasFamilyInSpain && (
            <div className="animate-fade-in">
              <Input
                label="Especifique el vínculo (Ej. Cónyuge, hijo, padre)"
                placeholder="Ej. Mi esposa tiene nacionalidad española"
                value={formData.familyDetails}
                onChange={(e) => updateField('familyDetails', e.target.value)}
              />
            </div>
          )}

          <button
            disabled={formData.hasFamilyInSpain === null}
            onClick={handleNext}
            className="action-btn"
          >
            Siguiente
          </button>
        </div>
      )
    },

    {
      id: 'final',
      title: 'Tu situacion en detalle',
      description: 'Cuentanos tu contexto general y particular para afinar la orientacion.',
      render: () => (
        <div className="space-y-6">
          <textarea
            className="w-full bg-white/90 text-lg p-5 rounded-2xl shadow-sm border border-[#d5dfec] focus:ring-2 focus:ring-[#36ccca]/50 outline-none resize-none h-40 transition-shadow text-[#031247] placeholder:text-[#6b7a99]"
            placeholder="Cuentanos todo lo que puedas: como llegaste, plazos importantes, que necesitas lograr y cualquier detalle que pueda ayudar."
            value={formData.comments}
            onChange={(e) => updateField('comments', e.target.value)}
          ></textarea>

          <div className="p-4 bg-white/90 rounded-xl border border-[#d5dfec] text-sm text-[#4a5d7a] shadow-sm">
            Entre mas contexto compartas, mas precisa sera la revision que recibiras por correo.
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="action-btn"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'contact',
      title: 'Datos de contacto',
      description: 'Envianos tu informacion y te responderemos directamente por email.',
      render: () => (
        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            label="Tu correo electronico"
            type="email"
            required
            placeholder="ejemplo@correo.com"
            value={contactData.email}
            disabled={isLoading}
            onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#4a5d7a] ml-1">
              Teléfono móvil
            </label>
            <div className="flex gap-2">
              <div className="w-1/3 sm:w-1/4">
                <select
                  className="w-full rounded-xl border-gray-200 bg-white p-3 text-base outline-none focus:border-[#36ccca] focus:ring-2 focus:ring-[#36ccca]/20 transition-all shadow-sm"
                  value={phonePrefix}
                  onChange={(e) => setPhonePrefix(e.target.value)}
                >
                  {PHONE_CODES.map((country) => (
                    <option key={country.code + country.country} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <Input
                  type="tel"
                  required
                  placeholder="600 000 000"
                  value={phoneNumber}
                  disabled={isLoading}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="action-btn flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando solicitud...
              </>
            ) : (
              'Enviar y finalizar'
            )}
          </button>
          <p className="text-center text-[#4a5d7a] text-xs mt-2">
            Te enviaremos el desglose completo por correo electronico.
          </p>
        </form>
      )
    }
  ];


  const totalSteps = steps.length;
  const safeStepIndex = Math.min(step, totalSteps - 1);
  const currentStepData = steps[safeStepIndex];
  const progress = Math.round(((safeStepIndex + 1) / totalSteps) * 100);
  const headerTitle = currentStepData.title || 'Conozcamos tu caso';
  const headerDescription =
    currentStepData.description || 'Preguntas cortas para entender tu situacion y darte una guia clara.';


  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#36ccca]/15 px-3 py-1 text-sm font-semibold text-[#0e2f76]">
              Formulario
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#4a5d7a]">
              Paso {safeStepIndex + 1} de {totalSteps}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#4a5d7a]">
              {headerTitle}
            </span>
          </div>
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm font-semibold text-[#4a5d7a] transition-colors hover:text-[#0e2f76]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Atras
            </button>
          )}
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div ref={containerRef} className="card-shell overflow-hidden animate-slide-in">
        <div className="border-b border-[#d5dfec] bg-gradient-to-r from-[#e6f8f9] via-white to-[#f4f7fb] px-6 py-6 sm:px-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-[#031247]">{headerTitle}</h2>
            <p className="text-base text-[#4a5d7a]">{headerDescription}</p>
          </div>
        </div>

        <div className="p-6 sm:p-10">{currentStepData.render()}</div>
      </div>

      <style>{`
        .action-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(120deg, #36ccca 0%, #0e2f76 100%);
          color: #ffffff;
          border-radius: 0.9rem;
          font-weight: 700;
          font-size: 1.05rem;
          box-shadow: 0 12px 30px rgba(14, 47, 118, 0.15);
          transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
          margin-top: 2rem;
          letter-spacing: 0.01em;
        }
        .action-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
          box-shadow: 0 14px 36px rgba(14, 47, 118, 0.2);
        }
        .action-btn:active {
          transform: translateY(0);
          filter: brightness(0.98);
        }
        .action-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
      `}</style>
    </div>
  );
};
