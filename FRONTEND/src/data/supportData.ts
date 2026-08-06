export type EmergencyContact = {
  label: string
  number: string
  note: string
}

export type NgoResource = {
  name: string
  address: string
  distance: string
  workingHours: string
  contactNumber: string
  website?: string
  mapUrl: string
  categories: string[]
}

export type MentalHealthResource = {
  name: string
  specialization: string
  rating?: string
  contact: string
  address: string
}

export type LegalAidResource = {
  name: string
  address: string
  phone: string
  officeHours: string
  website: string
}

export type SupportLocationData = {
  locationName: string
  state: string
  emergencyContacts: EmergencyContact[]
  ngos: NgoResource[]
  mentalHealth: MentalHealthResource[]
  legalAid: LegalAidResource[]
}

export const supportDataByPinCode: Record<string, SupportLocationData> = {
  '110001': {
    locationName: 'New Delhi',
    state: 'Delhi',
    emergencyContacts: [
      { label: 'Emergency Number', number: '112', note: 'Integrated police, fire, and medical response' },
      { label: 'Women Helpline', number: '1091', note: 'Delhi Police women in distress helpline' },
      { label: 'Police', number: '100', note: 'Police control room' },
      { label: 'Ambulance', number: '102', note: 'Ambulance support' },
      { label: 'Child Helpline', number: '1098', note: 'Child protection helpline' },
    ],
    ngos: [
      {
        name: 'Shakti Shalini Crisis Intervention Centre',
        address: 'Jangpura, New Delhi',
        distance: '4.8 km',
        workingHours: 'Mon-Sat, 10:00 AM-6:00 PM',
        contactNumber: '011-24373736',
        website: 'https://shaktishalini.org',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Shakti+Shalini+New+Delhi',
        categories: ['Women', 'Domestic Violence', 'Sexual Assault'],
      },
      {
        name: 'Delhi One Stop Centre Network',
        address: 'Central Delhi District Support Desk',
        distance: '2.6 km',
        workingHours: '24 hours',
        contactNumber: '181',
        website: 'https://wcd.delhi.gov.in',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=One+Stop+Centre+New+Delhi',
        categories: ['Women', 'Domestic Violence', 'Human Trafficking', 'Child Protection'],
      },
    ],
    mentalHealth: [
      {
        name: 'IHBAS Mental Health OPD',
        specialization: 'Trauma care, psychiatry, counselling',
        rating: '4.1',
        contact: '011-22114021',
        address: 'Dilshad Garden, Delhi',
      },
      {
        name: 'Central Delhi Trauma Counselling Desk',
        specialization: 'Trauma-informed counselling',
        contact: '011-23490010',
        address: 'Connaught Place, New Delhi',
      },
    ],
    legalAid: [
      {
        name: 'Delhi State Legal Services Authority',
        address: 'Patiala House Courts, New Delhi',
        phone: '1516',
        officeHours: 'Mon-Fri, 10:00 AM-5:00 PM',
        website: 'https://dslsa.org',
      },
      {
        name: 'New Delhi District Legal Services Authority',
        address: 'Patiala House Courts Complex, New Delhi',
        phone: '011-23384781',
        officeHours: 'Mon-Fri, 10:00 AM-5:00 PM',
        website: 'https://dslsa.org',
      },
    ],
  },
  '560001': {
    locationName: 'Bengaluru Central',
    state: 'Karnataka',
    emergencyContacts: [
      { label: 'Emergency Number', number: '112', note: 'Integrated emergency response' },
      { label: 'Women Helpline', number: '1091', note: 'Women safety helpline' },
      { label: 'Police', number: '100', note: 'Police emergency support' },
      { label: 'Ambulance', number: '108', note: 'Emergency ambulance support' },
      { label: 'Child Helpline', number: '1098', note: 'Child protection helpline' },
    ],
    ngos: [
      {
        name: 'Parihar Family Counselling Centre',
        address: 'Bengaluru City Police Commissioner Office, Infantry Road',
        distance: '1.5 km',
        workingHours: 'Mon-Sat, 10:00 AM-6:00 PM',
        contactNumber: '080-22943225',
        website: 'https://bcp.karnataka.gov.in',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Parihar+Family+Counselling+Centre+Bengaluru',
        categories: ['Women', 'Domestic Violence', 'Sexual Assault'],
      },
      {
        name: 'Sakhi One Stop Centre Bengaluru',
        address: 'Bengaluru Urban District Support Centre',
        distance: '5.2 km',
        workingHours: '24 hours',
        contactNumber: '181',
        website: 'https://wcd.karnataka.gov.in',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Sakhi+One+Stop+Centre+Bengaluru',
        categories: ['Women', 'Domestic Violence', 'Human Trafficking', 'Child Protection'],
      },
    ],
    mentalHealth: [
      {
        name: 'NIMHANS Centre for Wellbeing',
        specialization: 'Psychology, psychiatry, trauma support',
        rating: '4.4',
        contact: '080-26995000',
        address: 'Hosur Road, Bengaluru',
      },
      {
        name: 'Bengaluru Trauma Counselling Clinic',
        specialization: 'Trauma counselling and recovery planning',
        contact: '080-25580000',
        address: 'MG Road, Bengaluru',
      },
    ],
    legalAid: [
      {
        name: 'Karnataka State Legal Services Authority',
        address: 'Nyaya Degula, H. Siddaiah Road, Bengaluru',
        phone: '080-22111714',
        officeHours: 'Mon-Fri, 10:00 AM-5:30 PM',
        website: 'https://kslsa.kar.nic.in',
      },
      {
        name: 'Bengaluru Urban District Legal Services Authority',
        address: 'City Civil Court Complex, Bengaluru',
        phone: '080-22954825',
        officeHours: 'Mon-Fri, 10:00 AM-5:30 PM',
        website: 'https://kslsa.kar.nic.in',
      },
    ],
  },
  '160017': {
    locationName: 'Chandigarh Sector 17',
    state: 'Chandigarh',
    emergencyContacts: [
      { label: 'Emergency Number', number: '112', note: 'Integrated emergency response' },
      { label: 'Women Helpline', number: '1091', note: 'Women and child helpline' },
      { label: 'Police', number: '0172-2749194', note: 'Chandigarh Police control room' },
      { label: 'Ambulance', number: '108', note: 'Emergency ambulance support' },
      { label: 'Child Helpline', number: '1098', note: 'Child protection helpline' },
    ],
    ngos: [
      {
        name: 'Chandigarh Women and Child Support Unit',
        address: 'Home Guard Building, Sector 17, Chandigarh',
        distance: '0.8 km',
        workingHours: '24 hours emergency support',
        contactNumber: '0172-2705011',
        website: 'https://portal.chandigarhpolice.gov.in',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Women+Child+Support+Unit+Sector+17+Chandigarh',
        categories: ['Women', 'Domestic Violence', 'Child Protection'],
      },
      {
        name: 'Sakhi One Stop Centre Chandigarh',
        address: 'Sector 19, Chandigarh',
        distance: '2.1 km',
        workingHours: '24 hours',
        contactNumber: '181',
        website: 'https://chdsw.gov.in',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Sakhi+One+Stop+Centre+Chandigarh',
        categories: ['Women', 'Domestic Violence', 'Sexual Assault', 'Human Trafficking'],
      },
    ],
    mentalHealth: [
      {
        name: 'GMCH Mental Health Services',
        specialization: 'Psychiatry, psychology, counselling',
        rating: '4.2',
        contact: '0172-2665253',
        address: 'Sector 32, Chandigarh',
      },
      {
        name: 'Chandigarh Trauma Counselling Centre',
        specialization: 'Trauma counselling and crisis support',
        contact: '0172-2740500',
        address: 'Sector 17, Chandigarh',
      },
    ],
    legalAid: [
      {
        name: 'State Legal Services Authority, U.T. Chandigarh',
        address: 'Additional Deluxe Building, Sector 9, Chandigarh',
        phone: '0172-2742999',
        officeHours: 'Mon-Fri, 10:00 AM-5:00 PM',
        website: 'https://chdslsa.gov.in',
      },
      {
        name: 'District Legal Services Authority Chandigarh',
        address: 'District Courts Complex, Sector 43, Chandigarh',
        phone: '0172-2601900',
        officeHours: 'Mon-Fri, 10:00 AM-5:00 PM',
        website: 'https://chdslsa.gov.in',
      },
    ],
  },
}

export const supportPlaceholders = {
  emergencyContacts: [
    'Emergency numbers will appear after you enter a supported PIN Code.',
    'State and district helplines update here without refreshing the page.',
  ],
  ngos: [
    'Nearby organizations will include address, hours, contact, website, and directions.',
    'Support categories include women, domestic violence, trafficking, assault, and child protection.',
  ],
  mentalHealth: [
    'Therapists, counsellors, psychologists, and mental health clinics will appear here.',
    'Appointment actions are ready for a future booking integration.',
  ],
  legalAid: [
    'Legal aid centers, protection cells, and government offices will appear here.',
    'Office hours, phone numbers, and websites will update by location.',
  ],
}

