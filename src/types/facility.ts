export type AvailabilityStatus = 'Open' | 'Waitlist' | 'Closed' | 'N/A'

export type ProgramKey =
  | 'residentialTreatment'
  | 'outpatientTreatment'
  | 'intensiveOutpatient'
  | 'detoxification'
  | 'medAssistedTreatment'
  | 'otpMethadone'
  | 'partialHospitalization'
  | 'groupHome'
  | 'telehealth'
  | 'hospitalInpatient'
  | 'shortTermResidential'
  | 'longTermResidential'
  | 'outpatientDetox'

export const PROGRAM_LABELS: Record<ProgramKey, string> = {
  residentialTreatment: 'Residential Treatment',
  outpatientTreatment: 'Outpatient Treatment',
  intensiveOutpatient: 'Intensive Outpatient (IOP)',
  detoxification: 'Detoxification',
  medAssistedTreatment: 'Medication-Assisted Treatment (MAT)',
  otpMethadone: 'Opioid Treatment / Methadone',
  partialHospitalization: 'Partial Hospitalization',
  groupHome: 'Group Home / Sober Living',
  telehealth: 'Telehealth',
  hospitalInpatient: 'Hospital Inpatient',
  shortTermResidential: 'Short-Term Residential',
  longTermResidential: 'Long-Term Residential',
  outpatientDetox: 'Outpatient Detox',
}

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  SU: 'Substance Use',
  MH: 'Mental Health',
  BUPREN: 'Buprenorphine / MAT',
  OTP: 'Opioid Treatment (Methadone)',
  HRSA: 'Community Health Center',
}

export interface FacilityPrograms {
  residentialTreatment?: boolean
  outpatientTreatment?: boolean
  intensiveOutpatient?: boolean
  detoxification?: boolean
  medAssistedTreatment?: boolean
  otpMethadone?: boolean
  partialHospitalization?: boolean
  groupHome?: boolean
  telehealth?: boolean
  hospitalInpatient?: boolean
  shortTermResidential?: boolean
  longTermResidential?: boolean
  outpatientDetox?: boolean
}

export interface FacilityPopulations {
  veterans?: boolean
  activeMilitary?: boolean
  criminalJustice?: boolean
  seniors?: boolean
  adolescents?: boolean
  pregnantWomen?: boolean
  womenOnly?: boolean
  menOnly?: boolean
  hivAids?: boolean
  trauma?: boolean
  domesticViolence?: boolean
  youngAdults?: boolean
  lgbtq?: boolean
  nativeAmerican?: boolean
  dui?: boolean
}

export interface FacilityInsurance {
  medicaid?: boolean
  medicare?: boolean
  privateInsurance?: boolean
  cashSelfPay?: boolean
  tricare?: boolean
  slidingScale?: boolean
  stateInsurance?: boolean
  socialSecurity?: boolean
  paymentAssistance?: boolean
}

export interface FacilityAccreditation {
  jointCommission?: boolean
  carf?: boolean
  ncqa?: boolean
  coa?: boolean
  hfap?: boolean
}

export interface FacilityCapacity {
  totalBeds?: number | null
  adultBeds?: number | null
  femaleBeds?: number | null
  maleBeds?: number | null
}

export interface Facility {
  id: string
  name1: string
  name2?: string
  street1?: string
  street2?: string
  city: string
  state: string
  zip?: string
  county?: string
  phone?: string
  website?: string
  latitude?: number | null
  longitude?: number | null
  facilityTypes: string[]
  programs: FacilityPrograms
  populations: FacilityPopulations
  insurance: FacilityInsurance
  accreditation?: FacilityAccreditation
  languages?: { spanish?: boolean; asl?: boolean }
  therapies?: Record<string, boolean>
  capacity?: FacilityCapacity
  availability: Partial<Record<ProgramKey, AvailabilityStatus>>
  searchKeywords?: string[]
  active: boolean
  importedAt?: unknown
  lastUpdatedAt?: unknown
  lastUpdatedBy?: string | null
}

export interface Provider {
  uid: string
  email: string
  displayName: string
  facilityId: string
  facilityName: string
  createdAt: unknown
  createdBy: string
  active: boolean
  lastLoginAt: unknown | null
}

export interface SearchFilters {
  search: string
  county: string
  city: string
  facilityType: string
  programs: string[]
  populations: string[]
  insurance: string[]
}

export const POPULATION_LABELS: Record<string, string> = {
  veterans: 'Veterans',
  activeMilitary: 'Active Military',
  criminalJustice: 'Criminal Justice / DUI',
  seniors: 'Seniors / Older Adults',
  adolescents: 'Adolescents / Youth',
  pregnantWomen: 'Pregnant Women',
  womenOnly: 'Women Only',
  menOnly: 'Men Only',
  hivAids: 'HIV / AIDS',
  trauma: 'Trauma Survivors',
  domesticViolence: 'Domestic Violence',
  youngAdults: 'Young Adults (18–25)',
  lgbtq: 'LGBTQ+',
  nativeAmerican: 'Native American / Tribal',
  dui: 'DUI / Court-Ordered',
}

export const INSURANCE_LABELS: Record<string, string> = {
  medicaid: 'Medicaid',
  medicare: 'Medicare',
  privateInsurance: 'Private Insurance',
  cashSelfPay: 'Self-Pay / Cash',
  tricare: 'TRICARE (Military)',
  slidingScale: 'Sliding Scale / Fee Assist',
  stateInsurance: 'State-Funded',
  socialSecurity: 'Social Security / SSI',
  paymentAssistance: 'Payment Assistance',
}

export const NEBRASKA_COUNTIES = [
  'Adams', 'Antelope', 'Arthur', 'Banner', 'Blaine', 'Boone', 'Box Butte',
  'Boyd', 'Brown', 'Buffalo', 'Burt', 'Butler', 'Cass', 'Cedar', 'Chase',
  'Cherry', 'Cheyenne', 'Clay', 'Colfax', 'Cuming', 'Custer', 'Dakota',
  'Dawes', 'Dawson', 'Deuel', 'Dixon', 'Dodge', 'Douglas', 'Dundy',
  'Fillmore', 'Franklin', 'Frontier', 'Furnas', 'Gage', 'Garden', 'Garfield',
  'Gosper', 'Grant', 'Greeley', 'Hall', 'Hamilton', 'Harlan', 'Hayes',
  'Hitchcock', 'Holt', 'Hooker', 'Howard', 'Jefferson', 'Johnson', 'Kearney',
  'Keith', 'Keya Paha', 'Kimball', 'Knox', 'Lancaster', 'Lincoln', 'Logan',
  'Loup', 'Madison', 'McPherson', 'Merrick', 'Morrill', 'Nance', 'Nemaha',
  'Nuckolls', 'Otoe', 'Pawnee', 'Perkins', 'Phelps', 'Pierce', 'Platte',
  'Polk', 'Red Willow', 'Richardson', 'Rock', 'Saline', 'Sarpy', 'Saunders',
  'Scotts Bluff', 'Seward', 'Sheridan', 'Sherman', 'Sioux', 'Stanton',
  'Thayer', 'Thomas', 'Thurston', 'Valley', 'Washington', 'Wayne', 'Webster',
  'Wheeler', 'York',
]
