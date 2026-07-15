const billings = [
  { id: 'B001', stakeholder: 'Ana Garcia', period: 'Jan 2025', total: 1500, paid: 0, balance: 1500, due: '2025-01-15', status: 'UNPAID' },
  { id: 'B002', stakeholder: 'Ana Garcia', period: 'Dec 2024', total: 1500, paid: 1500, balance: 0, due: '2024-12-15', status: 'PAID' },
  { id: 'B003', stakeholder: 'Roberto Cruz', period: 'Jan 2025', total: 2000, paid: 800, balance: 1200, due: '2025-01-10', status: 'PARTIAL' },
  { id: 'B004', stakeholder: 'Linda Torres', period: 'Dec 2024', total: 1800, paid: 0, balance: 1800, due: '2024-12-20', status: 'OVERDUE' }
]

export default billings
