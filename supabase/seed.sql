-- ==============================================================================
-- SEED DATA: PUBLIC MARKET OF MANTICAO
-- ==============================================================================

-- 1. Initialize Market
INSERT INTO public.markets (id, code, name, municipality, description)
VALUES (1, 'MANTICAO_CENTRAL', 'Public Market of Manticao', 'Manticao, Misamis Oriental', 'Central Municipal Public Market of Manticao')
ON CONFLICT (id) DO NOTHING;

-- 2. Initialize Market Sections
INSERT INTO public.sections (id, market_id, code, name, description, rate_category)
VALUES 
    (1, 1, 'SEC_WET', 'Wet Section (Fish & Meat)', 'Fresh seafood, pork, beef, and poultry stalls', 'NEW'),
    (2, 1, 'SEC_DRY', 'Dry Goods & Groceries', 'General merchandise, grains, canned goods, and textiles', 'OLD'),
    (3, 1, 'SEC_FOOD', 'Food Court & Eatery', 'Cooked meals, snacks, refreshments, and dining areas', 'NEW'),
    (4, 1, 'SEC_VEG', 'Vegetables & Fruits', 'Fresh agricultural produce and farm goods', 'OLD'),
    (5, 1, 'SEC_COMM', 'Commercial Perimeter Block', 'High-traffic road frontage stalls', 'NEW')
ON CONFLICT (id) DO NOTHING;

-- 3. Initialize Rental Rates
INSERT INTO public.rental_rates (id, section_id, stall_type, rate_category, base_monthly_rate, rate_per_sqm, stall_rights_fee, advance_months)
VALUES
    (1, 1, 'Wet Section Stall', 'NEW', 3500.00, 388.88, 5000.00, 2),
    (2, 2, 'Dry Goods Stall', 'OLD', 2000.00, 222.22, 3000.00, 2),
    (3, 3, 'Food Court Eatery', 'NEW', 4000.00, 444.44, 5000.00, 2),
    (4, 4, 'Vegetable & Fruit Stall', 'OLD', 1500.00, 166.66, 3000.00, 2),
    (5, 5, 'Commercial Perimeter Stall', 'NEW', 5000.00, 555.55, 6000.00, 2)
ON CONFLICT (id) DO NOTHING;

-- 4. Initialize Stalls with Visual Map Placement Coordinates
INSERT INTO public.stalls (id, market_id, section_id, stall_no, stall_type, rate_category, dimensions, area_sqm, monthly_rent, stall_rights_fee, status, map_coordinates)
VALUES
    (1, 1, 1, 'WS-01', 'Wet Section Stall', 'NEW', '3m x 3m', 9.00, 3500.00, 5000.00, 'AVAILABLE', '{"x": 120, "y": 80, "lat": 8.5291, "lng": 124.2882}'),
    (2, 1, 1, 'WS-02', 'Wet Section Stall', 'NEW', '3m x 3m', 9.00, 3500.00, 5000.00, 'AVAILABLE', '{"x": 180, "y": 80, "lat": 8.5292, "lng": 124.2883}'),
    (3, 1, 2, 'DG-01', 'Dry Goods Stall', 'OLD', '3m x 3m', 9.00, 2000.00, 3000.00, 'AVAILABLE', '{"x": 120, "y": 180, "lat": 8.5293, "lng": 124.2884}'),
    (4, 1, 2, 'DG-02', 'Dry Goods Stall', 'OLD', '3m x 3m', 9.00, 2000.00, 3000.00, 'AVAILABLE', '{"x": 180, "y": 180, "lat": 8.5294, "lng": 124.2885}'),
    (5, 1, 3, 'FC-01', 'Food Court Eatery', 'NEW', '4m x 3m', 12.00, 4000.00, 5000.00, 'AVAILABLE', '{"x": 280, "y": 100, "lat": 8.5295, "lng": 124.2886}'),
    (6, 1, 4, 'VG-01', 'Vegetable & Fruit Stall', 'OLD', '3m x 2m', 6.00, 1500.00, 3000.00, 'AVAILABLE', '{"x": 120, "y": 280, "lat": 8.5296, "lng": 124.2887}'),
    (7, 1, 5, 'CP-01', 'Commercial Perimeter Stall', 'NEW', '4m x 4m', 16.00, 5000.00, 6000.00, 'AVAILABLE', '{"x": 380, "y": 150, "lat": 8.5297, "lng": 124.2888}')
ON CONFLICT (id) DO NOTHING;

-- 5. System Settings Baseline
UPDATE public.system_settings
SET 
    system_name = 'Public Market of Manticao Rental Management System',
    municipality = 'Manticao, Misamis Oriental',
    office_name = 'Office of the Market Supervisor',
    treasury_office = 'Municipal Treasury Office',
    stall_rights_fee_old = 3000.00,
    stall_rights_fee_new = 5000.00,
    advance_rent_months = 2,
    delinquency_grace_period_days = 60,
    auto_generate_billing = TRUE
WHERE id = 1;
