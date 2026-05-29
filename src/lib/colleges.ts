/**
 * Maps each major name (as it appears in the Career Center data) to its UIUC
 * college / school. Structure verified against catalog.illinois.edu.
 *
 * Notable UIUC quirks reflected below:
 *  - Chemical & Biomolecular Engineering lives in LAS (School of Chemical
 *    Sciences), not Grainger.
 *  - The Department of Communication is in LAS; Advertising / Journalism /
 *    Media Studies are in the College of Media.
 *  - Data Science is in Grainger (Siebel School of Computing & Data Science).
 *  - Statistics, Actuarial Science, Financial Math are LAS (Math/Stats).
 *  - Kinesiology, Community/Public Health, Recreation, and Speech & Hearing
 *    Science are in Applied Health Sciences.
 *  - Nutrition, Food Science, and all Agricultural/Animal/Crop programs are ACES.
 */

export type CollegeId =
  | 'grainger'
  | 'las'
  | 'gies'
  | 'aces'
  | 'faa'
  | 'media'
  | 'education'
  | 'ahs'
  | 'ischool'
  | 'ler'
  | 'socialwork'
  | 'law'
  | 'vetmed'
  | 'other';

export type College = { id: CollegeId; short: string; full: string };

/** Display order (also the fallback sort when totals tie). */
export const COLLEGES: College[] = [
  { id: 'grainger',   short: 'Engineering (Grainger)',          full: 'The Grainger College of Engineering' },
  { id: 'las',        short: 'Liberal Arts & Sciences (LAS)',   full: 'College of Liberal Arts & Sciences' },
  { id: 'gies',       short: 'Business (Gies)',                 full: 'Gies College of Business' },
  { id: 'aces',       short: 'Agriculture & Env. (ACES)',       full: 'College of Agricultural, Consumer & Environmental Sciences' },
  { id: 'faa',        short: 'Fine & Applied Arts (FAA)',       full: 'College of Fine & Applied Arts' },
  { id: 'media',      short: 'Media',                           full: 'College of Media' },
  { id: 'ahs',        short: 'Applied Health Sciences (AHS)',   full: 'College of Applied Health Sciences' },
  { id: 'education',  short: 'Education',                       full: 'College of Education' },
  { id: 'ischool',    short: 'Information Sciences (iSchool)',  full: 'School of Information Sciences' },
  { id: 'ler',        short: 'Labor & Employment Relations',    full: 'School of Labor & Employment Relations' },
  { id: 'socialwork', short: 'Social Work',                     full: 'School of Social Work' },
  { id: 'law',        short: 'Law',                             full: 'College of Law' },
  { id: 'vetmed',     short: 'Veterinary Medicine',            full: 'College of Veterinary Medicine' },
  { id: 'other',      short: 'Other & Interdisciplinary',       full: 'Other & Interdisciplinary' },
];

const COLLEGE_BY_ID = new Map(COLLEGES.map((c) => [c.id, c]));
export const collegeMeta = (id: CollegeId): College => COLLEGE_BY_ID.get(id) ?? COLLEGES[COLLEGES.length - 1];

