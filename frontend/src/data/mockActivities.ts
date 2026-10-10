import { ActivityLog } from '../types';

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'ACT-501',
    timestamp: '12 min ago',
    type: 'inspection_dispatched',
    drainId: 'DS-102',
    message: 'Rapid Response Unit 3 dispatched to 4th Ave & Wood St following elevated silt alert',
    actor: 'Dispatcher Sarah K.',
  },
  {
    id: 'ACT-502',
    timestamp: '46 min ago',
    type: 'report_filed',
    drainId: 'DS-110',
    message: 'Citizen 311 report filed for Fort Pitt Underpass Sump (Street pooling observed)',
    actor: 'Citizen #4092',
  },
  {
    id: 'ACT-503',
    timestamp: '2 hours ago',
    type: 'status_updated',
    drainId: 'DS-104',
    message: 'Harbor Maintenance Alpha arrived on-site; jet vac cleaning in progress',
    actor: 'Lead Tech Morris',
  },
  {
    id: 'ACT-504',
    timestamp: '4 hours ago',
    type: 'verification_pending',
    drainId: 'DS-107',
    message: 'Jet cleaning reported complete at Sandusky Street Interceptor; awaiting photo audit',
    actor: 'Crew Lead Martinez',
  },
  {
    id: 'ACT-505',
    timestamp: 'Yesterday',
    type: 'resolved',
    drainId: 'DS-114',
    message: 'Point State Park Promenade Drain marked resolved; sediment level confirmed at 18%',
    actor: 'Supervisor Chen',
  },
  {
    id: 'ACT-506',
    timestamp: 'Yesterday',
    type: 'inspection_dispatched',
    drainId: 'DS-119',
    message: 'Emergency work order generated for Mon Wharf Overflow Gate ahead of weekend surge',
    actor: 'System Risk Engine',
  },
];
