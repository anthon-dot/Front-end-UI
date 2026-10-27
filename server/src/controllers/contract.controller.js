import { prepareContractForApplication, executeContract, recordContractSigning, verifyContractInitialPayments } from '../services/contractService.js';
import { supabase } from '../config/supabase.js';
import { ROLES } from '../config/constants.js';

export async function prepareContract(req, res, next) {
  try {
    const { applicationId, terms } = req.body;
    const contract = await prepareContractForApplication(applicationId, {
      supervisorId: req.user.id,
      terms
    });
    return res.status(201).json({
      success: true,
      message: 'Draft 5-year Contract of Lease prepared successfully in PENDING_EXECUTION status.',
      contract
    });
  } catch (err) {
    next(err);
  }
}

export async function recordSigning(req, res, next) {
  try {
    const { id } = req.params;
    const { signedDate, remarks } = req.body;
    const contract = await recordContractSigning(id, {
      userId: req.user.id,
      signedDate,
      remarks
    });
    return res.json({
      success: true,
      message: 'Contract physical signing recorded successfully.',
      contract
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyInitialPayments(req, res, next) {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const contract = await verifyContractInitialPayments(id, {
      userId: req.user.id,
      remarks
    });
    return res.json({
      success: true,
      message: 'Initial payments verified successfully.',
      contract
    });
  } catch (err) {
    next(err);
  }
}

export async function execute(req, res, next) {
  try {
    const { id } = req.params;
    const contract = await executeContract(id, {
      userId: req.user.id,
      supervisorName: req.user.profile?.full_name || 'Market Supervisor'
    });
    return res.json({
      success: true,
      message: 'Contract activated successfully.',
      contract
    });
  } catch (err) {
    next(err);
  }
}

export async function listContracts(req, res, next) {
  try {
    let query = supabase
      .from('contracts')
      .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
      .order('id', { ascending: false });

    // Vendors can only see their own contract
    if (req.user.role === ROLES.VENDOR || req.user.role === ROLES.APPLICANT) {
      query = query.eq('occupant.stakeholder.user_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, contracts: data || [] });
  } catch (err) {
    next(err);
  }
}

export async function getContractById(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('contracts')
      .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
      .eq('id', Number(id))
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Contract not found.' });
    return res.json({ success: true, contract: data });
  } catch (err) {
    next(err);
  }
}
