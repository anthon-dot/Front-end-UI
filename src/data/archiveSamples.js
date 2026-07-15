const archivedApplicants = [
  {
    id: 'A100',
    name: 'Ana Bautista',
    business: 'Bautista Groceries',
    appliedOn: '2024-05-12',
    status: 'ARCHIVED',
    archivedOn: '2025-06-01',
    contact: '09171230001',
    stallRequested: 'S-03',
    notes: 'Moved to another market.'
  },
  {
    id: 'A101',
    name: 'Carlos Lim',
    business: 'Lim Hardware',
    appliedOn: '2023-11-02',
    status: 'DELETED',
    archivedOn: '2024-01-15',
    contact: '09171230002',
    stallRequested: 'S-10',
    notes: 'Business closed.'
  },
  {
    id: 'A102',
    name: 'Rosa Vega',
    business: 'Vega Handicrafts',
    appliedOn: '2025-02-18',
    status: 'ARCHIVED',
    archivedOn: '2025-12-12',
    contact: '09171230003',
    stallRequested: 'S-17',
    notes: 'Transferred to permanent location.'
  }
]

const archivedStalls = [
  {
    id: 'ST100',
    number: 'S-03',
    occupant: 'Ana Bautista',
    status: 'archived',
    archivedOn: '2025-06-01',
    reason: 'Owner moved to another market'
  },
  {
    id: 'ST101',
    number: 'S-10',
    occupant: null,
    status: 'archived',
    archivedOn: '2024-01-15',
    reason: 'Business closed'
  },
  {
    id: 'ST102',
    number: 'S-17',
    occupant: 'Rosa Vega',
    status: 'archived',
    archivedOn: '2025-12-12',
    reason: 'Transferred to permanent location'
  }
]

export { archivedApplicants, archivedStalls }