/** Exact major → college. Keys must match data.json major strings verbatim. */
const EXACT: Record<string, CollegeId> = {
  // ── The Grainger College of Engineering ────────────────────────────────
  'Aerospace Aeronautical and Astronautical/Space Engineering': 'grainger',
  'Bioengineering and Biomedical Engineering': 'grainger',
  'Civil Engineering': 'grainger',
  'Computer Engineering': 'grainger',
  'Computer Science': 'grainger',
  'Computer and Information Sciences': 'grainger',
  'Data Science': 'grainger',
  'Electrical and Electronics Engineering': 'grainger',
  'Engineering': 'grainger',
  'Engineering Mechanics': 'grainger',
  'Engineering Physics/Applied Physics': 'grainger',
  'Engineering/Industrial Management': 'grainger',
  'Environmental Engineering Technology/Environmental Technology': 'grainger',
  'Environmental/Environmental Health Engineering': 'grainger',
  'Industrial Engineering': 'grainger',
  'Materials Engineering': 'grainger',
  'Materials Science': 'grainger',
  'Mechanical Engineering': 'grainger',
  'Nuclear Engineering': 'grainger',
  'Operations Research': 'grainger',
  'Pre Engineering': 'grainger',
  'Systems Engineering': 'grainger',
  'Systems Science and Theory': 'grainger',

  // ── College of Liberal Arts & Sciences ─────────────────────────────────
  'Actuarial Science': 'las',
  'African Studies': 'las',
  'Anthropology': 'las',
  'Applied Mathematics': 'las',
  'Area Studies': 'las',
  'Astronomy': 'las',
  'Astrophysics': 'las',
  'Atmospheric Sciences and Meteorology': 'las',
  'Biochemistry': 'las',
  'Bioinformatics': 'las',
  'Biological and Biomedical Sciences': 'las',
  'Biology/Biological Sciences': 'las',
  'Biomedical Sciences': 'las',
  'Biophysics': 'las',
  'Biotechnology': 'las',
  'Botany/Plant Biology': 'las',
  'Cell/Cellular Biology and Histology': 'las',
  'Cell/Cellular and Molecular Biology': 'las',
  'Chemical Engineering': 'las',
  'Chemical and Biomolecular Engineering': 'las',
  'Chemistry': 'las',
  'Cognitive Science': 'las',
  'Communication': 'las',
  'Comparative Literature': 'las',
  'East Asian Languages Literatures and Linguistics': 'las',
  'East Asian Studies': 'las',
  'Ecology and Evolutionary Biology': 'las',
  'Econometrics and Quantitative Economics': 'las',
  'Economics': 'las',
  'English Language and Literature': 'las',
  'Entomology': 'las',
  'Environmental Science': 'las',
  'European Studies/Civilization': 'las',
  'Financial Mathematics': 'las',
  'French Language and Literature': 'las',
  'Geographic Information Science and Cartography': 'las',
  'Geography': 'las',
  'Geography and Environmental Studies': 'las',
  'Geology/Earth Science': 'las',
  'German Language and Literature': 'las',
  'History': 'las',
  'Italian Language and Literature': 'las',
  'Language Interpretation and Translation': 'las',
  'Latin American Studies': 'las',
  'Liberal Arts and Sciences/Liberal Studies': 'las',
  'Linguistics': 'las',
  'Mathematics': 'las',
  'Mathematics and Computer Science': 'las',
  'Microbiology': 'las',
  'Molecular Physiology': 'las',
  'Neuroscience': 'las',
  'Philosophy': 'las',
  'Physics': 'las',
  'Physiology': 'las',
  'Political Science and Government': 'las',
  'Psychology': 'las',
  'Research and Experimental Psychology': 'las',
  'Slavic Languages Literatures and Linguistics': 'las',
  'Sociology': 'las',
  'Spanish Language and Literature': 'las',
  'Statistics': 'las',
  'Sustainability Studies': 'las',

  // ── Gies College of Business ───────────────────────────────────────────
  'Accounting': 'gies',
  'Business Administration Management and Operations': 'gies',
  'Business Administration and Management': 'gies',
  'Business Analytics': 'gies',
  'Business Management Marketing and Related Support Services': 'gies',
  'Entrepreneurship/Entrepreneurial Studies': 'gies',
  'Finance': 'gies',
  'Financial Analytics': 'gies',
  'Logistics Materials and Supply Chain Management': 'gies',
  'Management Information Systems': 'gies',
  'Management Science': 'gies',
  'Management Sciences and Quantitative Methods': 'gies',
  'Marketing/Marketing Management': 'gies',
  'Operations Management and Supervision': 'gies',
  'Taxation': 'gies',

  // ── ACES (Agricultural, Consumer & Environmental Sciences) ──────────────
  'Agribusiness/Agricultural Business Operations': 'aces',
  'Agricultural Economics': 'aces',
  'Agricultural Engineering': 'aces',
  'Agroecology and Sustainable Agriculture': 'aces',
  'Agronomy and Crop Science': 'aces',
  'Animal Health': 'aces',
  'Animal Sciences': 'aces',
  'Food Science': 'aces',
  'Nutrition Sciences': 'aces',

  // ── College of Fine & Applied Arts ─────────────────────────────────────
  'Architectural and Building Sciences/Technology': 'faa',
  'Architecture': 'faa',
  'Art History Criticism and Conservation': 'faa',
  'Art Teacher Education': 'faa',
  'City/Urban Community and Regional Planning': 'faa',
  'Crafts/Craft Design Folk Art and Artisanry': 'faa',
  'Dance': 'faa',
  'Drama and Dramatics/Theatre Arts': 'faa',
  'Fine/Studio Arts': 'faa',
  'Graphic Design': 'faa',
  'Industrial and Product Design': 'faa',
  'Landscape Architecture': 'faa',
  'Music': 'faa',
  'Music Performance': 'faa',
  'Music Teacher Education': 'faa',
  'Musicology and Ethnomusicology': 'faa',

  // ── College of Media ───────────────────────────────────────────────────
  'Advertising': 'media',
  'Digital Communication and Media/Multimedia': 'media',
  'Journalism': 'media',
  'Mass Communication/Media Studies': 'media',

  // ── College of Applied Health Sciences ─────────────────────────────────
  'Audiology/Audiologist and Speech': 'ahs',
  'Audiology/Audiologist and Speech Language Pathology/Pathologist': 'ahs',
  'Community Health and Preventive Medicine': 'ahs',
  'Epidemiology': 'ahs',
  'Exercise Science and Kinesiology': 'ahs',
  'Health Services/Allied Health/Health Sciences': 'ahs',
  'Hospital and Health Care Facilities Administration/Management': 'ahs',
  'Kinesiology and Exercise Science': 'ahs',
  'Occupational Safety and Health Technology/Technician': 'ahs',
  'Parks Recreation and Leisure Studies': 'ahs',
  'Public Health': 'ahs',

  // ── College of Education ───────────────────────────────────────────────
  'Curriculum and Instruction': 'education',
  'Early Childhood Education and Teaching': 'education',
  'Education': 'education',
  'Educational Leadership and Administration': 'education',
  'Educational Psychology': 'education',
  'Educational Statistics and Research Methods': 'education',
  'Elementary Education and Teaching': 'education',
  'Mathematics Teacher Education': 'education',
  'Social and Philosophical Foundations of Education': 'education',
  'Special Education and Teaching': 'education',
  'Teaching English as a Second or Foreign Language/ESL Language Instructor': 'education',
  'Technical Teacher Education': 'education',

  // ── School of Information Sciences (iSchool) ────────────────────────────
  'Human Centered Technology Design': 'ischool',
  'Informatics': 'ischool',
  'Information Science/Studies': 'ischool',
  'Information Technology': 'ischool',
  'Library and Information Science': 'ischool',

  // ── School of Labor & Employment Relations ─────────────────────────────
  'Labor and Industrial Relations': 'ler',

  // ── School of Social Work ──────────────────────────────────────────────
  'Community Organization and Advocacy': 'socialwork',
  'Social Work': 'socialwork',

  // ── College of Law ─────────────────────────────────────────────────────
  'Advanced Legal Research/Studies': 'law',
  'Law': 'law',
  'Legal Professions and Studies': 'law',

  // ── College of Veterinary Medicine ─────────────────────────────────────
  'Veterinary Medicine': 'vetmed',
  'Veterinary Pathology and Pathobiology': 'vetmed',
  'Veterinary Sciences/Veterinary Clinical Sciences': 'vetmed',

  // ── Other & Interdisciplinary ──────────────────────────────────────────
  'General Studies': 'other',
  'Human': 'other',
  'Pre': 'other',
};

