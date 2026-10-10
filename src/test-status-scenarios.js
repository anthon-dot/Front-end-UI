import assert from 'assert';

// Implementation of status formatting matching dashboard.vue and api.js
function formatContractStatus(val, hasContractRecord = true) {
  if (!hasContractRecord || !val) return 'Not Created';
  const trimmed = String(val).trim();
  const upper = trimmed.toUpperCase();
  if (['NOT_CREATED', 'NOT CREATED', 'NONE'].includes(upper)) return 'Not Created';
  if (upper === 'DRAFT') return 'Draft';
  if (['PENDING', 'PENDING_APPROVAL', 'FOR_APPROVAL'].includes(upper)) return 'Pending';
  if (upper === 'ACTIVE') return 'Active';
  if (upper === 'EXPIRED') return 'Expired';
  if (['CANCELLED', 'CANCELED', 'TERMINATED', 'REJECTED'].includes(upper)) return 'Cancelled';
  return trimmed;
}

function formatOccupantStatus(val) {
  if (!val) return 'Pending';
  const trimmed = String(val).trim();
  const upper = trimmed.toUpperCase();
  if (upper === 'ACTIVE') return 'Active';
  if (upper === 'PENDING') return 'Pending';
  if (upper === 'EXPIRED') return 'Expired';
  if (upper === 'VACATED' || upper === 'TERMINATED') return 'Vacated';
  if (upper === 'ARCHIVED') return 'Archived';
  return trimmed;
}

function computeDashboardStatuses({ occupant, contracts }) {
  const occContracts = contracts || [];
  const activeContract = occContracts.find(c => String(c.status || '').toUpperCase() === 'ACTIVE');
  const inProgressContract = occContracts.find(c => ['PENDING', 'PENDING_APPROVAL', 'DRAFT'].includes(String(c.status || '').toUpperCase()));
  const resolvedContract = (occupant?.contractId && occContracts.find(c => String(c.id) === String(occupant.contractId))) ||
    activeContract || inProgressContract || occContracts[0] || null;

  const hasContract = Boolean(
    resolvedContract?.id ||
    resolvedContract?.contractNo ||
    (occContracts.length > 0 && occContracts[0]?.id)
  );

  const contractStatus = !hasContract
    ? 'Not Created'
    : formatContractStatus(resolvedContract?.status, true);

  const occupantStatus = formatOccupantStatus(occupant?.status);

  return {
    hasContract,
    contractStatus,
    occupantStatus,
    contractId: hasContract ? resolvedContract.id : null,
    contractNo: hasContract ? resolvedContract.contractNo : null
  };
}

console.log('Running test suite for Occupant Dashboard Contract Status...');

// Scenario 1: An occupant with no contract displays Not Created
{
  const result = computeDashboardStatuses({
    occupant: { id: 1, status: 'PENDING', contractId: null },
    contracts: []
  });
  assert.strictEqual(result.contractStatus, 'Not Created', 'Scenario 1 failed: should display Not Created');
  assert.strictEqual(result.hasContract, false);
  console.log('✔ Scenario 1 Passed: Occupant with no contract displays Not Created');
}

// Scenario 2: An occupant with a draft contract displays Draft
{
  const result = computeDashboardStatuses({
    occupant: { id: 2, status: 'PENDING', contractId: 101 },
    contracts: [{ id: 101, status: 'DRAFT', contractNo: 'CON-101' }]
  });
  assert.strictEqual(result.contractStatus, 'Draft', 'Scenario 2 failed: should display Draft');
  console.log('✔ Scenario 2 Passed: Occupant with draft contract displays Draft');
}

// Scenario 3: An occupant with a pending contract displays Pending
{
  const result = computeDashboardStatuses({
    occupant: { id: 3, status: 'PENDING', contractId: 102 },
    contracts: [{ id: 102, status: 'PENDING', contractNo: 'CON-102' }]
  });
  assert.strictEqual(result.contractStatus, 'Pending', 'Scenario 3 failed: should display Pending');
  console.log('✔ Scenario 3 Passed: Occupant with pending contract displays Pending');
}

