import { UserProfile } from '../types';
import { TEMPLATE_KEYS } from './templates';

export interface PreClassification {
  flowCategory: string;
  candidateTemplates: string[];
}

const simplify = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const TEMPLATE_INDEX = TEMPLATE_KEYS.map(key => ({
  key,
  norm: simplify(key),
}));

const matchTemplate = (label: string) => {
  const normLabel = simplify(label);
  if (!normLabel) return undefined;
  const exact = TEMPLATE_INDEX.find(t => t.norm === normLabel);
  if (exact) return exact.key;
  const contains = TEMPLATE_INDEX.find(
    t => t.norm.includes(normLabel) || normLabel.includes(t.norm),
  );
  return contains?.key;
};

const mapToTemplates = (labels: string[]): string[] => {
  const result: string[] = [];
  labels.forEach(label => {
    const matched = matchTemplate(label);
    if (matched) result.push(matched.trim());
  });
  return Array.from(new Set(result));
};

const normalizeStatus = (status?: string) => (status || '').toLowerCase();
const normalizeTime = (time?: string) => (time || '').toLowerCase();

const statusFlags = (status: string) => {
  const s = normalizeStatus(status);
  const hasWord = (pattern: RegExp) => pattern.test(s);

  return {
    isIrregular: hasWord(/\birregular\b/) || s.includes('sin papeles'),
    isStudent: hasWord(/\bestudiante\b/) || s.includes('student'),
    isResident:
      hasWord(/\bresident\b/) ||
      hasWord(/\bresidencia\b/) ||
      hasWord(/\bnie\b/) ||
      hasWord(/\bregular\b/),
    isTourist: hasWord(/\bturista\b/) || s.includes('tourist'),
    isAsylum: hasWord(/\basilo\b/) || s.includes('asylum'),
  };
};

const timeToYears = (time?: string): number => {
  const t = normalizeTime(time);
  if (!t) return 0;
  if (t.includes('more_than_three') || t.includes('mas de 3')) return 3.5;
  if (t.includes('two_to_three') || t.includes('2 a 3') || t.includes('2-3')) return 2.5;
  if (t.includes('one_to_two') || t.includes('1 a 2') || t.includes('1-2')) return 1.5;
  if (t.includes('six_to_twelve') || t.includes('6') || t.includes('twelve')) return 0.8;
  if (t.includes('less_than') || t.includes('<')) return 0.3;
  const numeric = parseFloat(t.replace(/[^0-9.]/g, ''));
  return isNaN(numeric) ? 0 : numeric;
};

const has3Years = (time?: string) => {
  const years = timeToYears(time);
  return years >= 3;
};

const hasBetween2And3 = (time?: string) => {
  const years = timeToYears(time);
  return years >= 2 && years < 3.2;
};

const isSpanishNationality = (nationality?: string) => {
  const value = (nationality || '').toLowerCase();
  return value.includes('espa') || value === 'spain';
};

const extractGoal = (comments: string): string => {
  if (comments.includes('[objetivo:regularizar]')) return 'regularize';
  if (comments.includes('[objetivo:entrada]')) return 'entry';
  if (comments.includes('[objetivo:familiares]')) return 'family';
  if (comments.includes('[objetivo:nacionalidad]')) return 'nationality';
  return '';
};

const containsAny = (text: string, needles: string[]) => {
  return needles.some((n) => {
    const pattern = new RegExp(`\\b${n}\\b`, 'i');
    return pattern.test(text);
  });
};