/** Ordered keyword fallback for any major not in EXACT (e.g. future terms). */
const KEYWORD_RULES: Array<[RegExp, CollegeId]> = [
  [/\blaw\b|legal/i, 'law'],
  [/veterinary/i, 'vetmed'],
  [/social work/i, 'socialwork'],
  [/\blabor\b/i, 'ler'],
  [/informatics|information (science|technology|studies)|library/i, 'ischool'],
  [/journalism|advertis|media studies/i, 'media'],
  [/kinesiolog|audiolog|speech|epidemi|public health|recreation|allied health/i, 'ahs'],
  [/teacher education|teaching|curriculum|\beducation\b/i, 'education'],
  [/architect|\bmusic\b|theatre|theater|\bdance\b|studio art|art history|graphic design|product design|urban.*planning/i, 'faa'],
  [/agricultur|agronomy|\bcrop\b|animal|food science|nutrition/i, 'aces'],
  [/account|finance|marketing|\bbusiness\b|supply chain|taxation|entrepreneur/i, 'gies'],
  [/chemical (engineering|and biomolecular)/i, 'las'], // UIUC quirk: ChemE is LAS
  [/engineering|computer science|data science/i, 'grainger'],
];

export function collegeForMajor(name: string): CollegeId {
  const exact = EXACT[name];
  if (exact) return exact;
  for (const [re, id] of KEYWORD_RULES) if (re.test(name)) return id;
  return 'other';
}
