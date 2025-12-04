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

  "Valladolid", "Vizcaya", "Zamora", "Zaragoza",

];



const COUNTRIES = [

  "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia",

  "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyán", "Bahamas", "Bangladés", "Barbados", "Baréin",

  "Bélgica", "Belice", "Benín", "Bielorrusia", "Birmania", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil",

  "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Cabo Verde", "Camboya", "Camerún", "Canadá",

  "Catar", "Chad", "Chile", "China", "Chipre", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur",

  "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador",

  "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Esuatini",

  "Etiopía", "Fiyi", "Filipinas", "Finlandia", "Francia", "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia",

  "Guatemala", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Guyana", "Haití", "Honduras", "Hungría", "India",

  "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", "Islas Salomón", "Israel", "Italia", "Jamaica",

  "Japón", "Jordania", "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait", "Laos", "Lesoto", "Letonia",

  "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo", "Madagascar", "Malasia", "Malaui",

  "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco",

  "Mongolia", "Montenegro", "Mozambique", "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega",

  "Nueva Zelanda", "Omán", "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú",

  "Polonia", "Portugal", "Reino Unido", "República Centroafricana", "República Checa", "República del Congo",

  "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumanía", "Rusia", "Samoa", "San Cristóbal y Nieves",

  "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles",

  "Sierra Leona", "Singapur", "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia",

  "Suiza", "Surinam", "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago",

  "Túnez", "Turkmenistán", "Turquía", "Tuvalu", "Ucrania", "Uganda", "Uruguay", "Uzbekistán", "Vanuatu", "Venezuela",

  "Vietnam", "Yemen", "Yibuti", "Zambia", "Zimbabue"

];



const PHONE_CODES = [

  { iso: "es", country: "España", code: "+34" },

  { iso: "ar", country: "Argentina", code: "+54" },

  { iso: "mx", country: "México", code: "+52" },

  { iso: "co", country: "Colombia", code: "+57" },

  { iso: "pe", country: "Perú", code: "+51" },

  { iso: "cl", country: "Chile", code: "+56" },

  { iso: "uy", country: "Uruguay", code: "+598" },

  { iso: "py", country: "Paraguay", code: "+595" },

  { iso: "bo", country: "Bolivia", code: "+591" },

  { iso: "ec", country: "Ecuador", code: "+593" },

  { iso: "ve", country: "Venezuela", code: "+58" },

  { iso: "br", country: "Brasil", code: "+55" },

  { iso: "us", country: "Estados Unidos", code: "+1" },

  { iso: "ca", country: "Canadá", code: "+1" },

  { iso: "it", country: "Italia", code: "+39" },

  { iso: "fr", country: "Francia", code: "+33" },

  { iso: "de", country: "Alemania", code: "+49" },

];



const AGES = Array.from({ length: 70 }, (_, i) => i + 18);

const TIME_IN_SPAIN_LABELS: Record<string, string> = {
  [TimeInSpain.LESS_THAN_SIX_MONTHS]: 'Menos de 6 meses',
  [TimeInSpain.SIX_TO_TWELVE_MONTHS]: 'Entre 6 meses y 1 año',
  [TimeInSpain.ONE_TO_TWO_YEARS]: 'Entre 1 y 2 años',
  [TimeInSpain.TWO_TO_THREE_YEARS]: 'Entre 2 y 3 años',
  [TimeInSpain.MORE_THAN_THREE_YEARS]: 'Más de 3 años',
};



const initialData: UserProfile = {

  firstName: "",

  lastName: "",

  nationality: "",

  age: undefined,

  educationLevel: EducationLevel.SECUNDARIA,

  currentStatus: ImmigrationStatus.IRREGULAR,

  timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS,

  entryDate: "",

  province: "",

  locationStatus: "origin",

  isEmpadronado: null,

  jobSituation: "",

  hasCriminalRecord: null,

  hasFamilyInSpain: null,

  familyNationality: undefined,

  familyRelation: undefined,

  familyDetails: "",

  comments: "",

};



const initialContact: ContactInfo = {

  email: "",

  phone: "",

};



