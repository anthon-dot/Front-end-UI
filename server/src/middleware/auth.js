import { supabase } from '../config/supabase.js';
import { ROLES } from '../config/constants.js';

/**
 * Authentication Middleware:
 * Validates Supabase JWT access tokens on the server.
 * Attaches verified user profile and assigned role to req.user.
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Missing or malformed authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Token is missing.'
      });
    }

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token.'
      });
    }

    // Retrieve corresponding user_profile to resolve role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Map role with robust legacy and fallback resolution
    let resolvedRole = (profile?.role || user.user_metadata?.role || 'APPLICANT').toUpperCase();
    if (resolvedRole === 'TREASURER' || resolvedRole === 'ROLE_TREASURER') resolvedRole = ROLES.TREASURER;
    if (resolvedRole === 'MARKET_SUPERVISOR' || resolvedRole === 'ROLE_MARKET_SUPERVISOR' || resolvedRole === 'SUPERVISOR') resolvedRole = ROLES.MARKET_SUPERVISOR;
    if (resolvedRole === 'MAYOR' || resolvedRole === 'ROLE_MAYOR') resolvedRole = ROLES.MAYOR;
    if (resolvedRole === 'BPLO' || resolvedRole === 'ROLE_BPLO' || resolvedRole === 'BPLO_OFFICE' || resolvedRole === 'BPLO_STAFF') resolvedRole = ROLES.BPLO;
    if (resolvedRole === 'ENDORSING' || resolvedRole === 'ROLE_ENDORSING' || resolvedRole === 'ENDORSING_OFFICE' || resolvedRole === 'ENDORSING_OFFICER') resolvedRole = ROLES.ENDORSING_OFFICE;
    if (resolvedRole === 'COLLECTOR') resolvedRole = ROLES.COLLECTOR;
    if (resolvedRole === 'INSPECTOR' || resolvedRole === 'COLLECTOR_INSPECTOR') resolvedRole = ROLES.COLLECTOR_INSPECTOR;
    if (resolvedRole === 'ADMIN' || resolvedRole === 'ROLE_ADMIN') resolvedRole = ROLES.ADMIN;
    if (resolvedRole === 'STAKEHOLDER' || resolvedRole === 'TENANT') resolvedRole = ROLES.VENDOR;

    req.user = {
      id: user.id,
      email: user.email,
      role: resolvedRole,
      profile: profile || { full_name: user.user_metadata?.name || user.email },
      token
    };

    next();
  } catch (err) {
    console.error('[auth.middleware] Unexpected authentication error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication verification.'
    });
  }
}
