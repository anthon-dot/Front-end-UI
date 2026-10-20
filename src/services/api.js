import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";
import { AUTH_TOKEN_KEY } from "../stores/auth";
import { supabase } from "../config/supabase";

const rawAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

rawAxios.interceptors.request.use(async (config) => {
  let token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to convert snake_case strings to camelCase
function toCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

// Normalizes records so both snake_case and camelCase properties exist
export function normalizeRecord(item) {
  if (!item || typeof item !== 'object') return item;
  if (Array.isArray(item)) return item.map(normalizeRecord);

  const result = { ...item };
  for (const [key, val] of Object.entries(item)) {
    const camelKey = toCamel(key);
    const normalizedVal = (val && typeof val === 'object') ? normalizeRecord(val) : val;
    result[key] = normalizedVal;
    if (camelKey !== key) {
      result[camelKey] = normalizedVal;
    }
  }

  // Key explicit aliases for frontend template compatibility
  if (result.created_at && !result.createdAt) result.createdAt = result.created_at;
  if (result.updated_at && !result.updatedAt) result.updatedAt = result.updated_at;
  if (result.first_name && !result.firstName) result.firstName = result.first_name;
  if (result.last_name && !result.lastName) result.lastName = result.last_name;
  if (result.middle_name && !result.middleName) result.middleName = result.middle_name;
  if (result.business_name && !result.businessName) result.businessName = result.business_name;
  if (result.business_type && !result.businessType) result.businessType = result.business_type;
  if (result.advance_balance !== undefined && result.advanceBalance === undefined) result.advanceBalance = result.advance_balance;
  if (result.total_advance_amount !== undefined && result.totalAdvanceAmount === undefined) result.totalAdvanceAmount = result.total_advance_amount;
  if (result.advance_payment_paid !== undefined && result.advancePaymentPaid === undefined) result.advancePaymentPaid = result.advance_payment_paid;
  if (result.advance_payment_completed !== undefined && result.advancePaymentCompleted === undefined) result.advancePaymentCompleted = result.advance_payment_completed;
  if (result.advance_payment_amount !== undefined && result.advancePaymentAmount === undefined) result.advancePaymentAmount = result.advance_payment_amount;
  if (result.treasurer_approved !== undefined && result.treasurerApproved === undefined) result.treasurerApproved = result.treasurer_approved;
  if (result.market_supervisor_approved !== undefined && result.marketSupervisorApproved === undefined) result.marketSupervisorApproved = result.market_supervisor_approved;
  if (result.bplo_approved !== undefined && result.bploApproved === undefined) result.bploApproved = result.bplo_approved;
  if (result.endorsing_approved !== undefined && result.endorsingApproved === undefined) result.endorsingApproved = result.endorsing_approved;
  if (result.final_endorsed !== undefined && result.finalEndorsed === undefined) result.finalEndorsed = result.final_endorsed;
  if (result.onboarding_status && !result.onboardingStatus) result.onboardingStatus = result.onboarding_status;
  if (result.application_status && !result.applicationStatus) result.applicationStatus = result.application_status;
  if (result.file_name && !result.fileName) result.fileName = result.file_name;
  if (result.file_path && !result.filePath) result.filePath = result.file_path;
  if (result.document_type && !result.documentType) result.documentType = result.document_type;
  if (result.monthly_rent !== undefined && result.monthlyRent === undefined) result.monthlyRent = result.monthly_rent;
  if (result.stall_no && !result.stallNo) result.stallNo = result.stall_no;
  if (result.stall_type && !result.stallType) result.stallType = result.stall_type;
  if (result.monthly_rate !== undefined && result.monthlyRate === undefined) result.monthlyRate = result.monthly_rate;
  if (result.info && !result.section) result.section = result.info;
  if (result.contract_no && !result.contractNo) result.contractNo = result.contract_no;
  if (result.start_date && !result.startDate) result.startDate = result.start_date;
  if (result.end_date && !result.endDate) result.endDate = result.end_date;
  if (result.billing_frequency && !result.billingFrequency) result.billingFrequency = result.billing_frequency;
  if (result.occupant_id && !result.occupantId) result.occupantId = result.occupant_id;
  if (result.stall_id && !result.stallId) result.stallId = result.stall_id;
  if (result.hazard_free_confirmed !== undefined && result.hazardFreeConfirmed === undefined) result.hazardFreeConfirmed = result.hazard_free_confirmed;
  if (result.hazard_free_document_url && !result.hazardFreeDocumentUrl) result.hazardFreeDocumentUrl = result.hazard_free_document_url;
  if (result.verified_tenant !== undefined && result.verifiedTenant === undefined) result.verifiedTenant = result.verified_tenant;
  if (result.verifiedTenant !== undefined && result.verified_tenant === undefined) result.verified_tenant = result.verifiedTenant;
  if (result.verified_stakeholder !== undefined && result.verifiedStakeholder === undefined) result.verifiedStakeholder = result.verified_stakeholder;
  if (result.verifiedStakeholder !== undefined && result.verified_stakeholder === undefined) result.verified_stakeholder = result.verifiedStakeholder;
  if (result.applicant_fee_paid !== undefined && result.applicantFeePaid === undefined) result.applicantFeePaid = result.applicant_fee_paid;
  if (result.applicantFeePaid !== undefined && result.applicant_fee_paid === undefined) result.applicant_fee_paid = result.applicantFeePaid;
  if (result.applicant_fee_amount !== undefined && result.applicantFeeAmount === undefined) result.applicantFeeAmount = result.applicant_fee_amount;
  if (result.applicantFeeAmount !== undefined && result.applicant_fee_amount === undefined) result.applicant_fee_amount = result.applicantFeeAmount;
  if (result.applicant_fee_date !== undefined && result.applicantFeeDate === undefined) result.applicantFeeDate = result.applicant_fee_date;
  if (result.applicantFeeDate !== undefined && result.applicant_fee_date === undefined) result.applicant_fee_date = result.applicantFeeDate;
  if (result.verified_application !== undefined && result.verifiedApplication === undefined) result.verifiedApplication = result.verified_application;
  if (result.verifiedApplication !== undefined && result.verified_application === undefined) result.verified_application = result.verifiedApplication;
  if (result.application_form_paid !== undefined && result.applicationFormPaid === undefined) result.applicationFormPaid = result.application_form_paid;
  if (result.applicationFormPaid !== undefined && result.application_form_paid === undefined) result.application_form_paid = result.applicationFormPaid;
  if (result.treasurer_paid !== undefined && result.treasurerPaid === undefined) result.treasurerPaid = result.treasurer_paid;
  if (result.treasurerPaid !== undefined && result.treasurer_paid === undefined) result.treasurer_paid = result.treasurerPaid;

  return result;
}


function mapStallPayload(data) {
  if (!data || typeof data !== 'object') return data;
  const payload = {};

  const stallNo = data.stall_no ?? data.stallNo ?? data.number ?? data.stallNumber;
  if (stallNo !== undefined && stallNo !== null) payload.stall_no = String(stallNo).trim();

  const stallType = data.stall_type ?? data.stallType ?? data.type;
  if (stallType !== undefined && stallType !== null) payload.stall_type = String(stallType).trim();

  const monthlyRent = data.monthly_rent ?? data.monthlyRent ?? data.rent ?? data.rentalRate;
  if (monthlyRent !== undefined && monthlyRent !== null) payload.monthly_rent = Number(monthlyRent || 0);

  if (data.status !== undefined && data.status !== null) {
    const s = String(data.status).trim().toUpperCase();
    payload.status = (s === 'VACANT') ? 'AVAILABLE' : s;
  }

  const imageUrl = data.image_url ?? data.imageUrl;
  if (imageUrl !== undefined) payload.image_url = imageUrl || null;

  const info = data.info ?? data.section ?? data.location;
  if (info !== undefined) payload.info = info || null;

  const lat = data.latitude ?? data.lat;
  if (lat !== undefined) {
    payload.latitude = (lat !== null && lat !== '' && !isNaN(Number(lat))) ? Number(lat) : null;
  }

  const lng = data.longitude ?? data.lng;
  if (lng !== undefined) {
    payload.longitude = (lng !== null && lng !== '' && !isNaN(Number(lng))) ? Number(lng) : null;
  }

  const occupantId = data.occupant_id ?? data.occupantId ?? data.occupant?.id;
  if (occupantId !== undefined) {
    payload.occupant_id = occupantId ? Number(occupantId) : null;
  }

  return payload;
}

function mapRentalRatePayload(data) {
  if (!data || typeof data !== 'object') return data;
  const payload = {};

  const stallType = data.stall_type ?? data.stallType;
  if (stallType !== undefined && stallType !== null) payload.stall_type = String(stallType).trim();

  const monthlyRate = data.monthly_rate ?? data.monthlyRate ?? data.rate;
  if (monthlyRate !== undefined && monthlyRate !== null) payload.monthly_rate = Number(monthlyRate || 0);

  if (data.description !== undefined) payload.description = data.description || '';
  if (data.status !== undefined) payload.status = data.status || 'ACTIVE';

  return payload;
}

// In-memory cache & in-flight deduplication to prevent redundant round-trip queries
const apiCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_CACHE_TTL = 6000; // 6-second short-lived cache

export function invalidateApiCache(pattern = null) {
  if (!pattern) {
    apiCache.clear();
    return;
  }
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  for (const key of apiCache.keys()) {
    if (regex.test(key)) {
      apiCache.delete(key);
    }
  }
}

async function handleSelectStall(cleanUrl, data) {
  const match = cleanUrl.match(/stakeholders\/([^/]+)\/select-stall/);
  const rawId = match ? match[1] : (data?.stakeholderId || data?.stakeholder_id || cleanUrl.split('/')[1]);
  const stakeholderId = Number(rawId);
  const rawStallId = data?.stallId ?? data?.stall_id;
  if (!rawStallId) throw new Error('Stall ID is required.');
  const targetStallId = Number(rawStallId);

  // 1. Fetch stall info to compute 2 months advance baseline (Blueprint requirement)
  const { data: st } = await supabase.from('stalls').select('*').eq('id', targetStallId).maybeSingle();
  const monthlyRent = Number(st?.monthly_rent ?? st?.monthlyRent ?? 1500);
  const totalAdvance = monthlyRent * 2;

  // 2. Free up any previous stall reserved by this stakeholder if changed
  try {
    const { data: currentSh } = await supabase
      .from('stakeholders')
      .select('selected_stall_id')
      .eq('id', stakeholderId)
      .maybeSingle();

    if (currentSh?.selected_stall_id && Number(currentSh.selected_stall_id) !== targetStallId) {
      await supabase
        .from('stalls')
        .update({ status: 'AVAILABLE', occupant_id: null })
        .eq('id', Number(currentSh.selected_stall_id))
        .eq('status', 'RESERVED');
    }
  } catch (freeErr) {
    console.warn('[select-stall] Free previous stall notice:', freeErr);
  }

  // 3. Update stakeholder record
  const { data: updated, error } = await supabase
    .from('stakeholders')
    .update({
      selected_stall_id: targetStallId,
      total_advance_amount: totalAdvance
    })
    .eq('id', stakeholderId)
    .select()
    .single();

  if (error) throw error;

  // 4. Upsert/update occupant with PENDING status
  let occId = null;
  try {
    const { data: exOcc } = await supabase
      .from('occupants')
      .select('id, stall_id')
      .eq('stakeholder_id', stakeholderId)
      .maybeSingle();

    if (exOcc?.id) {
      occId = exOcc.id;
      if (exOcc.stall_id && Number(exOcc.stall_id) !== targetStallId) {
        await supabase
          .from('stalls')
          .update({ status: 'AVAILABLE', occupant_id: null })
          .eq('id', Number(exOcc.stall_id))
          .eq('status', 'RESERVED');
      }
      await supabase
        .from('occupants')
        .update({
          stall_id: targetStallId,
          status: 'PENDING',
          advance_balance: 0,
          is_archived: false
        })
        .eq('id', occId);
    } else {
      const { data: newOcc } = await supabase
        .from('occupants')
        .insert({
          stakeholder_id: stakeholderId,
          stall_id: targetStallId,
          status: 'PENDING',
          occupancy_date: new Date().toISOString().split('T')[0],
          is_archived: false,
          advance_balance: 0
        })
        .select('id')
        .maybeSingle();
      occId = newOcc?.id;
    }

    // 5. Update target stall status to RESERVED and link occupant
    await supabase
      .from('stalls')
      .update({
        status: 'RESERVED',
        occupant_id: occId || null
      })
      .eq('id', targetStallId);
  } catch (occErr) {
    console.warn('[select-stall] Occupant sync notice:', occErr);
  }

  // 6. Sync business_applications table if user_id exists
  try {
    if (updated?.user_id) {
      await supabase
        .from('business_applications')
        .update({
          selected_stall_id: targetStallId
        })
        .eq('user_id', updated.user_id);
    }
  } catch (_) {}

  invalidateApiCache('stakeholders|payments|applications|stalls|occupants');
  return { data: normalizeRecord(updated) };
}

// Smart Adapter that translates REST endpoints directly into Supabase operations
const api = {
  interceptors: rawAxios.interceptors,
  clearCache: invalidateApiCache,

  async get(url, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');
    const cacheKey = `GET:${cleanUrl}:${JSON.stringify(config.params || {})}`;
    const bypassCache = Boolean(config.forceRefresh || config.noCache || config.headers?.['Cache-Control'] === 'no-cache');

    if (!bypassCache) {
      const cached = apiCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < (config.ttl || DEFAULT_CACHE_TTL))) {
        return { ...cached.response, fromCache: true };
      }
      if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey);
      }
    }

    const fetchPromise = (async () => {
      try {
        const response = await this._handleGet(cleanUrl, url, config);
        if (!bypassCache && response && response.data !== undefined) {
          apiCache.set(cacheKey, { timestamp: Date.now(), response });
        }
        return response;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    if (!bypassCache) {
      inFlightRequests.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  },

  async _handleGet(cleanUrl, url, config = {}) {

    // 1. Stalls
    if (cleanUrl === 'stalls') {
      const { data, error } = await supabase
        .from('stalls')
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
        .order('id', { ascending: true });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const { data, error } = await supabase.from('stalls').select('*').eq('id', id).single();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 2. Stall Types
    if (cleanUrl === 'stall-types' || cleanUrl === 'admin/stall-types') {
      const { data, error } = await supabase.from('stall_types').select('*').order('name', { ascending: true });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 3. Rental Rates
    if (cleanUrl === 'rental-rates' || cleanUrl === 'admin/rental-rates') {
      const { data, error } = await supabase.from('rental_rates').select('*').order('id', { ascending: true });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 4. System Settings
    if (cleanUrl === 'admin/system-settings' || cleanUrl === 'system-settings') {
      const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 5. Users
    if (cleanUrl === 'admin/users' || cleanUrl === 'users') {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 6. Stakeholders
    if (cleanUrl === 'stakeholders/for-approval') {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls(*), documents:stakeholder_documents(*), occupant:occupants(*, stall:stalls(*)), payments:payments(*)')
        .or('treasurer_approved.is.null,treasurer_approved.eq.false')
        .not('application_status', 'in', '("COMPLETED","REJECTED","CANCELLED","FULLY_APPROVED","PENDING_MARKET_SUPERVISOR_APPROVAL","PENDING_BPLO_APPROVAL")')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl === 'stakeholders') {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls(*), documents:stakeholder_documents(*), occupant:occupants(*, stall:stalls(*)), payments:payments(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('stakeholders/user/')) {
      const userId = cleanUrl.replace('stakeholders/user/', '');
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, occupant:occupants(*, stall:stalls(*)), documents:stakeholder_documents(*), payments:payments(*)')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/requirements')) {
      const stakeholderId = cleanUrl.replace('stakeholders/', '').replace('/requirements', '');
      const { data, error } = await supabase
        .from('stakeholder_documents')
        .select('*')
        .eq('stakeholder_id', stakeholderId);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('stakeholders/') && !cleanUrl.includes('/', 13)) {
      const id = cleanUrl.replace('stakeholders/', '');
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls(*), documents:stakeholder_documents(*), occupant:occupants(*, stall:stalls(*)), payments:payments(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 7. Applications
    if (cleanUrl === 'applications') {
      const { data, error } = await supabase
        .from('business_applications')
        .select('*, stall:stalls(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('applications/user/')) {
      const userId = cleanUrl.replace('applications/user/', '');
      const { data, error } = await supabase
        .from('business_applications')
        .select('*, stall:stalls(*)')
        .eq('user_id', userId)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 8. Billings
    if (cleanUrl === 'billings') {
      try {
        const { data, error } = await supabase
          .from('billings')
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
          .order('id', { ascending: false });
        if (!error && data && data.length > 0) {
          return { data: normalizeRecord(data) };
        }
      } catch (e) {
        console.warn('[api.get /billings] relational query note:', e);
      }

      try {
        const { data: flatData, error: flatErr } = await supabase
          .from('billings')
          .select('*')
          .order('id', { ascending: false });
        if (!flatErr && flatData && flatData.length > 0) {
          return { data: normalizeRecord(flatData) };
        }
      } catch (flatErr) {
        console.warn('[api.get /billings] flat query note:', flatErr);
      }

      try {
        return await rawAxios.get(url, config);
      } catch (axErr) {
        console.warn('[api.get /billings] rawAxios note:', axErr);
      }

      try {
        const raw = localStorage.getItem('billings');
        if (raw) return { data: JSON.parse(raw) };
      } catch (_) {}

      return { data: [] };
    }

    if (cleanUrl.startsWith('billings/')) {
      const bId = cleanUrl.replace('billings/', '');
      const queryId = !isNaN(Number(bId)) ? Number(bId) : bId;
      try {
        const { data, error } = await supabase
          .from('billings')
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
          .or(`id.eq.${queryId},billing_no.eq.${queryId}`)
          .maybeSingle();
        if (!error && data) {
          return { data: normalizeRecord(data) };
        }
      } catch (e) {
        console.warn('[api.get /billings/:id] relational query note:', e);
      }

      try {
        const { data: flatData, error: flatErr } = await supabase
          .from('billings')
          .select('*')
          .or(`id.eq.${queryId},billing_no.eq.${queryId}`)
          .maybeSingle();
        if (!flatErr && flatData) {
          return { data: normalizeRecord(flatData) };
        }
      } catch (_) {}

      return rawAxios.get(url, config);
    }


    // 8.1 Contracts
    if (cleanUrl === 'contracts') {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
          .order('id', { ascending: false });
        if (error) throw error;
        const normalized = normalizeRecord(data || []);
        if (normalized.length > 0) return { data: normalized };
      } catch (err) {
        console.warn('[api.get /contracts] error fetching from supabase:', err);
      }
      try {
        const raw = localStorage.getItem('contracts');
        if (raw) return { data: JSON.parse(raw) };
      } catch (_) {}
      return { data: [] };
    }

    if (cleanUrl.startsWith('contracts/')) {
      const id = cleanUrl.replace('contracts/', '');
      const { data, error } = await supabase
        .from('contracts')
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 8.2 Occupants
    if (cleanUrl === 'occupants') {
      try {
        const { data, error } = await supabase
          .from('occupants')
          .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
          .order('id', { ascending: false });
        if (!error && data) {
          // Fetch all contracts to resolve contractStatus without N+1
          let contractsMap = {};
          try {
            const { data: cList } = await supabase.from('contracts').select('*');
            if (cList) {
              for (const c of cList) {
                const occId = c.occupant_id || c.occupantId;
                if (occId) {
                  if (!contractsMap[occId]) contractsMap[occId] = [];
                  contractsMap[occId].push(normalizeRecord(c));
                }
              }
            }
          } catch (_) {}

          const enriched = data.map(occ => {
            const item = normalizeRecord(occ);
            const occContracts = contractsMap[occ.id] || [];
            const activeContract = occContracts.find(c => String(c.status || '').toUpperCase() === 'ACTIVE');
            const inProgressContract = occContracts.find(c => ['PENDING', 'PENDING_APPROVAL', 'DRAFT'].includes(String(c.status || '').toUpperCase()));
            const resolvedContract = (occ.contract_id && occContracts.find(c => String(c.id) === String(occ.contract_id))) ||
              activeContract || inProgressContract || occContracts[0] || null;

            item.occupantId = occ.id;
            item.occupantStatus = occ.status || 'PENDING';
            if (resolvedContract) {
              item.contractId = resolvedContract.id;
              item.contractNo = resolvedContract.contractNo || resolvedContract.contract_no;
              item.contractStatus = resolvedContract.status || 'ACTIVE';
              item.contractStartDate = resolvedContract.startDate || resolvedContract.start_date;
              item.contractEndDate = resolvedContract.endDate || resolvedContract.end_date;
            } else {
              item.contractId = null;
              item.contractNo = null;
              item.contractStatus = 'NOT_CREATED';
              item.contractStartDate = null;
              item.contractEndDate = null;
            }
            return item;
          });
          return { data: enriched };
        }
      } catch (err) {
        console.warn('[api.get /occupants] Supabase query failed, falling back:', err);
      }
      return rawAxios.get(url, config);
    }

    if (cleanUrl.startsWith('occupants/stakeholder/')) {
      const stakeholderId = cleanUrl.replace('occupants/stakeholder/', '');
      try {
        const { data: occ, error } = await supabase
          .from('occupants')
          .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
          .eq('stakeholder_id', stakeholderId)
          .maybeSingle();
        if (!error && occ) {
          const item = normalizeRecord(occ);
          let resolvedContract = null;
          try {
            const { data: cList } = await supabase
              .from('contracts')
              .select('*')
              .eq('occupant_id', occ.id)
              .order('id', { ascending: false });
            if (cList && cList.length > 0) {
              const normList = cList.map(normalizeRecord);
              resolvedContract = normList.find(c => String(c.status || '').toUpperCase() === 'ACTIVE') ||
                normList.find(c => ['PENDING', 'PENDING_APPROVAL', 'DRAFT'].includes(String(c.status || '').toUpperCase())) ||
                normList[0];
            }
          } catch (_) {}

          item.occupantId = occ.id;
          item.occupantStatus = occ.status || 'PENDING';
          if (resolvedContract) {
            item.contractId = resolvedContract.id;
            item.contractNo = resolvedContract.contractNo || resolvedContract.contract_no;
            item.contractStatus = resolvedContract.status || 'ACTIVE';
            item.contractStartDate = resolvedContract.startDate || resolvedContract.start_date;
            item.contractEndDate = resolvedContract.endDate || resolvedContract.end_date;
          } else {
            item.contractId = null;
            item.contractNo = null;
            item.contractStatus = 'NOT_CREATED';
            item.contractStartDate = null;
            item.contractEndDate = null;
          }
          return { data: item };
        }
      } catch (err) {
        console.warn('[api.get /occupants/stakeholder] failed, falling back:', err);
      }
      return rawAxios.get(url, config);
    }

    if (cleanUrl.startsWith('occupants/')) {
      const occId = cleanUrl.replace('occupants/', '');
      try {
        const { data: occ, error } = await supabase
          .from('occupants')
          .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
          .eq('id', occId)
          .maybeSingle();
        if (!error && occ) {
          const item = normalizeRecord(occ);
          let resolvedContract = null;
          try {
            const { data: cList } = await supabase
              .from('contracts')
              .select('*')
              .eq('occupant_id', occ.id)
              .order('id', { ascending: false });
            if (cList && cList.length > 0) {
              const normList = cList.map(normalizeRecord);
              resolvedContract = normList.find(c => String(c.status || '').toUpperCase() === 'ACTIVE') ||
                normList.find(c => ['PENDING', 'PENDING_APPROVAL', 'DRAFT'].includes(String(c.status || '').toUpperCase())) ||
                normList[0];
            }
          } catch (_) {}

          item.occupantId = occ.id;
          item.occupantStatus = occ.status || 'PENDING';
          if (resolvedContract) {
            item.contractId = resolvedContract.id;
            item.contractNo = resolvedContract.contractNo || resolvedContract.contract_no;
            item.contractStatus = resolvedContract.status || 'ACTIVE';
            item.contractStartDate = resolvedContract.startDate || resolvedContract.start_date;
            item.contractEndDate = resolvedContract.endDate || resolvedContract.end_date;
          } else {
            item.contractId = null;
            item.contractNo = null;
            item.contractStatus = 'NOT_CREATED';
            item.contractStartDate = null;
            item.contractEndDate = null;
          }
          return { data: item };
        }
      } catch (err) {
        console.warn('[api.get /occupants/:id] failed, falling back:', err);
      }
      return rawAxios.get(url, config);
    }

    // 9. Payments
    if (cleanUrl === 'payments') {
      const { data, error } = await supabase
        .from('payments')
        .select('*, stakeholder:stakeholders(*), billing:billings(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 10. Audit Logs
    if (cleanUrl === 'audit-logs' || cleanUrl === 'admin/audit-logs') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 11. Login History
    if (cleanUrl === 'login-history' || cleanUrl === 'admin/login-history') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .ilike('action', '%LOGIN%')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 12. Notifications
    if (cleanUrl === 'notifications') {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('notifications/stakeholder/')) {
      const parts = cleanUrl.split('/');
      const stakeholderId = parts[2];
      if (cleanUrl.endsWith('/unread-count')) {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('stakeholder_id', stakeholderId)
          .eq('is_read', false);
        if (error) throw error;
        return { data: count || 0 };
      } else {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('stakeholder_id', stakeholderId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return { data: normalizeRecord(data || []) };
      }
    }

    // 13. AI Insights
    if (cleanUrl.includes('ai/') || cleanUrl.includes('ai-insights')) {
      const { data, error } = await supabase.functions.invoke('ai-insights/summary');
      if (error) throw error;
      return { data };
    }

    // 14. Reports Endpoints (Collection, Liability, Stall Occupancy)
    if (cleanUrl === 'reports/daily-collections' || cleanUrl === 'reports/collection') {
      try {
        let paymentsList = []
        try {
          const { data, error } = await supabase
            .from('payments')
            .select('*, stakeholder:stakeholders(*), billing:billings(*)')
            .order('payment_date', { ascending: false })
          if (!error && data) {
            paymentsList = normalizeRecord(data)
          }
        } catch (_) {}

        if (!paymentsList.length) {
          try {
            const raw = localStorage.getItem('payments')
            if (raw) paymentsList = JSON.parse(raw)
          } catch (_) {}
        }

        const month = config.params?.month ? Number(config.params.month) : null
        const year = config.params?.year ? Number(config.params.year) : null

        const filtered = paymentsList.filter(p => {
          const d = new Date(p.paymentDate || p.payment_date || p.date || p.createdAt || p.created_at)
          if (isNaN(d.getTime())) return true
          if (month && d.getMonth() + 1 !== month) return false
          if (year && d.getFullYear() !== year) return false
          return true
        })

        // Group into daily collections
        const dailyMap = {}
        filtered.forEach(p => {
          const rawDate = p.paymentDate || p.payment_date || p.date || p.createdAt || p.created_at || 'Unknown Date'
          const dateStr = String(rawDate).split('T')[0]
          if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = { date: dateStr, totalTransactions: 0, totalAmount: 0 }
          }
          dailyMap[dateStr].totalTransactions += 1
          const amt = Number(String(p.amount || 0).replace(/[^\d.-]/g, '')) || 0
          dailyMap[dateStr].totalAmount += amt
        })

        const dailyCollections = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date))
        const totalCollected = filtered.reduce((sum, p) => sum + (Number(String(p.amount || 0).replace(/[^\d.-]/g, '')) || 0), 0)

        if (cleanUrl === 'reports/daily-collections') {
          return { data: dailyCollections }
        }

        return {
          data: {
            totalCollected,
            totalTransactions: filtered.length,
            dailyCollections,
            receipts: filtered
          }
        }
      } catch (err) {
        console.warn('[api.get /reports/collection] Error:', err)
        return { data: [] }
      }
    }

    if (cleanUrl === 'reports/outstanding-balances' || cleanUrl === 'reports/liability') {
      try {
        let billingsList = []
        try {
          const { data, error } = await supabase
            .from('billings')
            .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
            .order('due_date', { ascending: true })
          if (!error && data) {
            billingsList = normalizeRecord(data)
          }
        } catch (_) {}

        if (!billingsList.length) {
          try {
            const raw = localStorage.getItem('billings')
            if (raw) billingsList = JSON.parse(raw)
          } catch (_) {}
        }

        const month = config.params?.month ? Number(config.params.month) : null
        const year = config.params?.year ? Number(config.params.year) : null

        const filtered = billingsList.filter(b => {
          const d = new Date(b.dueDate || b.due_date || b.billingPeriod || b.createdAt)
          if (isNaN(d.getTime())) return true
          if (month && d.getMonth() + 1 !== month) return false
          if (year && d.getFullYear() !== year) return false
          return true
        })

        const mapped = filtered.map(b => {
          const tot = Number(b.totalAmount ?? b.total_amount ?? b.amount ?? 0)
          const pd = Number(b.paidAmount ?? b.paid_amount ?? 0)
          const bal = Number(b.balance !== undefined ? b.balance : Math.max(tot - pd, 0))
          const sName = [b.occupant?.stakeholder?.firstName, b.occupant?.stakeholder?.lastName].filter(Boolean).join(' ') ||
            b.stakeholderName || b.stakeholder || 'Stakeholder'
          const bName = b.occupant?.stakeholder?.businessName || b.businessName || ''
          const stNo = b.contract?.stall?.stallNo || b.stallNo || b.stall_no || ''
          const due = b.dueDate || b.due_date || ''
          const isOverdue = due && new Date(due).getTime() < Date.now() && bal > 0
          const status = bal <= 0 ? 'PAID' : (isOverdue ? 'OVERDUE' : (pd > 0 ? 'PARTIALLY_PAID' : 'UNPAID'))

          return {
            billingNo: b.billingNo || b.billing_no || `BILL-${b.id || ''}`,
            businessName: bName || sName,
            stakeholder: sName,
            stallNo: stNo,
            balance: bal,
            totalAmount: tot,
            paidAmount: pd,
            dueDate: due,
            period: b.billingPeriod || b.billing_period || b.period || '',
            status
          }
        })

        return { data: mapped }
      } catch (err) {
        console.warn('[api.get /reports/liability] Error:', err)
        return { data: [] }
      }
    }

    if (cleanUrl === 'reports/occupancy' || cleanUrl === 'reports/stall-occupancy') {
      try {
        let stallsList = []
        try {
          const { data, error } = await supabase
            .from('stalls')
            .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
            .order('id', { ascending: true })
          if (!error && data) {
            stallsList = normalizeRecord(data)
          }
        } catch (_) {}

        if (!stallsList.length) {
          try {
            const raw = localStorage.getItem('stalls')
            if (raw) stallsList = JSON.parse(raw)
          } catch (_) {}
        }

        let contractsList = []
        try {
          const { data } = await supabase.from('contracts').select('*')
          if (data) contractsList = normalizeRecord(data)
        } catch (_) {}
        if (!contractsList.length) {
          try {
            const raw = localStorage.getItem('contracts')
            if (raw) contractsList = JSON.parse(raw)
          } catch (_) {}
        }

        const enriched = stallsList.map(stall => {
          const sNo = stall.stallNo || stall.stall_no || ''
          const matchedContract = contractsList.find(c => (c.stallNo && c.stallNo === sNo) || (c.stallId && c.stallId === stall.id))
          const occupant = stall.occupant
          const stakeholder = occupant?.stakeholder

          const occName = stakeholder ? [stakeholder.firstName, stakeholder.lastName].filter(Boolean).join(' ') :
            (occupant?.name || matchedContract?.stakeholder || '')
          const busName = stakeholder?.businessName || matchedContract?.business || ''
          const normStatus = String(stall.status || '').toUpperCase()
          const isOccupied = ['OCCUPIED', 'RENTED', 'ASSIGNED'].includes(normStatus) || Boolean(occName)

          return {
            id: stall.id,
            stallNo: sNo,
            section: stall.section || stall.info || 'General Section',
            stallType: stall.stallType || stall.stall_type || 'Standard',
            monthlyRent: Number(stall.monthlyRent || stall.monthly_rent || 0),
            status: isOccupied ? 'OCCUPIED' : (normStatus === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE'),
            occupantName: isOccupied ? (occName || 'Assigned Stakeholder') : 'Available / Unassigned',
            businessName: busName || (isOccupied ? 'Registered Trade' : '—'),
            contractNo: matchedContract?.contractNo || matchedContract?.ref || (isOccupied ? `CON-${sNo}` : 'None'),
            leasePeriod: matchedContract?.startDate && matchedContract?.endDate ? `${matchedContract.startDate} to ${matchedContract.endDate}` : (isOccupied ? 'Active Lease' : '—')
          }
        })

        return { data: enriched }
      } catch (err) {
        console.warn('[api.get /reports/occupancy] Error:', err)
        return { data: [] }
      }
    }

    return rawAxios.get(url, config);
  },

  async post(url, data, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');
    invalidateApiCache(cleanUrl.split('/')[0]);

    // 1. Applications upload/create
    if (cleanUrl === 'applications') {
      if (data instanceof FormData) {
        let rawUserId = data.get('userId');
        let resolvedUserId = (rawUserId && rawUserId !== 'null' && rawUserId !== 'undefined') ? rawUserId : null;

        if (!resolvedUserId) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          resolvedUserId = authUser?.id || null;
        }

        if (!resolvedUserId) {
          throw new Error('Authentication required. Please log in before submitting an application.');
        }

        const idFile = data.get('idFile');
        const letterFile = data.get('letterFile');

        let idUrl = null;
        if (idFile && idFile.name) {
          const idPath = `applications/${Date.now()}_id_${idFile.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
          const { error: idErr } = await supabase.storage.from('uploads').upload(idPath, idFile);
          if (idErr) {
            console.warn('[STORAGE] ID upload warning:', idErr.message);
          } else {
            const { data: pub } = supabase.storage.from('uploads').getPublicUrl(idPath);
            idUrl = pub?.publicUrl || null;
          }
        }

        let letterUrl = null;
        if (letterFile && letterFile.name) {
          const letterPath = `applications/${Date.now()}_letter_${letterFile.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
          const { error: letErr } = await supabase.storage.from('uploads').upload(letterPath, letterFile);
          if (letErr) {
            console.warn('[STORAGE] Letter upload warning:', letErr.message);
          } else {
            const { data: pub } = supabase.storage.from('uploads').getPublicUrl(letterPath);
            letterUrl = pub?.publicUrl || null;
          }
        }

        const stallId = data.get('stallId') || data.get('selectedStallId') || null;
        const numStallId = stallId ? Number(stallId) : null;

        // Upsert into business_applications
        const { data: appData, error: appErr } = await supabase.from('business_applications')
          .upsert({
            user_id: resolvedUserId,
            business_name: data.get('businessName') || '',
            business_type: data.get('businessType') || '',
            first_name: data.get('firstName') || '',
            middle_name: data.get('middleName') || '',
            last_name: data.get('lastName') || '',
            contact: data.get('contact') || '',
            email: data.get('email') || '',
            address: data.get('address') || '',
            selected_stall_id: numStallId,
            id_document_url: idUrl,
            letter_document_url: letterUrl,
            application_status: 'PENDING',
            onboarding_status: 'NEW'
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (appErr) {
          console.error('[API] Error saving business application:', appErr);
          throw appErr;
        }

        // Upsert into stakeholders
        const { data: existingStakeholder } = await supabase
          .from('stakeholders')
          .select('id')
          .eq('user_id', resolvedUserId)
          .maybeSingle();

        let stakeholderId = existingStakeholder?.id;

        if (stakeholderId) {
          await supabase.from('stakeholders').update({
            business_name: data.get('businessName') || '',
            business_type: data.get('businessType') || '',
            first_name: data.get('firstName') || '',
            middle_name: data.get('middleName') || '',
            last_name: data.get('lastName') || '',
            contact: data.get('contact') || '',
            email: data.get('email') || '',
            address: data.get('address') || '',
            selected_stall_id: numStallId,
            application_status: 'FOR_APPROVAL',
            onboarding_status: 'FOR_APPROVAL'
          }).eq('id', stakeholderId);
        } else {
          const { data: newStakeholder } = await supabase.from('stakeholders').insert({
            user_id: resolvedUserId,
            business_name: data.get('businessName') || '',
            business_type: data.get('businessType') || '',
            first_name: data.get('firstName') || '',
            middle_name: data.get('middleName') || '',
            last_name: data.get('lastName') || '',
            contact: data.get('contact') || '',
            email: data.get('email') || '',
            address: data.get('address') || '',
            selected_stall_id: numStallId,
            application_status: 'FOR_APPROVAL',
            onboarding_status: 'FOR_APPROVAL'
          }).select('id').maybeSingle();
          stakeholderId = newStakeholder?.id;
        }

        localStorage.setItem('userId', resolvedUserId);
        if (stakeholderId) {
          localStorage.setItem('stakeholderId', String(stakeholderId));
          const docs = [];
          if (idUrl) {
            docs.push({
              stakeholder_id: stakeholderId,
              document_type: 'VALID_ID',
              file_path: idUrl,
              file_name: idFile?.name || 'valid_id'
            });
          }
          if (letterUrl) {
            docs.push({
              stakeholder_id: stakeholderId,
              document_type: 'APPLICATION_LETTER',
              file_path: letterUrl,
              file_name: letterFile?.name || 'letter_of_intent'
            });
          }
          if (docs.length > 0) {
            await supabase.from('stakeholder_documents').insert(docs);
          }

          // If a stall was chosen, calculate 2-month advance payment baseline and reserve stall with PENDING occupant
          if (numStallId) {
            try {
              const { data: st } = await supabase.from('stalls').select('*').eq('id', numStallId).maybeSingle();
              const monthlyRent = Number(st?.monthly_rent || st?.monthlyRent || 1500);
              const totalAdvance = monthlyRent * 2;

              await supabase.from('stakeholders').update({
                total_advance_amount: totalAdvance
              }).eq('id', stakeholderId);

              // Upsert occupant with PENDING status
              const { data: exOcc } = await supabase.from('occupants').select('id').eq('stakeholder_id', Number(stakeholderId)).maybeSingle();
              let occId = exOcc?.id;
              if (occId) {
                await supabase.from('occupants').update({
                  stall_id: numStallId,
                  status: 'PENDING'
                }).eq('id', occId);
              } else {
                const { data: newOcc } = await supabase.from('occupants').insert({
                  stakeholder_id: Number(stakeholderId),
                  stall_id: numStallId,
                  status: 'PENDING',
                  occupancy_date: new Date().toISOString().split('T')[0],
                  is_archived: false,
                  advance_balance: 0
                }).select('id').maybeSingle();
                occId = newOcc?.id;
              }

              // Update stall to RESERVED
              await supabase.from('stalls').update({
                status: 'RESERVED',
                occupant_id: occId || null
              }).eq('id', numStallId);
            } catch (occErr) {
              console.warn('[applications] Stall reservation & advance calculation note:', occErr);
            }
          }

          invalidateApiCache('stakeholders|payments|applications|stalls|occupants');
          return { data: normalizeRecord(appData) };
        }
      }
    }

    // 2. Stalls upload
    if (cleanUrl === 'stalls/upload') {
      const file = data.get ? (data.get('file') || data.get('image')) : null;
      if (file) {
        const filePath = `stalls/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
        const { error: upErr } = await supabase.storage.from('uploads').upload(filePath, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('uploads').getPublicUrl(filePath);
        return { data: pub?.publicUrl };
      }
    }

    // 3. Stalls create
    if (cleanUrl === 'stalls') {
      const stallPayload = mapStallPayload(data);
      const { data: newStall, error } = await supabase
        .from('stalls')
        .insert(stallPayload)
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
        .single();
      if (error) throw error;
      return { data: normalizeRecord(newStall) };
    }

    // 4. Stall Types create
    if (cleanUrl === 'stall-types' || cleanUrl === 'admin/stall-types') {
      const { data: newType, error } = await supabase.from('stall_types').insert(data).select().single();
      if (error) throw error;
      return { data: normalizeRecord(newType) };
    }

    // 5. Rental Rates create
    if (cleanUrl === 'rental-rates' || cleanUrl === 'admin/rental-rates') {
      const ratePayload = mapRentalRatePayload(data);
      const { data: newRate, error } = await supabase.from('rental_rates').insert(ratePayload).select().single();
      if (error) throw error;
      return { data: normalizeRecord(newRate) };
    }

    // 6. Payments create
    if (cleanUrl === 'payments') {
      const stakeholderId = data.stakeholderId || data.stakeholder_id || data.stakeholder?.id;
      const billingId = data.billingId || data.billing_id || data.billing?.id || null;
      const receiptNo = data.receiptNo || data.receipt_no || `RCP-${Date.now().toString().slice(-8)}`;
      const { data: newPayment, error } = await supabase
        .from('payments')
        .insert({
          stakeholder_id: stakeholderId,
          billing_id: billingId,
          amount: data.amount,
          payment_type: data.paymentType || data.payment_type || 'RENT_PAYMENT',
          reference_no: data.referenceNo || data.reference_no || '',
          receipt_no: receiptNo,
          payment_date: data.paymentDate || data.payment_date || new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      invalidateApiCache('payments|billings|stakeholders');
      return { data: normalizeRecord(newPayment) };
    }

    // 6.1 Billings create
    if (cleanUrl === 'billings') {
      const billingNo = data.billingNo || data.billing_no || `BILL-${Date.now().toString().slice(-8)}`;
      const totalAmount = Number(data.totalAmount ?? data.total_amount ?? data.amount ?? 0);
      const paidAmount = Number(data.paidAmount ?? data.paid_amount ?? 0);
      const balance = Number(data.balance ?? Math.max(totalAmount - paidAmount, 0));
      const status = data.status || (balance <= 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID'));

      const insertPayload = {
        occupant_id: data.occupantId || data.occupant_id || null,
        contract_id: data.contractId || data.contract_id || null,
        billing_no: billingNo,
        billing_period: data.billingPeriod || data.billing_period || `MONTHLY-${new Date().getMonth() + 1}-${new Date().getFullYear()}`,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance: balance,
        due_date: data.dueDate || data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: status
      };

      const { data: newBill, error } = await supabase
        .from('billings')
        .insert(insertPayload)
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
        .single();
      if (error) throw error;
      return { data: normalizeRecord(newBill) };
    }

    // 6.2 Activate contract and stall occupancy ONLY if all required conditions are satisfied
    if (cleanUrl.includes('activate-if-eligible')) {
      const parts = cleanUrl.split('/');
      const stakeholderId = parts.find((p, idx) => parts[idx - 1] === 'stakeholder') || data?.stakeholderId;
      if (stakeholderId) {
        const { data: sh } = await supabase.from('stakeholders').select('*').eq('id', Number(stakeholderId)).maybeSingle();
        if (sh) {
          const hasAdvance = Boolean(sh.advance_rent_paid || sh.advance_payment_paid || Number(sh.advance_balance || 0) > 0);
          const hasStall = Boolean(sh.selected_stall_id);
          const hasBplo = Boolean(sh.bplo_approved || sh.bplo_status === 'APPROVED');
          const hasEndorsement = Boolean(sh.final_endorsed || sh.endorsement_status === 'APPROVED' || sh.endorsing_approved);
          const hasPermitFee = Boolean(sh.applicant_fee_paid || sh.application_form_paid || sh.treasurer_paid);

          if (hasAdvance && hasStall && hasBplo && hasEndorsement && hasPermitFee) {
            const stallId = Number(sh.selected_stall_id);
            const { data: occ } = await supabase.from('occupants').select('id').eq('stakeholder_id', Number(stakeholderId)).maybeSingle();
            if (occ?.id) {
              await supabase.from('occupants').update({ status: 'ACTIVE', is_archived: false }).eq('id', occ.id);
              await supabase.from('contracts').update({ status: 'ACTIVE' }).eq('occupant_id', occ.id);
            }
            if (stallId) {
              await supabase.from('stalls').update({ status: 'OCCUPIED', occupant_id: occ?.id || null }).eq('id', stallId);
            }
            await supabase.from('stakeholders').update({
              application_status: 'FULLY_APPROVED',
              onboarding_status: 'FULLY_ONBOARDED',
              verified_tenant: true
            }).eq('id', Number(stakeholderId));

            if (sh.user_id) {
              await supabase.from('business_applications').update({
                application_status: 'COMPLETED',
                onboarding_status: 'FULLY_ONBOARDED'
              }).eq('user_id', sh.user_id);
            }
            return { data: { activated: true, stakeholderId, stallId } };
          }
          return { data: { activated: false, reason: 'Pending required approvals or fees', checks: { hasAdvance, hasStall, hasBplo, hasEndorsement, hasPermitFee } } };
        }
      }
      return { data: { activated: false } };
    }

    // 7. Stakeholder Approval Actions in POST
    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.includes('treasurer-approve')) {
      const stakeholderId = cleanUrl.split('/')[1];
      let resData = null;
      try {
        const { data: invData, error } = await supabase.functions.invoke('approval-workflow', {
          body: { action: 'treasurer-approve', stakeholderId, ...(data || {}) }
        });
        if (!error && invData && !invData.error) {
          resData = invData;
        }
      } catch (e) {
        console.warn('approval-workflow edge function notice, executing direct DB update:', e);
      }

      // Always update stakeholders table directly
      try {
        await supabase.from('stakeholders').update({
          treasurer_approved: true,
          advance_payment_paid: true,
          advance_payment_completed: true,
          application_status: 'PENDING_MARKET_SUPERVISOR_APPROVAL'
        }).eq('id', Number(stakeholderId));
      } catch (sErr) {
        console.warn('Direct stakeholders update note:', sErr);
      }

      try {
        const { data: st } = await supabase.from('stakeholders').select('user_id').eq('id', Number(stakeholderId)).maybeSingle();
        if (st?.user_id) {
          await supabase.from('business_applications').update({
            advance_payment_paid: true,
            advance_payment_completed: true,
            application_status: 'PENDING_MARKET_SUPERVISOR_APPROVAL'
          }).eq('user_id', st.user_id);
        }
      } catch (_) {}

      invalidateApiCache('stakeholders|payments|applications|stalls');
      return { data: resData || { success: true, stakeholderId, status: 'APPROVED' } };
    }

    // 6.2 Stakeholder Select Stall (from Application Progress / Business Application)
    if (cleanUrl.includes('/select-stall')) {
      return await handleSelectStall(cleanUrl, data);
    }

    if (cleanUrl.startsWith('stakeholders/') && (cleanUrl.includes('market-approve') || cleanUrl.includes('supervisor-approve'))) {
      const stakeholderId = cleanUrl.split('/')[1];
      const targetStallId = data?.stallId || data?.stall_id;

      // 1. Fetch stakeholder details
      const { data: currentSh } = await supabase.from('stakeholders').select('*').eq('id', stakeholderId).maybeSingle();
      const resolvedStallId = targetStallId || currentSh?.selected_stall_id || currentSh?.selectedStallId;

      const { data: updated, error } = await supabase
        .from('stakeholders')
        .update({
          market_supervisor_approved: true,
          market_approval_status: 'APPROVED',
          application_status: 'PENDING_BPLO_APPROVAL',
          onboarding_status: resolvedStallId ? 'STALL_ASSIGNED' : 'MARKET_APPROVED',
          selected_stall_id: resolvedStallId ? Number(resolvedStallId) : (currentSh?.selected_stall_id || null)
        })
        .eq('id', stakeholderId)
        .select()
        .single();
      if (error) throw error;

      // 2. If a stall is selected/assigned, assign occupant (PENDING), reserve stall (RESERVED), and prepare contract draft (PENDING_APPROVAL)
      if (resolvedStallId) {
        try {
          const { data: st } = await supabase.from('stalls').select('*').eq('id', Number(resolvedStallId)).maybeSingle();

          let occupantId = null;
          const { data: existingOcc } = await supabase.from('occupants').select('id').eq('stakeholder_id', Number(stakeholderId)).maybeSingle();
          if (existingOcc?.id) {
            occupantId = existingOcc.id;
            await supabase.from('occupants').update({
              status: 'PENDING',
              stall_id: Number(resolvedStallId),
              occupancy_date: new Date().toISOString().split('T')[0],
              is_archived: false
            }).eq('id', occupantId);
          } else {
            const { data: newOcc } = await supabase.from('occupants').insert({
              stakeholder_id: Number(stakeholderId),
              stall_id: Number(resolvedStallId),
              status: 'PENDING',
              occupancy_date: new Date().toISOString().split('T')[0],
              is_archived: false,
              advance_balance: currentSh?.advance_balance || 0
            }).select('id').maybeSingle();
            occupantId = newOcc?.id;
          }

          // Update stall to RESERVED (prevent double assignment while pending final permits)
          await supabase.from('stalls').update({
            status: 'RESERVED',
            occupant_id: occupantId
          }).eq('id', Number(resolvedStallId));

          // Prepare contract draft with PENDING_APPROVAL status (not ACTIVE until BPLO permit issuance)
          const contractNo = `CON-${Date.now().toString().slice(-8)}`;
          let contractId = null;
          const { data: existingContract } = await supabase.from('contracts').select('id').eq('occupant_id', occupantId).maybeSingle();
          if (existingContract?.id) {
            contractId = existingContract.id;
            await supabase.from('contracts').update({
              status: 'PENDING_APPROVAL',
              stall_id: Number(resolvedStallId),
              monthly_rent: Number(st?.monthly_rent || 1500)
            }).eq('id', contractId);
          } else {
            const { data: newCon } = await supabase.from('contracts').insert({
              occupant_id: occupantId,
              stall_id: Number(resolvedStallId),
              contract_no: contractNo,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              monthly_rent: Number(st?.monthly_rent || 1500),
              billing_frequency: 'MONTHLY',
              status: 'PENDING_APPROVAL'
            }).select('id').maybeSingle();
            contractId = newCon?.id;
          }

          if (contractId) {
            await supabase.from('occupants').update({ contract_id: contractId, status: 'PENDING' }).eq('id', occupantId);
            await supabase.from('stakeholders').update({ contract_id: contractId, onboarding_status: 'STALL_ASSIGNED' }).eq('id', Number(stakeholderId));
          }
        } catch (assignErr) {
          console.warn('[market-approve] Stall and contract assignment note:', assignErr);
        }
      }

      try {
        if (updated?.user_id) {
          await supabase.from('business_applications').update({
            market_approval_status: 'APPROVED',
            application_status: 'PENDING_BPLO_APPROVAL',
            selected_stall_id: resolvedStallId ? Number(resolvedStallId) : undefined
          }).eq('user_id', updated.user_id);
        }
      } catch (_) {}

      invalidateApiCache('stakeholders|payments|applications|stalls|occupants|contracts|billings');
      return { data: normalizeRecord(updated) };
    }

    // 7. Occupants Allocate
    if (cleanUrl.startsWith('occupants/allocate/')) {
      const stallId = cleanUrl.replace('occupants/allocate/', '');
      const stakeholderId = data?.stakeholderId || data?.stakeholder_id;
      if (!stakeholderId) throw new Error('Stakeholder ID is required for stall allocation');

      try {
        // Check stakeholder approval & advance payment
        const { data: sh, error: shErr } = await supabase
          .from('stakeholders')
          .select('*')
          .eq('id', stakeholderId)
          .maybeSingle();

        if (shErr) throw shErr;
        if (!sh) throw new Error('Stakeholder not found');

        // Fetch target stall details
        const { data: st } = await supabase
          .from('stalls')
          .select('*')
          .eq('id', Number(stallId))
          .maybeSingle();

        const targetStallNum = st?.stall_no || st?.stallNo || '';

        // Check or create occupant with ACTIVE status
        let occupantId = null;
        const { data: existingOcc } = await supabase
          .from('occupants')
          .select('id')
          .eq('stakeholder_id', Number(stakeholderId))
          .maybeSingle();

        if (existingOcc?.id) {
          occupantId = existingOcc.id;
          await supabase
            .from('occupants')
            .update({
              status: 'PENDING',
              stall_id: Number(stallId),
              is_archived: false,
              occupancy_date: new Date().toISOString().split('T')[0]
            })
            .eq('id', occupantId);
        } else {
          const { data: newOcc, error: newOccErr } = await supabase
            .from('occupants')
            .insert({
              stakeholder_id: Number(stakeholderId),
              stall_id: Number(stallId),
              status: 'PENDING',
              occupancy_date: new Date().toISOString().split('T')[0],
              is_archived: false,
              advance_balance: sh.advance_balance || 0
            })
            .select('id')
            .single();

          if (newOccErr) throw newOccErr;
          occupantId = newOcc?.id;
        }

        // Assign to stall as RESERVED (occupancy remains reserved until BPLO permit issuance)
        const { data: updatedStall, error: updStallErr } = await supabase
          .from('stalls')
          .update({
            status: 'RESERVED',
            occupant_id: occupantId
          })
          .eq('id', Number(stallId))
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
          .single();

        if (updStallErr) throw updStallErr;

        // Update stakeholder onboarding
        await supabase
          .from('stakeholders')
          .update({
            onboarding_status: 'STALL_ASSIGNED',
            selected_stall_id: Number(stallId),
            market_approval_status: 'APPROVED',
            market_supervisor_approved: true
          })
          .eq('id', Number(stakeholderId));

        // Prepare contract draft with PENDING_APPROVAL status (not ACTIVE)
        const contractNo = `CON-${Date.now().toString().slice(-8)}`;
        const { data: existingContract } = await supabase
          .from('contracts')
          .select('id')
          .eq('occupant_id', occupantId)
          .maybeSingle();

        let contractId = existingContract?.id;
        if (!contractId) {
          const { data: newCon } = await supabase
            .from('contracts')
            .insert({
              occupant_id: occupantId,
              stall_id: Number(stallId),
              contract_no: contractNo,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              monthly_rent: Number(st.monthly_rent || 1500),
              billing_frequency: 'MONTHLY',
              status: 'PENDING_APPROVAL'
            })
            .select('id')
            .maybeSingle();
          contractId = newCon?.id;
        }

        if (contractId) {
          await supabase.from('occupants').update({ contract_id: contractId, status: 'PENDING' }).eq('id', occupantId);
        }

        // Also update business_applications if user_id exists
        if (sh.user_id) {
          try {
            await supabase.from('business_applications').update({
              selected_stall_id: Number(stallId),
              market_approval_status: 'APPROVED',
              market_supervisor_approved: true,
              application_status: 'PENDING_BPLO_APPROVAL'
            }).eq('user_id', sh.user_id);
          } catch (_) {}
        }

        // Automatically trigger ensureBillingsForVerifiedTenants so billing statements are immediately created
        try {
          const { ensureBillingsForVerifiedTenants } = await import('./billingService');
          await ensureBillingsForVerifiedTenants();
        } catch (_) {}

        invalidateApiCache('stalls|stakeholders|occupants|contracts|billings');
        return { data: normalizeRecord(updatedStall) };
      } catch (err) {
        console.warn('[api.post /occupants/allocate] Supabase error, falling back:', err);
        return rawAxios.post(url, data, config);
      }
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.includes('assign-stall')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'assign-stall', stakeholderId, ...(data || {}) }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Stall assignment failed');

      try {
        const targetStallId = data?.stallId || data?.stall_id;
        if (targetStallId) {
          await supabase.from('occupants').update({ status: 'ACTIVE' }).eq('stakeholder_id', Number(stakeholderId));
          const { data: occ } = await supabase.from('occupants').select('id').eq('stakeholder_id', Number(stakeholderId)).maybeSingle();
          if (occ?.id) {
            await supabase.from('stalls').update({ status: 'OCCUPIED', occupant_id: occ.id }).eq('id', Number(targetStallId));
          }
        }
        const { data: st } = await supabase.from('stakeholders').select('user_id').eq('id', stakeholderId).maybeSingle();
        if (st?.user_id && targetStallId) {
          await supabase.from('business_applications').update({
            selected_stall_id: Number(targetStallId),
            market_approval_status: 'APPROVED',
            market_supervisor_approved: true,
            application_status: 'PENDING_BPLO_APPROVAL'
          }).eq('user_id', st.user_id);
        }
      } catch (_) {}

      // Non-blocking billing check and notification dispatch
      void (async () => {
        try {
          const { ensureBillingsForVerifiedTenants } = await import('./billingService');
          await ensureBillingsForVerifiedTenants();
        } catch (_) {}

        try {
          const { sendApplicationProgressNotification } = await import('./emailNotificationService');
          await sendApplicationProgressNotification({
            stakeholderId,
            stage: 'STALL_ASSIGNMENT',
            status: 'ASSIGNED',
            title: 'Market Stall Assignment Completed',
            message: 'Your stall assignment has been processed and forwarded to BPLO for verification.'
          });
        } catch (_) {}
      })();

      return { data: resData };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/approve')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'treasurer-approve', stakeholderId, ...(data || {}) }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Approval failed');
      return { data: resData };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/reject')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const remarks = data?.remarks || config.params?.remarks || 'Application rejected';
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'reject', stakeholderId, remarks }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Rejection failed');
      return { data: resData };
    }

    // 8. Direct Edge Function invocation
    if (cleanUrl.startsWith('approval-workflow')) {
      const { data: resData, error } = await supabase.functions.invoke(cleanUrl, { body: data });
      if (error) throw error;
      return { data: resData };
    }

    // 9. Contracts create
    if (cleanUrl === 'contracts') {
      const contractNo = data.contractNo || data.contract_no || `CON-${Date.now().toString().slice(-8)}`;
      let occupantId = data.occupantId || data.occupant_id || data.occupant?.id || null;
      const stallId = data.stallId || data.stall_id || data.stall?.id || null;
      const stakeholderId = data.stakeholderId || data.stakeholder_id || data.stakeholder?.id || data.occupant?.stakeholder?.id || null;

      // 1. Resolve occupant: occupants references stakeholder_id (unique) and stall references occupant_id
      if (!occupantId && stallId) {
        try {
          const { data: stallData } = await supabase
            .from('stalls')
            .select('occupant_id')
            .eq('id', Number(stallId))
            .maybeSingle();
          if (stallData?.occupant_id) occupantId = stallData.occupant_id;
        } catch (_) {}
      }

      if (!occupantId && stakeholderId) {
        try {
          const { data: existingOcc } = await supabase
            .from('occupants')
            .select('id')
            .eq('stakeholder_id', Number(stakeholderId))
            .maybeSingle();
          if (existingOcc?.id) {
            occupantId = existingOcc.id;
          } else {
            const { data: newOcc } = await supabase
              .from('occupants')
              .insert({
                stakeholder_id: Number(stakeholderId),
                status: 'ACTIVE',
                advance_balance: 0
              })
              .select('id')
              .single();
            if (newOcc?.id) occupantId = newOcc.id;
          }
        } catch (_) {}
      }

      const insertPayload = {
        contract_no: contractNo,
        start_date: data.startDate || data.start_date || null,
        end_date: data.endDate || data.end_date || null,
        monthly_rent: data.monthlyRent ?? data.monthly_rent ?? 0,
        billing_frequency: data.billingFrequency || data.billing_frequency || 'MONTHLY',
        terms: data.terms || '',
        status: data.status || 'ACTIVE',
        occupant_id: occupantId ? Number(occupantId) : null,
        stall_id: stallId ? Number(stallId) : null
      };

      try {
        const { data: newContract, error } = await supabase
          .from('contracts')
          .insert(insertPayload)
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
          .single();
        if (error) throw error;

        if (stallId && occupantId) {
          try {
            await supabase.from('stalls').update({ status: 'OCCUPIED', occupant_id: Number(occupantId) }).eq('id', Number(stallId));
          } catch (_) {}
        } else if (stallId) {
          try {
            await supabase.from('stalls').update({ status: 'OCCUPIED' }).eq('id', Number(stallId));
          } catch (_) {}
        }

        if (occupantId && newContract?.id) {
          try {
            await supabase.from('occupants').update({ contract_id: newContract.id, status: 'ACTIVE' }).eq('id', Number(occupantId));
          } catch (_) {}
        }

        if (stakeholderId) {
          try {
            await supabase.from('stakeholders').update({ onboarding_status: 'CONTRACT_CREATED' }).eq('id', Number(stakeholderId));
          } catch (_) {}
        }

        const normalizedContract = normalizeRecord(newContract);

        // Sync localStorage
        try {
          const raw = localStorage.getItem('contracts');
          let localList = raw ? JSON.parse(raw) : [];
          if (Array.isArray(localList)) {
            localList = localList.filter(c => String(c.id) !== String(normalizedContract.id) && c.contractNo !== contractNo);
            localList.unshift(normalizedContract);
            localStorage.setItem('contracts', JSON.stringify(localList));
          }
        } catch (_) {}

        return { data: normalizedContract };
      } catch (insertErr) {
        console.warn('[API] Contracts table insert notice (using fallback):', insertErr.message);
        const fallbackContract = normalizeRecord({
          id: Date.now(),
          ...insertPayload,
          created_at: new Date().toISOString()
        });

        try {
          const raw = localStorage.getItem('contracts');
          let localList = raw ? JSON.parse(raw) : [];
          if (Array.isArray(localList)) {
            localList.unshift(fallbackContract);
            localStorage.setItem('contracts', JSON.stringify(localList));
          }
        } catch (_) {}

        return { data: fallbackContract };
      }
    }

    return rawAxios.post(url, data, config);
  },

  async put(url, data, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');
    invalidateApiCache(cleanUrl.split('/')[0]);

    // 0. Stakeholder Select Stall (from Application Progress / Business Application)
    if (cleanUrl.includes('/select-stall')) {
      return await handleSelectStall(cleanUrl, data);
    }

    // 1. Applications endorse / approve / reject / bplo
    if (cleanUrl.includes('/reject') || cleanUrl.includes('/endorse-reject') || cleanUrl.includes('/bplo-reject')) {
      const id = cleanUrl.split('/')[1];
      const stage = cleanUrl.includes('/bplo-reject') ? 'BPLO' : (cleanUrl.includes('/endorse-reject') ? 'ENDORSEMENT' : 'WORKFLOW');
      const remarks = config.params?.remarks || data?.remarks || 'Application rejected';
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'reject', stakeholderId: id, stage, remarks }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'Rejection failed');

      // Non-blocking notification dispatch so UI updates immediately
      void (async () => {
        try {
          const { sendApplicationProgressNotification } = await import('./emailNotificationService');
          await sendApplicationProgressNotification({
            stakeholderId: id,
            stage,
            status: 'REJECTED',
            title: `Application Disapproved at ${stage} Stage`,
            message: `Your application was disapproved during ${stage} review.`,
            remarks
          });
        } catch (_) {}
      })();

      return { data: res };
    }

    if (cleanUrl.includes('/treasurer-approve') || (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/approve'))) {
      const id = cleanUrl.split('/')[1];
      let res = null;
      try {
        const { data: invRes, error } = await supabase.functions.invoke('approval-workflow', {
          body: { action: 'treasurer-approve', stakeholderId: id, ...(data || {}) }
        });
        if (!error && invRes && !invRes.error) {
          res = invRes;
        }
      } catch (e) {
        console.warn('approval-workflow invoke notice:', e);
      }

      // Always update stakeholders table directly
      try {
        await supabase.from('stakeholders').update({
          treasurer_approved: true,
          advance_payment_paid: true,
          advance_payment_completed: true,
          application_status: 'PENDING_MARKET_SUPERVISOR_APPROVAL'
        }).eq('id', Number(id));
      } catch (sErr) {
        console.warn('Direct stakeholders update notice:', sErr);
      }

      try {
        const { data: st } = await supabase.from('stakeholders').select('user_id').eq('id', Number(id)).maybeSingle();
        if (st?.user_id) {
          await supabase.from('business_applications').update({
            advance_payment_paid: true,
            advance_payment_completed: true,
            application_status: 'PENDING_MARKET_SUPERVISOR_APPROVAL'
          }).eq('user_id', st.user_id);
        }
      } catch (_) {}

      // Non-blocking notification dispatch so UI updates immediately
      void (async () => {
        try {
          const { sendApplicationProgressNotification } = await import('./emailNotificationService');
          await sendApplicationProgressNotification({
            stakeholderId: id,
            stage: 'TREASURER',
            status: 'APPROVED',
            title: 'Treasurer Review Approved',
            message: 'Your application has been approved by the Municipal Treasurer and forwarded to the Market Supervisor.'
          });
        } catch (_) {}
      })();

      invalidateApiCache('stakeholders|payments|applications|stalls');
      return { data: res || { success: true, stakeholderId: id, status: 'APPROVED' } };
    }

    if (cleanUrl.includes('/endorse') || cleanUrl.includes('/final-endorse')) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'final-endorse', stakeholderId: id, ...(data || {}) }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'Endorsement failed');

      try {
        const { data: st } = await supabase.from('stakeholders').select('user_id').eq('id', id).maybeSingle();
        if (st?.user_id) {
          await supabase.from('business_applications').update({
            endorsement_status: 'APPROVED',
            endorsing_status: 'ENDORSED',
            final_status: 'APPROVED',
            application_status: 'PENDING_BUSINESS_PERMIT_PAYMENT'
          }).eq('user_id', st.user_id);
        }
      } catch (_) {}

      // Non-blocking notification dispatch
      void (async () => {
        try {
          const { sendApplicationProgressNotification } = await import('./emailNotificationService');
          await sendApplicationProgressNotification({
            stakeholderId: id,
            stage: 'ENDORSEMENT',
            status: 'APPROVED',
            title: 'Final Mayoral Endorsement Approved',
            message: 'Your application has received final executive endorsement. Please settle business permit fees with the Treasurer to commence operations.'
          });
        } catch (_) {}
      })();

      return { data: res };
    }

    if (cleanUrl.includes('/market-approve') || cleanUrl.includes('/supervisor-approve')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const { data: updated, error } = await supabase
        .from('stakeholders')
        .update({
          market_supervisor_approved: true,
          market_approval_status: 'APPROVED',
          application_status: 'PENDING_BPLO_APPROVAL'
        })
        .eq('id', stakeholderId)
        .select()
        .single();
      if (error) throw error;

      try {
        if (updated?.user_id) {
          await supabase.from('business_applications').update({
            market_approval_status: 'APPROVED',
            application_status: 'PENDING_BPLO_APPROVAL'
          }).eq('user_id', updated.user_id);
        }
      } catch (_) {}

      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('approval_history').insert({
          stakeholder_id: Number(stakeholderId),
          stage: 'MARKET_SUPERVISOR',
          status: 'APPROVED',
          approved_by: user?.id || null,
          remarks: data?.remarks || 'Market Supervisor approved application'
        });
        await supabase.from('notifications').insert({
          stakeholder_id: Number(stakeholderId),
          title: 'Market Supervisor Approved',
          message: 'Your application has been approved by the Market Supervisor and forwarded to BPLO.',
          priority: 'MEDIUM',
          notification_type: 'APPROVAL_UPDATE',
          related_record_type: 'STAKEHOLDER',
          related_record_id: Number(stakeholderId)
        });

        // Non-blocking notification dispatch so UI updates immediately
        void (async () => {
          try {
            const { sendApplicationProgressNotification } = await import('./emailNotificationService');
            await sendApplicationProgressNotification({
              stakeholderId: Number(stakeholderId),
              userId: updated?.user_id,
              email: updated?.email,
              stage: 'MARKET_SUPERVISOR',
              status: 'APPROVED',
              title: 'Market Supervisor Approval Granted',
              message: 'Your application has been approved by the Market Supervisor and forwarded to BPLO.'
            });
          } catch (_) {}
        })();
      } catch (_) {}

      return { data: normalizeRecord(updated) };
    }

    if (cleanUrl.includes('/bplo-approve')) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'bplo-approve', stakeholderId: id, ...(data || {}) }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'BPLO approval failed');
      return { data: res };
    }

    if (cleanUrl.includes('/assign-stall')) {
      const id = cleanUrl.split('/')[1];
      const targetStallId = data?.stallId || data?.stall_id;

      try {
        const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
          body: { action: 'assign-stall', stakeholderId: id, ...(data || {}) }
        });
        if (error || res?.error) throw new Error(error?.message || res?.error || 'Stall assignment edge function returned error');
      } catch (efErr) {
        console.warn('[api.put assign-stall] Edge function notice, ensuring direct DB state:', efErr);
      }

      // Direct DB state synchronization: activate occupant and link stall
      try {
        if (targetStallId) {
          let occupantId = null;
          const { data: existingOcc } = await supabase
            .from('occupants')
            .select('id')
            .eq('stakeholder_id', Number(id))
            .maybeSingle();

          if (existingOcc?.id) {
            occupantId = existingOcc.id;
            await supabase
              .from('occupants')
              .update({
                status: 'ACTIVE',
                stall_id: Number(targetStallId),
                is_archived: false,
                occupancy_date: new Date().toISOString().split('T')[0]
              })
              .eq('id', occupantId);
          } else {
            const { data: newOcc, error: newOccErr } = await supabase
              .from('occupants')
              .insert({
                stakeholder_id: Number(id),
                stall_id: Number(targetStallId),
                status: 'ACTIVE',
                occupancy_date: new Date().toISOString().split('T')[0],
                is_archived: false
              })
              .select('id')
              .single();

            if (!newOccErr && newOcc?.id) {
              occupantId = newOcc.id;
            }
          }

          if (occupantId) {
            await supabase
              .from('stalls')
              .update({ status: 'OCCUPIED', occupant_id: occupantId })
              .eq('id', Number(targetStallId));
          }

          await supabase
            .from('stakeholders')
            .update({
              selected_stall_id: Number(targetStallId),
              onboarding_status: 'STALL_ASSIGNED',
              market_approval_status: 'APPROVED',
              market_supervisor_approved: true
            })
            .eq('id', Number(id));

          // Non-blocking billing check and notification dispatch
          void (async () => {
            try {
              const { ensureBillingsForVerifiedTenants } = await import('./billingService');
              await ensureBillingsForVerifiedTenants();
            } catch (_) {}

            try {
              const { sendApplicationProgressNotification } = await import('./emailNotificationService');
              await sendApplicationProgressNotification({
                stakeholderId: id,
                stage: 'STALL_ASSIGNMENT',
                status: 'ASSIGNED',
                title: 'Market Stall Assignment Completed',
                message: 'Your stall assignment has been processed and forwarded to BPLO for verification.'
              });
            } catch (_) {}
          })();
        }
      } catch (dbErr) {
        console.warn('[api.put assign-stall] Direct sync error:', dbErr);
      }

      return { data: { success: true, stakeholderId: id, stallId: targetStallId } };
    }

    // 1.1 Occupants Vacate
    if (cleanUrl.startsWith('occupants/vacate/')) {
      const stallId = cleanUrl.replace('occupants/vacate/', '');
      try {
        const { data: st, error: stErr } = await supabase
          .from('stalls')
          .select('*, occupant:occupants(*)')
          .eq('id', Number(stallId))
          .single();

        if (stErr) throw stErr;

        if (st?.occupant_id) {
          await supabase
            .from('occupants')
            .update({ is_archived: true, status: 'VACATED' })
            .eq('id', st.occupant_id);
        }

        const { data: updatedStall, error: updStallErr } = await supabase
          .from('stalls')
          .update({
            status: 'AVAILABLE',
            occupant_id: null
          })
          .eq('id', Number(stallId))
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
          .single();

        if (updStallErr) throw updStallErr;
        invalidateApiCache('stalls|stakeholders|occupants|contracts|billings');
        return { data: normalizeRecord(updatedStall) };
      } catch (err) {
        console.warn('[api.put /occupants/vacate] Supabase error, falling back:', err);
        return rawAxios.put(url, data, config);
      }
    }

    // 2. Update stalls
    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const updatePayload = mapStallPayload(data);
      const { data: updated, error } = await supabase
        .from('stalls')
        .update(updatePayload)
        .eq('id', id)
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
        .single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 3. Update stall types
    if (cleanUrl.startsWith('stall-types/') || cleanUrl.startsWith('admin/stall-types/')) {
      const id = cleanUrl.split('/')[1];
      const { data: updated, error } = await supabase.from('stall_types').update(data).eq('id', id).select().single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 4. Update rental rates
    if (cleanUrl.startsWith('rental-rates/') || cleanUrl.startsWith('admin/rental-rates/')) {
      const id = cleanUrl.split('/')[1];
      const ratePayload = mapRentalRatePayload(data);
      const { data: updated, error } = await supabase.from('rental_rates').update(ratePayload).eq('id', id).select().single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 5. Mark notifications read
    if (cleanUrl.startsWith('notifications/') && cleanUrl.endsWith('/read')) {
      const id = cleanUrl.split('/')[1];
      const { data: updated, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select();
      if (error) throw error;
      return { data: updated };
    }

    // 6. Contracts update
    if (cleanUrl.startsWith('contracts/')) {
      const id = cleanUrl.replace('contracts/', '');
      const updatePayload = {};
      if (data.contractNo !== undefined || data.contract_no !== undefined) updatePayload.contract_no = data.contractNo || data.contract_no;
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.terms !== undefined) updatePayload.terms = data.terms;
      if (data.startDate !== undefined || data.start_date !== undefined) updatePayload.start_date = data.startDate || data.start_date;
      if (data.endDate !== undefined || data.end_date !== undefined) updatePayload.end_date = data.endDate || data.end_date;
      if (data.monthlyRent !== undefined || data.monthly_rent !== undefined) updatePayload.monthly_rent = data.monthlyRent ?? data.monthly_rent;
      if (data.billingFrequency !== undefined || data.billing_frequency !== undefined) updatePayload.billing_frequency = data.billingFrequency || data.billing_frequency;
      if (data.stallId !== undefined || data.stall_id !== undefined) updatePayload.stall_id = data.stallId ?? data.stall_id;
      if (data.occupantId !== undefined || data.occupant_id !== undefined) updatePayload.occupant_id = data.occupantId ?? data.occupant_id;

      try {
        const queryId = !isNaN(Number(id)) ? Number(id) : id;
        const { data: updated, error } = await supabase
          .from('contracts')
          .update(updatePayload)
          .eq('id', queryId)
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
          .single();
        if (error) throw error;

        const normalized = normalizeRecord(updated);

        // Keep localStorage contracts in sync
        try {
          const raw = localStorage.getItem('contracts');
          if (raw) {
            let localContracts = JSON.parse(raw);
            if (Array.isArray(localContracts)) {
              const idx = localContracts.findIndex(c => String(c.id) === String(id) || (data.contractNo && (c.contractNo === data.contractNo || c.contract_no === data.contractNo)));
              if (idx !== -1) {
                localContracts[idx] = { ...localContracts[idx], ...normalized };
              } else {
                localContracts.unshift(normalized);
              }
              localStorage.setItem('contracts', JSON.stringify(localContracts));
            }
          }
        } catch (_) {}

        return { data: normalized };
      } catch (putErr) {
        console.warn('[API] Contracts update warning:', putErr.message);
        const fallback = normalizeRecord({ id, ...updatePayload });

        try {
          const raw = localStorage.getItem('contracts');
          if (raw) {
            let localContracts = JSON.parse(raw);
            if (Array.isArray(localContracts)) {
              const idx = localContracts.findIndex(c => String(c.id) === String(id));
              if (idx !== -1) {
                localContracts[idx] = { ...localContracts[idx], ...fallback };
                localStorage.setItem('contracts', JSON.stringify(localContracts));
              }
            }
          }
        } catch (_) {}

        return { data: fallback };
      }
    }

    // 7. Billings update
    if (cleanUrl.startsWith('billings/')) {
      const id = cleanUrl.replace('billings/', '');
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const updatePayload = {};
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.totalAmount !== undefined || data.total_amount !== undefined) updatePayload.total_amount = Number(data.totalAmount ?? data.total_amount);
      if (data.paidAmount !== undefined || data.paid_amount !== undefined) updatePayload.paid_amount = Number(data.paidAmount ?? data.paid_amount);
      if (data.balance !== undefined) updatePayload.balance = Number(data.balance);
      if (data.dueDate !== undefined || data.due_date !== undefined) updatePayload.due_date = data.dueDate || data.due_date;
      if (data.billingPeriod !== undefined || data.billing_period !== undefined) updatePayload.billing_period = data.billingPeriod || data.billing_period;
      if (data.billingNo !== undefined || data.billing_no !== undefined) updatePayload.billing_no = data.billingNo || data.billing_no;

      const { data: updated, error } = await supabase
        .from('billings')
        .update(updatePayload)
        .eq('id', queryId)
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
        .single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    return rawAxios.put(url, data, config);
  },

  async delete(url, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');
    invalidateApiCache(cleanUrl.split('/')[0]);

    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const { data, error } = await supabase.from('stalls').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('stall-types/')) {
      const id = cleanUrl.replace('stall-types/', '');
      const { data, error } = await supabase.from('stall_types').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('rental-rates/')) {
      const id = cleanUrl.replace('rental-rates/', '');
      const { data, error } = await supabase.from('rental_rates').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('contracts/')) {
      const id = cleanUrl.replace('contracts/', '');
      const { data, error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('billings/')) {
      const id = cleanUrl.replace('billings/', '');
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const { data, error } = await supabase.from('billings').delete().eq('id', queryId);
      if (error) throw error;
      return { data };
    }

    return rawAxios.delete(url, config);
  }
};

export default api;
