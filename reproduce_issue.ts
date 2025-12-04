

import { preClassify } from './services/preClassify.ts';
import { UserProfile, EducationLevel, ImmigrationStatus, TimeInSpain } from './types.ts';

const profile: UserProfile = {
  firstName: 'Test',
  lastName: 'User',
  nationality: 'Colombia',
  educationLevel: EducationLevel.SECUNDARIA,
  locationStatus: 'spain',
  currentStatus: ImmigrationStatus.IRREGULAR,
  timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS, // Doesn't matter for this test
  comments: 'Hola, estoy irregular y quiero estudiar un master o un grado para regularizarme.',
  hasFamilyInSpain: false,
  isEmpadronado: true,
  hasCriminalRecord: false,
  province: 'Madrid',
  jobSituation: 'informal',
};

async function run() {
  console.log('Running preClassify with profile:', JSON.stringify(profile, null, 2));
  const result = preClassify(profile);
  console.log('Flow Category:', result.flowCategory);
  console.log('Candidate Templates:', result.candidateTemplates);

  if (result.candidateTemplates[0] === 'ARRAIGO SOCIOFORMATIVO') {
    console.log('SUCCESS: ARRAIGO SOCIOFORMATIVO is the first candidate.');
  } else {
    console.error('FAILURE: ARRAIGO SOCIOFORMATIVO is NOT the first candidate. First is:', result.candidateTemplates[0]);
  }
}

run().catch(console.error);
