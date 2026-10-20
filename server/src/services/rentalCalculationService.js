import { supabase } from '../config/supabase.js';

/**
 * Pure helper for calculating dynamic stall rates and required initial fees
 * Blueprint formula: Stall Rights Fee + Two (2) Months Advance Rent
 */
export function computeInitialFees({ monthlyRent = 1500, stallRightsFee = 5000, advanceMonths = 2, penaltyPercent = 0 } = {}) {
  const advanceRent = Number(monthlyRent) * Number(advanceMonths);
  const penaltyAmount = penaltyPercent > 0 ? (Number(monthlyRent) * (Number(penaltyPercent) / 100)) : 0;
  const totalInitialDue = Number(stallRightsFee) + advanceRent + penaltyAmount;

  return {
    advanceMonths: Number(advanceMonths),
    advanceRent,
    advanceRentAmount: advanceRent,
    stallRightsFee: Number(stallRightsFee),
    penaltyAmount,
    totalInitialDue,
    totalInitialAmount: totalInitialDue
  };
}

/**
 * Service for calculating dynamic stall rates and required initial fees
 * Supports stall ID lookup or direct stall object input.
 */
export async function calculateInitialFeesForStall(stallIdOrObj, customSettings = null) {
  let stall;
  let settings = customSettings;

  if (typeof stallIdOrObj === 'object' && stallIdOrObj !== null) {
    stall = stallIdOrObj;
  } else {
    // 1. Fetch stall details
    const { data, error: stallErr } = await supabase
      .from('stalls')
      .select('*, section:sections(*)')
      .eq('id', Number(stallIdOrObj))
      .single();

    if (stallErr || !data) {
      throw new Error(`Stall #${stallIdOrObj} not found for rental rate calculation.`);
    }
    stall = data;

    if (!settings) {
      const { data: s } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      settings = s;
    }
  }

  const isOldCategory = stall.rate_category === 'OLD' || stall.section?.rate_category === 'OLD';
  const defaultStallRights = isOldCategory
    ? Number(settings?.stall_rights_fee_old || 3000.00)
    : Number(settings?.stall_rights_fee_new || 5000.00);

  const stallRightsFee = Number(stall.stall_rights_fee || defaultStallRights);
  const monthlyRent = Number(stall.monthly_rent || 1500.00);
  const advanceMonths = Number(settings?.advance_rent_months || 2); // 2 months baseline

  const advanceRentAmount = monthlyRent * advanceMonths;
  const totalInitialAmount = stallRightsFee + advanceRentAmount;

  return {
    stallId: stall.id,
    stallNo: stall.stall_no,
    stallType: stall.stall_type,
    rateCategory: isOldCategory ? 'OLD' : 'NEW',
    areaSqm: Number(stall.area_sqm || 9.00),
    monthlyRent,
    advanceMonths,
    stallRightsFee,
    advanceRent: advanceRentAmount,
    advanceRentAmount,
    totalInitialDue: totalInitialAmount,
    totalInitialAmount
  };
}
