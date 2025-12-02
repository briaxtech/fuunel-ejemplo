import { UserProfile } from '../types';
import { TEMPLATE_KEYS } from './templates';

export interface PreClassification {
  flowCategory: string;
  candidateTemplates: string[];
}

const isSpanishNationality = (nationality?: string) => {
  const value = (nationality || '').toLowerCase();
  return value.includes('espa') || value.includes('españ') || value === 'spain';
};

const isEuropeanNationality = (nationality?: string) => {
  const value = (nationality || '').toLowerCase();
  const euCountries = [
    'alemania', 'austria', 'bélgica', 'belgica', 'bulgaria', 'chipre', 'croacia', 'dinamarca', 'eslovenia',
    'eslovaquia', 'españa', 'estonia', 'finlandia', 'francia', 'grecia', 'hungría', 'hungria', 'irlanda',
    'italia', 'letonia', 'lituania', 'luxemburgo', 'malta', 'países bajos', 'paises bajos', 'portugal',
    'república checa', 'republica checa', 'rumanía', 'rumania', 'suecia', 'polonia',
    'noruega', 'islandia', 'liechtenstein', 'suiza',
  ];
  return euCountries.some(country => value.includes(country));
};

const normalizeStatus = (status?: string) => (status || '').toLowerCase();
const normalizeTime = (time?: string) => (time || '').toLowerCase();

const has3Years = (time?: string) => {
  const t = normalizeTime(time);
  return t.includes('3') || t.includes('más de 3') || t.includes('mas de 3') || t.includes('m') && t.includes('3');
};

const hasBetween2And3 = (time?: string) => {
  const t = normalizeTime(time);
  return t.includes('2') && t.includes('3') || t.includes('2 a') || t.includes('entre 2');
};

const filterExistingTemplates = (keys: string[]) => {
  const allowed = new Set(TEMPLATE_KEYS.map(k => k.toUpperCase()));
  return Array.from(
    keys.reduce<Set<string>>((acc, key) => {
      const normalized = key.toUpperCase();
      if (allowed.has(normalized)) {
        acc.add(key);
      }
      return acc;
    }, new Set<string>()),
  );
};