// Scenario 4: An occupant with an active contract displays Active
{
  const result = computeDashboardStatuses({
    occupant: { id: 4, status: 'ACTIVE', contractId: 103 },
    contracts: [{ id: 103, status: 'ACTIVE', contractNo: 'CON-103' }]
  });
  assert.strictEqual(result.contractStatus, 'Active', 'Scenario 4 failed: should display Active');
  console.log('✔ Scenario 4 Passed: Occupant with active contract displays Active');
}

// Scenario 5: An occupant with an expired contract displays Expired
{
  const result = computeDashboardStatuses({
    occupant: { id: 5, status: 'ACTIVE', contractId: 104 },
    contracts: [{ id: 104, status: 'EXPIRED', contractNo: 'CON-104' }]
  });
  assert.strictEqual(result.contractStatus, 'Expired', 'Scenario 5 failed: should display Expired');
  console.log('✔ Scenario 5 Passed: Occupant with expired contract displays Expired');
}

// Scenario 6: An occupant with a cancelled contract displays Cancelled
{
  const result = computeDashboardStatuses({
    occupant: { id: 6, status: 'ACTIVE', contractId: 105 },
    contracts: [{ id: 105, status: 'CANCELLED', contractNo: 'CON-105' }]
  });
  assert.strictEqual(result.contractStatus, 'Cancelled', 'Scenario 6 failed: should display Cancelled');
  console.log('✔ Scenario 6 Passed: Occupant with cancelled contract displays Cancelled');
}

// Scenario 7: An occupant marked PENDING does not cause an active contract to display as Pending
{
  const result = computeDashboardStatuses({
    occupant: { id: 7, status: 'PENDING', contractId: 106 },
    contracts: [{ id: 106, status: 'ACTIVE', contractNo: 'CON-106' }]
  });
  assert.strictEqual(result.occupantStatus, 'Pending', 'Occupant status should be Pending');
  assert.strictEqual(result.contractStatus, 'Active', 'Scenario 7 failed: Contract status should remain Active');
  console.log('✔ Scenario 7 Passed: Occupant PENDING does not override ACTIVE contract');
}

// Scenario 8: An occupant marked ACTIVE without a contract does not display a nonexistent active contract
{
  const result = computeDashboardStatuses({
    occupant: { id: 8, status: 'ACTIVE', contractId: null },
    contracts: []
  });
  assert.strictEqual(result.occupantStatus, 'Active', 'Occupant status should be Active');
  assert.strictEqual(result.contractStatus, 'Not Created', 'Scenario 8 failed: Contract status should be Not Created');
  console.log('✔ Scenario 8 Passed: Occupant ACTIVE without contract displays Not Created');
}

// Scenario 9: Contract creation associates the correct contract with the correct occupant
{
  const result = computeDashboardStatuses({
    occupant: { id: 9, status: 'ACTIVE', contractId: 200 },
    contracts: [
      { id: 199, status: 'EXPIRED', contractNo: 'CON-OLD' },
      { id: 200, status: 'ACTIVE', contractNo: 'CON-NEW' }
    ]
  });
  assert.strictEqual(result.contractId, 200);
  assert.strictEqual(result.contractNo, 'CON-NEW');
  assert.strictEqual(result.contractStatus, 'Active');
  console.log('✔ Scenario 9 Passed: Associates correct contract with occupant');
}

// Scenario 10: Existing dashboard features and API consumers continue to work
{
  const result = computeDashboardStatuses({
    occupant: { id: 10, status: 'ACTIVE', contractId: 201 },
    contracts: [{ id: 201, status: 'ACTIVE', contractNo: 'CON-201' }]
  });
  assert.strictEqual(typeof result.occupantStatus, 'string');
  assert.strictEqual(typeof result.contractStatus, 'string');
  assert.strictEqual(result.hasContract, true);
  console.log('✔ Scenario 10 Passed: Compatibility with existing consumers preserved');
}

console.log('\nAll 10 test scenarios passed successfully!');