const ChoiceCard = ({

  title,

  icon,

  selected,

  onClick,

}: {

  title: string;

  icon: React.ReactNode;

  selected?: boolean;

  onClick?: () => void;

}) => (

  <button

    type="button"

    onClick={onClick}

    className={`w-full rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#36ccca]/50 ${selected ? 'border-[#36ccca] bg-[#e2f8f8] shadow-md' : 'border-[#d5dfec]'

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

                className={`flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${option.iso === selectedIso ? 'bg-blue-50 text-blue-600' : 'text-gray-700'

                  }`}

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

  const [intentTags, setIntentTags] = useState<string[]>([]);

  const [customComment, setCustomComment] = useState<string>("");



  const extractIntentTags = (value: string) => {

    const regex = /\[objetivo:([^\]]+)\]/gi;

    const tags: string[] = [];

    let match;

    while ((match = regex.exec(value))) {

      tags.push(match[1]);

    }

    const textOnly = value.replace(regex, "").trim();

    return { tags: Array.from(new Set(tags)), textOnly };

  };



  const combineComments = (text: string, tags: string[]) => {

    const prefix = tags.map(t => `[objetivo:${t}]`).join(" ");

    return [prefix, text].filter(Boolean).join(" ").trim();

  };



  const toggleIntent = (key: string) =>

    setIntentTags(prev =>

      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key],

    );



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

      if (parsed.formData) {

        const extracted = extractIntentTags(parsed.formData.comments || "");

        setFormData({ ...parsed.formData, comments: extracted.textOnly });

        setIntentTags(parsed.intentTags || extracted.tags);

        setCustomComment(parsed.customComment ?? extracted.textOnly ?? "");

      }

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

      formData: { ...formData, comments: combineComments(customComment, intentTags) },

      contactData: { ...contactData, phone: fullPhone },

      step,

      intentTags,

      customComment,

      timestamp: Date.now()

    };

    setLastSavedAt(payload.timestamp);

    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(payload));

  }, [formData, contactData, step, phonePrefix, phoneNumber, intentTags, customComment]);



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

    // --- NUEVO: CÁLCULO EXACTO DE TIEMPO PARA LA IA ---
    let timeContext = "";
    if (formData.entryDate) {
      const entry = new Date(formData.entryDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - entry.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffYears = (diffDays / 365.25).toFixed(2); // Ej: "2.15 años"

      timeContext = `[SISTEMA: El usuario lleva exactamente ${diffYears} años (${diffDays} días) en España. Usar este dato para validar requisitos de 2 años.]`;
    }
    // ---------------------------------------------------

    const combinedComments = combineComments(customComment, intentTags);

    // Inyectamos el cálculo al principio de los comentarios
    const finalComments = `${timeContext} \n ${combinedComments}`;

    onSubmit({ ...formData, comments: finalComments }, contactData);
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

            className="action-btn w-full px-10 py-4"

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

            className="action-btn w-full"

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

            className="action-btn w-full"

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

            className="action-btn w-full"

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

          />

          <button

            disabled={!formData.province}

            onClick={handleNext}

            className="action-btn w-full"

          >

            Continuar

          </button>

        </div>

      )

    },

    {

      id: 'status',

      title: 'Situación actual en España',

      description: 'Indica en qué situación te encuentras actualmente.',

      render: () => (

        <div className="space-y-5">

          <Select

            label="¿Cuál es tu situación actual?"

            value={formData.currentStatus}

            onChange={(e) => updateField('currentStatus', e.target.value)}

            options={[

              { label: 'Estoy en situación irregular', value: ImmigrationStatus.IRREGULAR },

              { label: 'Tengo permiso de residencia y/o trabajo', value: ImmigrationStatus.RESIDENT },

              { label: 'Estoy estudiando con visado de estudios', value: ImmigrationStatus.STUDENT },

            ]}

          />



          <Select

            label="¿Cuánto tiempo llevas en España?"

            value={formData.timeInSpain}

            onChange={(e) => updateField('timeInSpain', e.target.value)}

            options={[

              { label: 'Menos de 6 meses', value: TimeInSpain.LESS_THAN_SIX_MONTHS },

              { label: 'Entre 6 meses y 1 año', value: TimeInSpain.SIX_TO_TWELVE_MONTHS },

              { label: 'Entre 1 y 2 años', value: TimeInSpain.ONE_TO_TWO_YEARS },

              { label: 'Entre 2 y 3 años', value: TimeInSpain.TWO_TO_THREE_YEARS },

              { label: 'Más de 3 años', value: TimeInSpain.MORE_THAN_THREE_YEARS },

            ]}

          />

          <button

            onClick={handleNext}

            className="action-btn w-full"

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
            className="action-btn w-full"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'job',
      title: 'Trabajo y medios de vida',
      description: 'Cuéntanos tu situación laboral actual.',
      render: () => (
        <div className="space-y-4">
          <Select
            label="Situación laboral actual"
            value={formData.jobSituation}
            onChange={(e) => updateField('jobSituation', e.target.value)}
            options={[
              { label: 'Trabajo por cuenta ajena (contrato)', value: 'empleado' },
              { label: 'Trabajo por cuenta propia (autónomo)', value: 'autonomo' },
              { label: 'Trabajo sin contrato / economía informal', value: 'informal' },
              { label: 'Estoy desempleado/a', value: 'desempleado' },
              { label: 'Soy estudiante', value: 'estudiante' },
              { label: 'Otra situación', value: 'otro' },
            ]}
          />
          <button
            disabled={!formData.jobSituation}
            onClick={handleNext}
            className="action-btn w-full"
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
            className="action-btn w-full"
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
                  { label: 'Pareja de hecho inscrita', value: 'registered_partner' },
                  { label: 'Pareja estable (No inscrita/Novios)', value: 'unregistered_partner' },
                  { label: 'Hijo/a de español o europeo', value: 'child_of_spanish_eu' },
                  { label: 'Padre/Madre de español', value: 'parent_of_spanish' },
                  { label: 'Otro familiar conviviente', value: 'other' },
                ]}
              />

              <div className="space-y-2 mt-3">
                <label className="block text-sm font-medium text-[#4a5d7a] ml-1">
                  Cuéntanos brevemente con quién vives y si dependen de ti o tú dependes de ellos.
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#36ccca] focus:ring-4 focus:ring-[#36ccca]/10"
                  placeholder="Ejemplo: Vivo con mi pareja española desde hace 2 años, ella trabaja con contrato indefinido..."
                  value={formData.familyDetails || ''}
                  onChange={(e) => updateField('familyDetails', e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            disabled={formData.hasFamilyInSpain === null}
            onClick={handleNext}
            className="action-btn w-full"
          >
            Continuar
          </button>
        </div>
      )
    },
    {
      id: 'intent',
      title: '¿Qué estás buscando conseguir?',
      description: 'Esto nos ayuda a enfocar el análisis en el tipo de autorización que más encaja contigo.',
      render: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChoiceCard
              title="Regularizar mi situación (Arraigo, etc.)"
              icon="📄"
              selected={intentTags.includes('regularizar')}
              onClick={() => toggleIntent('regularizar')}
            />
            {formData.locationStatus !== 'spain' && (
              <ChoiceCard
                title="Venir a España por primera vez"
                icon="✈️"
                selected={intentTags.includes('entrada')}
                onClick={() => toggleIntent('entrada')}
              />
            )}
            <ChoiceCard
              title="Reagrupar o traer a un familiar"
              icon="👨‍👩‍👧‍👦"
              selected={intentTags.includes('familiares')}
              onClick={() => toggleIntent('familiares')}
            />
            <ChoiceCard
              title="Nacionalidad Española"
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
              selected={intentTags.includes('nacionalidad')}
              onClick={() => toggleIntent('nacionalidad')}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-base font-semibold text-[#0e2f76] ml-1">
              ¿Quieres añadir algún detalle importante? (Opcional)
            </label>
            <div className="rounded-2xl border border-[#d5dfec] bg-[#f7fbff] shadow-inner p-2">
              <textarea
                rows={4}
                className="w-full rounded-xl border border-transparent bg-transparent p-3 text-base text-[#031247] outline-none focus:border-[#36ccca] focus:ring-4 focus:ring-[#36ccca]/10"
                placeholder="Ejemplo: Tengo una oferta de trabajo, mi hijo nacio en España, ya intente un tramite y me lo denegaron, etc."
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleNext}
            className="action-btn w-full"
          >
            Ver resumen y enviar
          </button>
        </div>
      )
    },
    {
      id: 'summary',
      title: 'Último paso: revisemos tu caso',
      description: 'Revisa que todo esté correcto antes de enviarnos la información.',
      render: () => (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#d5dfec] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0e2f76] mb-3">Resumen de tu situación</h3>
            <ul className="space-y-2 text-sm text-[#4a5d7a]">
              <li><strong>Nombre:</strong> {formData.firstName} {formData.lastName}</li>
              <li><strong>Nacionalidad:</strong> {formData.nationality}</li>
              <li><strong>Edad:</strong> {formData.age} años</li>
              <li><strong>Nivel educativo:</strong> {formData.educationLevel}</li>
              <li><strong>Provincia:</strong> {formData.province}</li>
              <li><strong>Situación actual:</strong> {formData.currentStatus}</li>
              <li><strong>Tiempo en España:</strong> {formData.timeInSpain ? TIME_IN_SPAIN_LABELS[formData.timeInSpain] : 'No indicado'}</li>
              {formData.entryDate && <li><strong>Fecha de entrada:</strong> {formData.entryDate}</li>}
              <li><strong>Empadronado:</strong> {formData.isEmpadronado === true ? 'Sí' : formData.isEmpadronado === false ? 'No' : 'No indicado'}</li>
              <li><strong>Situación laboral:</strong> {formData.jobSituation || 'No indicado'}</li>
              <li><strong>Tienes antecedentes:</strong> {formData.hasCriminalRecord === true ? 'Sí' : formData.hasCriminalRecord === false ? 'No' : 'No indicado'}</li>
              <li><strong>Familia en España:</strong> {formData.hasFamilyInSpain === true ? 'Sí' : formData.hasFamilyInSpain === false ? 'No' : 'No indicado'}</li>
              {formData.familyDetails && <li><strong>Detalles familiares:</strong> {formData.familyDetails}</li>}
            </ul>
          </div>

          <button
            onClick={handleNext}
            className="action-btn w-full"
          >
            Confirmar y dejar mis datos de contacto
          </button>
        </div>
      )
    },
    {
      id: 'contact',
      title: '¿Dónde te enviamos el estudio?',
      description: 'Te enviaremos un resumen claro de tu caso y los posibles caminos legales.',
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
            className="action-btn w-full flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
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
        <div className="border-b border-[#e0e7f3] px-5 py-4">
          <h3 className="text-xl font-semibold text-[#031247]">
            {headerTitle}
          </h3>
          <p className="mt-1 text-sm text-[#4a5d7a]">
            {headerDescription}
          </p>
        </div>
        <div className="px-5 py-6">

          {currentStepData.render()}

        </div>

      </div>

    </div>

  );

};