const stripAccents = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const preClassify = (profile: UserProfile): PreClassification => {
  const result: PreClassification = {
    flowCategory: 'GENERIC',
    candidateTemplates: TEMPLATE_KEYS,
  };

  const status = normalizeStatus(profile.currentStatus);
  const flags = statusFlags(profile.currentStatus);
  const comments = (profile.comments || '').toLowerCase();
  const commentsPlain = stripAccents(comments);
  const job = (profile.jobSituation || '').toLowerCase();
  const jobPlain = stripAccents(job);
  const inSpain = profile.locationStatus === 'spain';
  const hasFamily = !!profile.hasFamilyInSpain;
  const familyNationality = profile.familyNationality || '';
  const relation = profile.familyRelation || '';
  const goalTag = extractGoal(comments);
  const goal =
    goalTag ||
    (profile.primaryGoal?.toLowerCase().includes('study')
      ? 'study'
      : profile.primaryGoal?.toLowerCase().includes('family')
        ? 'family'
        : profile.primaryGoal?.toLowerCase().includes('nationality')
          ? 'nationality'
          : profile.primaryGoal?.toLowerCase().includes('regular')
            ? 'regularize'
            : '');

  // Señales de ruta formativa (para socioformativo)
  const hasTrainingPath =
    commentsPlain.includes('formacion') ||
    commentsPlain.includes('curso') ||
    commentsPlain.includes('600h') ||
    commentsPlain.includes('600 h') ||
    commentsPlain.includes('fp') ||
    commentsPlain.includes('socioformativo') ||
    commentsPlain.includes('preinscripcion') ||
    commentsPlain.includes('estudiar') ||
    commentsPlain.includes('estudios') ||
    commentsPlain.includes('master') ||
    commentsPlain.includes('grado') ||
    commentsPlain.includes('aprender') ||
    jobPlain.includes('curso');

  // Exploratory detection
  const isExploratory = () => {
    if (hasFamily) return false;
    const exploratoryKeywords = ['opciones', 'posibilidades', 'no se', 'explorando', 'busco informacion'];
    const hasExploratoryKeywords = exploratoryKeywords.some(kw => commentsPlain.includes(kw));
    const lacksSpecifics =
      !commentsPlain.includes('oferta') &&
      !commentsPlain.includes('contrato') &&
      !commentsPlain.includes('matricula') &&
      !commentsPlain.includes('admision');
    return hasExploratoryKeywords || (lacksSpecifics && comments.length < 50);
  };

  const needsGenericTemplate = () => {
    if (commentsPlain.includes('clienes')) return 'CLIENES';
    if (commentsPlain.includes('gestor de confianza')) return 'GESTOR DE CONFIANZA';
    if (commentsPlain.includes('cuenta brevemente')) return 'CUENTA BREVEMENTE';
    if (commentsPlain.includes('remitir a julia') || commentsPlain.includes('julia')) return 'REMITIR A JULIA';
    return null;
  };

  // Payment intents
  const isPayment = containsAny(commentsPlain, ['pago', 'pagar', 'enlace de pago']);
  if (isPayment) {
    result.flowCategory = 'PAYMENT';
    result.candidateTemplates = mapToTemplates([
      'PEDIDO PAGO',
      'PRIMER PAGO NACIONALIDAD (UN EXPEDIENTE)',
      'PRIMER PAGO NACIONALIDAD (VARIOS EXPEDIENTES)',
    ]);
    return result;
  }

  // Scheduling intents
  const isSchedule = containsAny(commentsPlain, ['agendar', 'agenda', 'cita', 'confirmar cita']);
  if (isSchedule) {
    result.flowCategory = 'SCHEDULING';
    result.candidateTemplates = mapToTemplates([
      'AGENDAR CITA',
      'CITA AGENDADA',
      'CLIENES',
    ]);
    return result;
  }

  // Actas / certificates search
  const isActas = containsAny(commentsPlain, ['acta', 'actas', 'partida', 'registro']);
  if (isActas) {
    result.flowCategory = inSpain ? 'ACTAS' : 'OUTSIDE_SPAIN';
    result.candidateTemplates = mapToTemplates([
      'BUSQUEDA DE ACTAS',
      'LEY DE MEMORIA DEMOCRATICA (LMD)',
    ]);
    return result;
  }

  // Work while residence pending (comunitario)
  const asksWorkInProcess = containsAny(commentsPlain, ['residencia en tramite', 'resguardo', 'puedo trabajar', 'trabajar mientras']);
  if (asksWorkInProcess) {
    result.flowCategory = flags.isResident ? 'RESIDENT' : 'WORK_PENDING';
    result.candidateTemplates = mapToTemplates([
      'TRABAJAR CON RESIDENCIA DE FAMILIAR DE CIUDADANO DE LA UE EN TRAMITE',
      'PUEDO TRABAJAR CON LA RESIDENCIA EN TRAMITE',
      'FAMILIAR UE 2025',
      'ARRAIGO FAMILIAR',
    ]);
    return result;
  }

  const genericTemplate = needsGenericTemplate();
  if (genericTemplate) {
    result.flowCategory = 'GENERIC_ADVISORY';
    result.candidateTemplates = mapToTemplates([
      genericTemplate,
      'CLIENES',
      'CUENTA BREVEMENTE',
    ]);
    return result;
  }

  if (isExploratory()) {
    result.flowCategory = 'GENERIC_ADVISORY';
    result.candidateTemplates = mapToTemplates([
      'CLIENES',
      'GESTOR DE CONFIANZA',
      'CUENTA BREVEMENTE',
      'REMITIR A JULIA',
    ]);
    return result;
  }

  // 1) Spanish
  if (isSpanishNationality(profile.nationality)) {
    result.flowCategory = 'SPANISH';
    result.candidateTemplates = mapToTemplates(['CUE 2025']);
    return result;
  }

  // 2) Family of EU/Spanish (solo si esta en Espana)
  if (inSpain && hasFamily && familyNationality === 'spanish_eu') {
    result.flowCategory = 'FAMILY_OF_EU';
    const isPartner =
      relation === 'spouse' || relation === 'registered_partner' || relation === 'unregistered_partner';
    const isChildParent = relation === 'child_of_spanish_eu' || relation === 'parent_of_spanish';

    // Right to work while the community card is in process
    const mentionsTramite = comments.includes('tramite') || comments.includes('trámite') || comments.includes('tram');
    if (comments.includes('trabaj') && mentionsTramite) {
      result.candidateTemplates = mapToTemplates([
        'TRABAJAR CON RESIDENCIA DE FAMILIAR DE CIUDADANO DE LA UE EN TRAMITE',
        'PUEDO TRABAJAR CON LA RESIDENCIA EN TRAMITE',
        'FAMILIAR UE 2025',
        'ARRAIGO FAMILIAR',
      ]);
      return result;
    }

    // Nationality by marriage should take precedence
    if (goal === 'nationality') {
      result.candidateTemplates = mapToTemplates([
        'NACIONALIDAD POR MATRIMONIO',
        'NACIONALIDAD 2024',
        'FAMILIAR UE 2025',
        'ARRAIGO FAMILIAR',
      ]);
      return result;
    }

    const familyTemplates = [
      'FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPANOLA',
      'ESTAR A CARGO',
      'FAMILIAR UE 2025',
      'PAREJA DE HECHO',
      'ARRAIGO FAMILIAR',
      'TRABAJAR CON RESIDENCIA DE FAMILIAR DE CIUDADANO DE LA UE EN TRAMITE',
      'RESIDENCIA INDEPENDIENTE',
      'HIJO DE ESPANOL DE ORIGEN',
    ];

    // Ascendientes/directos de español: priorizar estar a cargo / familiares de español
    if (relation === 'other' || commentsPlain.includes('ascendiente') || commentsPlain.includes('a cargo')) {
      familyTemplates.unshift('FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPANOLA', 'ESTAR A CARGO');
    }

    if (isPartner) {
      result.candidateTemplates = mapToTemplates([
        'FAMILIAR UE 2025',
        'PAREJA DE HECHO',
        ...familyTemplates,
        'REAGRUPACION FAMILIAR',
      ]);
    } else if (isChildParent) {
      result.candidateTemplates = mapToTemplates([
        'ARRAIGO FAMILIAR',
        'HIJO DE ESPANOL DE ORIGEN',
        'REAGRUPACION FAMILIAR',
        'ESTAR A CARGO',
        'FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPANOLA',
        'RESIDENCIA INDEPENDIENTE',
      ]);
    } else {
      result.candidateTemplates = mapToTemplates(familyTemplates);
    }
    return result;
  }

  // 3) Non Spanish/family
  if (inSpain) {
    // Special cases: homologation / investors
    if (commentsPlain.includes('homolog') || commentsPlain.includes('titulo') || commentsPlain.includes('reconocimiento')) {
      result.flowCategory = flags.isResident ? 'RESIDENT' : 'GENERIC';
      result.candidateTemplates = mapToTemplates(['HOMOLOGACION']);
      return result;
    }
    if (
      commentsPlain.includes('inver') ||
      commentsPlain.includes('compra') ||
      commentsPlain.includes('bienes') ||
      (commentsPlain.includes('600') && commentsPlain.includes('000'))
    ) {
      result.flowCategory = flags.isResident ? 'RESIDENT' : result.flowCategory;
      result.candidateTemplates = mapToTemplates(['RESIDENCIA PARA INVERSORES']);
      return result;
    }

    // Tourist already in Spain: priorizar autorizaciones/nomada antes de otras ramas
    if (flags.isTourist) {
      result.flowCategory = 'TOURIST_IN_SPAIN';
      const hasRemoteSignals =
        jobPlain.includes('remoto') ||
        jobPlain.includes('remote') ||
        commentsPlain.includes('remoto') ||
        commentsPlain.includes('teletrabajo') ||
        commentsPlain.includes('freelance');
      const touristTemplates = hasRemoteSignals
        ? [
            'NOMADA DIGITAL',
            'AUTORIZACIONES COMO TURISTA',
            'ESTUDIAR EN ESPAÑA',
            'ENTRAR COMO TURISTA',
            'EMPRENDER EN ESPANA',
            'RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO',
            'RESIDENCIA PARA INVERSORES',
          ]
        : [
            'AUTORIZACIONES COMO TURISTA',
            'ESTUDIAR EN ESPANA',
            'ENTRAR COMO TURISTA',
            'NOMADA DIGITAL',
            'EMPRENDER EN ESPANA',
            'RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO',
            'RESIDENCIA PARA INVERSORES',
          ];

      if (isExploratory()) {
        touristTemplates.unshift('CUENTA BREVEMENTE', 'CLIENES');
      }

      result.candidateTemplates = mapToTemplates(touristTemplates);
      return result;
    }

    // Irregular / arraigos
    // Students first (evita que goal=regularize los mande a arraigos)
    if (flags.isStudent || goal === 'study') {
      result.flowCategory = 'STUDENT';

      const studyTemplates: string[] = [];
      let isSpecificStudyCase = false;
      let addedStudentFamily = false;

      const mentionsStudentFamily =
        commentsPlain.includes('conyuge') ||
        commentsPlain.includes('espos') ||
        commentsPlain.includes('pareja') ||
        commentsPlain.includes('hijo') ||
        commentsPlain.includes('hija') ||
        commentsPlain.includes('familia');

      if (mentionsStudentFamily) {
        studyTemplates.push('MODIFICACION DE FAMILIARES DE ESTUDIANTE');
        isSpecificStudyCase = true;
        addedStudentFamily = true;
      }

      if (commentsPlain.includes('modificar') || commentsPlain.includes('cuenta ajena') || commentsPlain.includes('trabajo')) {
        studyTemplates.push('MODIFICAR DE ESTUDIOS A CUENTA AJENA');
        isSpecificStudyCase = true;
      }
      if (
        commentsPlain.includes('modificar') ||
        commentsPlain.includes('cuenta propia') ||
        commentsPlain.includes('autonomo') ||
        commentsPlain.includes('emprende')
      ) {
        studyTemplates.push('MODIFICAR DE ESTUDIOS A CUENTA PROPIA');
        isSpecificStudyCase = true;
      }
      if (commentsPlain.includes('despues') || commentsPlain.includes('terminad') || commentsPlain.includes('termin') || commentsPlain.includes('buscar empleo')) {
        studyTemplates.push('DESPUES DE ESTUDIOS');
        isSpecificStudyCase = true;
      }
      if (
        commentsPlain.includes('renova') ||
        commentsPlain.includes('prorroga') ||
        commentsPlain.includes('prorrogar') ||
        commentsPlain.includes('prorrog')
      ) {
        studyTemplates.push('RENOVACION DE ESTUDIOS');
        isSpecificStudyCase = true;
      }
      if (commentsPlain.includes('familia') && !addedStudentFamily) {
        studyTemplates.push('MODIFICACION DE FAMILIARES DE ESTUDIANTE');
        isSpecificStudyCase = true;
      }
      if (commentsPlain.includes('error') || commentsPlain.includes('resolucion') || commentsPlain.includes('denega')) {
        studyTemplates.unshift('ERROR EN LA RESOLUCION DE ESTUDIANTES');
        isSpecificStudyCase = true;
      }

      if (!isSpecificStudyCase) {
        studyTemplates.push('ESTUDIAR EN ESPANA');
        studyTemplates.push('FORMAS DE REGULARIZARSE');
      }

      result.candidateTemplates = mapToTemplates(studyTemplates);
      return result;
    }

    // Resident
    if (flags.isResident) {
      result.flowCategory = 'RESIDENT';

      const asksWorkWhilePending = commentsPlain.includes('trabaj') && commentsPlain.includes('tramite');
      if (asksWorkWhilePending && hasFamily && familyNationality === 'spanish_eu') {
        result.candidateTemplates = mapToTemplates([
          'PUEDO TRABAJAR CON LA RESIDENCIA EN TRAMITE',
          'TRABAJAR CON RESIDENCIA DE FAMILIAR DE CIUDADANO DE LA UE EN TRAMITE',
          'FAMILIAR UE 2025',
          'ARRAIGO FAMILIAR',
        ]);
        return result;
      }

      const residentTemplates = [
        'NACIONALIDAD 2024',
        'REAGRUPACION FAMILIAR',
        'RESIDENCIA INDEPENDIENTE',
        'PUEDO TRABAJAR CON LA RESIDENCIA EN TRAMITE',
        'CUE 2025',
      ];

      if (goal === 'family' || commentsPlain.includes('reagrup')) {
        residentTemplates.unshift('REAGRUPACION FAMILIAR');
      }

      if (goal === 'nationality' || commentsPlain.includes('nacionalidad')) {
        if (commentsPlain.includes('matrimonio') || commentsPlain.includes('casad') || commentsPlain.includes('espos')) {
          residentTemplates.unshift('NACIONALIDAD POR MATRIMONIO');
        }
        if (commentsPlain.includes('apellido') || commentsPlain.includes('sefarad') || commentsPlain.includes('judio')) {
          residentTemplates.unshift('NACIONALIDAD POR APELLIDOS');
        }
        if (commentsPlain.includes('lmd') || commentsPlain.includes('memoria') || commentsPlain.includes('nieto') || commentsPlain.includes('abuelo')) {
          residentTemplates.unshift('LEY DE MEMORIA DEMOCRATICA (LMD)');
        }
      }

      if (commentsPlain.includes('recurso') || commentsPlain.includes('denega')) {
        residentTemplates.unshift('RECURSO CONTENCIOSO');
      }

      result.candidateTemplates = mapToTemplates(residentTemplates);
      return result;
    }

    // Students (manejar antes de irregular para no enviarlos a arraigos)
    if (flags.isStudent || goal === 'study') {
      result.flowCategory = 'STUDENT';

      const studyTemplates: string[] = [];
      let isSpecificStudyCase = false;
      let addedStudentFamily = false;

      if (commentsPlain.includes('familiar de estudiante') || commentsPlain.includes('conyuge de estudiante') || commentsPlain.includes('familia de estudiante')) {
        studyTemplates.unshift('MODIFICACION DE FAMILIARES DE ESTUDIANTE');
        isSpecificStudyCase = true;
        addedStudentFamily = true;
      }

      const mentionsStudentFamily =
        commentsPlain.includes('conyuge') ||
        commentsPlain.includes('espos') ||
        commentsPlain.includes('pareja') ||
        commentsPlain.includes('hijo') ||
        commentsPlain.includes('hija') ||
        commentsPlain.includes('familia');

      if (!addedStudentFamily && mentionsStudentFamily) {
        studyTemplates.unshift('MODIFICACION DE FAMILIARES DE ESTUDIANTE');
        isSpecificStudyCase = true;
        addedStudentFamily = true;
      }

      if (commentsPlain.includes('modificar') || commentsPlain.includes('cuenta ajena') || commentsPlain.includes('trabajo')) {
        studyTemplates.push('MODIFICAR DE ESTUDIOS A CUENTA AJENA');
        isSpecificStudyCase = true;
      }
      if (
        commentsPlain.includes('modificar') ||
        commentsPlain.includes('cuenta propia') ||
        commentsPlain.includes('autonomo') ||
        commentsPlain.includes('emprende')
      ) {
        studyTemplates.push('MODIFICAR DE ESTUDIOS A CUENTA PROPIA');
        isSpecificStudyCase = true;
      }
      if (commentsPlain.includes('despues') || commentsPlain.includes('terminad') || commentsPlain.includes('termin') || commentsPlain.includes('buscar empleo')) {
        studyTemplates.push('DESPUES DE ESTUDIOS');
        isSpecificStudyCase = true;
      }
      if (
        commentsPlain.includes('renova') ||
        commentsPlain.includes('prorroga') ||
        commentsPlain.includes('prorrogar') ||
        commentsPlain.includes('prorrog')
      ) {
        studyTemplates.push('RENOVACION DE ESTUDIOS');
        isSpecificStudyCase = true;
      }
      if (commentsPlain.includes('familia') && !addedStudentFamily) {
        studyTemplates.push('MODIFICACION DE FAMILIARES DE ESTUDIANTE');
        isSpecificStudyCase = true;
      }
      if (commentsPlain.includes('error') || commentsPlain.includes('resolucion') || commentsPlain.includes('denega')) {
        studyTemplates.unshift('ERROR EN LA RESOLUCION DE ESTUDIANTES');
        isSpecificStudyCase = true;
      }

      if (!isSpecificStudyCase) {
        studyTemplates.push('ESTUDIAR EN ESPANA');
        studyTemplates.push('FORMAS DE REGULARIZARSE');
      }

      result.candidateTemplates = mapToTemplates(studyTemplates);
      return result;
    }

    // Residentes antes que irregular
    if (flags.isResident) {
      result.flowCategory = 'RESIDENT';

      const asksWorkWhilePending = commentsPlain.includes('trabaj') && commentsPlain.includes('tramite');
      if (asksWorkWhilePending && hasFamily && familyNationality === 'spanish_eu') {
        result.candidateTemplates = mapToTemplates([
          'PUEDO TRABAJAR CON LA RESIDENCIA EN TRAMITE',
          'TRABAJAR CON RESIDENCIA DE FAMILIAR DE CIUDADANO DE LA UE EN TRAMITE',
          'FAMILIAR UE 2025',
          'ARRAIGO FAMILIAR',
        ]);
        return result;
      }

      const residentTemplates = [
        'NACIONALIDAD 2024',
        'REAGRUPACION FAMILIAR',
        'RESIDENCIA INDEPENDIENTE',
        'PUEDO TRABAJAR CON LA RESIDENCIA EN TRAMITE',
        'CUE 2025',
      ];

      if (goal === 'family' || commentsPlain.includes('reagrup')) {
        residentTemplates.unshift('REAGRUPACION FAMILIAR');
      }

      if (goal === 'nationality' || commentsPlain.includes('nacionalidad')) {
        if (commentsPlain.includes('matrimonio') || commentsPlain.includes('casad') || commentsPlain.includes('espos')) {
          residentTemplates.unshift('NACIONALIDAD POR MATRIMONIO');
        }
        if (commentsPlain.includes('apellido') || commentsPlain.includes('sefarad') || commentsPlain.includes('judio')) {
          residentTemplates.unshift('NACIONALIDAD POR APELLIDOS');
        }
        if (commentsPlain.includes('lmd') || commentsPlain.includes('memoria') || commentsPlain.includes('nieto') || commentsPlain.includes('abuelo')) {
          residentTemplates.unshift('LEY DE MEMORIA DEMOCRATICA (LMD)');
        }
      }

      if (commentsPlain.includes('recurso') || commentsPlain.includes('denega')) {
        residentTemplates.unshift('RECURSO CONTENCIOSO');
      }

      result.candidateTemplates = mapToTemplates(residentTemplates);
      return result;
    }

    if (flags.isIrregular || goal === 'regularize') {
      result.flowCategory = 'ARRAIGOS';
      const base: string[] = [
        'ARRAIGO SOCIAL',
        'ARRAIGO SOCIOFORMATIVO',
        'ARRAIGO FAMILIAR',
        'ARRAIGO DE SEGUNDA OPORTUNIDAD',
        'FORMAS DE REGULARIZARSE',
      ];

      if (commentsPlain.includes('recurso') || commentsPlain.includes('denega') || commentsPlain.includes('contencioso')) {
        base.unshift('RECURSO CONTENCIOSO');
      }

      // LÓGICA DE TIEMPO ACTUALIZADA
      const years = timeToYears(profile.timeInSpain);
      let candidates = [...base];

      // FILTRO ESTRICTO DE AÑOS
      if (years < 1.9) {
         // Menos de 2 años: No puede hacer Arraigo Social ni Laboral
         candidates = candidates.filter(t => t !== 'ARRAIGO SOCIAL' && t !== 'ARRAIGO SOCIOLABORAL');
      } else if (years < 2.9) {
         // Entre 2 y 3 años (Caso de tu usuario: 2.16):
         // Cumple para Formativo y Laboral, pero NO para Social (pide 3).
         // Quitamos "ARRAIGO SOCIAL" para que la IA no se confunda.
         candidates = candidates.filter(t => t !== 'ARRAIGO SOCIAL');
      }

      // Logica laboral
      const hasLaborEvidence =
        jobPlain.includes('denuncia') ||
        jobPlain.includes('inspecci') ||
        jobPlain.includes('sentencia') ||
        jobPlain.includes('nomina') ||
        commentsPlain.includes('laboral'); // OJO: 'informal' no suele activar esto en tu código actual

      if (hasLaborEvidence) {
        candidates.unshift('ARRAIGO SOCIOLABORAL');
      }

      // Priorizar formativo si no hay pruebas laborales fuertes
      if (!hasLaborEvidence && years >= 1.9) {
          // Ponemos Formativo al principio porque es la vía más segura para 2 años sin denuncia
          candidates = candidates.filter(t => t !== 'ARRAIGO SOCIOFORMATIVO'); // Lo quitamos para volver a ponerlo al inicio
          candidates.unshift('ARRAIGO SOCIOFORMATIVO');
      }

      result.candidateTemplates = mapToTemplates(candidates);
      return result;
    }

    // Tourist in Spain
    if (flags.isTourist) {
      result.flowCategory = 'TOURIST_IN_SPAIN';
      const hasRemoteSignals =
        jobPlain.includes('remoto') ||
        jobPlain.includes('remote') ||
        commentsPlain.includes('remoto') ||
        commentsPlain.includes('teletrabajo') ||
        commentsPlain.includes('freelance');
      const touristTemplates = hasRemoteSignals
        ? [
            'NOMADA DIGITAL',
            'AUTORIZACIONES COMO TURISTA',
            'ESTUDIAR EN ESPANA',
            'ENTRAR COMO TURISTA',
            'EMPRENDER EN ESPANA',
            'RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO',
            'RESIDENCIA PARA INVERSORES',
          ]
        : [
            'AUTORIZACIONES COMO TURISTA',
            'ESTUDIAR EN ESPANA',
            'ENTRAR COMO TURISTA',
            'NOMADA DIGITAL',
            'EMPRENDER EN ESPANA',
            'RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO',
            'RESIDENCIA PARA INVERSORES',
          ];

      if (isExploratory()) {
        touristTemplates.unshift('CUENTA BREVEMENTE', 'CLIENES');
      }

      result.candidateTemplates = mapToTemplates(touristTemplates);
      return result;
    }

    // Asylum
    if (flags.isAsylum) {
      result.flowCategory = 'ASYLUM';
      result.candidateTemplates = mapToTemplates(['ASILO', 'FORMAS DE REGULARIZARSE']);
      return result;
    }
  } else {
    // Outside Spain
    const goalStudy =
      goal === 'study' ||
      commentsPlain.includes('estudi') ||
      commentsPlain.includes('master') ||
      commentsPlain.includes('fp') ||
      commentsPlain.includes('curso');
    const goalFamily = goal === 'family';
    const goalNationality = goal === 'nationality';
    const goalRegularize =
      goal === 'regularize' || goal === 'entry' || goal === 'reside_work';

    const baseTemplates: string[] = [];

    if (commentsPlain.includes('actas') || commentsPlain.includes('partida') || commentsPlain.includes('registro')) {
      baseTemplates.push('BUSQUEDA DE ACTAS');
    }
    if (commentsPlain.includes('turista') && (commentsPlain.includes('entrar') || commentsPlain.includes('requisitos'))) {
      baseTemplates.push('ENTRAR COMO TURISTA', 'CUE 2025');
    }

    // Trabajo / residencia desde origen
    const isRemote =
      jobPlain.includes('remoto') ||
      jobPlain.includes('remote') ||
      commentsPlain.includes('remoto') ||
      commentsPlain.includes('teletrabajo') ||
      commentsPlain.includes('freelance');
    const mentionsInvestorVisa =
      jobPlain.includes('inversor') ||
      commentsPlain.includes('inversor') ||
      commentsPlain.includes('visa de inversor') ||
      commentsPlain.includes('golden visa') ||
      commentsPlain.includes('golden');
    const highInvestmentRegex = /\b([5-9]\d{2}k|[5-9]\d{5}|[5-9]\d{2}[.,]\d{3}|[1-2](?:[.,]\d+)?m)\b/;
    const hasHighInvestmentAmount =
      highInvestmentRegex.test(commentsPlain) ||
      highInvestmentRegex.test(jobPlain) ||
      commentsPlain.includes('1.000.000') ||
      jobPlain.includes('1.000.000') ||
      commentsPlain.includes('1,000,000') ||
      jobPlain.includes('1,000,000');
    const isInvestor = mentionsInvestorVisa || hasHighInvestmentAmount;
    const noOffer = commentsPlain.includes('sin oferta') || jobPlain.includes('sin oferta');
    const isHq =
      !noOffer &&
      (jobPlain.includes('oferta') ||
        jobPlain.includes('director') ||
        jobPlain.includes('jefe') ||
        jobPlain.includes('cto') ||
        commentsPlain.includes('multinacional') ||
        commentsPlain.includes('cualific') ||
        commentsPlain.includes('investigador') ||
        commentsPlain.includes('salario'));
    const isEntrepreneur =
      jobPlain.includes('emprend') ||
      commentsPlain.includes('emprend') ||
      commentsPlain.includes('startup') ||
      commentsPlain.includes('negocio') ||
      commentsPlain.includes('plan de negocio');
    const mentionsAscendant =
      commentsPlain.includes('ascendiente') ||
      commentsPlain.includes('a cargo') ||
      commentsPlain.includes('madre') ||
      commentsPlain.includes('padre') ||
      commentsPlain.includes('abuela') ||
      commentsPlain.includes('abuelo') ||
      commentsPlain.includes('suegr');

    const wantsWork = goalRegularize || isRemote || isInvestor || isHq || isEntrepreneur;

    if (wantsWork) {
      if (isEntrepreneur) baseTemplates.push('EMPRENDER EN ESPAÑA');
      if (isInvestor) baseTemplates.push('RESIDENCIA PARA INVERSORES');
      if (isHq) baseTemplates.push('RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO');
      if (isRemote) baseTemplates.push('NOMADA DIGITAL');
      baseTemplates.push('EMIGRAR SIN PASAPORTE EUROPEO', 'ENTRAR COMO TURISTA');
    }

    if (goalStudy) {
      baseTemplates.unshift('ESTUDIAR EN ESPAÑA');
    }

    if (goalFamily || hasFamily) {
      const familyOrder = mentionsAscendant
        ? ['ESTAR A CARGO', 'FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPANOLA', 'REAGRUPACION FAMILIAR']
        : ['REAGRUPACION FAMILIAR', 'FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPANOLA', 'ESTAR A CARGO'];
      baseTemplates.unshift(...familyOrder);
    }

    if (goalNationality) {
      const nationalityTemplates = [
        'NACIONALIDAD 2024',
        'NACIONALIDAD POR MATRIMONIO',
        'NACIONALIDAD POR APELLIDOS',
        'LEY DE MEMORIA DEMOCRATICA (LMD)',
        'BUSQUEDA DE ACTAS',
        'RESIDIR MIENTRAS ESPERAMOS LMD',
      ];
      if (commentsPlain.includes('lmd') || commentsPlain.includes('memoria') || commentsPlain.includes('nieto') || commentsPlain.includes('abuelo')) {
        nationalityTemplates.unshift('LEY DE MEMORIA DEMOCRATICA (LMD)');
      }
      baseTemplates.unshift(...nationalityTemplates);
    }

    if (!baseTemplates.length) {
      baseTemplates.push('FORMAS DE REGULARIZARSE', 'CUENTA BREVEMENTE');
    }

    result.flowCategory = 'OUTSIDE_SPAIN';
    result.candidateTemplates = mapToTemplates(baseTemplates);
    return result;
  }

  return result;
};
