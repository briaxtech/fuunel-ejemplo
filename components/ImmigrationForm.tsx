import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ImmigrationStatus, EducationLevel, TimeInSpain, ContactInfo } from '../types';

interface ImmigrationFormProps {
  onSubmit: (data: UserProfile, contact: ContactInfo) => void;
  isLoading: boolean;
}

export const FORM_STORAGE_KEY = 'immigration_form_state';
const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const Input = ({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="space-y-2">
    {label && <label className="block text-sm font-medium text-[#4a5d7a] ml-1">{label}</label>}
    <input
      className={`w-full rounded-xl border-gray-200 bg-white p-4 text-lg outline-none focus:border-[#36ccca] focus:ring-4 focus:ring-[#36ccca]/10 transition-all shadow-sm placeholder:text-gray-300 ${className}`}
      {...props}
    />
  </div>
);

const Select = ({ label, options, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: { label: string, value: string }[] }) => (
  <div className="space-y-2">
    {label && <label className="block text-sm font-medium text-[#4a5d7a] ml-1">{label}</label>}
    <div className="relative">
      <select
        className={`w-full appearance-none rounded-xl border-gray-200 bg-white p-4 text-lg outline-none focus:border-[#36ccca] focus:ring-4 focus:ring-[#36ccca]/10 transition-all shadow-sm ${className}`}
        {...props}
      >
        <option value="" disabled>Selecciona una opción</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#4a5d7a]">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

const PROVINCES = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", "Cáceres",
  "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara",
  "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León",
  "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia",
  "Valladolid", "Vizcaya", "Zamora", "Zaragoza", "Ceuta", "Melilla"
];

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador",
  "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "República Dominicana",
  "Uruguay", "Venezuela", "Marruecos", "Argelia", "Senegal", "China", "Pakistán", "Filipinas", "Rusia",
  "Ucrania", "Estados Unidos", "Reino Unido", "Otro"
];

const PHONE_CODES = [
  { code: "+34", country: "España", iso: "es" },
  { code: "+54", country: "Argentina", iso: "ar" },
  { code: "+591", country: "Bolivia", iso: "bo" },
  { code: "+55", country: "Brasil", iso: "br" },
  { code: "+56", country: "Chile", iso: "cl" },
  { code: "+86", country: "China", iso: "cn" },
  { code: "+57", country: "Colombia", iso: "co" },
  { code: "+506", country: "Costa Rica", iso: "cr" },
  { code: "+53", country: "Cuba", iso: "cu" },
  { code: "+593", country: "Ecuador", iso: "ec" },
  { code: "+503", country: "El Salvador", iso: "sv" },
  { code: "+1", country: "Estados Unidos", iso: "us" },
  { code: "+63", country: "Filipinas", iso: "ph" },
  { code: "+33", country: "Francia", iso: "fr" },
  { code: "+502", country: "Guatemala", iso: "gt" },
  { code: "+504", country: "Honduras", iso: "hn" },
  { code: "+39", country: "Italia", iso: "it" },
  { code: "+212", country: "Marruecos", iso: "ma" },
  { code: "+52", country: "México", iso: "mx" },
  { code: "+505", country: "Nicaragua", iso: "ni" },
  { code: "+92", country: "Pakistán", iso: "pk" },
  { code: "+507", country: "Panamá", iso: "pa" },
  { code: "+595", country: "Paraguay", iso: "py" },
  { code: "+51", country: "Perú", iso: "pe" },
  { code: "+351", country: "Portugal", iso: "pt" },
  { code: "+44", country: "Reino Unido", iso: "gb" },
  { code: "+1", country: "República Dominicana", iso: "do" },
  { code: "+40", country: "Rumanía", iso: "ro" },
  { code: "+7", country: "Rusia", iso: "ru" },
  { code: "+221", country: "Senegal", iso: "sn" },
  { code: "+380", country: "Ucrania", iso: "ua" },
  { code: "+598", country: "Uruguay", iso: "uy" },
  { code: "+58", country: "Venezuela", iso: "ve" },
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
  comments: '',
  locationStatus: undefined,
  familyNationality: undefined,
  familyRelation: undefined,
  primaryGoal: undefined
};

const initialContact: ContactInfo = {
  email: '',
  phone: ''
};

const ChoiceCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}> = ({
  selected,
  onClick,
  title,
  icon
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
                crossOrigin="anonymous"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );

const PhonePrefixSelect = ({
  selectedIso,
  onChange,
  options
}: {
  selectedIso: string;
  onChange: (iso: string) => void;
  options: typeof PHONE_CODES;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.iso === selectedIso) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-lg outline-none focus:border-[#36ccca] focus:ring-2 focus:ring-[#36ccca]/20 transition-all shadow-sm"
      >
        <img
          src={`https://flagcdn.com/w40/${selectedOption.iso}.png`}
          srcSet={`https://flagcdn.com/w80/${selectedOption.iso}.png 2x`}
          width="24"
          alt={selectedOption.country}
          className="rounded-sm object-cover"
        />
        <span>{selectedOption.code}</span>
        <svg className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white shadow-lg py-1">
            {options.map((option) => (
              <button
                key={option.iso}
                type="button"
                onClick={() => {
                  onChange(option.iso);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${option.iso === selectedIso ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                <img
                  src={`https://flagcdn.com/w40/${option.iso}.png`}
                  srcSet={`https://flagcdn.com/w80/${option.iso}.png 2x`}
                  width="20"
                  alt={option.country}
                  className="rounded-sm object-cover"
                />
                <span className="font-medium">{option.code}</span>
                <span className="truncate text-gray-400 text-xs ml-auto">{option.country}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const ImmigrationForm: React.FC<ImmigrationFormProps> = ({ onSubmit, isLoading }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<UserProfile>(initialData);
  const [contactData, setContactData] = useState<ContactInfo>(initialContact);
  const [phonePrefix, setPhonePrefix] = useState("+34");
  const [phoneIso, setPhoneIso] = useState("es");
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
          setPhoneIso(foundPrefix.iso);
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
      id: 'current_location',
      title: '¿Dónde te encuentras ahora?',
      description: 'Esto determina si aplicas a un Visado (Consulado) o a un trámite de Extranjería.',
      render: () => (
        <div className="space-y-4">
          <ChoiceCard
            title="En mi país de origen (Fuera de España)"
            icon="🌍"
            selected={formData.locationStatus === 'origin'}
            onClick={() => {
              updateField('locationStatus', 'origin');
              updateField('entryDate', '');
            }}
          />
          <ChoiceCard
            title="Ya estoy en España"
            icon={
              <img
                src="https://flagcdn.com/w40/es.png"
                srcSet="https://flagcdn.com/w80/es.png 2x"
                width="24"
                height="18"
                alt="España"
                className="rounded-sm object-cover"
              />
            }
            selected={formData.locationStatus === 'spain'}
            onClick={() => updateField('locationStatus', 'spain')}
          />
          <button
            disabled={!formData.locationStatus}
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
            <div className="animate-fade-in space-y-4 mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-sm font-semibold text-[#0e2f76]">¿Qué nacionalidad tiene tu familiar?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('familyNationality', 'spanish_eu')}
                  className={`p-3 rounded-lg border text-left text-sm ${formData.familyNationality === 'spanish_eu'
                    ? 'border-[#36ccca] bg-[#d9f3f4] text-[#031247]'
                    : 'border-gray-200 bg-white'
                    }`}
                >
                  🇪🇺 Española / Europea
                </button>
                <button
                  type="button"
                  onClick={() => updateField('familyNationality', 'non_eu')}
                  className={`p-3 rounded-lg border text-left text-sm ${formData.familyNationality === 'non_eu'
                    ? 'border-[#36ccca] bg-[#d9f3f4] text-[#031247]'
                    : 'border-gray-200 bg-white'
                    }`}
                >
                  🌍 Extracomunitaria (Latinoamérica, etc)
                </button>
              </div>

              <p className="text-sm font-semibold text-[#0e2f76] mt-3">¿Cuál es el vínculo legal?</p>
              <Select
                value={formData.familyRelation || ''}
                onChange={(e) => updateField('familyRelation', e.target.value)}
                options={[
                  { label: 'Cónyuge (Matrimonio)', value: 'spouse' },
                  { label: 'Pareja de Hecho (Inscrita en Registro)', value: 'registered_partner' },
                  { label: 'Pareja estable (No inscrita/Novios)', value: 'unregistered_partner' },
                  { label: 'Hijo/a', value: 'child' },
                  { label: 'Padre/Madre', value: 'parent' },
                ]}
                label="Selecciona el vínculo"
              />
            </div>
          )}

          <button
            disabled={formData.hasFamilyInSpain === null || (formData.hasFamilyInSpain && (!formData.familyNationality || !formData.familyRelation))}
            onClick={handleNext}
            className="action-btn"
          >
            Siguiente
          </button>
        </div>
      )
    },
    {
      id: 'intent',
      title: '¿Cuál es tu objetivo principal?',
      description: 'Ayúdanos a priorizar la mejor vía para ti.',
      render: () => (
        <div className="space-y-3">
          {[
            { id: 'reside_work', text: 'Vivir y Trabajar', icon: '💼' },
            { id: 'study', text: 'Estudiar / Prácticas', icon: '🎓' },
            { id: 'family', text: 'Reagruparme con familia', icon: '👨‍👩‍👧' },
            {
              id: 'nationality',
              text: 'Obtener Nacionalidad',
              icon: (
                <img
                  src="https://flagcdn.com/w40/es.png"
                  srcSet="https://flagcdn.com/w80/es.png 2x"
                  width="24"
                  height="18"
                  alt="España"
                  className="rounded-sm object-cover"
                />
              )
            },
          ].map((opt) => (
            <ChoiceCard
              key={opt.id}
              title={opt.text}
              icon={opt.icon}
              selected={formData.primaryGoal === opt.id}
              onClick={() => updateField('primaryGoal', opt.id)}
            />
          ))}
          <button
            disabled={!formData.primaryGoal}
            onClick={handleNext}
            className="action-btn"
          >
            Continuar
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
              <div className="w-[45%] sm:w-[35%]">
                <PhonePrefixSelect
                  selectedIso={phoneIso}
                  onChange={(iso) => {
                    setPhoneIso(iso);
                    const code = PHONE_CODES.find(p => p.iso === iso)?.code;
                    if (code) setPhonePrefix(code);
                  }}
                  options={PHONE_CODES}
                />
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