export const preClassify = (profile: UserProfile): PreClassification => {
  const result: PreClassification = {
    flowCategory: 'GENERIC',
    candidateTemplates: TEMPLATE_KEYS,
  };

  const status = normalizeStatus(profile.currentStatus);
  const inSpain = profile.locationStatus === 'spain';
  const hasFamily = !!profile.hasFamilyInSpain;
  const familyNationality = profile.familyNationality || '';
  const relation = profile.familyRelation || '';
  const goal = profile.primaryGoal || '';

  // 1) Español o comunitario
  if (isSpanishNationality(profile.nationality)) {
    result.flowCategory = 'SPANISH';
    result.candidateTemplates = filterExistingTemplates([
      'CUE 2025',
      'CUE 2025 ',
    ]);
    return result;
  }

  // 2) Familiar de español o UE
  if (hasFamily && familyNationality === 'spanish_eu') {
    result.flowCategory = 'FAMILY_OF_EU';
    const isPartner = relation === 'spouse' || relation === 'registered_partner' || relation === 'unregistered_partner';
    const isChildParent = relation === 'child' || relation === 'parent';
    const familyTemplates = [
      'FAMILIAR UE 2025',
      'PAREJA DE HECHO',
      'TRABAJAR CON RESIDENCIA DE FAMILIAR DE CIUDADANO DE LA UE EN TRÁMITE',
      'TRABAJAR CON RESIDENCIA DE FAMILIAR DE CIUDADANO DE LA UE EN TRÁMITE ',
      'RESIDENCIA INDEPENDIENTE',
      'RESIDENCIA INDEPENDIENTE ',
      'ARRAIGO FAMILIAR',
      'FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPAÑOLA',
    ];
    if (isPartner) {
      result.candidateTemplates = filterExistingTemplates([
        ...familyTemplates,
        'REAGRUPACIÓN FAMILIAR',
      ]);
    } else if (isChildParent) {
      result.candidateTemplates = filterExistingTemplates([
        'ARRAIGO FAMILIAR',
        'REAGRUPACIÓN FAMILIAR',
        'ESTAR A CARGO',
        'FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPAÑOLA',
        'RESIDENCIA INDEPENDIENTE',
        'RESIDENCIA INDEPENDIENTE ',
      ]);
    } else {
      result.candidateTemplates = filterExistingTemplates(familyTemplates);
    }
    return result;
  }

  // 3) No español/familiar: clasificar por ubicación y status
  if (inSpain) {
    // Arraigos e irregularidad
    if (status.includes('irregular') || status.includes('sin papeles')) {
      result.flowCategory = 'ARRAIGOS';
      const base = [
        'ARRAIGO SOCIAL',
        'ARRAIGO SOCIOLABORAL',
        'ARRAIGO SOCIOFORMATIVO',
        'ARRAIGO FAMILIAR',
        'ARRAIGO DE SEGUNDA OPORTUNIDAD',
        'FORMAS DE REGULARIZARSE',
      ];
      const extras: string[] = [];
      if (has3Years(profile.timeInSpain)) {
        extras.push('ARRAIGO SOCIAL', 'ARRAIGO SOCIOLABORAL', 'ARRAIGO SOCIOFORMATIVO');
      }
      if (hasBetween2And3(profile.timeInSpain)) {
        extras.push('ARRAIGO SOCIOLABORAL');
      }
      result.candidateTemplates = filterExistingTemplates([...base, ...extras]);
      return result;
    }

    // Estudiantes
    if (status.includes('estudiante') || goal === 'study') {
      result.flowCategory = 'STUDENT';
      result.candidateTemplates = filterExistingTemplates([
        'RENOVACIÓN DE ESTUDIOS',
        'DESPUÉS DE ESTUDIOS',
        'MODIFICAR DE ESTUDIOS A CUENTA AJENA',
        'MODIFICAR DE ESTUDIOS A CUENTA PROPIA',
        'MODIFICACIÓN DE FAMILIARES DE ESTUDIANTE',
        'ERROR EN LA RESOLUCIÓN DE ESTUDIANTES',
        'FORMAS DE REGULARIZARSE',
      ]);
      return result;
    }

    // Residente regular
    if (status.includes('regular') || status.includes('residencia') || status.includes('nie')) {
      result.flowCategory = 'RESIDENT';
      result.candidateTemplates = filterExistingTemplates([
        'PUEDO TRABAJAR CON LA RESIDENCIA EN TRÁMITE',
        'PUEDO TRABAJAR CON LA RESIDENCIA EN TRÁMITE ',
        'RESIDENCIA INDEPENDIENTE',
        'RESIDENCIA INDEPENDIENTE ',
        'REAGRUPACIÓN FAMILIAR',
        'FORMAS DE REGULARIZARSE',
        'CUE 2025',
        'CUE 2025 ',
        'NACIONALIDAD 2024',
        'NACIONALIDAD POR MATRIMONIO',
        'NACIONALIDAD POR APELLIDOS',
        'RECURSO CONTENCIOSO',
        'LEY DE MEMORIA DEMOCRÁTICA (LMD)',
      ]);
      return result;
    }

    // Turista en España
    if (status.includes('turista')) {
      result.flowCategory = 'TOURIST_IN_SPAIN';
      result.candidateTemplates = filterExistingTemplates([
        'AUTORIZACIONES COMO TURISTA',
        'ESTUDIAR EN ESPAÑA',
        'ENTRAR COMO TURISTA',
        'NÓMADA DIGITAL',
        'EMPRENDER EN ESPAÑA',
        'RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO',
        'RESIDENCIA PARA INVERSORES',
      ]);
      return result;
    }

    // Asilo
    if (status.includes('asilo')) {
      result.flowCategory = 'ASYLUM';
      result.candidateTemplates = filterExistingTemplates(['ASILO', 'FORMAS DE REGULARIZARSE']);
      return result;
    }
  } else {
    // Fuera de España
    const goalStudy = goal === 'study';
    const goalWork = goal === 'reside_work';
    const goalFamily = goal === 'family';
    const goalNationality = goal === 'nationality';

    const baseTemplates: string[] = [];

    if (goalStudy) {
      baseTemplates.push('ESTUDIAR EN ESPAÑA');
    }
    if (goalWork) {
      baseTemplates.push(
        'EMIGRAR SIN PASAPORTE EUROPEO',
        'RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO',
        'RESIDENCIA PARA INVERSORES',
        'NÓMADA DIGITAL',
        'EMPRENDER EN ESPAÑA',
        'ENTRAR COMO TURISTA',
      );
    }
    if (goalFamily || hasFamily) {
      baseTemplates.push(
        'REAGRUPACIÓN FAMILIAR',
        'FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPAÑOLA',
        'ESTAR A CARGO',
      );
    }
    if (goalNationality) {
      baseTemplates.push(
        'NACIONALIDAD 2024',
        'NACIONALIDAD POR MATRIMONIO',
        'NACIONALIDAD POR APELLIDOS',
        'LEY DE MEMORIA DEMOCRÁTICA (LMD)',
        'BÚSQUEDA DE ACTAS',
      );
    }

    result.flowCategory = 'OUTSIDE_SPAIN';
    result.candidateTemplates = filterExistingTemplates(
      baseTemplates.length ? baseTemplates : TEMPLATE_KEYS,
    );
    return result;
  }

  return result;
};
