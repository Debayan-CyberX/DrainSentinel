import { ActivityLog } from '../types';

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'ACT-501',
    timestamp: '12 min ago',
    type: 'inspection_dispatched',
    drainId: 'DS-MUM-102',
    message: 'BMC Monsoon Jet Vac Unit 4 dispatched to Milan Subway Underpass following elevated silt choke alert (91%)',
    actor: 'BMC Dispatcher S. Shinde',
  },
  {
    id: 'ACT-502',
    timestamp: '46 min ago',
    type: 'report_filed',
    drainId: 'DS-MUM-101',
    message: 'Citizen 1916 report filed for Hindmata Junction Sump Chamber (Street water pooling observed near cinema flyover)',
    actor: 'Citizen #4092 (P. Sawant)',
  },
  {
    id: 'ACT-503',
    timestamp: '2 hours ago',
    type: 'status_updated',
    drainId: 'DS-MUM-104',
    message: 'Andheri Rapid Dewatering Squad arrived on-site; high-capacity jet vac suction in progress',
    actor: 'Lead Tech R. Kadam',
  },
  {
    id: 'ACT-504',
    timestamp: '4 hours ago',
    type: 'verification_pending',
    drainId: 'DS-MUM-107',
    message: 'Emergency desilting reported complete at Sion Circle Drain Box; awaiting supervisory photo audit',
    actor: 'Crew Lead A. Patil',
  },
  {
    id: 'ACT-505',
    timestamp: 'Yesterday',
    type: 'resolved',
    drainId: 'DS-MUM-114',
    message: 'Chembur Postal Colony Collector Drain marked resolved; sediment level confirmed reduced to 18%',
    actor: 'Ward Supervisor V. More',
  },
  {
    id: 'ACT-506',
    timestamp: 'Yesterday',
    type: 'inspection_dispatched',
    drainId: 'DS-MUM-119',
    message: 'Preventive high-tide alert generated for Mahim Causeway Culvert Gate ahead of Arabian Sea tidal surge',
    actor: 'System Hydrology Engine',
  },
];
