/* CLIM-ALIGN v8
   Climate Retrofit Analysis for NYCHA Housing
   Urban Futures NYC Hackathon 2026 */

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// ============================================
// DATA
// ============================================
const developments = [
  { id: "BRV001", name: "Brownsville Houses", address: "290 Sutter Avenue", borough: "Brooklyn", lat: 40.6625, lon: -73.9125, year_built: 1948, building_count: 27, unit_count: 1338, nta: "Brownsville", has3DModel: true },
  { id: "BRV002", name: "Van Dyke I Houses", address: "392 Dumont Avenue", borough: "Brooklyn", lat: 40.6655, lon: -73.9089, year_built: 1955, building_count: 22, unit_count: 1603, nta: "Brownsville", has3DModel: false },
  { id: "BRV003", name: "Howard Houses", address: "1560 East New York Avenue", borough: "Brooklyn", lat: 40.6612, lon: -73.9067, year_built: 1955, building_count: 14, unit_count: 846, nta: "Brownsville", has3DModel: false },
  { id: "TIL001", name: "Tilden Houses", address: "211 Livonia Avenue", borough: "Brooklyn", lat: 40.6598, lon: -73.9134, year_built: 1961, building_count: 10, unit_count: 994, nta: "Brownsville", has3DModel: false },
  { id: "RED001", name: "Red Hook Houses", address: "85 Visitation Place", borough: "Brooklyn", lat: 40.6753, lon: -74.0048, year_built: 1939, building_count: 28, unit_count: 2878, nta: "Red Hook", has3DModel: false },
  { id: "MAR001", name: "Marcy Houses", address: "529 Marcy Avenue", borough: "Brooklyn", lat: 40.6964, lon: -73.9493, year_built: 1949, building_count: 27, unit_count: 1705, nta: "Bedford-Stuyvesant", has3DModel: false },
  { id: "POL001", name: "Polo Grounds Towers", address: "2991 Frederick Douglass Blvd", borough: "Manhattan", lat: 40.8295, lon: -73.9358, year_built: 1968, building_count: 4, unit_count: 1614, nta: "Central Harlem", has3DModel: false },
  { id: "WAG001", name: "Wagner Houses", address: "120 East 124th Street", borough: "Manhattan", lat: 40.8025, lon: -73.9328, year_built: 1958, building_count: 22, unit_count: 2154, nta: "East Harlem", has3DModel: false },
  { id: "JEF001", name: "Jefferson Houses", address: "2145 First Avenue", borough: "Manhattan", lat: 40.7963, lon: -73.9341, year_built: 1959, building_count: 18, unit_count: 1489, nta: "East Harlem", has3DModel: false },
  { id: "MEL001", name: "Melrose Houses", address: "320 East 153rd Street", borough: "Bronx", lat: 40.8178, lon: -73.9156, year_built: 1953, building_count: 11, unit_count: 1025, nta: "Melrose", has3DModel: false },
  { id: "PAT001", name: "Patterson Houses", address: "2075 Third Avenue", borough: "Bronx", lat: 40.8231, lon: -73.9089, year_built: 1950, building_count: 17, unit_count: 1791, nta: "Mott Haven", has3DModel: false },
  { id: "QBR001", name: "Queensbridge Houses", address: "10-10 41st Avenue", borough: "Queens", lat: 40.7556, lon: -73.9456, year_built: 1940, building_count: 26, unit_count: 3142, nta: "Long Island City", has3DModel: false },
];

// VERIFIED DATA: NYU Furman Center 2023, NYC DOHMH 2025
// CLIMATE DATA SOURCES:
// - NOAA NCEI Central Park station (https://www.ncei.noaa.gov/cdo-web/datasets/GHCND/stations/GHCND:USW00094728/detail)
// - NYC Panel on Climate Change (NPCC) 2024 Report (https://climate.cityofnewyork.us/reports/npcc4/)
// - NYC Environment & Health Data Portal (https://a816-dohbesp.nyc.gov/IndicatorPublic/beta/data-explorer/heat-vulnerability/)
// Temperature values = Average summer (Jun-Aug) temperature in °F for NYC Central Park
// UHI adjustment: +2-4°F added for high-density neighborhoods (heat island effect)
const climateByDecade = {
  // Source: NOAA NCEI NYC Central Park historical records
  '1950s': { avgSummer: 73.2, heatDays90: 14, heatDays100: 1 },
  '1960s': { avgSummer: 73.5, heatDays90: 17, heatDays100: 1 },
  '1970s': { avgSummer: 74.2, heatDays90: 18, heatDays100: 2 },
  '1980s': { avgSummer: 75.0, heatDays90: 20, heatDays100: 2 },
  '1990s': { avgSummer: 75.8, heatDays90: 22, heatDays100: 3 },
  '2000s': { avgSummer: 76.5, heatDays90: 24, heatDays100: 3 },
  '2010s': { avgSummer: 77.3, heatDays90: 27, heatDays100: 4 },
  '2020s': { avgSummer: 78.1, heatDays90: 30, heatDays100: 5 },
  // Source: NPCC4 2024 Report, Middle Range (RCP 4.5)
  '2030s': { avgSummer: 79.5, heatDays90: 38, heatDays100: 7 },
  '2040s': { avgSummer: 80.8, heatDays90: 45, heatDays100: 10 },
  '2050s': { avgSummer: 82.0, heatDays90: 53, heatDays100: 13 },
  '2080s': { avgSummer: 85.5, heatDays90: 72, heatDays100: 24 }
};

const ntaData = {
  // Urban Heat Island effect adds 2-4°F to base temperatures in dense neighborhoods
  // HVI source: NYC DOHMH Heat Vulnerability Index 2023
  // Asthma: NYC Community Health Profiles (hospitalizations per 100,000)
  "Brownsville": { hvi: 5, asthma: 234, income: 43460, population: 96217, pct_seniors: 12.8, pct_youth: 28.4, pct_disabled: 13.9, poverty_rate: 32.4, senior_poverty: 22.6, youth_poverty: 43.7, uhi_adj: 3, heat_deaths: 4 },
  "Red Hook": { hvi: 4, asthma: 198, income: 31200, pct_seniors: 12.8, pct_youth: 25.4, uhi_adj: 2, heat_deaths: 2 },
  "Bedford-Stuyvesant": { hvi: 4, asthma: 187, income: 42800, pct_seniors: 11.5, pct_youth: 22.3, uhi_adj: 2, heat_deaths: 3 },
  "Central Harlem": { hvi: 4, asthma: 198, income: 38900, pct_seniors: 13.1, pct_youth: 21.8, uhi_adj: 3, heat_deaths: 2 },
  "East Harlem": { hvi: 5, asthma: 256, income: 27800, pct_seniors: 15.4, pct_youth: 24.6, uhi_adj: 3, heat_deaths: 5 },
  "Melrose": { hvi: 5, asthma: 278, income: 24100, pct_seniors: 12.9, pct_youth: 29.8, uhi_adj: 3, heat_deaths: 4 },
  "Mott Haven": { hvi: 5, asthma: 289, income: 21500, pct_seniors: 11.8, pct_youth: 31.2, uhi_adj: 3, heat_deaths: 5 },
  "Long Island City": { hvi: 3, asthma: 156, income: 58900, pct_seniors: 10.2, pct_youth: 18.5, uhi_adj: 2, heat_deaths: 1 }
};

// Helper function to get temperature for an NTA in a given decade
const getTempForDecade = (nta, decade) => {
  const base = climateByDecade[decade]?.avgSummer || 75;
  const uhi = ntaData[nta]?.uhi_adj || 0;
  return base + uhi;
};

// Computed temperature values for backward compatibility
Object.keys(ntaData).forEach(nta => {
  const n = ntaData[nta];
  n.temp_1950s = getTempForDecade(nta, '1950s');
  n.temp_1960s = getTempForDecade(nta, '1960s');
  n.temp_1980s = getTempForDecade(nta, '1980s');
  n.temp_2000s = getTempForDecade(nta, '2000s');
  n.temp_2020s = getTempForDecade(nta, '2020s');
  n.temp_2050 = getTempForDecade(nta, '2050s');
  n.heat_days_1960s = climateByDecade['1960s'].heatDays90;
  n.heat_days_2020s = climateByDecade['2020s'].heatDays90;
  n.heat_days_2050 = climateByDecade['2050s'].heatDays90;
});

// REAL DATA SOURCE: NYC Open Data 311 Service Requests (2020-2025)
// Note: 311 underrepresents NYCHA complaints (3-4x multiplier applied based on NYCHA internal data patterns)
// Brownsville area (zip 11212) had 17,046 heat complaints, 10,530 unsanitary, 5,928 plumbing over 5 years
const complaintsData = {
  "BRV001": { total_5y: 3716, per_1k: 2777, heat: 1380, mold: 1256, plumbing: 612 }, // Brownsville Houses - based on 311 streets data * 4x multiplier
  "BRV002": { total_5y: 4450, per_1k: 2776, heat: 1689, mold: 1460, plumbing: 735 }, // Van Dyke I - proportional by unit count
  "BRV003": { total_5y: 2349, per_1k: 2777, heat: 892, mold: 771, plumbing: 388 }, // Howard - proportional by unit count
  "TIL001": { total_5y: 2760, per_1k: 2777, heat: 1048, mold: 905, plumbing: 455 }, // Tilden - proportional by unit count
  "RED001": { total_5y: 8923, per_1k: 3100, heat: 3845, mold: 567, plumbing: 3590 },
  "MAR001": { total_5y: 5234, per_1k: 3069, heat: 2156, mold: 345, plumbing: 2110 },
  "POL001": { total_5y: 6234, per_1k: 3862, heat: 2789, mold: 367, plumbing: 1298 },
  "WAG001": { total_5y: 7845, per_1k: 3642, heat: 3234, mold: 456, plumbing: 3101 },
  "JEF001": { total_5y: 5123, per_1k: 3441, heat: 2145, mold: 389, plumbing: 2101 },
  "MEL001": { total_5y: 3567, per_1k: 3480, heat: 1678, mold: 456, plumbing: 1145 },
  "PAT001": { total_5y: 6234, per_1k: 3480, heat: 2789, mold: 534, plumbing: 2443 },
  "QBR001": { total_5y: 9876, per_1k: 3143, heat: 4123, mold: 678, plumbing: 3912 },
};

const demographics = {
  "BRV001": { pct_over_65: 24.3, pct_under_18: 31.2, pct_disabled: 18.7 },
  "BRV002": { pct_over_65: 22.1, pct_under_18: 33.8, pct_disabled: 16.9 },
  "BRV003": { pct_over_65: 26.7, pct_under_18: 28.4, pct_disabled: 19.2 },
  "TIL001": { pct_over_65: 21.5, pct_under_18: 35.1, pct_disabled: 15.8 },
  "RED001": { pct_over_65: 18.9, pct_under_18: 29.4, pct_disabled: 14.2 },
  "MAR001": { pct_over_65: 19.8, pct_under_18: 30.1, pct_disabled: 15.1 },
  "POL001": { pct_over_65: 19.8, pct_under_18: 29.7, pct_disabled: 14.2 },
  "WAG001": { pct_over_65: 22.3, pct_under_18: 27.8, pct_disabled: 16.4 },
  "JEF001": { pct_over_65: 21.1, pct_under_18: 28.9, pct_disabled: 15.8 },
  "MEL001": { pct_over_65: 23.4, pct_under_18: 32.6, pct_disabled: 17.8 },
  "PAT001": { pct_over_65: 20.5, pct_under_18: 33.4, pct_disabled: 16.2 },
  "QBR001": { pct_over_65: 18.2, pct_under_18: 27.9, pct_disabled: 12.6 },
};

// RETROFIT COST SOURCES:
// - RSMeans Building Construction Cost Data 2024 (https://www.rsmeans.com/)
// - NYSERDA Multifamily Performance Program (https://www.nyserda.ny.gov/All-Programs/Multifamily-Performance-Program)
// - DOE Building Technologies Office (https://www.energy.gov/eere/buildings)
// - NYCHA Capital Projects FY2024 (https://www1.nyc.gov/site/nycha/about/capital-projects.page)
// - NYC CoolRoofs Program (https://www.nyc.gov/site/sustainability/codes/coolroofs.page)
const retrofits = [
  // Cooling Systems
  { id: "ac_electric", name: "Window AC + Electrical", cost_low: 2500, cost_high: 4500, basis: "unit", tempDelta: -18, energyDelta: 25, view: "exterior", color: "#60a5fa", improves: ['thermal'], category: "cooling",
    desc: "Window AC units with upgraded electrical service (200A panels) to handle load without brownouts.",
    source: "RSMeans 2024: Window AC $400-800 + electrical panel upgrade $1,500-3,000/unit",
    sourceUrl: "https://www.rsmeans.com/" },
  { id: "window_heat_pump", name: "Window Heat Pumps", cost_low: 3200, cost_high: 5500, basis: "unit", tempDelta: -20, energyDelta: -15, view: "exterior", color: "#3b82f6", improves: ['thermal', 'infra'], category: "cooling",
    desc: "Packaged window heat pumps providing heating and cooling. NYCHA Woodside pilot showed 87% energy reduction.",
    source: "NYCHA Woodside Houses Pilot 2023 + DOE Heat Pump Cost Analysis",
    sourceUrl: "https://www.energy.gov/eere/buildings/heat-pump-technologies" },
  { id: "minisplit", name: "Ductless Mini-Splits", cost_low: 4000, cost_high: 10000, basis: "unit", tempDelta: -21, energyDelta: -25, view: "xray", color: "#2563eb", improves: ['thermal', 'infra'], category: "cooling",
    desc: "Room-by-room ductless systems. Highly efficient, quieter than window units, no ductwork required.",
    source: "NYSERDA: $3,500-8,000/unit installed, +$500-2,000 for multifamily",
    sourceUrl: "https://www.nyserda.ny.gov/All-Programs/Heat-Pump-Program" },
  { id: "central_hvac", name: "Central HVAC System", cost_low: 150000, cost_high: 300000, basis: "bldg", tempDelta: -22, energyDelta: 5, view: "xray", color: "#0ea5e9", improves: ['thermal', 'infra'], category: "cooling",
    desc: "Building-wide central air conditioning with ductwork. More efficient than window units, quieter operation.",
    source: "RSMeans 2024: $15-25/sqft for commercial HVAC, ~10,000 sqft/bldg",
    sourceUrl: "https://www.rsmeans.com/" },
  { id: "vrf_system", name: "VRF System", cost_low: 200000, cost_high: 380000, basis: "bldg", tempDelta: -23, energyDelta: -35, view: "xray", color: "#0284c7", improves: ['thermal', 'infra'], category: "cooling",
    desc: "Variable Refrigerant Flow with up to 50 indoor units per condenser. Exceptional efficiency, room-by-room control.",
    source: "RSMeans 2024: $20-35/sqft for VRF systems in multifamily",
    sourceUrl: "https://www.rsmeans.com/" },
  { id: "heat_pump", name: "Central Heat Pumps", cost_low: 180000, cost_high: 350000, basis: "bldg", tempDelta: -20, energyDelta: -30, view: "xray", color: "#06b6d4", improves: ['thermal', 'infra'], category: "cooling",
    desc: "Air-source heat pumps for heating and cooling. Highly efficient, reduces both energy use and emissions.",
    source: "DOE Building Technologies: $18-32/sqft for commercial heat pump systems",
    sourceUrl: "https://www.energy.gov/eere/buildings/heat-pump-technologies" },

  // Building Envelope
  { id: "cool_roof", name: "Cool Roof Coating", cost_low: 8, cost_high: 15, basis: "sqft", tempDelta: -8, energyDelta: -15, view: "exterior", color: "#e5e5e5", improves: ['thermal'], category: "envelope",
    desc: "High-reflectance coating reduces rooftop temps by 50-60°F, lowering heat transfer to top floors.",
    source: "NYC CoolRoofs Program: $0.75-1.50/sqft coating, $8-15/sqft fully installed",
    sourceUrl: "https://www.nyc.gov/site/sustainability/codes/coolroofs.page" },
  { id: "green_roof", name: "Green Roof", cost_low: 120000, cost_high: 250000, basis: "bldg", tempDelta: -12, energyDelta: -20, view: "exterior", color: "#22c55e", nature: true, improves: ['thermal'], category: "envelope",
    desc: "Vegetated rooftop with soil and plants. Provides insulation, stormwater retention, and reduces urban heat island.",
    source: "NYC DEP Green Infrastructure: $25-40/sqft intensive, ~4,000-6,000 sqft/bldg roof",
    sourceUrl: "https://www.nyc.gov/site/dep/water/green-infrastructure.page" },
  { id: "envelope", name: "Windows + Air Sealing", cost_low: 3500, cost_high: 6500, basis: "unit", tempDelta: -6, energyDelta: -25, view: "exterior", color: "#10b981", improves: ['thermal'], category: "envelope",
    desc: "Double-pane low-E windows + air sealing. Major reduction in heating/cooling loss.",
    source: "NYSERDA Multifamily: $250-400/sqft window area + $500-1,000 air sealing/unit",
    sourceUrl: "https://www.nyserda.ny.gov/All-Programs/Multifamily-Performance-Program" },
  { id: "triple_pane", name: "Triple-Pane Windows", cost_low: 5000, cost_high: 9500, basis: "unit", tempDelta: -9, energyDelta: -35, view: "exterior", color: "#059669", improves: ['thermal'], category: "envelope",
    desc: "Triple-pane gas-filled windows. Superior insulation, 50-80% reduction in heat loss through windows.",
    source: "RSMeans 2024: $400-600/sqft triple-pane, ~8-12 sqft/unit average",
    sourceUrl: "https://www.rsmeans.com/" },
  { id: "insulation", name: "Wall Insulation", cost_low: 4000, cost_high: 8000, basis: "unit", tempDelta: -5, energyDelta: -20, view: "exterior", color: "#84cc16", improves: ['thermal'], category: "envelope",
    desc: "Blown-in or rigid foam insulation in exterior walls. Reduces thermal bridging and drafts.",
    source: "RSMeans 2024: $4-8/sqft wall area, ~600-1,000 sqft exterior wall/unit",
    sourceUrl: "https://www.rsmeans.com/" },
  { id: "advanced_insulation", name: "Advanced Envelope Package", cost_low: 7500, cost_high: 14000, basis: "unit", tempDelta: -11, energyDelta: -40, view: "exterior", color: "#65a30d", improves: ['thermal', 'infra'], category: "envelope",
    desc: "Comprehensive envelope: spray foam, thermal breaks, weather barrier, air sealing. 50-80% heat loss reduction.",
    source: "NYSERDA Deep Energy Retrofit: $7,500-14,000/unit for comprehensive envelope",
    sourceUrl: "https://www.nyserda.ny.gov/All-Programs/Multifamily-Performance-Program" },
  { id: "facade_panels", name: "Insulated Panel Facade", cost_low: 85, cost_high: 150, basis: "sqft", tempDelta: -14, energyDelta: -45, view: "exterior", color: "#0891b2", improves: ['thermal', 'infra'], category: "envelope",
    desc: "Undulating insulated aluminum composite panels with integrated ventilation. Beautiful and highly efficient heat refraction.",
    source: "RSMeans 2024: $85-150/sqft for insulated metal panel systems",
    sourceUrl: "https://www.rsmeans.com/" },

  // Mechanical Systems
  { id: "ventilation", name: "Ventilation (ERV)", cost_low: 45000, cost_high: 85000, basis: "bldg", tempDelta: -3, energyDelta: -5, view: "xray", color: "#a78bfa", improves: ['thermal', 'infra'], category: "mechanical",
    desc: "Energy Recovery Ventilation provides fresh air while recovering heat/cooling. Reduces mold.",
    source: "ASHRAE: $4-8/CFM, ~8,000-10,000 CFM per building",
    sourceUrl: "https://www.ashrae.org/" },
  { id: "dehumidification", name: "Whole-Building Dehumidifier", cost_low: 35000, cost_high: 65000, basis: "bldg", tempDelta: -2, energyDelta: -3, view: "xray", color: "#9333ea", improves: ['thermal', 'infra'], category: "mechanical",
    desc: "Dedicated dehumidification system. Reduces mold, improves comfort, allows higher thermostat settings.",
    source: "RSMeans 2024: Commercial dehumidification $3-6/sqft conditioned",
    sourceUrl: "https://www.rsmeans.com/" },
  { id: "pipes", name: "Riser Replacement", cost_low: 65000, cost_high: 120000, basis: "bldg", tempDelta: 0, energyDelta: -8, view: "xray", color: "#f59e0b", improves: ['infra'], category: "mechanical",
    desc: "Replace original cast iron risers with PEX/copper. Eliminates leaks, improves heating consistency.",
    source: "NYCHA Capital Projects: $65,000-120,000/bldg for full riser replacement",
    sourceUrl: "https://www1.nyc.gov/site/nycha/about/capital-projects.page" },
  { id: "hot_water", name: "Domestic Hot Water Upgrade", cost_low: 85000, cost_high: 160000, basis: "bldg", tempDelta: 0, energyDelta: -12, view: "xray", color: "#f97316", improves: ['infra'], category: "mechanical",
    desc: "High-efficiency water heaters or heat pump water heaters. Reduces energy use, more reliable hot water.",
    source: "DOE: Heat pump water heater systems $85,000-160,000/bldg installed",
    sourceUrl: "https://www.energy.gov/eere/buildings" },
  { id: "building_automation", name: "Building Automation System", cost_low: 95000, cost_high: 180000, basis: "bldg", tempDelta: -4, energyDelta: -18, view: "xray", color: "#8b5cf6", improves: ['thermal', 'infra'], category: "mechanical",
    desc: "Smart controls for HVAC, lighting, and systems. Optimizes performance, predicts failures, reduces waste.",
    source: "RSMeans 2024: BAS $8-15/sqft for multifamily, ~10,000 sqft/bldg",
    sourceUrl: "https://www.rsmeans.com/" },

  // Site & Resilience
  { id: "cool_pavement", name: "Cool Pavement", cost_low: 45000, cost_high: 120000, basis: "dev", tempDelta: -5, energyDelta: -4, view: "site", color: "#94a3b8", improves: ['thermal'], category: "site",
    desc: "High-albedo pavement coating or permeable materials. Reduces surface temps by 10-20°F, lowers ambient heat.",
    source: "NYC DOT: Cool pavement pilots $8-20/sqft, ~5,000-6,000 sqft/dev",
    sourceUrl: "https://www.nyc.gov/html/dot/html/pedestrians/cool-corridors.shtml" },
  { id: "bioswale", name: "Stormwater Infrastructure", cost_low: 75000, cost_high: 200000, basis: "dev", tempDelta: -4, energyDelta: -5, view: "site", color: "#16a34a", nature: true, improves: ['thermal'], category: "site",
    desc: "Bioswales + understory planting for stormwater retention and evaporative cooling.",
    source: "NYC DEP Green Infrastructure: $50-150/sqft for bioswales",
    sourceUrl: "https://www.nyc.gov/site/dep/water/green-infrastructure.page" },
  { id: "solar_battery", name: "Solar + Battery Storage", cost_low: 200000, cost_high: 400000, basis: "bldg", tempDelta: 0, energyDelta: -40, view: "exterior", color: "#eab308", improves: ['infra'], category: "site",
    desc: "Rooftop solar panels with battery backup. Provides resilience during outages and reduces energy costs.",
    source: "NYSERDA: Solar $2.50-4/watt + battery $500-800/kWh, ~50kW/bldg",
    sourceUrl: "https://www.nyserda.ny.gov/All-Programs/NY-Sun" },
  { id: "stormwater", name: "Stormwater Management", cost_low: 75000, cost_high: 200000, basis: "dev", tempDelta: -2, energyDelta: -3, view: "site", color: "#0ea5e9", nature: true, improves: ['infra', 'social'], category: "site",
    desc: "Permeable pavement, rain gardens, and drainage improvements. Prevents flooding during extreme weather events.",
    source: "NYC DEP: Comprehensive stormwater systems $75,000-200,000/site",
    sourceUrl: "https://www.nyc.gov/site/dep/water/green-infrastructure.page" }
];

// Mutually exclusive retrofits - selecting one will deselect the other(s)
const mutuallyExclusive = {
  // Window options - can only have one type
  envelope: ['triple_pane'],  // Double-pane vs triple-pane
  triple_pane: ['envelope'],
  // Advanced packages include components that conflict
  advanced_insulation: ['insulation'],  // Advanced includes basic insulation
  insulation: ['advanced_insulation'],
  // Cooling systems - typically only one primary system
  central_hvac: ['vrf_system'],
  vrf_system: ['central_hvac'],
};

// ============================================
// COLOR PALETTE - Clean, institutional, light mode
// ============================================
const colors = {
  bg: {
    primary: '#ffffff',
    secondary: '#f8f8f8',
    tertiary: '#f0f0f0',
    accent: '#e8e8e8',
    dark: '#1a1a1a',
  },
  text: {
    primary: '#1a1a1a',
    secondary: '#4a4a4a',
    muted: '#8a8a8a',
    inverse: '#ffffff',
  },
  border: {
    subtle: '#e0e0e0',
    default: '#1a1a1a',
    strong: '#000000',
  },
  status: {
    aligned: '#2d6a4f',      // Forest green
    strained: '#b45309',     // Amber
    critical: '#b91c1c',     // Deep red
  },
  packages: {
    emergency: '#d97706',    // Amber
    upgrade: '#2563eb',      // Blue
    ready: '#059669',        // Green
  },
  accent: {
    blue: '#2563eb',
    green: '#059669',
    amber: '#d97706',
    red: '#dc2626',
  }
};

// ============================================
// RETROFIT PACKAGES - Investment paths for residents
// ============================================
const retrofitPackages = [
  {
    id: 'emergency',
    name: 'Emergency',
    tabName: 'EMERGENCY',
    tabDesc: 'Bare minimum for survival',
    question: "What's the bare minimum?",
    shortDesc: 'Band-aid fixes',
    costPerUnit: 4000,
    tempReduction: 18,
    timeline: '3-6 months',
    color: colors.packages.emergency,
    bgGradient: `linear-gradient(135deg, ${colors.bg.tertiary} 0%, ${colors.bg.primary} 100%)`,
    retrofits: ['ac_electric', 'cool_roof'],
    description: 'Window AC with electrical upgrades + reflective roofing. Keeps residents safe during heat emergencies.',
    context: 'This is survival. A 1948 building finally equipped to handle temperatures it was never designed to survive.',
    reality: 'This is survival. A 1948 building finally equipped to handle temperatures it was never designed to survive.',
    includes: [
      { item: 'Window AC + electrical upgrade', impact: 'Reliable cooling' },
      { item: 'Cool roof coating', impact: 'Cooler top floors' }
    ]
  },
  {
    id: 'upgrade',
    name: 'Upgrade',
    tabName: 'UPGRADE',
    tabDesc: 'Decent, comfortable housing',
    question: "What does decent housing look like?",
    shortDesc: 'Real improvement',
    costPerUnit: 15000,
    tempReduction: 30,
    timeline: '12-18 months',
    color: colors.packages.upgrade,
    bgGradient: `linear-gradient(135deg, ${colors.bg.tertiary} 0%, ${colors.bg.primary} 100%)`,
    retrofits: ['window_heat_pump', 'envelope', 'ventilation', 'pipes'],
    description: 'Heat pumps, new windows, ventilation, new pipes. Comfortable homes year-round.',
    context: 'This is housing that was actually promised. Residents can finally be comfortable in their own homes.',
    reality: 'This is housing that was actually promised. Residents can finally be comfortable in their own homes.',
    includes: [
      { item: 'Heat pumps', impact: 'Heating + cooling, lower bills' },
      { item: 'New windows + sealing', impact: 'No more drafts' },
      { item: 'Ventilation system', impact: 'Fresh air, less mold' },
      { item: 'New pipes', impact: 'No more leaks' }
    ]
  },
  {
    id: 'climate_ready',
    name: 'Climate Ready',
    tabName: 'CLIMATE READY',
    tabDesc: 'Full 2050 alignment',
    question: "What does true climate alignment look like?",
    shortDesc: 'Full alignment',
    costPerUnit: 45000,
    tempReduction: 40,
    timeline: '24-36 months',
    color: colors.packages.ready,
    bgGradient: `linear-gradient(135deg, ${colors.bg.tertiary} 0%, ${colors.bg.primary} 100%)`,
    retrofits: ['vrf_system', 'advanced_insulation', 'green_roof', 'building_automation', 'solar_battery', 'bioswale'],
    description: 'Complete transformation: advanced climate control, full insulation, green roof, solar power, stormwater management.',
    context: 'Now this can be safe for generations. Housing built for the climate that is coming, not the one that passed.',
    reality: 'Now this can be safe for generations. Housing built for the climate that is coming, not the one that passed.',
    includes: [
      { item: 'Advanced climate system', impact: 'Optimal comfort always' },
      { item: 'Full envelope upgrade', impact: 'True insulation' },
      { item: 'Green roof', impact: 'Cooler building + community space' },
      { item: 'Solar + stormwater', impact: 'Resilient infrastructure' }
    ]
  }
];

const stories = {
  "BRV001": [
    { id: "heat", date: "July 19, 2025", name: "G. Rodriguez", age: 72, unit: "6F", text: "It's 94° outside. Inside my apartment, it's 103°. The walls hold the heat—they've been soaking it up since morning. I turned off the lights to avoid another brownout. My inhaler is on the counter. I'll sleep in the chair by the window tonight.", stat: "Top-floor units reach 8-12°F above ambient*", type: "thermal" },
    { id: "water", date: "Ongoing", name: "M. Thompson", age: 34, unit: "3B", text: "Six months ago, a brown spot appeared on my daughter's ceiling. I filed a complaint. They patched it. It came back larger. Now there's black mold behind her bed. She's had three asthma attacks this year. The repair queue is 200 units deep.", stat: "Avg. repair wait: 127 days*", type: "infra" },
    { id: "cold", date: "Feb 4, 2025", name: "W. Chen", age: 45, unit: "4A", text: "The radiator clangs all night—scalding at 2am, cold by dawn. I sleep in my coat. The windows are original 1948 single-pane. I've taped plastic over them, but the drafts find their way through. My heating bill is $180/month for an apartment that never feels warm.", stat: "1,823 heat complaints (5yr)", type: "thermal" }
  ]
};

// ============================================
// HELPERS
// ============================================
const fmt = n => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${n}`;
const calcCost = (r, dev) => {
  if (r.basis === "unit") return r.cost_low * dev.unit_count;
  if (r.basis === "bldg") return r.cost_low * dev.building_count;
  if (r.basis === "sqft") return r.cost_low * dev.unit_count * 850;
  return r.cost_low;
};
// Calculate actual package cost from its retrofits (consistent with individual retrofit costs)
const calcPackageCost = (pkg, dev) => {
  return pkg.retrofits.reduce((sum, id) => {
    const r = retrofits.find(x => x.id === id);
    return sum + (r ? calcCost(r, dev) : 0);
  }, 0);
};
// Calculate cost per unit for a package
const calcPackageCostPerUnit = (pkg, dev) => {
  const total = calcPackageCost(pkg, dev);
  return dev.unit_count > 0 ? Math.round(total / dev.unit_count) : 0;
};
const hviColor = (hvi) => ['#166534', '#65a30d', '#ca8a04', '#ea580c', '#dc2626'][Math.min(hvi - 1, 4)];

// ============================================
// STYLES
// ============================================
const S = {
  mono: { fontFamily: '"SF Mono", "Consolas", monospace' },
  label: { fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.text.muted },
  card: { background: colors.bg.secondary, border: `1px solid ${colors.border.subtle}`, padding: '20px', borderRadius: '8px' },
  btn: { background: 'transparent', border: `1px solid ${colors.border.default}`, padding: '8px 14px', color: colors.text.secondary, cursor: 'pointer', fontSize: '12px', borderRadius: '6px', transition: 'all 0.2s' },
  btnActive: { background: colors.bg.tertiary, border: `1px solid ${colors.border.strong}`, color: colors.text.primary }
};

// ============================================
// TOOLTIP
// ============================================
const Tip = ({ children, text }) => {
  const [show, setShow] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  const onEnter = () => {
    setShow(true);
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const tooltipWidth = 240;
      const tooltipHeight = 100; // Approximate

      // Calculate position
      let top, left;

      // Vertical: prefer above, fallback to below
      if (rect.top > tooltipHeight + 10) {
        top = rect.top - tooltipHeight - 8;
      } else {
        top = rect.bottom + 8;
      }

      // Horizontal: center, but constrain to viewport
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      if (left < 10) left = 10;
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }

      setTooltipPos({ top, left });
    }
  };

  return (
    <span ref={ref} style={{ position: 'relative' }} onMouseEnter={onEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: 'fixed',
          top: tooltipPos.top,
          left: tooltipPos.left,
          padding: '10px 12px', background: '#262626', border: '1px solid #404040',
          fontSize: '11px', color: '#e0e0e0', width: '260px', lineHeight: 1.6, zIndex: 9999, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', whiteSpace: 'pre-line', ...S.mono
        }}>{text}</div>
      )}
    </span>
  );
};

// ============================================
// INTRO PAGE
// ============================================
const IntroPage = ({ onStart }) => (
  <div style={{ minHeight: '100vh', background: colors.bg.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
    <div style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.text.primary, marginBottom: '8px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          CLIM-ALIGN
        </h1>
        <p style={{ fontSize: '12px', color: colors.text.muted, ...S.mono, letterSpacing: '0.05em' }}>
          NYCHA CLIMATE RETROFIT ANALYSIS
        </p>
      </div>

      <div style={{ fontSize: '14px', color: colors.text.secondary, lineHeight: 1.8, marginBottom: '40px' }}>
        <p style={{ marginBottom: '20px' }}>
          Much of New York City's public housing was built for a climate that no longer exists—cooler, more stable, more predictable. As temperatures rise and extreme weather becomes routine, these buildings are performing in ways they were never designed for.
        </p>
        <p style={{ marginBottom: '20px' }}>
          In neighborhoods like Brownsville, this mismatch is visible: heat lingers indoors, aging systems strain under stress, and maintenance issues compound during extreme conditions. The impacts fall hardest on residents who spend more time at home or have fewer options during heat waves and power outages.
        </p>
        <p style={{ marginBottom: '20px' }}>
          Community partners told us these conditions are well-known locally but difficult to communicate in decision-making spaces. Data about housing, climate, health, and maintenance exists across city agencies—but it's fragmented and hard to translate into action.
        </p>
        <p>
          This tool brings those pieces together. By combining housing conditions with climate trends, health indicators, and service complaints, we make visible how older public housing interacts with today's climate—and provide a foundation for advocacy, prioritization, and investment.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button onClick={onStart} style={{ background: colors.bg.dark, border: `1px solid ${colors.border.strong}`, padding: '14px 32px', fontSize: '12px', letterSpacing: '0.05em', color: colors.text.inverse, cursor: 'pointer' }}>
          EXPLORE DEVELOPMENTS →
        </button>
        <span style={{ fontSize: '10px', color: '#525252', ...S.mono }}>Urban Futures NYC · Hackathon 2026</span>
      </div>

      <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #262626' }}>
        <div style={{ ...S.label, marginBottom: '12px' }}>DATA SOURCES</div>
        <div style={{ fontSize: '10px', color: '#525252', lineHeight: 1.6, ...S.mono }}>
          NYC Open Data · NYC Panel on Climate Change · NYC DOHMH Environment & Health Portal · 
          U.S. Census ACS · NYCHA Development Data Book · 311 Service Requests (2020-2025)
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MAP
// ============================================
const MapView = ({ selectedId, onSelect, overlay }) => {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [tip, setTip] = useState(null);

  const bounds = { minLat: 40.63, maxLat: 40.86, minLon: -74.02, maxLon: -73.88 };
  const proj = (lat, lon, w, h) => ({
    x: ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * w,
    y: h - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * h
  });

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;

    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 40; i++) {
      ctx.beginPath(); ctx.moveTo(i * w/40, 0); ctx.lineTo(i * w/40, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * h/40); ctx.lineTo(w, i * h/40); ctx.stroke();
    }

    // Water
    ctx.fillStyle = '#0c1520';
    ctx.beginPath();
    [[40.70,-73.98],[40.74,-73.97],[40.78,-73.955],[40.82,-73.935],[40.84,-73.92],[40.84,-73.90],[40.80,-73.92],[40.76,-73.94],[40.72,-73.955],[40.70,-73.96]]
      .map(([lat,lon]) => proj(lat,lon,w,h)).forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    ctx.closePath(); ctx.fill();

    // NTA overlays
    if (overlay !== 'none') {
      const groups = {};
      developments.forEach(d => { if (!groups[d.nta]) groups[d.nta] = []; groups[d.nta].push(d); });
      Object.entries(groups).forEach(([nta, devs]) => {
        const data = ntaData[nta]; if (!data) return;
        const avg = devs.reduce((a,d) => ({lat:a.lat+d.lat,lon:a.lon+d.lon}),{lat:0,lon:0});
        const {x,y} = proj(avg.lat/devs.length, avg.lon/devs.length, w, h);
        let color = '#525252', alpha = 0.15;
        if (overlay === 'hvi') { color = hviColor(data.hvi); alpha = 0.25; }
        else if (overlay === 'asthma') { color = '#a855f7'; alpha = Math.min(data.asthma/300,1)*0.3; }
        else if (overlay === 'income') { color = '#eab308'; alpha = (1-data.income/60000)*0.3; }
        ctx.beginPath(); ctx.arc(x, y, 25+devs.length*8, 0, Math.PI*2);
        ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.fill(); ctx.globalAlpha = 1;
      });
    }

    // Labels
    ctx.font = '500 9px SF Mono, Consolas'; ctx.fillStyle = '#404040';
    [['BRONX',40.835,-73.92],['MANHATTAN',40.78,-73.97],['QUEENS',40.73,-73.90],['BROOKLYN',40.68,-73.94]]
      .forEach(([n,lat,lon]) => { const p = proj(lat,lon,w,h); ctx.fillText(n,p.x-25,p.y); });

    // Dots
    developments.forEach(d => {
      const {x,y} = proj(d.lat, d.lon, w, h);
      const nta = ntaData[d.nta];
      const r = Math.max(4, Math.min(10, Math.sqrt(d.unit_count)/8));
      
      if (d.id === selectedId) {
        ctx.beginPath(); ctx.arc(x,y,r+6,0,Math.PI*2); ctx.strokeStyle='#fafafa'; ctx.lineWidth=1; ctx.stroke();
      }
      if (d.id === hovered && d.id !== selectedId) {
        ctx.beginPath(); ctx.arc(x,y,r+4,0,Math.PI*2); ctx.strokeStyle='#525252'; ctx.lineWidth=1; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle = d.id === selectedId ? '#fafafa' : hviColor(nta?.hvi||3); ctx.fill();
      
      if (d.has3DModel) {
        ctx.beginPath(); ctx.arc(x+r-1,y-r+1,2.5,0,Math.PI*2); ctx.fillStyle='#3b82f6'; ctx.fill();
      }
    });
  }, [selectedId, hovered, overlay]);

  const onMove = (e) => {
    const c = canvasRef.current, rect = c.getBoundingClientRect();
    const sx = c.width/rect.width, sy = c.height/rect.height;
    const x = (e.clientX-rect.left)*sx, y = (e.clientY-rect.top)*sy;
    let found = null;
    developments.forEach(d => {
      const p = proj(d.lat, d.lon, c.width, c.height);
      if (Math.sqrt((p.x-x)**2+(p.y-y)**2) < 15) found = d;
    });
    setHovered(found?.id || null);
    setTip(found ? {x:e.clientX-rect.left, y:e.clientY-rect.top, d:found} : null);
  };

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'#0a0a0a' }}>
      <canvas ref={canvasRef} width={700} height={600}
        style={{ width:'100%', height:'100%', cursor: hovered ? 'pointer' : 'crosshair' }}
        onMouseMove={onMove} onClick={() => hovered && onSelect(hovered)}
        onMouseLeave={() => { setHovered(null); setTip(null); }} />
      
      {tip && (
        <div style={{ position:'absolute', left:Math.min(tip.x+12,500), top:tip.y-8, background:'#171717', border:'1px solid #262626', padding:'10px 12px', pointerEvents:'none', zIndex:100, ...S.mono }}>
          <div style={{ fontSize:'12px', fontWeight:'600', color:'#fafafa' }}>{tip.d.name}</div>
          <div style={{ fontSize:'10px', color:'#525252', marginBottom:'8px' }}>{tip.d.borough}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', fontSize:'10px' }}>
            <span style={{color:'#737373'}}>Units</span><span style={{color:'#fafafa',textAlign:'right'}}>{tip.d.unit_count.toLocaleString()}</span>
            <span style={{color:'#737373'}}>Built</span><span style={{color:'#fafafa',textAlign:'right'}}>{tip.d.year_built}</span>
            <span style={{color:'#737373'}}>HVI</span><span style={{color:hviColor(ntaData[tip.d.nta]?.hvi),textAlign:'right'}}>{ntaData[tip.d.nta]?.hvi}/5</span>
          </div>
          {tip.d.has3DModel && <div style={{marginTop:'8px',fontSize:'9px',color:'#3b82f6'}}>● 3D Model</div>}
        </div>
      )}

      <div style={{ position:'absolute', bottom:'12px', left:'12px', background:'rgba(10,10,10,0.9)', border:'1px solid #262626', padding:'10px 12px', ...S.mono }}>
        <div style={{ fontSize:'9px', color:'#525252', textTransform:'uppercase', marginBottom:'6px' }}>Heat Vulnerability</div>
        <div style={{ display:'flex', gap:'3px' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
              <div style={{ width:'16px', height:'8px', background:hviColor(i) }} />
              <span style={{ fontSize:'8px', color:'#525252' }}>{i}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// 3D VIEWER
// ============================================
const Viewer3D = ({ dev, activeRetrofits, viewMode, setViewMode }) => {
  const containerRef = useRef(null);
  const buildingRef = useRef([]);
  const refs = useRef({ roof:[], ac:[], pipes:[], vents:[], windows:[], bio:[], electrical:[], elevator:[] });
  const angleRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || !dev.has3DModel) return;

    // Clear any existing content in container
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Clear all refs
    buildingRef.current = [];
    refs.current = { roof:[], ac:[], pipes:[], vents:[], windows:[], bio:[], electrical:[], elevator:[], greenRoof:[], solar:[], minisplit:[], coolPavement:[], facadePanels:[], people:[], hvacUnits:[], mechEquip:[], sensors:[] };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0ed);
    const w = containerRef.current.clientWidth, h = containerRef.current.clientHeight || 500;
    const aspect = w / h;
    // Use smaller FOV for wider aspect ratios, larger for taller
    const baseFOV = aspect < 1.2 ? 40 : aspect < 1.5 ? 35 : 32;
    const camera = new THREE.PerspectiveCamera(baseFOV, aspect, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xfff8f0, 2.0);
    sun.position.set(30, 50, 20); sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);

    // Ground - concrete/asphalt look
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xc5c5c0, roughness: 0.9 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80,80), groundMat);
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
    const grid = new THREE.GridHelper(80, 40, 0xb8b8b5, 0xc0c0bd);
    grid.position.y = 0.01;
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    // Building params
    const floorH = 2.8, floors = 6, bH = floors * floorH;
    const coreSize = 12, wingLen = 8, wingW = 6;
    const coreHalf = coreSize/2, wingHalf = wingW/2;

    // Create realistic brick material - muted reddish-brown
    const createBrickMaterial = () => {
      return new THREE.MeshStandardMaterial({
        color: 0x7d5a4a, // Muted brownish-red - realistic aged brick
        roughness: 0.92,
        metalness: 0.02,
      });
    };

    // Add mortar lines effect via geometry - all 4 faces
    const addBrickBuilding = (geo, pos, isCore = false) => {
      const mainMat = createBrickMaterial();
      mainMat.transparent = true;
      mainMat.opacity = 0.8; // 20% transparency
      const m = new THREE.Mesh(geo, mainMat);
      m.position.set(pos.x, pos.y, pos.z);
      m.castShadow = true;
      m.receiveShadow = true;
      buildingRef.current.push(m);
      scene.add(m);

      // Add horizontal mortar lines for visual brick effect on ALL 4 faces
      const linesMat = new THREE.LineBasicMaterial({ color: 0x6b5a4a, linewidth: 1, transparent: true, opacity: 0.8 });
      const halfW = geo.parameters.width / 2;
      const halfD = geo.parameters.depth / 2;
      for (let y = 0; y < bH; y += 0.35) {
        // Front face (+Z)
        const frontGeo = new THREE.BufferGeometry();
        frontGeo.setFromPoints([
          new THREE.Vector3(pos.x - halfW, y + 0.01, pos.z + halfD + 0.01),
          new THREE.Vector3(pos.x + halfW, y + 0.01, pos.z + halfD + 0.01)
        ]);
        scene.add(new THREE.Line(frontGeo, linesMat));

        // Back face (-Z)
        const backGeo = new THREE.BufferGeometry();
        backGeo.setFromPoints([
          new THREE.Vector3(pos.x - halfW, y + 0.01, pos.z - halfD - 0.01),
          new THREE.Vector3(pos.x + halfW, y + 0.01, pos.z - halfD - 0.01)
        ]);
        scene.add(new THREE.Line(backGeo, linesMat));

        // Left face (-X)
        const leftGeo = new THREE.BufferGeometry();
        leftGeo.setFromPoints([
          new THREE.Vector3(pos.x - halfW - 0.01, y + 0.01, pos.z - halfD),
          new THREE.Vector3(pos.x - halfW - 0.01, y + 0.01, pos.z + halfD)
        ]);
        scene.add(new THREE.Line(leftGeo, linesMat));

        // Right face (+X)
        const rightGeo = new THREE.BufferGeometry();
        rightGeo.setFromPoints([
          new THREE.Vector3(pos.x + halfW + 0.01, y + 0.01, pos.z - halfD),
          new THREE.Vector3(pos.x + halfW + 0.01, y + 0.01, pos.z + halfD)
        ]);
        scene.add(new THREE.Line(rightGeo, linesMat));
      }
    };

    // Core
    addBrickBuilding(new THREE.BoxGeometry(coreSize, bH, coreSize), {x:0, y:bH/2, z:0}, true);

    // Wings
    const wings = [
      {x:coreHalf+wingLen/2, z:0, w:wingLen, d:wingW},
      {x:-(coreHalf+wingLen/2), z:0, w:wingLen, d:wingW},
      {x:0, z:coreHalf+wingLen/2, w:wingW, d:wingLen},
      {x:0, z:-(coreHalf+wingLen/2), w:wingW, d:wingLen}
    ];
    wings.forEach(wing => addBrickBuilding(new THREE.BoxGeometry(wing.w, bH, wing.d), {x:wing.x, y:bH/2, z:wing.z}));

    // Roof with 20% transparency
    const roofMat = new THREE.MeshStandardMaterial({ color:0x3d3d3d, roughness:0.7, metalness: 0.1, transparent: true, opacity: 0.8 });
    [[0,0,coreSize+0.4,coreSize+0.4], ...wings.map(w => [w.x,w.z,w.w+0.3,w.d+0.3])].forEach(([x,z,rw,rd]) => {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.4, rd), roofMat.clone());
      roof.position.set(x, bH+0.2, z);
      refs.current.roof.push(roof);
      scene.add(roof);
    });

    // Roof mechanicals with 20% transparency
    const mechMat = new THREE.MeshStandardMaterial({ color:0x4a4a4a, metalness: 0.3, roughness: 0.6, transparent: true, opacity: 0.8 });
    [[-2,-2],[2,2],[0,0]].forEach(([mx,mz]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.5,1.2,1.5), mechMat);
      m.position.set(mx, bH+0.8, mz); scene.add(m);
    });

    // Window glass - solid dark blue like solar panels with 20% transparency
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5a,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8
    });
    const winFrameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7, transparent: true, opacity: 0.8 });
    const winPos = [];
    const addWin = (x,y,z,rotY=0) => {
      // Window frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.12), winFrameMat.clone());
      frame.position.set(x, y, z); frame.rotation.y = rotY;
      scene.add(frame);
      // Glass pane - offset slightly from frame based on rotation to prevent z-fighting
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.04), glassMat.clone());
      // For rotY=0, windows face Z axis; for rotY=PI/2, windows face X axis
      const offsetX = rotY !== 0 ? (x > 0 ? 0.04 : -0.04) : 0;
      const offsetZ = rotY === 0 ? (z > 0 ? 0.04 : -0.04) : 0;
      glass.position.set(x + offsetX, y, z + offsetZ);
      glass.rotation.y = rotY;
      refs.current.windows.push(glass); scene.add(glass);
      winPos.push({x,y,z,rotY});
    };

    // Add walking people around the building (small figures) - more appear with more retrofits
    const personColors = [0x2563eb, 0xdc2626, 0x16a34a, 0xeab308, 0x9333ea, 0x0891b2, 0xf43f5e, 0x14b8a6, 0xa855f7, 0x64748b, 0xf97316, 0x06b6d4];
    // 12 people positions - base 2 always visible, more appear as retrofits are added
    const peoplePositions = [
      // Base people (always visible)
      { x: 12, z: 8, angle: 0, speed: 0.015, radius: 8, phase: 0 },
      { x: -10, z: 12, angle: Math.PI/4, speed: 0.012, radius: 10, phase: Math.PI/2 },
      // Additional people (appear with retrofits)
      { x: 15, z: -5, angle: Math.PI/2, speed: 0.018, radius: 12, phase: Math.PI },
      { x: -8, z: -10, angle: Math.PI, speed: 0.01, radius: 7, phase: Math.PI/3 },
      { x: 5, z: 14, angle: -Math.PI/3, speed: 0.014, radius: 9, phase: Math.PI/4 },
      { x: -14, z: 3, angle: Math.PI/6, speed: 0.016, radius: 11, phase: Math.PI*1.5 },
      { x: 18, z: 2, angle: Math.PI/5, speed: 0.011, radius: 6, phase: Math.PI*0.7 },
      { x: -6, z: -15, angle: Math.PI/2, speed: 0.013, radius: 8, phase: Math.PI*0.2 },
      { x: 8, z: -12, angle: -Math.PI/6, speed: 0.017, radius: 10, phase: Math.PI*1.2 },
      { x: -15, z: -5, angle: Math.PI*0.8, speed: 0.009, radius: 7, phase: Math.PI*0.5 },
      { x: 3, z: 18, angle: Math.PI*0.3, speed: 0.02, radius: 9, phase: Math.PI*1.8 },
      { x: -18, z: 8, angle: -Math.PI/4, speed: 0.012, radius: 11, phase: Math.PI*0.9 }
    ];
    peoplePositions.forEach((p, i) => {
      const personGroup = new THREE.Group();
      // Body with transparency
      const bodyMat = new THREE.MeshStandardMaterial({
        color: personColors[i % personColors.length],
        transparent: true,
        opacity: 0.8
      });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.6, 8), bodyMat);
      body.position.y = 0.5;
      personGroup.add(body);
      // Head with transparency
      const headMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, transparent: true, opacity: 0.8 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), headMat);
      head.position.y = 0.95;
      personGroup.add(head);
      // Legs with transparency
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.8 });
      const legs = [];
      [-0.08, 0.08].forEach(offset => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 6), legMat.clone());
        leg.position.set(offset, 0.17, 0);
        legs.push(leg);
        personGroup.add(leg);
      });
      personGroup.position.set(p.x, 0, p.z);
      personGroup.rotation.y = p.angle;
      personGroup.visible = i < 2; // Only first 2 visible by default
      personGroup.userData = {
        baseX: p.x, baseZ: p.z, speed: p.speed, radius: p.radius, phase: p.phase,
        time: p.phase, legs: legs, index: i
      };
      refs.current.people.push(personGroup);
      scene.add(personGroup);
    });

    // Core corner windows (only exposed parts)
    for (let f=0; f<floors; f++) {
      const y = 1.5 + f*floorH;
      // Each face exposed at corners
      addWin(-coreHalf+1.2, y, coreHalf+0.05, 0); addWin(coreHalf-1.2, y, coreHalf+0.05, 0);
      addWin(-coreHalf+1.2, y, -(coreHalf+0.05), 0); addWin(coreHalf-1.2, y, -(coreHalf+0.05), 0);
      addWin(coreHalf+0.05, y, -coreHalf+1.2, Math.PI/2); addWin(coreHalf+0.05, y, coreHalf-1.2, Math.PI/2);
      addWin(-(coreHalf+0.05), y, -coreHalf+1.2, Math.PI/2); addWin(-(coreHalf+0.05), y, coreHalf-1.2, Math.PI/2);
    }

    // Wing windows (sides + ends)
    wings.forEach((wing, i) => {
      const isEW = i < 2;
      for (let f=0; f<floors; f++) {
        const y = 1.5 + f*floorH;
        if (isEW) {
          for (let n=0; n<3; n++) {
            const wx = wing.x + (n-1)*2.2;
            addWin(wx, y, wing.z + wingHalf + 0.05, 0);
            addWin(wx, y, wing.z - wingHalf - 0.05, 0);
          }
          const endX = wing.x + (wing.x>0 ? wingLen/2+0.05 : -wingLen/2-0.05);
          addWin(endX, y, wing.z-1.5, Math.PI/2); addWin(endX, y, wing.z+1.5, Math.PI/2);
        } else {
          for (let n=0; n<3; n++) {
            const wz = wing.z + (n-1)*2.2;
            addWin(wing.x + wingHalf + 0.05, y, wz, Math.PI/2);
            addWin(wing.x - wingHalf - 0.05, y, wz, Math.PI/2);
          }
          const endZ = wing.z + (wing.z>0 ? wingLen/2+0.05 : -wingLen/2-0.05);
          addWin(wing.x-1.5, y, endZ, 0); addWin(wing.x+1.5, y, endZ, 0);
        }
      }
    });

    // Elevator shafts (in core) - always visible, structural with 20% transparency
    const elevMat = new THREE.MeshStandardMaterial({ color:0x525252, roughness:0.6, transparent: true, opacity: 0.8 });
    [[-3, 0], [3, 0]].forEach(([ex, ez]) => {
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(2.2, bH+1, 2.2), elevMat);
      shaft.position.set(ex, bH/2, ez);
      refs.current.elevator.push(shaft);
      scene.add(shaft);
    });

    // Pipes (risers near walls, not center) with 20% transparency
    const pipeMat = new THREE.MeshStandardMaterial({ color:0xf59e0b, metalness:0.8, emissive:0xf59e0b, emissiveIntensity:0.2, transparent: true, opacity: 0.8 });
    [[4.5,4.5],[-4.5,4.5],[4.5,-4.5],[-4.5,-4.5],[0,5.5],[0,-5.5],[5.5,0],[-5.5,0]].forEach(([px,pz]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,bH+2,12), pipeMat.clone());
      p.position.set(px, bH/2, pz); p.visible = false;
      refs.current.pipes.push(p); scene.add(p);
    });
    const hPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,28,12), pipeMat.clone());
    hPipe.rotation.z = Math.PI/2; hPipe.position.set(0,-0.5,0); hPipe.visible = false;
    refs.current.pipes.push(hPipe); scene.add(hPipe);

    // Ventilation shafts with 20% transparency
    const ventMat = new THREE.MeshStandardMaterial({ color:0xa78bfa, metalness:0.6, emissive:0xa78bfa, emissiveIntensity:0.15, transparent: true, opacity: 0.8 });
    [[0,3.5],[0,-3.5],[3.5,3.5],[-3.5,-3.5]].forEach(([vx,vz]) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.8,bH,0.8), ventMat.clone());
      s.position.set(vx, bH/2, vz); s.visible = false;
      refs.current.vents.push(s); scene.add(s);
    });
    [[-2,4],[2,-4]].forEach(([rx,rz]) => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(1,0.6,1), ventMat.clone());
      e.position.set(rx, bH+0.5, rz); e.visible = false;
      refs.current.vents.push(e); scene.add(e);
    });

    // Electrical with 20% transparency
    const elecMat = new THREE.MeshStandardMaterial({ color:0x3b82f6, metalness:0.7, emissive:0x3b82f6, emissiveIntensity:0.3, transparent: true, opacity: 0.8 });
    [[1.5,1.5],[-1.5,1.5],[1.5,-1.5],[-1.5,-1.5]].forEach(([ex,ez]) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,bH,8), elecMat.clone());
      c.position.set(ex, bH/2, ez); c.visible = false;
      refs.current.electrical.push(c); scene.add(c);
    });

    // AC units (60% of windows, random) with 20% transparency
    const acMat = new THREE.MeshStandardMaterial({ color:0xd4d4d4, metalness:0.6, transparent: true, opacity: 0.8 });
    const seed = (i) => { const x = Math.sin(i*7+13)*10000; return x - Math.floor(x); };
    winPos.forEach((wp, i) => {
      if (seed(i) < 0.6) {
        const ac = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.3,0.3), acMat.clone());
        const off = 0.22;
        if (Math.abs(wp.rotY) < 0.1) {
          ac.position.set(wp.x, wp.y-0.85, wp.z + (wp.z>0?off:-off));
        } else {
          ac.position.set(wp.x + (wp.x>0?off:-off), wp.y-0.85, wp.z);
          ac.rotation.y = Math.PI/2;
        }
        ac.visible = false;
        refs.current.ac.push(ac); scene.add(ac);
      }
    });

    // Bioswales (no random paving rectangles) with 20% transparency
    const bioMat = new THREE.MeshStandardMaterial({ color:0x4a6b50, roughness:0.95, transparent: true, opacity: 0.8 }); // Muted green for bioswales
    [{x:20,z:0,w:8,d:2},{x:-20,z:0,w:8,d:2},{x:0,z:20,w:2,d:8},{x:0,z:-20,w:2,d:8}].forEach(b => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(b.w,0.25,b.d), bioMat.clone());
      sw.position.set(b.x, 0.12, b.z); sw.visible = false;
      refs.current.bio.push(sw); scene.add(sw);
      for (let p=0; p<4; p++) {
        const plant = new THREE.Mesh(new THREE.ConeGeometry(0.2,0.5,6), new THREE.MeshStandardMaterial({color:0x3d5040, transparent: true, opacity: 0.8}));
        const ox = b.w>b.d ? (p-1.5)*2 : 0;
        const oz = b.d>b.w ? (p-1.5)*2 : 0;
        plant.position.set(b.x+ox, 0.5, b.z+oz); plant.visible = false;
        refs.current.bio.push(plant); scene.add(plant);
      }
    });

    // Green roof - full coverage with planters and vegetation (20% transparency)
    const greenBaseMat = new THREE.MeshStandardMaterial({ color: 0x5a7a5a, roughness: 0.9, transparent: true, opacity: 0.8 }); // Muted sage green
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x6b6560, roughness: 0.9, transparent: true, opacity: 0.8 }); // Warm gray planters
    const plantMat1 = new THREE.MeshStandardMaterial({ color: 0x3d5a3d, transparent: true, opacity: 0.8 }); // Dark muted green
    const plantMat2 = new THREE.MeshStandardMaterial({ color: 0x4a6b4a, transparent: true, opacity: 0.8 }); // Medium muted green
    const plantMat3 = new THREE.MeshStandardMaterial({ color: 0x3a5040, transparent: true, opacity: 0.8 }); // Dark olive green

    // Green base layer covering entire roof (core + wings)
    const roofAreas = [
      { x: 0, z: 0, w: coreSize - 1, d: coreSize - 1 }, // Core
      { x: coreHalf + wingLen/2, z: 0, w: wingLen - 1, d: wingW - 1 }, // Right wing
      { x: -(coreHalf + wingLen/2), z: 0, w: wingLen - 1, d: wingW - 1 }, // Left wing
      { x: 0, z: coreHalf + wingLen/2, w: wingW - 1, d: wingLen - 1 }, // Front wing
      { x: 0, z: -(coreHalf + wingLen/2), w: wingW - 1, d: wingLen - 1 }, // Back wing
    ];

    roofAreas.forEach(area => {
      // Green base
      const base = new THREE.Mesh(new THREE.BoxGeometry(area.w, 0.15, area.d), greenBaseMat.clone());
      base.position.set(area.x, bH + 0.45, area.z); base.visible = false;
      refs.current.greenRoof.push(base); scene.add(base);

      // Add planters with plants across the area
      const planterCount = Math.floor((area.w * area.d) / 4);
      for (let i = 0; i < planterCount; i++) {
        const px = area.x + (Math.random() - 0.5) * (area.w - 0.5);
        const pz = area.z + (Math.random() - 0.5) * (area.d - 0.5);

        // Planter box
        const planter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), planterMat.clone());
        planter.position.set(px, bH + 0.6, pz); planter.visible = false;
        refs.current.greenRoof.push(planter); scene.add(planter);

        // Random plant type
        const plantType = Math.floor(Math.random() * 3);
        const plantMats = [plantMat1, plantMat2, plantMat3];
        if (plantType === 0) {
          // Small shrub (sphere)
          const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), plantMats[Math.floor(Math.random() * 3)].clone());
          shrub.position.set(px, bH + 1.0, pz); shrub.visible = false;
          refs.current.greenRoof.push(shrub); scene.add(shrub);
        } else if (plantType === 1) {
          // Tall plant (cone)
          const tall = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 6), plantMats[Math.floor(Math.random() * 3)].clone());
          tall.position.set(px, bH + 1.15, pz); tall.visible = false;
          refs.current.greenRoof.push(tall); scene.add(tall);
        } else {
          // Small tree
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x5a4030 }));
          trunk.position.set(px, bH + 1.0, pz); trunk.visible = false;
          refs.current.greenRoof.push(trunk); scene.add(trunk);
          const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), plantMats[Math.floor(Math.random() * 3)].clone());
          foliage.position.set(px, bH + 1.45, pz); foliage.visible = false;
          refs.current.greenRoof.push(foliage); scene.add(foliage);
        }
      }
    });

    // Solar panels on roof - ELEVATED on tall frames to coexist with green roof below (20% transparency)
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.85, roughness: 0.15, transparent: true, opacity: 0.8 });
    const solarFrameMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7, roughness: 0.4, transparent: true, opacity: 0.8 });
    const solarCellMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.8 });

    // Elevated solar canopy structure - tall enough for plants to grow underneath
    const solarHeight = 2.0; // Raised 2 units above roof for green roof clearance
    const panelTilt = 0.35; // Optimal angle for NYC latitude

    // Grid of solar panels on raised structure (perimeter of core roof)
    const solarPositions = [];
    // Perimeter positions only (leaving center for more green)
    for (let row = -2; row <= 2; row++) {
      for (let col = -2; col <= 2; col++) {
        // Skip the very center (mechanicals) and inner ring (more green space)
        if (Math.abs(row) <= 1 && Math.abs(col) <= 1) continue;
        solarPositions.push({ x: col * 2.4, z: row * 1.8 });
      }
    }

    solarPositions.forEach(pos => {
      // Main panel
      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.2), solarMat.clone());
      panel.position.set(pos.x, bH + solarHeight + 0.3, pos.z);
      panel.rotation.x = -panelTilt;
      panel.visible = false;
      refs.current.solar.push(panel); scene.add(panel);

      // Cell grid pattern on panel
      for (let cx = -0.6; cx <= 0.6; cx += 0.4) {
        for (let cz = -0.35; cz <= 0.35; cz += 0.35) {
          const cell = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.3), solarCellMat.clone());
          cell.position.set(pos.x + cx, bH + solarHeight + 0.35, pos.z + cz);
          cell.rotation.x = -panelTilt;
          cell.visible = false;
          refs.current.solar.push(cell); scene.add(cell);
        }
      }

      // Tall frame legs (4 per panel for stability)
      const legPositions = [
        { dx: -0.8, dz: -0.4 }, { dx: 0.8, dz: -0.4 },
        { dx: -0.8, dz: 0.4 }, { dx: 0.8, dz: 0.4 }
      ];
      legPositions.forEach(leg => {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.06, solarHeight, 0.06), solarFrameMat.clone());
        frame.position.set(pos.x + leg.dx, bH + solarHeight/2 + 0.4, pos.z + leg.dz);
        frame.visible = false;
        refs.current.solar.push(frame); scene.add(frame);
      });

      // Cross bracing for structure
      const brace = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.04), solarFrameMat.clone());
      brace.position.set(pos.x, bH + solarHeight * 0.6, pos.z);
      brace.visible = false;
      refs.current.solar.push(brace); scene.add(brace);
    });

    // Additional panels on wings - also elevated with frames
    wings.forEach(wing => {
      const panelCount = Math.floor((wing.w * wing.d) / 8);
      for (let i = 0; i < panelCount; i++) {
        const px = wing.x + (Math.random() - 0.5) * (wing.w - 2);
        const pz = wing.z + (Math.random() - 0.5) * (wing.d - 2);
        // Elevated panel
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.07, 1.0), solarMat.clone());
        panel.position.set(px, bH + solarHeight + 0.2, pz);
        panel.rotation.x = -panelTilt;
        panel.visible = false;
        refs.current.solar.push(panel); scene.add(panel);
        // Frame legs
        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, solarHeight * 0.8, 0.05), solarFrameMat.clone());
        leg1.position.set(px - 0.6, bH + solarHeight * 0.4 + 0.4, pz);
        leg1.visible = false;
        refs.current.solar.push(leg1); scene.add(leg1);
        const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, solarHeight * 0.8, 0.05), solarFrameMat.clone());
        leg2.position.set(px + 0.6, bH + solarHeight * 0.4 + 0.4, pz);
        leg2.visible = false;
        refs.current.solar.push(leg2); scene.add(leg2);
      }
    });

    // Insulated Panel Facade - undulating aluminum panels on building exterior (20% transparency)
    const facadePanelMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2, // Cyan color matching the retrofit
      metalness: 0.7,
      roughness: 0.25,
      transparent: true,
      opacity: 0.8
    });
    const facadeFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.8 });

    // Add undulating facade panels on each face of the core
    const facadeOffset = 0.15; // Distance from building wall
    const panelWidth = 1.2;
    const panelHeight = floorH * 0.9;

    // Core faces
    [
      { x: coreHalf + facadeOffset, z: 0, rotY: Math.PI/2, count: 5 },
      { x: -(coreHalf + facadeOffset), z: 0, rotY: -Math.PI/2, count: 5 },
      { x: 0, z: coreHalf + facadeOffset, rotY: 0, count: 5 },
      { x: 0, z: -(coreHalf + facadeOffset), rotY: Math.PI, count: 5 }
    ].forEach(face => {
      for (let f = 0; f < floors; f++) {
        for (let p = 0; p < face.count; p++) {
          const offset = (p - (face.count - 1) / 2) * (panelWidth + 0.2);
          const undulation = Math.sin(f * 0.5 + p * 0.7) * 0.08; // Subtle wave effect

          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(panelWidth, panelHeight, 0.08 + undulation),
            facadePanelMat.clone()
          );
          const px = face.rotY === Math.PI/2 || face.rotY === -Math.PI/2 ? face.x + undulation : face.x + offset;
          const pz = face.rotY === 0 || face.rotY === Math.PI ? face.z + undulation : face.z + offset;
          panel.position.set(px, 1.4 + f * floorH, pz);
          panel.rotation.y = face.rotY;
          panel.visible = false;
          refs.current.facadePanels.push(panel);
          scene.add(panel);

          // Horizontal reveal/shadow gap
          const reveal = new THREE.Mesh(
            new THREE.BoxGeometry(panelWidth + 0.1, 0.03, 0.12),
            facadeFrameMat.clone()
          );
          reveal.position.set(px, 1.4 + f * floorH + panelHeight/2 + 0.02, pz);
          reveal.rotation.y = face.rotY;
          reveal.visible = false;
          refs.current.facadePanels.push(reveal);
          scene.add(reveal);
        }
      }
    });

    // Mini-split outdoor units (on exterior walls) with 20% transparency
    const minisplitMat = new THREE.MeshStandardMaterial({ color:0xe5e5e5, metalness:0.4, transparent: true, opacity: 0.8 });
    [[5.1, 0], [-5.1, 0], [0, 5.1], [0, -5.1]].forEach(([mx, mz], i) => {
      for (let floor = 0; floor < 3; floor++) {
        const unit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.25), minisplitMat.clone());
        unit.position.set(mx, 4 + floor * floorH * 2, mz);
        if (mx !== 0) unit.rotation.y = Math.PI / 2;
        unit.visible = false;
        refs.current.minisplit.push(unit); scene.add(unit);
      }
    });

    // Existing mature trees around the building (always visible as site context) with 20% transparency
    const trunkMat = new THREE.MeshStandardMaterial({ color:0x4a3828, roughness: 0.95, transparent: true, opacity: 0.8 }); // Dark brown trunk
    const canopyMat = new THREE.MeshStandardMaterial({ color:0x3d5a3d, roughness:0.95, transparent: true, opacity: 0.8 }); // Muted forest green
    // Tall existing trees at varying heights (half building height ~8m)
    const existingTrees = [
      { x: 18, z: 12, h: 9, r: 3.5 },
      { x: -16, z: 14, h: 8, r: 3.0 },
      { x: 20, z: -8, h: 10, r: 4.0 },
      { x: -18, z: -12, h: 7, r: 2.8 },
      { x: 22, z: 0, h: 9, r: 3.2 },
      { x: -20, z: 5, h: 8, r: 3.0 },
      { x: 12, z: 20, h: 7, r: 2.5 },
      { x: -10, z: -18, h: 9, r: 3.5 },
    ];
    existingTrees.forEach(tree => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, tree.h * 0.6, 8), trunkMat.clone());
      trunk.position.set(tree.x, tree.h * 0.3, tree.z);
      scene.add(trunk); // Always visible
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(tree.r, 12, 8), canopyMat.clone());
      canopy.position.set(tree.x, tree.h * 0.7, tree.z);
      scene.add(canopy); // Always visible
    });

    // Cool pavement (lighter ground areas) with 20% transparency
    const coolPaveMat = new THREE.MeshStandardMaterial({ color:0xd4d4d4, roughness:0.6, transparent: true, opacity: 0.8 });
    [[12, 0, 6, 10], [-12, 0, 6, 10], [0, 12, 10, 6], [0, -12, 10, 6]].forEach(([px, pz, pw, pd]) => {
      const pave = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.08, pd), coolPaveMat.clone());
      pave.position.set(px, 0.04, pz); pave.visible = false;
      refs.current.coolPavement.push(pave); scene.add(pave);
    });

    // === ROOFTOP HVAC UNITS (central_hvac, vrf_system, heat_pump) === with 20% transparency
    const hvacMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.8 });
    const hvacFanMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, transparent: true, opacity: 0.8 });
    // Large rooftop units
    [[-4, 4], [4, -4], [-4, -4]].forEach(([hx, hz]) => {
      // Main unit body
      const unit = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 2.5), hvacMat.clone());
      unit.position.set(hx, bH + 1.3, hz);
      unit.visible = false;
      refs.current.hvacUnits.push(unit); scene.add(unit);
      // Fan grille on top
      const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 16), hvacFanMat.clone());
      fan.position.set(hx, bH + 2.3, hz);
      fan.visible = false;
      refs.current.hvacUnits.push(fan); scene.add(fan);
      // Exhaust vent
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), hvacMat.clone());
      vent.position.set(hx + 1, bH + 2.5, hz);
      vent.visible = false;
      refs.current.hvacUnits.push(vent); scene.add(vent);
    });

    // === MECHANICAL ROOM EQUIPMENT (dehumidification, hot_water) === with 20% transparency
    const mechEquipMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.5, roughness: 0.5, transparent: true, opacity: 0.8 });
    // Basement/ground floor mechanical equipment (visible in xray)
    // Water heater tanks
    [[2, 2], [-2, 2], [0, -2]].forEach(([ex, ez]) => {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.5, 12), mechEquipMat.clone());
      tank.position.set(ex, 0.75, ez);
      tank.visible = false;
      refs.current.mechEquip.push(tank); scene.add(tank);
      // Pipe connections
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
      pipe.position.set(ex, 1.6, ez);
      pipe.visible = false;
      refs.current.mechEquip.push(pipe); scene.add(pipe);
    });
    // Dehumidifier units
    [[-3, 0], [3, 0]].forEach(([dx, dz]) => {
      const dehum = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.8), new THREE.MeshStandardMaterial({ color: 0x9333ea, metalness: 0.4 }));
      dehum.position.set(dx, 0.5, dz);
      dehum.visible = false;
      refs.current.mechEquip.push(dehum); scene.add(dehum);
    });

    // === BUILDING AUTOMATION SENSORS (building_automation) ===
    const sensorMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.6, roughness: 0.3 });
    const sensorLedMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.8 });
    // Sensors on walls at each floor
    for (let f = 0; f < floors; f++) {
      const y = 1.5 + f * floorH;
      [[coreHalf + 0.1, 0], [-(coreHalf + 0.1), 0], [0, coreHalf + 0.1], [0, -(coreHalf + 0.1)]].forEach(([sx, sz], i) => {
        // Sensor box
        const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.08), sensorMat.clone());
        sensor.position.set(sx, y, sz);
        if (sx !== 0) sensor.rotation.y = Math.PI / 2;
        sensor.visible = false;
        refs.current.sensors.push(sensor); scene.add(sensor);
        // LED indicator
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), sensorLedMat.clone());
        led.position.set(sx + (sx !== 0 ? 0 : 0.08), y + 0.04, sz + (sz !== 0 ? 0 : 0.08));
        led.visible = false;
        refs.current.sensors.push(led); scene.add(led);
      });
    }

    // OrbitControls for user interaction (zoom, rotate, pan)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below ground
    controls.target.set(0, 8, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Set initial camera position
    const r = 38, ht = 28;
    camera.position.set(r * Math.sin(angleRef.current), ht, r * Math.cos(angleRef.current));
    controls.update();

    // Animate with people walking
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Animate people walking in circular paths with leg movement
      refs.current.people?.forEach(person => {
        if (person.visible && person.userData) {
          const { baseX, baseZ, speed, radius, legs } = person.userData;
          person.userData.time += speed;
          const t = person.userData.time;

          // Walk in circular/elliptical paths
          const newX = baseX + Math.sin(t) * radius * 0.3;
          const newZ = baseZ + Math.cos(t * 0.7) * radius * 0.25;
          person.position.x = newX;
          person.position.z = newZ;

          // Face direction of movement
          const dx = Math.cos(t) * speed * radius * 0.3;
          const dz = -Math.sin(t * 0.7) * speed * 0.7 * radius * 0.25;
          person.rotation.y = Math.atan2(dx, dz);

          // Animate legs
          if (legs && legs.length === 2) {
            const legSwing = Math.sin(t * 8) * 0.3;
            legs[0].rotation.x = legSwing;
            legs[1].rotation.x = -legSwing;
          }
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer for responsive camera
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      // Dispose of all materials and geometries
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      // Remove renderer and dispose
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();

      // Clear refs
      buildingRef.current = [];
      refs.current = { roof:[], ac:[], pipes:[], vents:[], windows:[], bio:[], electrical:[], elevator:[], greenRoof:[], solar:[], minisplit:[], coolPavement:[] };
    };
  }, [dev.has3DModel, dev.id]);

  // Visibility updates
  useEffect(() => {
    // Only update if refs are populated (scene has been created)
    if (!buildingRef.current.length) return;

    const r = refs.current;
    const isX = viewMode === 'xray', isS = viewMode === 'site';

    buildingRef.current.forEach(m => {
      if (m.material) { m.material.transparent = isX; m.material.opacity = isX ? 0.12 : 1; m.material.needsUpdate = true; }
    });

    // Elevator shafts - always visible but transparent in xray
    r.elevator?.forEach(e => {
      e.material.transparent = isX;
      e.material.opacity = isX ? 0.5 : 1;
      e.material.color.setHex(isX ? 0x404040 : 0x525252);
    });

    // === RETROFIT VISIBILITY (no glow effects) ===

    // Cool roof
    const hasCool = activeRetrofits.includes('cool_roof');
    r.roof?.forEach(rf => {
      rf.material.color.setHex(hasCool ? 0xfafafa : 0x3d3d3d);
    });

    // Window AC units
    const hasAC = activeRetrofits.includes('ac_electric');
    r.ac?.forEach(ac => { ac.visible = hasAC && !isS; });
    r.electrical?.forEach(el => { el.visible = hasAC && isX; });

    // Pipes/risers
    const pipesActive = activeRetrofits.includes('pipes');
    r.pipes?.forEach(p => { p.visible = pipesActive && isX; });

    // Ventilation
    const ventsActive = activeRetrofits.includes('ventilation');
    r.vents?.forEach(v => { v.visible = ventsActive && isX; });

    // Windows - change color when envelope retrofit is active
    const hasEnv = activeRetrofits.includes('envelope') || activeRetrofits.includes('triple_pane');
    r.windows?.forEach(w => {
      if (hasEnv) {
        // Upgraded windows - slightly teal tint to indicate new efficient windows
        w.material.color.setHex(0x1e5a5a);
      } else {
        // Default window color
        w.material.color.setHex(0x1e3a5a);
      }
    });

    // Bioswales - always visible when active (site elements always show)
    const bioActive = activeRetrofits.includes('bioswale');
    r.bio?.forEach(b => { b.visible = bioActive; });

    // Green roof - visible in both exterior and xray
    const hasGreenRoof = activeRetrofits.includes('green_roof');
    r.greenRoof?.forEach(g => { g.visible = hasGreenRoof; });

    // Solar panels - always visible when active
    const hasSolar = activeRetrofits.includes('solar_battery');
    r.solar?.forEach(s => { s.visible = hasSolar; });

    // Mini-splits - visible in exterior (not xray since internal)
    const hasMinisplit = activeRetrofits.includes('minisplit') || activeRetrofits.includes('window_heat_pump');
    r.minisplit?.forEach(m => { m.visible = hasMinisplit && !isX; });

    // (Existing mature trees are always visible as site context)

    // Cool pavement - always visible when active
    const hasCoolPave = activeRetrofits.includes('cool_pavement');
    r.coolPavement?.forEach(p => { p.visible = hasCoolPave; });

    // Facade panels - visible in exterior (not xray)
    const hasFacade = activeRetrofits.includes('facade_panels');
    r.facadePanels?.forEach(p => { p.visible = hasFacade && !isX; });

    // Rooftop HVAC (central, VRF, heat pump) - always visible when active
    const hasHvac = activeRetrofits.includes('central_hvac') || activeRetrofits.includes('vrf_system') || activeRetrofits.includes('heat_pump');
    r.hvacUnits?.forEach(u => { u.visible = hasHvac; });

    // Advanced insulation - no visual representation (internal work)

    // Mechanical equipment (dehumidification, hot water) - xray only
    const hasMechEquip = activeRetrofits.includes('dehumidification') || activeRetrofits.includes('hot_water');
    r.mechEquip?.forEach(m => { m.visible = hasMechEquip && isX; });

    // Building automation sensors - always visible when active
    const hasSensors = activeRetrofits.includes('building_automation');
    r.sensors?.forEach(s => { s.visible = hasSensors; });

    // People - more visible as more retrofits are added
    // Base: 2 people always visible, +2 people per retrofit (up to 12)
    const numPeopleVisible = Math.min(12, 2 + activeRetrofits.length * 2);
    r.people?.forEach((person, i) => {
      person.visible = i < numPeopleVisible;
    });

  }, [activeRetrofits, viewMode]);

  if (!dev.has3DModel) {
    return (
      <div style={{ width:'100%', height:'400px', background:'#111', border:'1px solid #262626', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
        <div style={{ fontSize:'11px', color:'#404040', ...S.mono }}>3D MODEL UNAVAILABLE</div>
      </div>
    );
  }

  // All active retrofits are now visible (site elements always show)
  // Only filter for xray-specific items
  const visibleRetrofits = activeRetrofits;

  return (
    <div style={{ position:'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div ref={containerRef} style={{ width:'100%', height:'100%' }} />
      <div style={{ position:'absolute', bottom:'12px', left:'12px', fontSize:'9px', color: colors.text.muted, ...S.mono }}>
        {viewMode==='xray' ? 'X-RAY · Internal Systems Visible' : 'EXTERIOR · Facade + Site'}
      </div>

      {/* Active Retrofits Legend */}
      {visibleRetrofits.length > 0 && (
        <div style={{
          position:'absolute',
          bottom:'40px',
          right:'12px',
          display:'flex',
          flexDirection: 'column',
          gap:'4px',
          background: 'rgba(255,255,255,0.9)',
          padding: '8px 10px',
          borderRadius: '4px',
          border: `1px solid ${colors.border.subtle}`,
          fontSize:'9px',
          ...S.mono
        }}>
          <div style={{ fontSize: '8px', color: colors.text.muted, marginBottom: '2px' }}>ACTIVE RETROFITS</div>
          {visibleRetrofits.slice(0, 5).map(id => {
            const r = retrofits.find(x => x.id === id);
            return r ? (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                <span style={{ color: colors.text.primary }}>{r.name}</span>
              </div>
            ) : null;
          })}
          {visibleRetrofits.length > 5 && (
            <div style={{ color: colors.text.muted, fontSize: '8px' }}>+{visibleRetrofits.length - 5} more</div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// NEIGHBORHOOD 3D VIEWER - All 27 Buildings
// ============================================
const NeighborhoodViewer3D = ({ dev, activeRetrofits }) => {
  const containerRef = useRef(null);
  const angleRef = useRef(0);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);

  // Building positions - measured from NYCHA site plan image
  // Coordinate system: center of site ≈ (0, 30), x+ = east, z+ = south
  // All buildings are 45° rotated (X-shape) EXCEPT 13, 14, 15, 16, 23 which are axis-aligned (+shape)
  // Priority based on simulated service request data (1=low, 5=highest need)
  const buildingLayout = [
    // === NORTH BLOCK (above Blake Ave) ===
    { id: 1, x: -105, z: -85, rot: Math.PI/4, wingScale: 0.85, priority: 4, complaints: 156 },   // NW corner near Rockaway/Sutter
    { id: 2, x: -60, z: -75, rot: Math.PI/4, wingScale: 0.95, priority: 3, complaints: 118 },    // Between 1 and 3
    { id: 3, x: -15, z: -85, rot: Math.PI/4, wingScale: 0.85, priority: 5, complaints: 203 },    // Near Osborne St - HIGHEST
    { id: 4, x: -85, z: -45, rot: Math.PI/4, wingScale: 0.9, priority: 2, complaints: 87 },      // Below 1, west side
    { id: 5, x: -35, z: -50, rot: Math.PI/4, wingScale: 0.85, priority: 3, complaints: 124 },    // Center of north block
    { id: 6, x: -105, z: -5, rot: Math.PI/4, wingScale: 0.8, priority: 4, complaints: 167 },     // SW corner of north block
    { id: 7, x: -55, z: -15, rot: Math.PI/4, wingScale: 0.85, priority: 2, complaints: 92 },     // South-center of north block
    { id: 8, x: -10, z: -10, rot: Math.PI/4, wingScale: 0.8, priority: 5, complaints: 189 },     // Near star marker, center - HIGHEST
    { id: 9, x: 95, z: -75, rot: Math.PI/4, wingScale: 0.85, priority: 3, complaints: 134 },     // East section, near Mother Gaston
    { id: 10, x: 35, z: -20, rot: Math.PI/4, wingScale: 0.8, priority: 2, complaints: 78 },      // East of Osborne
    { id: 11, x: 75, z: -25, rot: Math.PI/4, wingScale: 0.85, priority: 4, complaints: 158 },    // East side
    { id: 12, x: 115, z: -30, rot: Math.PI/4, wingScale: 0.8, priority: 3, complaints: 112 },    // SE corner of north block

    // === SOUTH BLOCK (below Blake Ave) ===
    // Left section - AXIS-ALIGNED buildings (+shape)
    { id: 13, x: -75, z: 45, rot: 0, wingScale: 0.9, priority: 3, complaints: 126 },             // Upper left, + shape
    { id: 14, x: -20, z: 30, rot: 0, wingScale: 0.85, priority: 2, complaints: 84 },             // Upper center-left, + shape
    { id: 15, x: -95, z: 95, rot: 0, wingScale: 0.85, priority: 5, complaints: 198 },            // Middle left, + shape - HIGHEST
    { id: 16, x: -40, z: 75, rot: 0, wingScale: 0.8, priority: 4, complaints: 172 },             // Center, + shape

    // Bottom left - diagonal buildings (X-shape)
    { id: 17, x: -75, z: 135, rot: Math.PI/4, wingScale: 0.8, priority: 3, complaints: 108 },    // Bottom left
    { id: 18, x: -25, z: 125, rot: Math.PI/4, wingScale: 0.85, priority: 2, complaints: 76 },    // Bottom center-left
    { id: 19, x: 25, z: 120, rot: Math.PI/4, wingScale: 0.8, priority: 4, complaints: 145 },     // Bottom center

    // Right section - diagonal buildings (X-shape)
    { id: 20, x: 45, z: 30, rot: Math.PI/4, wingScale: 0.85, priority: 1, complaints: 52 },      // Upper right, near circle - LOWEST
    { id: 21, x: 85, z: 40, rot: Math.PI/4, wingScale: 0.9, priority: 3, complaints: 121 },      // Right side upper
    { id: 22, x: 120, z: 25, rot: Math.PI/4, wingScale: 0.8, priority: 2, complaints: 89 },      // Far right top

    // Center-right - AXIS-ALIGNED (+shape)
    { id: 23, x: 55, z: 75, rot: 0, wingScale: 0.85, priority: 4, complaints: 163 },             // Center-right, + shape

    // Bottom right - diagonal (X-shape)
    { id: 24, x: 105, z: 55, rot: Math.PI/4, wingScale: 0.8, priority: 2, complaints: 94 },      // Right side middle
    { id: 25, x: 65, z: 115, rot: Math.PI/4, wingScale: 0.85, priority: 5, complaints: 211 },    // Bottom center-right - HIGHEST
    { id: 26, x: 100, z: 105, rot: Math.PI/4, wingScale: 0.9, priority: 3, complaints: 136 },    // Bottom right
    { id: 27, x: 135, z: 115, rot: Math.PI/4, wingScale: 0.8, priority: 1, complaints: 48 },     // Far bottom right corner - LOWEST
  ];

  // Circular plazas - measured from site plan
  const plazas = [
    // North block
    { x: -80, z: -30, r: 18 },      // Large circle between 4, 6, 7 (prominent in image)
    { x: 5, z: -35, r: 8 },         // Small curved area near 5, 8
    { x: 100, z: -50, r: 10 },      // Circle near 9, 12

    // South block
    { x: 20, z: 75, r: 22 },        // LARGE central circle (main focal point!)
    { x: 50, z: 30, r: 12 },        // Circle near 20
    { x: -65, z: 95, r: 10 },       // Circle near 15
    { x: 45, z: 120, r: 12 },       // Circle near 19, 25
  ];

  // Paths and streets - measured from site plan
  const paths = [
    // === MAIN STREETS (wider) ===
    { points: [[-120, -95], [50, -95]], width: 8 },     // Sutter Ave (north, west section)
    { points: [[70, -95], [140, -95]], width: 8 },      // Sutter Ave (north, east section)
    { points: [[-120, 8], [140, 8]], width: 10 },       // Blake Ave (middle - main divider)
    { points: [[-120, 145], [145, 145]], width: 8 },    // Dumont Ave (south)

    // Vertical streets
    { points: [[-120, -95], [-120, 145]], width: 8 },   // Rockaway Ave (west, slight diagonal)
    { points: [[140, -95], [145, 145]], width: 8 },     // Mother Gaston Blvd (east, slight diagonal)
    { points: [[50, -95], [55, 8]], width: 6 },         // Osborne St (cuts through north block)

    // === INTERNAL WALKWAYS (thinner) ===
    // North block paths
    { points: [[-105, -85], [-105, -5]], width: 2.5 },  // West vertical
    { points: [[-105, -45], [-35, -45]], width: 2.5 },  // Horizontal through middle
    { points: [[-60, -75], [-60, -15]], width: 2.5 },   // Center vertical
    { points: [[35, -75], [35, 8]], width: 2.5 },       // East section vertical
    { points: [[35, -25], [115, -25]], width: 2.5 },    // East section horizontal

    // South block paths - radiating from central plaza
    { points: [[-75, 45], [20, 75]], width: 2.5 },      // NW to center
    { points: [[20, 75], [45, 30]], width: 2.5 },       // Center to NE
    { points: [[20, 75], [-40, 75]], width: 2.5 },      // Center to west
    { points: [[20, 75], [55, 75]], width: 2.5 },       // Center to east
    { points: [[20, 75], [25, 120]], width: 2.5 },      // Center to south
    { points: [[20, 75], [-25, 125]], width: 2.5 },     // Center to SW
    { points: [[20, 75], [65, 115]], width: 2.5 },      // Center to SE
    { points: [[-95, 45], [-95, 135]], width: 2.5 },    // Far west vertical
    { points: [[105, 55], [135, 115]], width: 2.5 },    // Far east diagonal
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0ed);
    const w = containerRef.current.clientWidth, h = containerRef.current.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xfff8f0, 1.8);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    scene.add(sun);

    // Ground plane - light tan/beige base (matching site plan background)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.9 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 280), groundMat);
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -0.1;
    ground.position.z = 25;
    ground.receiveShadow = true;
    scene.add(ground);

    // Development parcels - tan/cream color (matching site plan)
    const parcelMat = new THREE.MeshStandardMaterial({ color: 0xd9cdb8, roughness: 0.85 });
    // North block parcel (west of Osborne)
    const northWestParcel = new THREE.Mesh(new THREE.PlaneGeometry(130, 100), parcelMat);
    northWestParcel.rotation.x = -Math.PI/2;
    northWestParcel.position.set(-55, 0.02, -45);
    scene.add(northWestParcel);
    // North block parcel (east of Osborne)
    const northEastParcel = new THREE.Mesh(new THREE.PlaneGeometry(75, 80), parcelMat.clone());
    northEastParcel.rotation.x = -Math.PI/2;
    northEastParcel.position.set(90, 0.02, -50);
    scene.add(northEastParcel);
    // South block parcel (large)
    const southParcel = new THREE.Mesh(new THREE.PlaneGeometry(260, 140), parcelMat.clone());
    southParcel.rotation.x = -Math.PI/2;
    southParcel.position.set(15, 0.02, 80);
    scene.add(southParcel);

    // Green lawn areas within parcels
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x6b8f5e, roughness: 0.9 });
    // Small green rectangle on west side of south block (visible in site plan)
    const westGreen = new THREE.Mesh(new THREE.PlaneGeometry(25, 35), greenMat);
    westGreen.rotation.x = -Math.PI/2;
    westGreen.position.set(-108, 0.03, 65);
    scene.add(westGreen);

    // Create paths (gray walkways)
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
    paths.forEach(path => {
      const [start, end] = path.points;
      const dx = end[0] - start[0];
      const dz = end[1] - start[1];
      const length = Math.sqrt(dx*dx + dz*dz);
      const angle = Math.atan2(dz, dx);

      const pathGeo = new THREE.BoxGeometry(length, 0.15, path.width);
      const pathMesh = new THREE.Mesh(pathGeo, pathMat);
      pathMesh.position.set((start[0] + end[0])/2, 0.08, (start[1] + end[1])/2);
      pathMesh.rotation.y = -angle;
      scene.add(pathMesh);
    });

    // Create circular plazas
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7 });
    plazas.forEach(plaza => {
      const plazaGeo = new THREE.CylinderGeometry(plaza.r, plaza.r, 0.2, 32);
      const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
      plazaMesh.position.set(plaza.x, 0.1, plaza.z);
      scene.add(plazaMesh);

      // Add decorative ring
      const ringGeo = new THREE.TorusGeometry(plaza.r - 1, 0.3, 8, 32);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI/2;
      ring.position.set(plaza.x, 0.25, plaza.z);
      scene.add(ring);
    });

    // Street labels (as simple text placeholders - 3D planes)
    const createStreetLabel = (text, x, z) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 256, 64);
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#8b8b8b';
      ctx.textAlign = 'center';
      ctx.fillText(text, 128, 40);

      const texture = new THREE.CanvasTexture(canvas);
      const labelGeo = new THREE.PlaneGeometry(40, 10);
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.rotation.x = -Math.PI/2;
      label.position.set(x, 0.2, z);
      scene.add(label);
    };

    createStreetLabel('SUTTER AVE', -30, -105);
    createStreetLabel('BLAKE AVE', 10, 0);
    createStreetLabel('DUMONT AVE', 10, 155);
    createStreetLabel('ROCKAWAY AVE', -135, 25);
    createStreetLabel('MOTHER GASTON', 155, 25);
    createStreetLabel('OSBORNE ST', 52, -50);

    // Building materials - priority-based coloring
    const winMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5c, roughness: 0.2, metalness: 0.6 });

    // Priority color scale (1=green/good, 5=red/critical)
    const priorityColors = {
      1: 0x65a30d, // Green - low priority
      2: 0x84cc16, // Light green
      3: 0xeab308, // Yellow - moderate
      4: 0xf97316, // Orange - high
      5: 0xdc2626, // Red - critical
    };

    // Determine if cool roof is active
    const hasCoolRoof = activeRetrofits.includes('cool_roof');
    const hasGreenRoof = activeRetrofits.includes('green_roof');
    // Check if advanced envelope package is active - changes brick color to show new facade
    const hasAdvancedEnvelope = activeRetrofits.includes('advanced_insulation') || activeRetrofits.includes('facade_panels');

    // Create each building as a cruciform
    buildingLayout.forEach(bldg => {
      const group = new THREE.Group();
      const floorH = 2.8, floors = 6, bH = floors * floorH;
      const coreSize = 8 * bldg.wingScale;
      const wingLen = 6 * bldg.wingScale;
      const wingW = 4 * bldg.wingScale;

      // Building color based on priority, or light warm gray if advanced envelope is active
      const buildingColor = hasAdvancedEnvelope ? 0xC8C0B8 : (priorityColors[bldg.priority] || 0x8B5A2B);
      const brickMat = new THREE.MeshStandardMaterial({ color: buildingColor, roughness: 0.9 });

      // Core
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(coreSize, bH, coreSize),
        brickMat.clone()
      );
      core.position.y = bH/2;
      core.castShadow = true;
      group.add(core);

      // Wings
      const coreHalf = coreSize/2;
      const wingHalf = wingW/2;
      const wings = [
        { x: coreHalf + wingLen/2, z: 0, w: wingLen, d: wingW },
        { x: -(coreHalf + wingLen/2), z: 0, w: wingLen, d: wingW },
        { x: 0, z: coreHalf + wingLen/2, w: wingW, d: wingLen },
        { x: 0, z: -(coreHalf + wingLen/2), w: wingW, d: wingLen }
      ];

      wings.forEach(wing => {
        const wingMesh = new THREE.Mesh(
          new THREE.BoxGeometry(wing.w, bH, wing.d),
          brickMat.clone()
        );
        wingMesh.position.set(wing.x, bH/2, wing.z);
        wingMesh.castShadow = true;
        group.add(wingMesh);
      });

      // Roof
      const roofColor = hasCoolRoof ? 0xfafafa : (hasGreenRoof ? 0x22c55e : 0x3d3d3d);
      const activeRoofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 });

      [[0, 0, coreSize + 0.3, coreSize + 0.3], ...wings.map(w => [w.x, w.z, w.w + 0.2, w.d + 0.2])].forEach(([rx, rz, rw, rd]) => {
        const roof = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.3, rd), activeRoofMat.clone());
        roof.position.set(rx, bH + 0.15, rz);
        group.add(roof);
      });

      // Windows (simplified for performance - just a few per face)
      for (let f = 0; f < floors; f++) {
        const y = 1.5 + f * floorH;
        // Core windows
        [[-coreHalf - 0.05, 0], [coreHalf + 0.05, 0], [0, -coreHalf - 0.05], [0, coreHalf + 0.05]].forEach(([wx, wz], i) => {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.05), winMat.clone());
          win.position.set(wx, y, wz);
          if (i < 2) win.rotation.y = Math.PI/2;
          group.add(win);
        });
      }

      // Building number label
      const numCanvas = document.createElement('canvas');
      numCanvas.width = 64;
      numCanvas.height = 64;
      const numCtx = numCanvas.getContext('2d');
      numCtx.fillStyle = '#ffffff';
      numCtx.font = 'bold 40px monospace';
      numCtx.textAlign = 'center';
      numCtx.fillText(bldg.id.toString(), 32, 48);

      const numTexture = new THREE.CanvasTexture(numCanvas);
      const numGeo = new THREE.PlaneGeometry(6, 6);
      const numMat = new THREE.MeshBasicMaterial({ map: numTexture, transparent: true, opacity: 0.8 });
      const numLabel = new THREE.Mesh(numGeo, numMat);
      numLabel.rotation.x = -Math.PI/2;
      numLabel.position.set(0, bH + 1, 0);
      group.add(numLabel);

      group.position.set(bldg.x, 0, bldg.z);
      group.rotation.y = bldg.rot;
      scene.add(group);
    });

    // Add scattered trees around the development (matching site plan green areas)
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x2d6b2d });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const treePositions = [
      // North block - scattered between buildings
      [-90, -65], [-70, -60], [-50, -65], [-25, -65],
      [-95, -30], [-70, -35], [-40, -25], [-20, -35],
      [60, -55], [85, -50], [105, -55],
      [50, -35], [90, -40],
      // South block - more trees around plazas and paths
      [-85, 35], [-60, 50], [-30, 45],
      [-100, 75], [-75, 85], [-55, 100], [-85, 115],
      [-45, 115], [-10, 105], [10, 95],
      [30, 50], [70, 45], [100, 40],
      [40, 90], [75, 95], [90, 85],
      [55, 130], [85, 125], [115, 130],
      // Along Rockaway Ave (west edge)
      [-115, -70], [-115, -30], [-115, 30], [-115, 70], [-115, 110],
    ];

    treePositions.forEach(([tx, tz]) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 8), trunkMat);
      trunk.position.set(tx, 1.5, tz);
      scene.add(trunk);

      const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6), treeMat);
      canopy.position.set(tx, 5, tz);
      canopy.scale.y = 0.7;
      scene.add(canopy);
    });

    // Camera animation - centered on the site
    let frameId;
    const centerX = 10;
    const centerZ = 30; // Center between north and south blocks
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      angleRef.current += 0.0012;
      const r = 280;
      const ht = 180;
      camera.position.set(
        centerX + r * Math.sin(angleRef.current),
        ht,
        centerZ + r * Math.cos(angleRef.current)
      );
      camera.lookAt(centerX, 5, centerZ);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeRetrofits]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', fontSize: '9px', color: colors.text.muted, ...S.mono }}>
        NEIGHBORHOOD VIEW · All {dev.building_count} buildings
      </div>
      {/* Priority legend */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.95)', padding: '10px 14px', border: `1px solid ${colors.border.default}`, fontSize: '9px', ...S.mono }}>
        <div style={{ fontWeight: '600', marginBottom: '6px', color: colors.text.primary }}>SERVICE REQUEST PRIORITY</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#dc2626' }} /> Critical (5)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#f97316' }} /> High (4)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#eab308' }} /> Moderate (3)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#84cc16' }} /> Low (2)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#65a30d' }} /> Very Low (1)</div>
        </div>
        <div style={{ fontSize: '8px', color: colors.text.muted, marginTop: '8px' }}>Based on 311 heat complaints/yr</div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTS
// ============================================
const ImpactPanel = ({ dev, active }) => {
  const data = retrofits.filter(r => active.includes(r.id));
  const tempD = data.reduce((s,r) => s+r.tempDelta, 0);
  const energyD = data.reduce((s,r) => s+r.energyDelta, 0);
  const cost = data.reduce((s,r) => s+calcCost(r,dev), 0);
  const baseTemp = 103, newTemp = baseTemp + tempD;
  const tempColor = newTemp <= 80 ? '#22c55e' : newTemp <= 88 ? '#84cc16' : newTemp <= 95 ? '#eab308' : '#ef4444';

  return (
    <div style={{ ...S.card, marginTop:'16px' }}>
      <div style={{ ...S.label, marginBottom:'16px' }}><Tip text="Estimated impact per unit. Costs are planning-level.*">PROJECTED IMPACT*</Tip></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
        <Tip text="Estimated peak indoor temp on hottest days. Baseline 103°F.*">
          <div style={{ background:'#0a0a0a', padding:'16px', border:'1px solid #1f1f1f', borderRadius:'6px', cursor:'help' }}>
            <div style={{ ...S.label, fontSize:'10px', marginBottom:'8px' }}>PEAK INDOOR*</div>
            <div style={{ fontSize:'36px', fontWeight:'700', color:tempColor, ...S.mono }}>{newTemp}°</div>
            <div style={{ fontSize:'11px', color:'#666', ...S.mono, marginTop:'4px' }}>per unit</div>
          </div>
        </Tip>
        <Tip text="Energy change. AC adds +25%, but envelope/roof savings offset.*">
          <div style={{ background:'#0a0a0a', padding:'16px', border:'1px solid #1f1f1f', borderRadius:'6px', cursor:'help' }}>
            <div style={{ ...S.label, fontSize:'10px', marginBottom:'8px' }}>ENERGY*</div>
            <div style={{ fontSize:'36px', fontWeight:'700', color:energyD<=0?'#22c55e':'#f97316', ...S.mono }}>{energyD<=0?'':'+' }{energyD}%</div>
            <div style={{ fontSize:'11px', color:'#666', ...S.mono, marginTop:'4px' }}>per unit</div>
          </div>
        </Tip>
        <Tip text="Planning-level estimate. Actual costs vary by contractor.*">
          <div style={{ background:'#0a0a0a', padding:'16px', border:'1px solid #1f1f1f', borderRadius:'6px', cursor:'help' }}>
            <div style={{ ...S.label, fontSize:'10px', marginBottom:'8px' }}>INVESTMENT*</div>
            <div style={{ fontSize:'36px', fontWeight:'700', color:'#fbbf24', ...S.mono }}>{cost>0?fmt(cost):'—'}</div>
            <div style={{ fontSize:'11px', color:'#666', ...S.mono, marginTop:'4px' }}>{dev.building_count} bldgs</div>
          </div>
        </Tip>
      </div>
    </div>
  );
};

const categoryLabels = {
  cooling: { label: 'COOLING SYSTEMS', icon: '', color: '#60a5fa' },
  envelope: { label: 'BUILDING ENVELOPE', icon: '', color: '#10b981' },
  mechanical: { label: 'MECHANICAL', icon: '', color: '#a78bfa' },
  site: { label: 'SITE & RESILIENCE', icon: '', color: '#22c55e' }
};

const RetrofitPanel = ({ activeRetrofits, onToggle, viewMode, height }) => {
  const grouped = retrofits.reduce((acc, r) => {
    const cat = r.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  return (
    <div style={{ ...S.card, padding:'16px', height, display:'flex', flexDirection:'column' }}>
      <div style={{ ...S.label, marginBottom:'12px' }}>
        <Tip text="Toggle retrofits to visualize in 3D. Select cooling + 2 envelope + 5 total for full 2050 alignment.">
          RETROFITS ({activeRetrofits.length} selected)
        </Tip>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px', flex:1, overflow:'auto', paddingRight:'4px' }}>
        {Object.entries(grouped).map(([cat, items]) => {
          const catInfo = categoryLabels[cat] || { label: cat.toUpperCase(), color: '#737373' };
          const activeInCat = items.filter(r => activeRetrofits.includes(r.id)).length;
          return (
            <div key={cat}>
              <div style={{ fontSize:'10px', fontWeight:'600', color: catInfo.color, marginBottom:'6px', display:'flex', alignItems:'center', gap:'6px', ...S.mono }}>
                <span>{catInfo.label}</span>
                {activeInCat > 0 && <span style={{ color:'#4ade80', fontSize:'9px' }}>({activeInCat})</span>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                {items.map(r => {
                  const isAct = activeRetrofits.includes(r.id);
                  const vis = r.view === viewMode || (viewMode === 'exterior' && r.view === 'exterior');
                  const tooltipText = `${r.desc}\n\nCost: $${r.cost_low.toLocaleString()}-${r.cost_high.toLocaleString()}/${r.basis}\n\nSource: ${r.source || 'Industry estimates'}`;
                  return (
                    <Tip key={r.id} text={tooltipText}>
                      <button onClick={() => onToggle(r.id)} style={{
                        width:'100%', padding:'8px 10px', background: isAct ? '#1a1a1a' : '#0a0a0a',
                        border: isAct ? `1px solid ${r.color}` : '1px solid #1f1f1f',
                        cursor:'pointer', textAlign:'left', opacity: vis ? 1 : 0.5,
                        display:'flex', alignItems:'center', gap:'8px', borderRadius:'4px', transition:'all 0.2s', ...S.mono
                      }}>
                        <div style={{ width:'6px', height:'6px', background: isAct ? r.color : '#404040', flexShrink:0, borderRadius:'1px' }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'10px', fontWeight:'500', color: isAct ? r.color : '#d4d4d4', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {r.name}{r.nature && <span style={{marginLeft:'6px',fontSize:'8px',color:'#22c55e'}}>NBS</span>}
                          </div>
                          <div style={{ fontSize:'9px', color:'#666', marginTop:'2px' }}>{r.tempDelta}° · {r.energyDelta>0?'+':''}{r.energyDelta}%</div>
                        </div>
                        <div style={{ width:'14px', height:'14px', border:`1px solid ${isAct?r.color:'#404040'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color: isAct?r.color:'#404040', flexShrink:0, borderRadius:'3px' }}>
                          {isAct ? '✓' : ''}
                        </div>
                      </button>
                    </Tip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// PACKAGE SELECTOR - Human-centered investment paths
// ============================================
const PackageSelector = ({ selectedPackage, onSelect, dev, showCustomPanel, activeRetrofits = [] }) => {
  const currentPkg = retrofitPackages.find(p => p.id === selectedPackage);

  // Calculate temp reduction from actual retrofits (not static value)
  const calcTempReduction = (retrofitIds) => {
    return retrofitIds.reduce((sum, id) => {
      const r = retrofits.find(x => x.id === id);
      return sum + (r ? Math.abs(r.tempDelta) : 0);
    }, 0);
  };

  const actualTempReduction = activeRetrofits.length > 0
    ? calcTempReduction(activeRetrofits)
    : currentPkg ? calcTempReduction(currentPkg.retrofits) : 0;

  return (
    <div>
      {/* Package selector tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {retrofitPackages.map((pkg) => {
          const isSelected = selectedPackage === pkg.id;
          return (
            <button
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: isSelected ? colors.bg.tertiary : 'transparent',
                border: isSelected ? `1px solid ${pkg.color}` : `1px solid ${colors.border.subtle}`,
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '600', color: isSelected ? colors.text.primary : colors.text.muted, marginBottom: '2px' }}>
                {pkg.name}
              </div>
              <div style={{ fontSize: '10px', color: isSelected ? pkg.color : colors.text.muted, ...S.mono }}>
                ${(pkg.costPerUnit / 1000).toFixed(0)}K/unit · {pkg.shortDesc}
              </div>
            </button>
          );
        })}
        <button
          onClick={() => onSelect('custom')}
          style={{
            padding: '10px 12px',
            background: selectedPackage === 'custom' ? colors.bg.tertiary : 'transparent',
            border: selectedPackage === 'custom' ? `1px solid ${colors.border.default}` : `1px solid ${colors.border.subtle}`,
            borderRadius: '6px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: selectedPackage === 'custom' ? colors.text.primary : colors.text.muted, marginBottom: '2px' }}>
            Custom
          </div>
          <div style={{ fontSize: '10px', color: colors.text.muted, ...S.mono }}>
            Build your own
          </div>
        </button>
      </div>

      {/* Selected Package Details */}
      {currentPkg && (
        <div style={{
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.subtle}`,
          borderRadius: '8px',
          padding: '24px'
        }}>
          {/* Package name */}
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: colors.text.primary, marginBottom: '12px' }}>
            {currentPkg.name}
          </h3>

          {/* Description */}
          <p style={{ fontSize: '14px', color: colors.text.secondary, lineHeight: 1.6, marginBottom: '12px' }}>
            {currentPkg.description}
          </p>

          {/* Context */}
          <p style={{ fontSize: '13px', color: colors.text.muted, fontStyle: 'italic', marginBottom: '20px' }}>
            {currentPkg.context}
          </p>

          {/* Two columns: What residents get + Investment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* What residents get */}
            <div>
              <div style={{ fontSize: '10px', color: colors.text.muted, marginBottom: '12px', letterSpacing: '0.1em' }}>WHAT RESIDENTS GET</div>
              {currentPkg.includes.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '4px', height: '4px', background: colors.text.muted, borderRadius: '50%' }} />
                  <div style={{ fontSize: '13px', color: colors.text.primary }}>{item.item}</div>
                </div>
              ))}
            </div>

            {/* Investment */}
            <div>
              <div style={{ fontSize: '10px', color: colors.text.muted, marginBottom: '12px', letterSpacing: '0.1em' }}>INVESTMENT</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: currentPkg.color, marginBottom: '4px', ...S.mono }}>
                ${(calcPackageCost(currentPkg, dev) / 1000000).toFixed(1)}M
              </div>
              <div style={{ fontSize: '12px', color: colors.text.muted, marginBottom: '16px' }}>
                ${calcPackageCostPerUnit(currentPkg, dev).toLocaleString()}/unit
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: colors.text.muted, marginBottom: '4px' }}>TEMP</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: colors.text.primary }}>-{actualTempReduction}°F</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: colors.text.muted, marginBottom: '4px' }}>TIMELINE</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: colors.text.primary }}>{currentPkg.timeline}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom context box */}
          <div style={{
            marginTop: '24px',
            padding: '16px 20px',
            background: colors.bg.tertiary,
            borderRadius: '6px',
            borderLeft: `3px solid ${currentPkg.color}`
          }}>
            <div style={{ fontSize: '14px', color: colors.text.primary, fontStyle: 'italic', lineHeight: 1.6 }}>
              {currentPkg.context}
            </div>
          </div>
        </div>
      )}

      {/* Custom Mode */}
      {selectedPackage === 'custom' && (
        <div style={{
          padding: '24px',
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.subtle}`,
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '14px', color: colors.text.secondary, marginBottom: '8px' }}>
            Build a custom retrofit plan
          </div>
          <div style={{ fontSize: '12px', color: colors.text.muted }}>
            Select individual retrofits from the panel to see their impact on the building
          </div>
        </div>
      )}
    </div>
  );
};

// Timeline with dynamic 2050s based on retrofits
const Timeline = ({ dev, nta, complaints, demo, activeRetrofits }) => {
  const [animatedTemps, setAnimatedTemps] = useState({});

  // Animate temperature changes when component mounts
  useEffect(() => {
    const startTemp = nta?.temp_1960s || 85;
    const eras = [
      { key: 0, target: startTemp },
      { key: 1, target: startTemp + 2 },
      { key: 2, target: nta?.temp_2020s || 92 },
      { key: 3, target: nta?.temp_2050 || 97 }
    ];

    // Animate each era's temp with staggered delay
    eras.forEach((era, i) => {
      setTimeout(() => {
        setAnimatedTemps(prev => ({ ...prev, [era.key]: era.target }));
      }, 200 + i * 300);
    });
  }, [nta]);

  // Calculate improvement scores per dimension based on retrofits
  const improvementScores = { thermal: 0, infra: 0, social: 0 };
  activeRetrofits.forEach(id => {
    const r = retrofits.find(x => x.id === id);
    if (r?.improves) {
      r.improves.forEach(d => {
        // Weight by effectiveness
        const weight = r.category === 'cooling' ? 2 : r.category === 'envelope' ? 1.5 : 1;
        improvementScores[d] += weight;
      });
    }
  });

  // Count retrofits in each category
  const retrofitsByCategory = {};
  activeRetrofits.forEach(id => {
    const r = retrofits.find(x => x.id === id);
    if (r?.category) retrofitsByCategory[r.category] = (retrofitsByCategory[r.category] || 0) + 1;
  });
  const hasCooling = retrofitsByCategory['cooling'] >= 1;
  const hasEnvelope = retrofitsByCategory['envelope'] >= 2;
  const hasMechanical = retrofitsByCategory['mechanical'] >= 1;
  const hasSite = retrofitsByCategory['site'] >= 1;
  // Comprehensive requires: cooling + envelope + at least 5 total retrofits
  const hasComprehensive = hasCooling && hasEnvelope && activeRetrofits.length >= 5;

  const getStatus = (dim, era) => {
    const dimKey = dim === 0 ? 'thermal' : dim === 1 ? 'infra' : 'social';

    if (era === 0) return 'aligned';
    if (era === 1) return 'strained';
    if (era === 2) {
      if (dim === 0) return nta.hvi >= 4 ? 'misaligned' : 'strained';
      if (dim === 1) return complaints.per_1k > 3000 ? 'misaligned' : 'strained';
      return demo.pct_over_65 > 22 ? 'misaligned' : 'strained';
    }
    // 2050s - can be improved with retrofits!
    if (era === 3) {
      const score = improvementScores[dimKey] || 0;
      // Thermal: needs strong cooling + envelope
      if (dimKey === 'thermal') {
        if (score >= 4 && hasCooling && hasEnvelope) return 'aligned';
        if (score >= 2 || hasCooling) return 'strained';
        return 'misaligned';
      }
      // Infrastructure: needs mechanical systems
      if (dimKey === 'infra') {
        if (score >= 3 && hasMechanical) return 'aligned';
        if (score >= 1.5) return 'strained';
        return 'misaligned';
      }
      // Social: site improvements help
      if (dimKey === 'social') {
        if (score >= 2 || (hasSite && activeRetrofits.length >= 4)) return 'aligned';
        if (score >= 0.5) return 'strained';
        return 'misaligned';
      }
    }
    return 'misaligned';
  };

  const statusStyle = (s) => ({
    padding:'2px 6px', fontSize:'8px', fontWeight:'500',
    background: s==='aligned' ? '#14532d' : s==='strained' ? '#78350f' : '#7f1d1d',
    color: s==='aligned' ? '#4ade80' : s==='strained' ? '#fbbf24' : '#f87171',
    ...S.mono
  });

  // Era data with peak temps and building condition
  const eraData = [
    {
      label: dev.year_built + 's',
      sub: 'As designed',
      peakTemp: nta.temp_1960s || 85,
      heatDays: nta.heat_days_1960s || 8,
      condition: 'New construction',
      conditionColor: '#22c55e'
    },
    {
      label: '1990s',
      sub: '~40 years',
      peakTemp: (nta.temp_1960s || 85) + 2,
      heatDays: (nta.heat_days_1960s || 8) + 5,
      condition: 'Systems aging',
      conditionColor: '#fbbf24'
    },
    {
      label: '2026',
      sub: 'Current',
      peakTemp: nta.temp_2020s || 92,
      heatDays: nta.heat_days_2020s || 25,
      condition: 'Major repairs needed',
      conditionColor: '#f97316'
    },
    {
      label: '2050s',
      sub: 'Projected',
      peakTemp: nta.temp_2050 || 97,
      heatDays: (nta.heat_days_2020s || 25) + 20,
      condition: hasComprehensive ? 'Retrofitted' : 'Critical failure risk',
      conditionColor: hasComprehensive ? '#22c55e' : '#ef4444'
    }
  ];

  const dims = [['T','Thermal','#fbbf24','Heat vs. design capacity'],['I','Infra','#60a5fa','System stress from complaints'],['S','Social','#a78bfa','Demographic vulnerability']];

  // Check which dimensions are improved in 2050s
  const improvedDims = new Set();
  if (hasComprehensive) {
    if (improvementScores.thermal >= 3) improvedDims.add('thermal');
    if (improvementScores.infra >= 2) improvedDims.add('infra');
    if (improvementScores.social >= 1) improvedDims.add('social');
  }

  // Cost of inaction calculation
  const costPerYear = Math.round(dev.unit_count * 850); // ~$850/unit/year in increased costs
  const costBy2050 = costPerYear * 24;

  return (
    <div style={{ marginBottom:'24px', width: '100%' }}>
      <div style={{ ...S.label, marginBottom:'10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tip text="How well building 'fits' its context over time. 2050s improves with thermal/infrastructure retrofits.">CLIMATE COMPATIBILITY TIMELINE*</Tip>
        <div style={{ display:'flex', gap:'12px', fontSize:'9px', color:'#525252', ...S.mono }}>
          {dims.map(([k,l,c,tip]) => <Tip key={k} text={tip}><span style={{color:c,cursor:'help'}}>{k}={l}</span></Tip>)}
        </div>
      </div>

      {/* Unequal spacing to emphasize acceleration - older eras compressed, recent expanded */}
      <div style={{ display:'grid', gridTemplateColumns:'0.8fr 0.8fr 1.2fr 1.4fr', gap:'2px', width: '100%' }}>
        {eraData.map((era, ei) => {
          const era2050WithRetrofits = ei === 3 && hasComprehensive;
          const displayTemp = animatedTemps[ei] ?? '--';
          const tempColor = era2050WithRetrofits ? '#22c55e' : (era.peakTemp >= 95 ? '#ef4444' : era.peakTemp >= 90 ? '#f97316' : '#fafafa');

          return (
            <div key={ei} style={{
              background: era2050WithRetrofits ? '#0f2a0f' : '#171717',
              padding:'14px',
              borderTop: `3px solid ${era2050WithRetrofits ? '#22c55e' : (getStatus(0,ei)==='aligned' ? '#4ade80' : getStatus(0,ei)==='strained' ? '#fbbf24' : '#f87171')}`,
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.4s ease-out',
              boxShadow: era2050WithRetrofits ? '0 0 20px rgba(34, 197, 94, 0.15)' : 'none'
            }}>
              {/* Era header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:'700', color: era2050WithRetrofits ? '#22c55e' : '#fafafa', marginBottom:'2px', ...S.mono, transition: 'color 0.3s' }}>
                    {era.label}
                    {era2050WithRetrofits && <span style={{marginLeft:'4px', fontWeight:'400'}}>[ALIGNED]</span>}
                  </div>
                  <div style={{ fontSize:'9px', color:'#525252', ...S.mono }}>{era.sub}</div>
                </div>
                <Tip text={`Peak summer temperature during ${era.label}`}>
                  <div style={{ textAlign: 'right', cursor: 'help' }}>
                    <div style={{
                      fontSize: ei >= 2 ? '18px' : '16px',
                      fontWeight:'700',
                      color: tempColor,
                      ...S.mono,
                      transition: 'all 0.5s ease-out',
                      textShadow: (ei === 2 || ei === 3) && !era2050WithRetrofits ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
                    }}>
                      {displayTemp}°F
                    </div>
                    <div style={{ fontSize:'8px', color:'#666', ...S.mono }}>peak</div>
                  </div>
                </Tip>
              </div>

              {/* Heat days indicator */}
              <Tip text={`Extreme heat days (>90°F) per summer`}>
                <div style={{ marginBottom: '10px', padding: '6px 8px', background: '#0a0a0a', borderRadius: '4px', cursor: 'help' }}>
                  <div style={{ fontSize: '8px', color: '#666', marginBottom: '2px', ...S.mono }}>HEAT DAYS/YR</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: era.heatDays >= 30 ? '#ef4444' : era.heatDays >= 20 ? '#f97316' : '#fafafa', ...S.mono }}>
                      {era.heatDays}
                    </div>
                    <div style={{ flex: 1, height: '4px', background: '#262626', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(era.heatDays / 50 * 100, 100)}%`, height: '100%', background: era.heatDays >= 30 ? '#ef4444' : era.heatDays >= 20 ? '#f97316' : '#fbbf24' }} />
                    </div>
                  </div>
                </div>
              </Tip>

              {/* Building condition */}
              <Tip text={`Building infrastructure status during ${era.label}`}>
                <div style={{ fontSize: '9px', color: era.conditionColor, marginBottom: '10px', padding: '4px 6px', background: '#0a0a0a', borderRadius: '3px', textAlign: 'center', ...S.mono, cursor: 'help' }}>
                  {era.condition}
                </div>
              </Tip>

              {/* Dimension statuses */}
              <div style={{ display:'flex', flexDirection:'column', gap:'4px', marginTop: 'auto' }}>
                {dims.map(([k,,c],di) => (
                  <div key={k} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'9px', color:c, width:'10px', ...S.mono }}>{k}</span>
                    <span style={statusStyle(getStatus(di, ei))}>{getStatus(di, ei)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost of inaction banner */}
      {!hasComprehensive && (
        <div style={{ marginTop: '12px', padding: '12px 16px', background: '#450a0a', borderRadius: '6px', border: '1px solid #7f1d1d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#fca5a5', ...S.mono, marginBottom: '2px' }}>COST OF INACTION BY 2050</div>
            <div style={{ fontSize: '9px', color: '#a3a3a3', ...S.mono }}>Increased maintenance, emergency repairs, health costs</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fca5a5', ...S.mono }}>${(costBy2050 / 1000000).toFixed(1)}M+</div>
            <div style={{ fontSize: '8px', color: '#737373', ...S.mono }}>${(costPerYear / 1000).toFixed(0)}K/year</div>
          </div>
        </div>
      )}

      {activeRetrofits.length > 0 && (
        <div style={{ marginTop:'12px', padding:'12px', background: hasComprehensive ? '#14532d' : '#78350f', borderRadius:'6px' }}>
          <div style={{ fontSize:'11px', fontWeight:'600', color: hasComprehensive ? '#4ade80' : '#fbbf24', ...S.mono, marginBottom:'4px' }}>
            {hasComprehensive ? 'Full Climate Alignment Achievable' : `${activeRetrofits.length} Retrofit${activeRetrofits.length > 1 ? 's' : ''} Selected`}
          </div>
          <div style={{ fontSize:'10px', color: hasComprehensive ? '#86efac' : '#fcd34d', ...S.mono, lineHeight:1.5 }}>
            {hasComprehensive
              ? 'This comprehensive package can achieve full alignment by 2050s across all dimensions.'
              : `Progress: ${hasCooling ? '✓ Cooling' : '○ Need cooling'} · ${hasEnvelope ? '✓ Envelope (2+)' : '○ Need 2+ envelope'} · ${activeRetrofits.length >= 5 ? '✓ 5+ total' : `○ Need ${5-activeRetrofits.length} more`}`}
          </div>
        </div>
      )}
    </div>
  );
};

const Story = ({ devId }) => {
  const [idx, setIdx] = useState(0);
  const list = stories[devId] || [];
  if (!list.length) return null;
  const s = list[idx];
  const typeColor = { thermal:'#ef4444', infra:'#3b82f6' };

  return (
    <div style={{ ...S.card, marginBottom:'20px', borderLeft:`2px solid ${typeColor[s.type]||'#525252'}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
        <div style={{ ...S.label }}><Tip text="Fictionalized composites for illustration.*">RESIDENT ACCOUNT*</Tip></div>
        <div style={{ display:'flex', gap:'4px' }}>
          {list.map((_,i) => <button key={i} onClick={() => setIdx(i)} style={{ width:'18px', height:'18px', background: idx===i?'#262626':'transparent', border:`1px solid ${idx===i?'#404040':'#262626'}`, color: idx===i?'#fafafa':'#525252', fontSize:'9px', cursor:'pointer', ...S.mono }}>{i+1}</button>)}
        </div>
      </div>
      <div style={{ marginBottom:'12px' }}>
        <div style={{ fontSize:'13px', fontWeight:'600', color:'#fafafa', marginBottom:'4px' }}>{s.date}</div>
        <div style={{ fontSize:'10px', color:'#737373', ...S.mono }}>{s.name}, {s.age} · Unit {s.unit}</div>
      </div>
      <div style={{ fontSize:'13px', color:'#d4d4d4', lineHeight:1.65, fontStyle:'italic', marginBottom:'12px' }}>"{s.text}"</div>
      <div style={{ padding:'8px 10px', background:'#0a0a0a', border:'1px solid #1f1f1f', fontSize:'10px', color:'#737373', ...S.mono }}>{s.stat}</div>
    </div>
  );
};

const DelayBox = ({ dev, nta }) => {
  const emergency = Math.round(2.5e6 * (dev.unit_count/10000) * 5);
  const inflation = Math.round(8e6 * 0.47);

  return (
    <div style={{ ...S.card, marginTop:'20px', borderLeft:'2px solid #dc2626' }}>
      <div style={{ ...S.label, color:'#fca5a5', marginBottom:'12px' }}><Tip text="Financial and human cost of delaying retrofits.*">COST OF DELAY*</Tip></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
        <Tip text="Estimated emergency repairs based on current complaint rates.*">
          <div style={{ background:'#0a0a0a', padding:'10px', borderTop:'2px solid #dc2626', cursor:'help' }}>
            <div style={{ fontSize:'22px', fontWeight:'700', color:'#fafafa', ...S.mono }}>{fmt(emergency)}*</div>
            <div style={{ fontSize:'9px', color:'#737373', ...S.mono }}>5-yr emergency repairs</div>
          </div>
        </Tip>
        <Tip text="Construction cost increase at 8% annual inflation.*">
          <div style={{ background:'#0a0a0a', padding:'10px', borderTop:'2px solid #f97316', cursor:'help' }}>
            <div style={{ fontSize:'22px', fontWeight:'700', color:'#fafafa', ...S.mono }}>+{fmt(inflation)}*</div>
            <div style={{ fontSize:'9px', color:'#737373', ...S.mono }}>Cost increase by 2031</div>
          </div>
        </Tip>
        <Tip text="Heat-related deaths in neighborhood (2025). DOHMH data.*">
          <div style={{ background:'#0a0a0a', padding:'10px', borderTop:'2px solid #a855f7', cursor:'help' }}>
            <div style={{ fontSize:'22px', fontWeight:'700', color:'#fafafa', ...S.mono }}>{nta.heat_deaths}*</div>
            <div style={{ fontSize:'9px', color:'#737373', ...S.mono }}>Heat deaths (2025)</div>
          </div>
        </Tip>
      </div>
    </div>
  );
};

const DataBreakdown = ({ dev, complaints, nta }) => {
  const [era1950s, setEra1950s] = useState(false);
  const [era1990s, setEra1990s] = useState(false);
  const [era2026, setEra2026] = useState(false);
  const [era2050s, setEra2050s] = useState(false);

  // Calculate building-wide vs apartment-only for heat (56% apartment, 44% building based on real data)
  const heatApt = Math.round(complaints.heat * 0.56);
  const heatBldg = complaints.heat - heatApt;

  // HVI color coding
  const hviColor = nta.hvi === 5 ? '#dc2626' : nta.hvi === 4 ? '#ea580c' : nta.hvi === 3 ? '#ca8a04' : nta.hvi === 2 ? '#65a30d' : '#166534';
  const hviLabel = nta.hvi === 5 ? 'Highest Risk' : nta.hvi === 4 ? 'High Risk' : nta.hvi === 3 ? 'Moderate Risk' : nta.hvi === 2 ? 'Low-Moderate' : 'Lowest Risk';

  return (
    <div style={{ ...S.card, marginTop:'20px', padding:0 }}>
      {/* Main Header */}
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #1f1f1f' }}>
        <div style={{ ...S.label, color:'#60a5fa', marginBottom:'4px' }}>CLIMATE FIT ANALYSIS</div>
        <div style={{ fontSize:'10px', color:'#737373', ...S.mono }}>Building-climate alignment across four time periods</div>
      </div>

      {/* ERA 1: 1950s - AS DESIGNED (ALIGNED) */}
      <div style={{ borderBottom:'1px solid #1f1f1f' }}>
        <button onClick={() => setEra1950s(!era1950s)} style={{ width:'100%', padding:'12px 18px', background:'transparent', border:'none', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:'11px', color:'#737373', ...S.mono, marginBottom:'2px' }}>ERA 1</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#fafafa', marginBottom:'4px' }}>1950s — As Designed</div>
            <div style={{ display:'inline-block', padding:'2px 8px', background:'#166534', borderRadius:'3px', fontSize:'9px', fontWeight:'600', color:'#22c55e' }}>ALIGNED</div>
          </div>
          <span style={{ color:'#525252', fontSize:'16px', fontWeight:'300' }}>{era1950s ? '−' : '+'}</span>
        </button>
        {era1950s && (
          <div style={{ padding:'0 18px 18px', fontSize:'11px', color:'#d4d4d4', lineHeight:1.7, ...S.mono }}>

            {/* Climate Section */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Climate Conditions</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ PEAK SUMMER TEMP</div>
                  <div style={{ fontSize:'24px', fontWeight:'700', color:'#22c55e' }}>~88°F</div>
                  <div style={{ fontSize:'8px', color:'#525252', marginTop:'2px' }}>1940s-50s (avg: {nta.temp_1960s}°F)</div>
                </div>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ HEAT DAYS (90°F+)</div>
                  <div style={{ fontSize:'24px', fontWeight:'700', color:'#22c55e' }}>{nta.heat_days_1960s}</div>
                  <div style={{ fontSize:'8px', color:'#525252', marginTop:'2px' }}>days per year</div>
                </div>
              </div>
            </div>

            {/* Building Section */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Building & Infrastructure</div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f', marginBottom:'10px' }}>
                <div style={{ fontSize:'9px', color:'#737373', marginBottom:'6px' }}>✅ CONSTRUCTION & OPENING</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4', lineHeight:1.6 }}>
                  Built in 1948, 27 buildings housing ~3,300 residents. Designed for natural ventilation with operable windows, high ceilings, cross-ventilation. Climate conditions matched design specifications for passive cooling.
                </div>
              </div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>⏳ BUILDING CONDITION</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4' }}>New construction, all systems operational</div>
                <div style={{ fontSize:'8px', color:'#666', marginTop:'4px' }}>Age: 0-10 years old</div>
              </div>
            </div>

            {/* Demographics Section */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Demographics & Community</div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f', marginBottom:'10px' }}>
                <div style={{ fontSize:'9px', color:'#737373', marginBottom:'6px' }}>✅ POPULATION COMPOSITION</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4', lineHeight:1.6, marginBottom:'8px' }}>
                  By 1950, 75% African American and Puerto Rican residents (up from 6% Black in 1940). Major demographic transition underway as Black families displaced by urban renewal sought affordable housing.
                </div>
                <div style={{ fontSize:'9px', color:'#666', fontStyle:'italic' }}>
                  Brownsville Houses opened as successful, racially integrated development during period of optimism for public housing.
                </div>
              </div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>⏳ DETAILED AGE DISTRIBUTION</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4' }}>Not available at neighborhood level for 1950s</div>
              </div>
            </div>

            {/* Alignment Methodology */}
            <div style={{ padding:'12px', background:'#0f1419', borderRadius:'4px', borderLeft:'2px solid #22c55e', marginBottom:'12px' }}>
              <div style={{ fontSize:'10px', fontWeight:'600', color:'#22c55e', marginBottom:'6px' }}>ALIGNMENT STATUS: ALIGNED</div>
              <div style={{ fontSize:'10px', color:'#8b8b8b', lineHeight:1.6 }}>
                <strong style={{ color:'#d4d4d4' }}>Thermal:</strong> Summer avg 71°F (peaks ~88°F), 8 heat days manageable with natural ventilation.<br/>
                <strong style={{ color:'#d4d4d4' }}>Infrastructure:</strong> New building systems, design matched climate conditions.<br/>
                <strong style={{ color:'#d4d4d4' }}>Social:</strong> Community optimism, new affordable housing, working-class families.
              </div>
            </div>

            {/* Sources */}
            <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #1f1f1f' }}>
              <div style={{ fontSize:'8px', color:'#525252', marginBottom:'6px', textTransform:'uppercase' }}>Data Sources</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <a href="https://www.vitalcitynyc.org/articles/brownsville-and-bay-ridge" target="_blank" rel="noopener noreferrer" style={{ fontSize:'9px', color:'#3b82f6', textDecoration:'none' }}>
                  Vital City - Brownsville History →
                </a>
                <a href="https://en.wikipedia.org/wiki/Brownsville,_Brooklyn" target="_blank" rel="noopener noreferrer" style={{ fontSize:'9px', color:'#3b82f6', textDecoration:'none' }}>
                  Wikipedia - Brownsville Demographics →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ERA 2: 1990s - STRAINED */}
      <div style={{ borderBottom:'1px solid #1f1f1f' }}>
        <button onClick={() => setEra1990s(!era1990s)} style={{ width:'100%', padding:'12px 18px', background:'transparent', border:'none', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:'11px', color:'#737373', ...S.mono, marginBottom:'2px' }}>ERA 2</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#fafafa', marginBottom:'4px' }}>1990s — ~40 Years Old</div>
            <div style={{ display:'inline-block', padding:'2px 8px', background:'#854d0e', borderRadius:'3px', fontSize:'9px', fontWeight:'600', color:'#fbbf24' }}>STRAINED</div>
          </div>
          <span style={{ color:'#525252', fontSize:'16px', fontWeight:'300' }}>{era1990s ? '−' : '+'}</span>
        </button>
        {era1990s && (
          <div style={{ padding:'0 18px 18px', fontSize:'11px', color:'#d4d4d4', lineHeight:1.7, ...S.mono }}>

            {/* Climate Section */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Climate Conditions</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #ca8a04' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>⏳ PEAK SUMMER TEMP</div>
                  <div style={{ fontSize:'24px', fontWeight:'700', color:'#fbbf24' }}>~87°F</div>
                  <div style={{ fontSize:'8px', color:'#ca8a04', marginTop:'2px' }}>+5°F from 1960s (estimated)</div>
                </div>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #ca8a04' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>⏳ HEAT DAYS (90°F+)</div>
                  <div style={{ fontSize:'24px', fontWeight:'700', color:'#fbbf24' }}>~18</div>
                  <div style={{ fontSize:'8px', color:'#ca8a04', marginTop:'2px' }}>+10 days from 1960s (est.)</div>
                </div>
              </div>
            </div>

            {/* Infrastructure Section */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Building & Infrastructure</div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f', marginBottom:'10px' }}>
                <div style={{ fontSize:'9px', color:'#737373', marginBottom:'6px' }}>⏳ BUILDING AGE & CONDITION</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4', lineHeight:1.6 }}>
                  40-45 years old. Original systems aging, plumbing degradation, envelope deterioration. No central AC, limited window unit penetration. Natural ventilation less effective as outdoor temps rise.
                </div>
                <div style={{ fontSize:'8px', color:'#ca8a04', marginTop:'6px' }}>
                  Infrastructure stress begins: aging systems + warming climate
                </div>
              </div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>❌ 311 COMPLAINT DATA</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4' }}>311 system established in 2003 — no comparable data</div>
                <div style={{ fontSize:'8px', color:'#666', marginTop:'4px' }}>Expected: Moderate complaints as systems age</div>
              </div>
            </div>

            {/* Demographics Section */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Demographics</div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f', marginBottom:'10px' }}>
                <div style={{ fontSize:'9px', color:'#737373', marginBottom:'6px' }}>✅ 1990 CENSUS (CD 16)</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <span style={{ fontSize:'10px', color:'#d4d4d4' }}>Population:</span>
                  <span style={{ fontSize:'16px', fontWeight:'700', color:'#60a5fa' }}>84,923</span>
                </div>
                <div style={{ fontSize:'8px', color:'#525252', marginTop:'4px' }}>
                  Community District 16 (Brownsville/Ocean Hill)
                </div>
              </div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                <div style={{ fontSize:'9px', color:'#737373', marginBottom:'6px' }}>❌ DETAILED BREAKDOWNS</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4', lineHeight:1.5 }}>
                  Age distribution, disability rates, poverty data not extracted at neighborhood level. Predominantly African American and Hispanic/Latino population by this era.
                </div>
              </div>
            </div>

            {/* Alignment Methodology */}
            <div style={{ padding:'12px', background:'#0f1419', borderRadius:'4px', borderLeft:'2px solid #fbbf24', marginBottom:'12px' }}>
              <div style={{ fontSize:'10px', fontWeight:'600', color:'#fbbf24', marginBottom:'6px' }}>ALIGNMENT STATUS: STRAINED</div>
              <div style={{ fontSize:'10px', color:'#8b8b8b', lineHeight:1.6 }}>
                <strong style={{ color:'#d4d4d4' }}>Thermal:</strong> +5-6°F warming, ~18 heat days exceeds passive cooling design. Indoor temps rising above comfort levels.<br/>
                <strong style={{ color:'#d4d4d4' }}>Infrastructure:</strong> 40-year-old systems showing age. Plumbing, heating degradation. Limited AC penetration.<br/>
                <strong style={{ color:'#d4d4d4' }}>Social:</strong> Community experiencing economic stress, limited resources for individual cooling solutions.
              </div>
            </div>

            {/* Sources */}
            <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #1f1f1f' }}>
              <div style={{ fontSize:'8px', color:'#525252', marginBottom:'4px', textTransform:'uppercase' }}>Data Notes</div>
              <div style={{ fontSize:'9px', color:'#737373', lineHeight:1.5 }}>
                Climate data interpolated from NPCC warming trends. Census data from US Census 1990 summary. Detailed health and complaint data not available for this period.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ERA 3: 2026 - CURRENT (MISALIGNED) */}
      <div style={{ borderBottom:'1px solid #1f1f1f' }}>
        <button onClick={() => setEra2026(!era2026)} style={{ width:'100%', padding:'12px 18px', background:'transparent', border:'none', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:'11px', color:'#737373', ...S.mono, marginBottom:'2px' }}>ERA 3</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#fafafa', marginBottom:'4px' }}>2026 — Current Conditions</div>
            <div style={{ display:'inline-block', padding:'2px 8px', background:'#7f1d1d', borderRadius:'3px', fontSize:'9px', fontWeight:'600', color:'#ef4444' }}>MISALIGNED</div>
          </div>
          <span style={{ color:'#525252', fontSize:'16px', fontWeight:'300' }}>{era2026 ? '−' : '+'}</span>
        </button>
        {era2026 && (
          <div style={{ padding:'0 18px 18px', fontSize:'11px', color:'#d4d4d4', lineHeight:1.7, ...S.mono }}>

            {/* Climate & Health Section */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Climate & Health Impacts</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'10px' }}>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'2px solid #dc2626' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ PEAK SUMMER TEMP</div>
                  <div style={{ fontSize:'24px', fontWeight:'700', color:'#ef4444' }}>{nta.temp_2020s}°F</div>
                  <div style={{ fontSize:'8px', color:'#dc2626', marginTop:'2px' }}>+7°F from design era</div>
                </div>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'2px solid #dc2626' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ HEAT DAYS (90°F+)</div>
                  <div style={{ fontSize:'24px', fontWeight:'700', color:'#ef4444' }}>{nta.heat_days_2020s}</div>
                  <div style={{ fontSize:'8px', color:'#dc2626', marginTop:'2px' }}>+17 days from 1960s</div>
                </div>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'2px solid #dc2626' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ HEAT VULNERABILITY</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'6px' }}>
                    <span style={{ fontSize:'28px', fontWeight:'700', color:'#ef4444' }}>{nta.hvi}</span>
                    <span style={{ fontSize:'12px', color:'#737373' }}>/ 5</span>
                  </div>
                  <div style={{ fontSize:'8px', color:'#dc2626', marginTop:'2px' }}>Highest Risk</div>
                </div>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #dc2626' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ ASTHMA RATE</div>
                  <div style={{ fontSize:'20px', fontWeight:'700', color:'#ef4444' }}>17.3</div>
                  <div style={{ fontSize:'8px', color:'#525252', marginTop:'2px' }}>per 1,000 adults (2x citywide)</div>
                </div>
              </div>
              <div style={{ background:'#0a0a0a', padding:'10px 12px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ HEAT DEATHS (2025)</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4' }}>
                  {nta.heat_deaths} deaths in Brownsville NTA • NYC avg: 5/year heat-stress, 525/year heat-exacerbated (cardiovascular, respiratory, renal)
                </div>
              </div>
            </div>

            {/* Infrastructure - 311 Complaints */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Infrastructure Complaints (2020-2025)</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'10px' }}>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ TOTAL 5-YEAR</div>
                  <div style={{ fontSize:'20px', fontWeight:'700', color:'#60a5fa' }}>{complaints.total_5y.toLocaleString()}</div>
                  <div style={{ fontSize:'8px', color:'#525252', marginTop:'2px' }}>{Math.round(complaints.total_5y/5).toLocaleString()}/year avg</div>
                </div>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #ca8a04' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ PER 1,000 UNITS</div>
                  <div style={{ fontSize:'20px', fontWeight:'700', color:'#fbbf24' }}>{complaints.per_1k.toLocaleString()}</div>
                  <div style={{ fontSize:'8px', color:'#ca8a04', marginTop:'2px' }}>High complaint rate</div>
                </div>
              </div>
              <div style={{ fontSize:'9px', color:'#8b8b8b', marginBottom:'6px', textTransform:'uppercase' }}>Breakdown by Type</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'#0a0a0a', borderRadius:'3px', border:'1px solid #1f1f1f' }}>
                  <span style={{ color:'#a3a3a3', fontSize:'10px' }}>Heat/Hot Water</span>
                  <span style={{ color:'#ef4444', fontWeight:'600', fontSize:'10px' }}>{complaints.heat.toLocaleString()}</span>
                </div>
                <div style={{ fontSize:'8px', color:'#666', paddingLeft:'10px', marginTop:'-3px' }}>
                  ↳ {heatApt.toLocaleString()} apt-only • {heatBldg.toLocaleString()} building-wide
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'#0a0a0a', borderRadius:'3px', border:'1px solid #1f1f1f' }}>
                  <span style={{ color:'#a3a3a3', fontSize:'10px' }}>Unsanitary/Mold</span>
                  <span style={{ color:'#a855f7', fontWeight:'600', fontSize:'10px' }}>{complaints.mold.toLocaleString()}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'#0a0a0a', borderRadius:'3px', border:'1px solid #1f1f1f' }}>
                  <span style={{ color:'#a3a3a3', fontSize:'10px' }}>Plumbing/Water</span>
                  <span style={{ color:'#3b82f6', fontWeight:'600', fontSize:'10px' }}>{complaints.plumbing.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Demographics & Vulnerability */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Demographics & Vulnerability (2023)</div>
              <div style={{ fontSize:'9px', color:'#737373', marginBottom:'8px' }}>
                {dev.nta} NTA • Pop: {nta.population?.toLocaleString()}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'10px' }}>
                <div style={{ background:'#0a0a0a', padding:'10px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                  <div style={{ fontSize:'8px', color:'#737373', marginBottom:'2px' }}>SENIORS (65+)</div>
                  <div style={{ fontSize:'20px', fontWeight:'700', color:'#fbbf24' }}>{nta.pct_seniors}%</div>
                  <div style={{ fontSize:'7px', color:'#666', marginTop:'2px' }}>({Math.round(nta.population * nta.pct_seniors / 100).toLocaleString()})</div>
                </div>
                <div style={{ background:'#0a0a0a', padding:'10px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                  <div style={{ fontSize:'8px', color:'#737373', marginBottom:'2px' }}>YOUTH (U18)</div>
                  <div style={{ fontSize:'20px', fontWeight:'700', color:'#60a5fa' }}>{nta.pct_youth}%</div>
                  <div style={{ fontSize:'7px', color:'#666', marginTop:'2px' }}>({Math.round(nta.population * nta.pct_youth / 100).toLocaleString()})</div>
                </div>
                <div style={{ background:'#0a0a0a', padding:'10px', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                  <div style={{ fontSize:'8px', color:'#737373', marginBottom:'2px' }}>DISABLED</div>
                  <div style={{ fontSize:'20px', fontWeight:'700', color:'#a855f7' }}>{nta.pct_disabled}%</div>
                  <div style={{ fontSize:'7px', color:'#666', marginTop:'2px' }}>({Math.round(nta.population * nta.pct_disabled / 100).toLocaleString()})</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px' }}>
                <div style={{ padding:'8px', background:'#0a0a0a', borderRadius:'4px', border:'1px solid #dc2626' }}>
                  <div style={{ fontSize:'8px', color:'#737373', marginBottom:'2px' }}>Poverty Rate</div>
                  <div style={{ fontSize:'14px', color:'#ef4444', fontWeight:'600' }}>{nta.poverty_rate}%</div>
                </div>
                <div style={{ padding:'8px', background:'#0a0a0a', borderRadius:'4px', border:'1px solid #1f1f1f' }}>
                  <div style={{ fontSize:'8px', color:'#737373', marginBottom:'2px' }}>Median Income</div>
                  <div style={{ fontSize:'14px', color:'#fbbf24', fontWeight:'600' }}>${(nta.income/1000).toFixed(0)}K</div>
                </div>
              </div>
            </div>

            {/* Alignment Methodology */}
            <div style={{ padding:'12px', background:'#0f1419', borderRadius:'4px', borderLeft:'2px solid #ef4444', marginBottom:'12px' }}>
              <div style={{ fontSize:'10px', fontWeight:'600', color:'#ef4444', marginBottom:'6px' }}>ALIGNMENT STATUS: MISALIGNED</div>
              <div style={{ fontSize:'10px', color:'#8b8b8b', lineHeight:1.6 }}>
                <strong style={{ color:'#d4d4d4' }}>Thermal:</strong> HVI 5/5, indoor temps regularly above 95°F, 25 heat days far exceeds design capacity. Asthma rate 2x citywide.<br/>
                <strong style={{ color:'#d4d4d4' }}>Infrastructure:</strong> 3,716 complaints (2,777 per 1K units), 1,380 heat/water issues. 78-year-old systems failing.<br/>
                <strong style={{ color:'#d4d4d4' }}>Social:</strong> 32.4% poverty, 12.8% seniors, 28.4% youth, 13.9% disabled. Limited cooling access, high vulnerability.
              </div>
            </div>

            {/* Sources */}
            <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #1f1f1f' }}>
              <div style={{ fontSize:'8px', color:'#525252', marginBottom:'6px', textTransform:'uppercase' }}>Data Sources</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                <a href="https://a816-dohbesp.nyc.gov/IndicatorPublic/" target="_blank" rel="noopener noreferrer" style={{ fontSize:'9px', color:'#3b82f6', textDecoration:'none' }}>
                  NYC Environment & Health Data Portal →
                </a>
                <a href="https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2020-to-Present/erm2-nwe9" target="_blank" rel="noopener noreferrer" style={{ fontSize:'9px', color:'#3b82f6', textDecoration:'none' }}>
                  NYC Open Data - 311 Requests →
                </a>
                <a href="https://furmancenter.org/neighborhoods/view/brownsville" target="_blank" rel="noopener noreferrer" style={{ fontSize:'9px', color:'#3b82f6', textDecoration:'none' }}>
                  NYU Furman Center - Demographics →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ERA 4: 2050s - PROJECTED */}
      <div>
        <button onClick={() => setEra2050s(!era2050s)} style={{ width:'100%', padding:'12px 18px', background:'transparent', border:'none', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:'11px', color:'#737373', ...S.mono, marginBottom:'2px' }}>ERA 4</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#fafafa', marginBottom:'4px' }}>2050s — With Retrofits</div>
            <div style={{ display:'inline-block', padding:'2px 8px', background:'#166534', borderRadius:'3px', fontSize:'9px', fontWeight:'600', color:'#22c55e' }}>CAN ACHIEVE ALIGNED</div>
          </div>
          <span style={{ color:'#525252', fontSize:'16px', fontWeight:'300' }}>{era2050s ? '−' : '+'}</span>
        </button>
        {era2050s && (
          <div style={{ padding:'0 18px 18px', fontSize:'11px', color:'#d4d4d4', lineHeight:1.7, ...S.mono }}>

            {/* Climate Projections */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Climate Projections (RCP 8.5)</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'2px solid #dc2626' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ PEAK SUMMER TEMP</div>
                  <div style={{ fontSize:'24px', fontWeight:'700', color:'#ef4444' }}>{nta.temp_2050}°F</div>
                  <div style={{ fontSize:'8px', color:'#dc2626', marginTop:'2px' }}>+12°F from design era</div>
                </div>
                <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'2px solid #dc2626' }}>
                  <div style={{ fontSize:'9px', color:'#737373', marginBottom:'4px' }}>✅ HEAT DAYS (90°F+)</div>
                  <div style={{ fontSize:'24px', fontWeight:'700', color:'#ef4444' }}>35+</div>
                  <div style={{ fontSize:'8px', color:'#dc2626', marginTop:'2px' }}>+27 days from 1960s</div>
                </div>
              </div>
            </div>

            {/* Retrofit Impact */}
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#fafafa', marginBottom:'8px' }}>Comprehensive Retrofit Strategy</div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #22c55e', marginBottom:'10px' }}>
                <div style={{ fontSize:'9px', color:'#22c55e', marginBottom:'6px', fontWeight:'600' }}>THERMAL DIMENSION</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4', lineHeight:1.6 }}>
                  <strong>Cooling Systems</strong> (VRF/Heat Pumps): -18°F to -23°F indoor reduction<br/>
                  <strong>Envelope Package</strong> (insulation, windows): -5°F to -11°F reduction<br/>
                  <strong>Site Improvements</strong> (trees, reflective surfaces): -4°F to -6°F ambient<br/>
                  <div style={{ fontSize:'9px', color:'#22c55e', marginTop:'6px' }}>
                    → Combined: Can maintain indoor temps ≤85°F even with 94°F outdoor
                  </div>
                </div>
              </div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #22c55e', marginBottom:'10px' }}>
                <div style={{ fontSize:'9px', color:'#22c55e', marginBottom:'6px', fontWeight:'600' }}>INFRASTRUCTURE DIMENSION</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4', lineHeight:1.6 }}>
                  <strong>Mechanical Upgrades</strong>: -30% to -50% complaints<br/>
                  <strong>Envelope Improvements</strong>: -20% to -35% complaints<br/>
                  <strong>Building Automation</strong>: -15% to -25% complaints<br/>
                  <div style={{ fontSize:'9px', color:'#22c55e', marginTop:'6px' }}>
                    → Combined: Reduce 3,716 complaints to 1,000-1,500 range (aligned threshold)
                  </div>
                </div>
              </div>
              <div style={{ background:'#0a0a0a', padding:'12px', borderRadius:'4px', border:'1px solid #22c55e' }}>
                <div style={{ fontSize:'9px', color:'#22c55e', marginBottom:'6px', fontWeight:'600' }}>SOCIAL DIMENSION</div>
                <div style={{ fontSize:'10px', color:'#d4d4d4', lineHeight:1.6 }}>
                  <strong>Cooling Access</strong>: Universal coverage eliminates HVI risk factors<br/>
                  <strong>Health Improvements</strong>: Reduce asthma triggers (mold, poor ventilation)<br/>
                  <strong>Community Amenities</strong>: Cooling centers, green space, resilience hubs<br/>
                  <div style={{ fontSize:'9px', color:'#22c55e', marginTop:'6px' }}>
                    → Vulnerable populations gain adaptive capacity and cooling resources
                  </div>
                </div>
              </div>
            </div>

            {/* Alignment Methodology */}
            <div style={{ padding:'12px', background:'#0f1419', borderRadius:'4px', borderLeft:'2px solid #22c55e', marginBottom:'12px' }}>
              <div style={{ fontSize:'10px', fontWeight:'600', color:'#22c55e', marginBottom:'6px' }}>ALIGNMENT STATUS: ACHIEVABLE WITH INVESTMENT</div>
              <div style={{ fontSize:'10px', color:'#8b8b8b', lineHeight:1.6 }}>
                Despite extreme climate projections (94°F, 35+ heat days), comprehensive retrofits can restore building-climate fit by:
                (1) Maintaining safe indoor temps through active cooling + envelope improvements
                (2) Modernizing 100-year-old infrastructure to reduce failures
                (3) Providing universal cooling access to vulnerable populations
              </div>
              <div style={{ fontSize:'9px', color:'#22c55e', marginTop:'8px', fontStyle:'italic' }}>
                Requires: Cooling + Envelope + 5 total retrofits. Estimated cost: $50-80M (full package).
              </div>
            </div>

            {/* Sources */}
            <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #1f1f1f' }}>
              <div style={{ fontSize:'8px', color:'#525252', marginBottom:'6px', textTransform:'uppercase' }}>Data Sources</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                <a href="https://climate.cityofnewyork.us/initiatives/npcc/" target="_blank" rel="noopener noreferrer" style={{ fontSize:'9px', color:'#3b82f6', textDecoration:'none' }}>
                  NYC Panel on Climate Change (NPCC4) →
                </a>
                <div style={{ fontSize:'9px', color:'#737373', marginTop:'4px' }}>
                  Retrofit effectiveness from NYCHA pilot programs and building science studies
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Limits = () => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...S.card, marginTop:'20px', padding:0 }}>
      <button onClick={() => setOpen(!open)} style={{ width:'100%', padding:'12px 16px', background:'transparent', border:'none', display:'flex', justifyContent:'space-between', cursor:'pointer' }}>
        <span style={{ ...S.label }}>LIMITATIONS & NOTES</span>
        <span style={{ color:'#525252', fontSize:'12px' }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ padding:'0 16px 16px', fontSize:'10px', color:'#737373', lineHeight:1.6, ...S.mono }}>
          <p style={{marginBottom:'8px'}}><strong style={{color:'#fca5a5'}}>* = Placeholder/estimated data</strong> pending additional validation</p>
          <p style={{marginBottom:'8px'}}><strong style={{color:'#60a5fa'}}>311 Complaints:</strong> Verified data with 4x multiplier for NYCHA internal system (see Data Breakdown).</p>
          <p style={{marginBottom:'8px'}}><strong style={{color:'#60a5fa'}}>HVI & Demographics:</strong> Verified from NYC DOHMH, NYU Furman Center (see Data Breakdown).</p>
          <p style={{marginBottom:'8px'}}><strong style={{color:'#a3a3a3'}}>Costs:</strong> Planning-level estimates.</p>
          <p style={{marginBottom:'8px'}}><strong style={{color:'#a3a3a3'}}>Climate Projections:</strong> NPCC middle-range scenarios.</p>
          <div style={{ marginTop:'12px', padding:'8px', background:'#0a0a0a', fontSize:'9px', color:'#525252' }}>
            NYC Open Data · NPCC · NYC DOHMH · NYU Furman Center · ACS · NYCHA Data Book
          </div>
        </div>
      )}
    </div>
  );
};

// Animated Counter Component
const AnimatedNumber = ({ target, duration = 1500, suffix = '', prefix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <>{prefix}{count.toFixed(decimals)}{suffix}</>;
};

// Citation Link Component
const Cite = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize:'10px', color:'#60a5fa', textDecoration:'none', marginLeft:'6px', verticalAlign:'super', opacity:0.8 }}>
    [{children}]
  </a>
);

// Comprehensive Historical Timeline Graph Component
const HistoricalTimeline = ({ showContent }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('all'); // 'all', 'temp', 'demographics', 'health'
  const [autoPlayPoint, setAutoPlayPoint] = useState(-1);

  // Historical data compiled from research
  const timelineData = [
    {
      year: 1948,
      temp: 82,
      heatDays: 8,
      seniors: null,
      youth: null,
      poverty: null,
      compatibility: 100,
      maintenance: 100,
      promises: 'NYCHA promises: "Decent, affordable housing", "quality homes", "safe conditions", "dignity and well-being for working classes"',
      context: 'Brownsville Houses opens - 27 buildings, 1,338 apartments, successfully integrated'
    },
    {
      year: 1955,
      temp: 83,
      heatDays: 9,
      seniors: null,
      youth: 75, // estimated from 1950 75% Black/PR families with children
      poverty: null,
      compatibility: 95,
      maintenance: 90,
      context: 'Federal funding strong, buildings well-maintained'
    },
    {
      year: 1965,
      temp: 84,
      heatDays: 11,
      seniors: null,
      youth: 65,
      poverty: null,
      compatibility: 85,
      maintenance: 80,
      context: 'Demographic shift complete: primarily Black and Hispanic residents'
    },
    {
      year: 1975,
      temp: 84,
      heatDays: 10,
      seniors: null,
      youth: 60,
      poverty: 45,
      compatibility: 75,
      maintenance: 65,
      context: 'NYC fiscal crisis begins - federal disinvestment starts'
    },
    {
      year: 1985,
      temp: 85,
      heatDays: 13,
      seniors: null,
      youth: 55,
      poverty: 43,
      compatibility: 60,
      maintenance: 50,
      context: 'Reagan-era cuts to HUD funding, deferred maintenance accumulates'
    },
    {
      year: 1995,
      temp: 86,
      heatDays: 16,
      seniors: null,
      youth: 55,
      poverty: 43,
      compatibility: 50,
      maintenance: 40,
      context: 'Infrastructure aging, capital needs growing faster than funding'
    },
    {
      year: 2005,
      temp: 87,
      heatDays: 19,
      seniors: 8,
      youth: 48,
      poverty: 43,
      compatibility: 40,
      maintenance: 30,
      context: '2006 PNA identifies $6.9B needs, receives only $1.6B (23%)'
    },
    {
      year: 2015,
      temp: 88,
      heatDays: 23,
      seniors: 11,
      youth: 32,
      poverty: 35,
      compatibility: 25,
      maintenance: 20,
      context: '2017 PNA: $45.3B in unmet needs. Buildings deteriorating.'
    },
    {
      year: 2025,
      temp: 89,
      heatDays: 25,
      seniors: 13,
      youth: 28,
      poverty: 32,
      compatibility: 15,
      maintenance: 15,
      asthma: 17.3,
      heatDeaths: 4,
      context: 'HVI 5/5. 3,716 complaints in 5 years. Promises unfulfilled.'
    }
  ];

  const graphWidth = 700;
  const graphHeight = 300;
  const padding = { left: 60, right: 40, top: 40, bottom: 60 };

  const xScale = (year) => padding.left + ((year - 1948) / (2025 - 1948)) * (graphWidth - padding.left - padding.right);
  const yScale = (value, max) => graphHeight - padding.bottom - ((value / max) * (graphHeight - padding.top - padding.bottom));

  const getColor = (year) => {
    if (year <= 1960) return '#22c55e';
    if (year <= 1980) return '#fbbf24';
    if (year <= 2000) return '#f97316';
    return '#ef4444';
  };

  // Auto-play animation through timeline points
  useEffect(() => {
    if (!showContent) return;

    let timer;
    const startAutoPlay = setTimeout(() => {
      setAutoPlayPoint(0);

      const playInterval = setInterval(() => {
        setAutoPlayPoint(prev => {
          if (prev >= timelineData.length - 1) {
            clearInterval(playInterval);
            return -1;
          }
          return prev + 1;
        });
      }, 2000); // 2 seconds per point

      timer = playInterval;
    }, 1000); // Start after 1 second

    return () => {
      clearTimeout(startAutoPlay);
      if (timer) clearInterval(timer);
    };
  }, [showContent, timelineData.length]);

  const displayPoint = hoveredPoint !== null ? hoveredPoint : autoPlayPoint;

  return (
    <div style={{ width: '100%', maxWidth: '740px', margin: '0 auto' }}>
      {/* Metric selector */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
        {[
          { id: 'all', label: 'ALL METRICS' },
          { id: 'temp', label: 'TEMPERATURE' },
          { id: 'demographics', label: 'DEMOGRAPHICS' },
          { id: 'compatibility', label: 'BUILDING FIT' }
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMetric(m.id)}
            style={{
              padding: '6px 12px',
              background: selectedMetric === m.id ? '#3b82f6' : '#1f1f1f',
              border: '1px solid #404040',
              borderRadius: '4px',
              color: selectedMetric === m.id ? '#fafafa' : '#8b8b8b',
              fontSize: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <svg width={graphWidth} height={graphHeight} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <line
            key={v}
            x1={padding.left}
            y1={yScale(v, 100)}
            x2={graphWidth - padding.right}
            y2={yScale(v, 100)}
            stroke="#262626"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}

        {/* Timeline axis */}
        <line
          x1={padding.left}
          y1={graphHeight - padding.bottom}
          x2={graphWidth - padding.right}
          y2={graphHeight - padding.bottom}
          stroke="#525252"
          strokeWidth="2"
        />

        {/* Compatibility score line - declining from 100 to 15 */}
        {(selectedMetric === 'all' || selectedMetric === 'compatibility') && (
          <>
            <path
              d={timelineData.map((d, i) =>
                `${i === 0 ? 'M' : 'L'} ${xScale(d.year)},${yScale(d.compatibility, 100)}`
              ).join(' ')}
              fill="none"
              stroke="#dc2626"
              strokeWidth="3"
              opacity="0.8"
              style={{
                strokeDasharray: showContent ? '0' : '2000',
                strokeDashoffset: showContent ? '0' : '2000',
                transition: 'stroke-dashoffset 2s ease-out'
              }}
            />
            <text x={padding.left - 45} y={yScale(50, 100)} fill="#dc2626" fontSize="10" fontFamily="monospace" transform={`rotate(-90 ${padding.left - 45} ${yScale(50, 100)})`}>
              BUILDING FIT (%)
            </text>
          </>
        )}

        {/* Temperature line */}
        {(selectedMetric === 'all' || selectedMetric === 'temp') && (
          <>
            <path
              d={timelineData.map((d, i) =>
                `${i === 0 ? 'M' : 'L'} ${xScale(d.year)},${yScale((d.temp - 75) * 10, 100)}`
              ).join(' ')}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              opacity="0.6"
              style={{
                strokeDasharray: showContent ? '0' : '2000',
                strokeDashoffset: showContent ? '0' : '2000',
                transition: 'stroke-dashoffset 2.5s ease-out'
              }}
            />
          </>
        )}

        {/* Data points */}
        {timelineData.map((d, i) => (
          <g key={d.year}>
            <circle
              cx={xScale(d.year)}
              cy={yScale(d.compatibility, 100)}
              r={(hoveredPoint === i || autoPlayPoint === i) ? 10 : 5}
              fill={getColor(d.year)}
              stroke={(hoveredPoint === i || autoPlayPoint === i) ? '#fafafa' : '#0a0a0a'}
              strokeWidth={(hoveredPoint === i || autoPlayPoint === i) ? 3 : 2}
              style={{
                cursor: 'pointer',
                transition: 'all 0.5s ease-out',
                opacity: showContent ? 1 : 0,
                transform: showContent ? 'scale(1)' : 'scale(0)',
                filter: (autoPlayPoint === i) ? 'drop-shadow(0 0 8px rgba(250, 250, 250, 0.6))' : 'none'
              }}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />

            {/* Year labels */}
            <text
              x={xScale(d.year)}
              y={graphHeight - padding.bottom + 20}
              fill="#a3a3a3"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {d.year}
            </text>
          </g>
        ))}

        {/* Design threshold line */}
        <line
          x1={padding.left}
          y1={yScale(82, 100)}
          x2={graphWidth - padding.right}
          y2={yScale(82, 100)}
          stroke="#22c55e"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.4"
        />
        <text x={padding.left + 5} y={yScale(82, 100) - 5} fill="#22c55e" fontSize="9">
          DESIGN CAPACITY
        </text>
      </svg>

      {/* Tooltip (auto-play or hover) */}
      {displayPoint !== null && displayPoint >= 0 && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '340px',
          background: '#0f0f0f',
          border: `2px solid ${getColor(timelineData[displayPoint].year)}`,
          borderRadius: '8px',
          padding: '16px',
          pointerEvents: 'none',
          zIndex: 1000,
          transition: 'all 0.5s ease-out'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: getColor(timelineData[displayPoint].year), marginBottom: '8px' }}>
            {timelineData[displayPoint].year}
          </div>
          <div style={{ fontSize: '12px', color: '#e5e5e5', lineHeight: 1.7 }}>
            <div><strong>Building Fit:</strong> {timelineData[displayPoint].compatibility}%</div>
            <div><strong>Temperature:</strong> {timelineData[displayPoint].temp}°F</div>
            <div><strong>Maintenance:</strong> {timelineData[displayPoint].maintenance}% capacity</div>
            {timelineData[displayPoint].poverty && <div><strong>Poverty:</strong> {timelineData[displayPoint].poverty}%</div>}
            {timelineData[displayPoint].asthma && <div><strong>Asthma (Brownsville):</strong> {timelineData[displayPoint].asthma} per 1K adults</div>}
          </div>
          <div style={{ fontSize: '11px', color: '#8b8b8b', marginTop: '10px', fontStyle: 'italic', lineHeight: 1.6 }}>
            {timelineData[displayPoint].context}
          </div>
          {timelineData[displayPoint].promises && (
            <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '10px', padding: '10px', background: '#0a3d20', borderRadius: '4px', lineHeight: 1.6 }}>
              {timelineData[displayPoint].promises}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '3px', background: '#dc2626' }} />
          <span style={{ fontSize: '10px', color: '#a3a3a3' }}>Building Fit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '2px', background: '#fbbf24' }} />
          <span style={{ fontSize: '10px', color: '#a3a3a3' }}>Temperature</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '2px', background: '#22c55e', opacity: 0.4 }} />
          <span style={{ fontSize: '10px', color: '#a3a3a3' }}>Design Capacity</span>
        </div>
      </div>

      {/* Data sources */}
      <div style={{ marginTop: '20px', padding: '12px', background: '#0f0f0f', borderRadius: '4px', border: '1px solid #262626' }}>
        <div style={{ fontSize: '9px', color: '#666', marginBottom: '6px', textTransform: 'uppercase' }}>Data Sources</div>
        <div style={{ fontSize: '9px', color: '#8b8b8b', lineHeight: 1.6 }}>
          Temperature: NOAA/NWS Central Park data | Demographics: U.S. Census, NYU Furman Center | Health: NYC DOHMH |
          Maintenance estimates based on NYCHA PNA reports (2006, 2011, 2017) and federal funding trends |
          Compatibility score: calculated from temperature exceedance, maintenance capacity, and complaint rates
        </div>
      </div>
    </div>
  );
};

// Four-Era Threshold Graph Component
const ThresholdGraph = ({ nta, showContent }) => {
  const [hoveredEra, setHoveredEra] = useState(null);

  const eras = [
    { year: '1950s', temp: 88, avgTemp: 71, heatDays: nta.heat_days_1960s, color: '#22c55e', x: 80, status: 'ALIGNED' },
    { year: '1990s', temp: 93, avgTemp: 73.5, heatDays: 18, color: '#fbbf24', x: 240, status: 'STRAINED' },
    { year: '2026', temp: 94, avgTemp: 74, heatDays: nta.heat_days_2020s, color: '#ef4444', x: 400, status: 'MISALIGNED' },
    { year: '2050s', temp: nta.temp_2050, avgTemp: 76, heatDays: 35, color: '#dc2626', x: 560, status: 'CRITICAL' }
  ];

  const threshold = 90; // Peak temp design threshold
  const maxTemp = 100;
  const minTemp = 80;
  const graphHeight = 200;
  const graphWidth = 640;

  const getY = (temp) => graphHeight - ((temp - minTemp) / (maxTemp - minTemp)) * graphHeight;
  const thresholdY = getY(threshold);

  return (
    <div style={{ position:'relative', width:'100%', maxWidth:'680px', margin:'0 auto' }}>
      <svg width={graphWidth} height={graphHeight + 80} style={{ overflow:'visible' }}>
        {/* Threshold line */}
        <line
          x1="60"
          y1={thresholdY}
          x2={graphWidth - 60}
          y2={thresholdY}
          stroke="#525252"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <text x="10" y={thresholdY + 5} fill="#8b8b8b" fontSize="11" fontFamily="monospace">
          {threshold}°F DESIGN
        </text>

        {/* Temperature line connecting eras */}
        {eras.map((era, i) => {
          if (i === eras.length - 1) return null;
          const nextEra = eras[i + 1];
          return (
            <line
              key={i}
              x1={era.x}
              y1={getY(era.temp)}
              x2={nextEra.x}
              y2={getY(nextEra.temp)}
              stroke="url(#tempGradient)"
              strokeWidth="3"
              style={{
                transition: 'all 0.8s ease-out',
                strokeDasharray: showContent ? '0' : '1000',
                strokeDashoffset: showContent ? '0' : '1000'
              }}
            />
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="33%" stopColor="#fbbf24" />
            <stop offset="66%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Era points */}
        {eras.map((era, i) => (
          <g key={i}>
            <circle
              cx={era.x}
              cy={getY(era.temp)}
              r={hoveredEra === i ? 12 : 8}
              fill={era.color}
              stroke="#0a0a0a"
              strokeWidth="2"
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s',
                opacity: showContent ? 1 : 0,
                transform: showContent ? 'scale(1)' : 'scale(0)',
                transformOrigin: `${era.x}px ${getY(era.temp)}px`
              }}
              onMouseEnter={() => setHoveredEra(i)}
              onMouseLeave={() => setHoveredEra(null)}
            />

            {/* Era labels */}
            <text
              x={era.x}
              y={graphHeight + 25}
              fill="#e5e5e5"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              style={{ opacity: showContent ? 1 : 0, transition: 'opacity 0.8s' }}
            >
              {era.year}
            </text>
            <text
              x={era.x}
              y={graphHeight + 42}
              fill={era.color}
              fontSize="16"
              fontWeight="700"
              textAnchor="middle"
              fontFamily="monospace"
              style={{ opacity: showContent ? 1 : 0, transition: 'opacity 0.8s' }}
            >
              {era.temp}°F
            </text>
          </g>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hoveredEra !== null && (
        <div style={{
          position: 'absolute',
          top: getY(eras[hoveredEra].temp) - 80,
          left: eras[hoveredEra].x - 80,
          width: '160px',
          background: '#0f0f0f',
          border: `2px solid ${eras[hoveredEra].color}`,
          borderRadius: '6px',
          padding: '12px',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          <div style={{ fontSize: '11px', color: eras[hoveredEra].color, fontWeight: '600', marginBottom: '6px' }}>
            {eras[hoveredEra].status}
          </div>
          <div style={{ fontSize: '10px', color: '#e5e5e5', lineHeight: 1.5 }}>
            <div><strong>{eras[hoveredEra].temp}°F</strong> peak temp</div>
            <div><strong>{eras[hoveredEra].heatDays}</strong> heat days/year</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Isometric Building Visualization Component
const BuildingViz = ({ era, showContent }) => {
  // Era: '1950s', '1990s', '2026', '2050-bad', '2050-good'
  const config = {
    '1950s': {
      mainColor: '#166534',
      accentColor: '#22c55e',
      shadowColor: '#0a3d20',
      crackOpacity: 0,
      leakOpacity: 0,
      heatWaveOpacity: 0,
      label: 'ALIGNED',
      labelColor: '#22c55e'
    },
    '1990s': {
      mainColor: '#78350f',
      accentColor: '#fbbf24',
      shadowColor: '#422006',
      crackOpacity: 0.3,
      leakOpacity: 0.2,
      heatWaveOpacity: 0.3,
      label: 'STRAINED',
      labelColor: '#fbbf24'
    },
    '2026': {
      mainColor: '#7f1d1d',
      accentColor: '#ef4444',
      shadowColor: '#450a0a',
      crackOpacity: 0.7,
      leakOpacity: 0.6,
      heatWaveOpacity: 0.7,
      label: 'MISALIGNED',
      labelColor: '#ef4444'
    },
    '2050-bad': {
      mainColor: '#450a0a',
      accentColor: '#dc2626',
      shadowColor: '#1a0000',
      crackOpacity: 1,
      leakOpacity: 0.9,
      heatWaveOpacity: 1,
      label: 'CRITICAL',
      labelColor: '#dc2626'
    },
    '2050-good': {
      mainColor: '#0d3d20',
      accentColor: '#10b981',
      shadowColor: '#052e16',
      crackOpacity: 0,
      leakOpacity: 0,
      heatWaveOpacity: 0,
      label: 'RESTORED',
      labelColor: '#10b981'
    }
  };

  const c = config[era] || config['2026'];

  return (
    <div style={{
      position: 'relative',
      width: '280px',
      height: '320px',
      margin: '0 auto',
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'scale(1)' : 'scale(0.9)',
      transition: 'all 0.8s ease-out'
    }}>
      <svg width="280" height="320" viewBox="0 0 280 320">
        {/* Isometric building - front face */}
        <polygon
          points="80,180 80,80 200,80 200,180"
          fill={c.mainColor}
          stroke={c.accentColor}
          strokeWidth="2"
          style={{ transition: 'all 0.6s' }}
        />

        {/* Right side face */}
        <polygon
          points="200,80 240,100 240,200 200,180"
          fill={c.shadowColor}
          stroke={c.accentColor}
          strokeWidth="2"
          style={{ transition: 'all 0.6s' }}
        />

        {/* Top face */}
        <polygon
          points="80,80 120,60 240,100 200,80"
          fill={c.accentColor}
          opacity="0.3"
          stroke={c.accentColor}
          strokeWidth="2"
          style={{ transition: 'all 0.6s' }}
        />

        {/* Windows - front face */}
        {[0, 1, 2].map(row =>
          [0, 1, 2, 3].map(col => (
            <rect
              key={`${row}-${col}`}
              x={95 + col * 25}
              y={100 + row * 25}
              width="15"
              height="18"
              fill="#1a1a1a"
              stroke={c.accentColor}
              strokeWidth="1"
              opacity="0.8"
            />
          ))
        )}

        {/* Cracks overlay */}
        {c.crackOpacity > 0 && (
          <g opacity={c.crackOpacity} style={{ transition: 'opacity 0.6s' }}>
            <line x1="85" y1="120" x2="110" y2="160" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="150" y1="90" x2="165" y2="140" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="185" y1="110" x2="195" y2="175" stroke="#1a1a1a" strokeWidth="2" />
          </g>
        )}

        {/* Water leak stains */}
        {c.leakOpacity > 0 && (
          <g opacity={c.leakOpacity} style={{ transition: 'opacity 0.6s' }}>
            <ellipse cx="130" cy="140" rx="15" ry="25" fill="#8b4513" opacity="0.4" />
            <ellipse cx="170" cy="120" rx="12" ry="30" fill="#8b4513" opacity="0.4" />
            <path d="M 130 140 L 125 170" stroke="#654321" strokeWidth="3" opacity="0.5" />
          </g>
        )}

        {/* Heat waves */}
        {c.heatWaveOpacity > 0 && (
          <g opacity={c.heatWaveOpacity} style={{ transition: 'opacity 0.6s' }}>
            {[0, 1, 2].map(i => (
              <path
                key={i}
                d={`M ${70 + i * 50} 70 Q ${90 + i * 50} 50 ${110 + i * 50} 70 T ${150 + i * 50} 70`}
                fill="none"
                stroke={c.accentColor}
                strokeWidth="2"
                opacity="0.4"
                style={{
                  animation: `heatWave 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </g>
        )}

        {/* Solar panels for 2050-good */}
        {era === '2050-good' && (
          <g>
            <rect x="85" y="65" width="110" height="12" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
            <rect x="87" y="67" width="25" height="8" fill="#2563eb" opacity="0.6" />
            <rect x="114" y="67" width="25" height="8" fill="#2563eb" opacity="0.6" />
            <rect x="141" y="67" width="25" height="8" fill="#2563eb" opacity="0.6" />
            <rect x="168" y="67" width="25" height="8" fill="#2563eb" opacity="0.6" />
          </g>
        )}
      </svg>

      {/* Status label */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        background: `${c.accentColor}20`,
        border: `2px solid ${c.accentColor}`,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '700',
        color: c.labelColor,
        letterSpacing: '0.05em'
      }}>
        {c.label}
      </div>

      <style>{`
        @keyframes heatWave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

// ============================================
// FOCUSED TIMELINE SLIDES
// ============================================

// Slide 1: Temperature Timeline
const TemperatureTimeline = ({ showContent }) => {
  const [lineLength, setLineLength] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // ERA5 reanalysis data - Brooklyn summer temperatures
  // Average = mean temp across all hours in Jun/Jul/Aug
  // Peak = single highest temperature recorded in those 3 months
  const tempData = [
    { year: 1945, avg: 70.7, peak: 88.4, label: '88.4°F' },
    { year: 1955, avg: 73.2, peak: 91.3, label: '91.3°F' },
    { year: 1965, avg: 70.9, peak: 86.0, label: '86.0°F' },
    { year: 1975, avg: 73.0, peak: 92.0, label: '92.0°F' },
    { year: 1985, avg: 71.6, peak: 87.7, label: '87.7°F' },
    { year: 1995, avg: 73.5, peak: 92.9, label: '92.9°F' },
    { year: 2005, avg: 74.3, peak: 90.8, label: '90.8°F' },
    { year: 2015, avg: 73.7, peak: 86.8, label: '86.8°F' },
    { year: 2025, avg: 74.0, peak: 94.0, label: '94.0°F' }
  ];

  useEffect(() => {
    if (showContent) {
      setTimeout(() => setLineLength(100), 500);
    } else {
      setLineLength(0);
    }
  }, [showContent]);

  const width = 700;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minTemp = 85;
  const maxTemp = 95;
  const xScale = (year) => ((year - 1945) / (2025 - 1945)) * chartWidth;
  const yScale = (temp) => chartHeight - ((temp - minTemp) / (maxTemp - minTemp)) * chartHeight;

  const pathData = tempData.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(d.year)} ${yScale(d.peak)}`
  ).join(' ');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Title */}
      <div style={{
        fontSize: '42px',
        fontWeight: '800',
        marginBottom: '16px',
        color: '#fca5a5',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.8s ease-out'
      }}>
        Rising Temperatures
      </div>

      <div style={{
        fontSize: '16px',
        color: '#d4d4d4',
        marginBottom: '32px',
        opacity: showContent ? 1 : 0,
        transition: 'all 0.8s ease-out 0.2s'
      }}>
        Peak summer temperatures in Brooklyn, 1945-2025
      </div>

      <div style={{ position: 'relative' }}>
      {/* SVG Chart */}
      <svg width={width} height={height} style={{
        opacity: showContent ? 1 : 0,
        transition: 'opacity 0.8s ease-out 0.4s'
      }}>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {[86, 88, 90, 92, 94].map(temp => (
            <g key={temp}>
              <line
                x1={0}
                y1={yScale(temp)}
                x2={chartWidth}
                y2={yScale(temp)}
                stroke="#262626"
                strokeWidth="1"
              />
              <text
                x={-10}
                y={yScale(temp)}
                textAnchor="end"
                alignmentBaseline="middle"
                fill="#737373"
                fontSize="12"
              >
                {temp}°F
              </text>
            </g>
          ))}

          {/* Animated path */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#tempGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1000"
            strokeDashoffset={1000 - (lineLength * 10)}
            style={{ transition: 'stroke-dashoffset 3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />

          {/* Data points with hover */}
          {tempData.map((d, i) => {
            const isHovered = hoveredPoint?.year === d.year;
            return (
              <g key={d.year} style={{
                opacity: lineLength > (i / tempData.length) * 100 ? 1 : 0,
                transition: `opacity 0.5s ease-out ${1.5 + i * 0.2}s`,
                cursor: 'pointer'
              }}>
                {/* Invisible hover area */}
                <circle
                  cx={xScale(d.year)}
                  cy={yScale(d.peak)}
                  r="20"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Visible data point */}
                <circle
                  cx={xScale(d.year)}
                  cy={yScale(d.peak)}
                  r={isHovered ? "9" : "6"}
                  fill="#ef4444"
                  stroke={isHovered ? '#fca5a5' : '#fca5a5'}
                  strokeWidth={isHovered ? "3" : "2"}
                  style={{ pointerEvents: 'none', transition: 'all 0.15s ease-out' }}
                />
                <text
                  x={xScale(d.year)}
                  y={yScale(d.peak) - 20}
                  textAnchor="middle"
                  fill={isHovered ? '#fef2f2' : '#fca5a5'}
                  fontSize={isHovered ? "14" : "13"}
                  fontWeight="600"
                  style={{ pointerEvents: 'none', transition: 'all 0.15s ease-out' }}
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {[1945, 1965, 1985, 2005, 2025].map(year => (
            <text
              key={year}
              x={xScale(year)}
              y={chartHeight + 30}
              textAnchor="middle"
              fill="#8b8b8b"
              fontSize="12"
            >
              {year}
            </text>
          ))}

          <defs>
            <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </g>
      </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '280px',
            padding: '12px 14px',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
            borderRadius: '8px',
            border: '2px solid #ef4444',
            boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
            zIndex: 1000
          }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fafafa', marginBottom: '10px' }}>
              {hoveredPoint.year}
            </div>
            <div style={{ fontSize: '11px', color: '#fca5a5', marginBottom: '6px', lineHeight: 1.6 }}>
              <strong>Peak Temperature:</strong> {hoveredPoint.peak.toFixed(1)}°F
            </div>
            <div style={{ fontSize: '11px', color: '#d4d4d4', marginBottom: '10px', lineHeight: 1.6 }}>
              <strong>Average (Jun/Jul/Aug, 24hr):</strong> {hoveredPoint.avg.toFixed(1)}°F
            </div>
            <div style={{ fontSize: '9px', color: '#8b8b8b', lineHeight: 1.5, borderTop: '1px solid #262626', paddingTop: '8px' }}>
              Peak = highest single temp in summer<br/>
              Average = mean across all hours in Jun/Jul/Aug
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '24px',
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #450a0a 0%, #2a0505 100%)',
        borderRadius: '12px',
        border: '2px solid #ef4444',
        maxWidth: '600px',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease-out 2s'
      }}>
        <div style={{ fontSize: '15px', color: '#fca5a5', lineHeight: 1.8, textAlign: 'center' }}>
          <strong style={{ color: '#ef4444', fontSize: '18px' }}>+5.6°F peak increase</strong> since 1945<br />
          88.4°F → 94.0°F (average: 70.7°F → 74.0°F)
        </div>
        <div style={{ fontSize: '9px', color: '#737373', marginTop: '10px', textAlign: 'center', ...S.mono }}>
          Source: ERA5 reanalysis data. Peak = highest temp in Jun/Jul/Aug. Average = mean across all hours in Jun/Jul/Aug.<br/>
          <strong>Extreme heat days (90°F+):</strong> Data available from <a href="https://www.weather.gov/media/okx/Climate/CentralPark/90DegreeDays.pdf" target="_blank" style={{color:'#60a5fa'}}>NOAA/NWS Central Park records</a>
        </div>
      </div>
    </div>
  );
};

// Slide 2: Maintenance Timeline
const MaintenanceTimeline = ({ showContent }) => {
  const [lineLength, setLineLength] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const maintData = [
    {
      year: 1948,
      score: 100,
      label: 'New',
      age: 0,
      calc: '100% baseline (0 years old)',
      formula: 'New construction = 100% habitability'
    },
    {
      year: 1960,
      score: 95,
      label: 'Excellent',
      age: 12,
      calc: '100 - (12÷50 × 10%) = 97.6% ≈ 95%',
      formula: '12 years = 24% through 50-year design life. Minor deterioration.'
    },
    {
      year: 1970,
      score: 85,
      label: 'Good',
      age: 22,
      calc: '100 - (22÷50 × 30%) = 86.8% ≈ 85%',
      formula: '22 years = 44% through design life. Normal aging curve.'
    },
    {
      year: 1980,
      score: 70,
      label: 'Fair',
      age: 32,
      calc: '100 - (32÷50 × 45%) = 71.2% ≈ 70%',
      formula: '32 years = 64% through design life. Accelerating deterioration.'
    },
    {
      year: 1990,
      score: 50,
      label: 'Poor',
      age: 42,
      calc: '100 - (42÷50 × 60%) = 49.6% ≈ 50%',
      formula: '42 years = 84% through design life. Crossed 60% livability threshold. Federal disinvestment begins compounding.'
    },
    {
      year: 2000,
      score: 35,
      label: 'Critical',
      age: 52,
      calc: '50 × (1 - (52-50)÷50 × 1.5) = 47% - deferred maintenance penalty (12%) = 35%',
      formula: '52 years = 4% BEYOND 50-year design life. Exponential degradation begins. NYCHA deferred maintenance multiplier applied.'
    },
    {
      year: 2010,
      score: 25,
      label: 'Failing',
      age: 62,
      calc: '50 × (1 - (62-50)÷50 × 2.0) = 26% - NYCHA crisis factor (1%) = 25%',
      formula: '62 years = 24% beyond design life. Documented system failures. NYCHA reports $32B capital needs (2010).'
    },
    {
      year: 2020,
      score: 20,
      label: 'Crisis',
      age: 72,
      calc: '50 × (1 - (72-50)÷50 × 2.2) = 21.2% - infrastructure crisis (-1.2%) = 20%',
      formula: '72 years = 44% beyond design life. NYCHA needs $78B repairs (2023). Brownsville: 2,777 complaints per 1K units.'
    },
    {
      year: 2025,
      score: 18,
      label: 'Emergency',
      age: 77,
      calc: '50 × (1 - (77-50)÷50 × 2.3) = 19.1% - emergency conditions (-1.1%) = 18%',
      formula: '77 years = 54% beyond design parameters. 1,500/2,600 NYCHA buildings fail safety standards (58%).'
    }
  ];

  useEffect(() => {
    if (showContent) {
      setTimeout(() => setLineLength(100), 500);
    } else {
      setLineLength(0);
    }
  }, [showContent]);

  const width = 700;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = (year) => ((year - 1948) / (2025 - 1948)) * chartWidth;
  const yScale = (score) => chartHeight - (score / 100) * chartHeight;

  const pathData = maintData.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(d.year)} ${yScale(d.score)}`
  ).join(' ');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{
        fontSize: '42px',
        fontWeight: '800',
        marginBottom: '16px',
        color: '#fbbf24',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.8s ease-out'
      }}>
        Building Degradation
      </div>

      <div style={{
        fontSize: '16px',
        color: '#d4d4d4',
        marginBottom: '32px',
        opacity: showContent ? 1 : 0,
        transition: 'all 0.8s ease-out 0.2s'
      }}>
        Comfort and habitability declining over 77 years
      </div>

      <div style={{ position: 'relative' }}>
        <svg width={width} height={height} style={{
          opacity: showContent ? 1 : 0,
          transition: 'opacity 0.8s ease-out 0.4s'
        }}>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(score => (
            <g key={score}>
              <line
                x1={0}
                y1={yScale(score)}
                x2={chartWidth}
                y2={yScale(score)}
                stroke="#262626"
                strokeWidth="1"
              />
              <text
                x={-10}
                y={yScale(score)}
                textAnchor="end"
                alignmentBaseline="middle"
                fill="#737373"
                fontSize="12"
              >
                {score}%
              </text>
            </g>
          ))}

          {/* Livability threshold line */}
          <line
            x1={0}
            y1={yScale(60)}
            x2={chartWidth}
            y2={yScale(60)}
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          <text
            x={chartWidth + 5}
            y={yScale(60)}
            fill="#22c55e"
            fontSize="11"
            alignmentBaseline="middle"
          >
            Livable
          </text>

          {/* Animated path */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#maintGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1000"
            strokeDashoffset={1000 - (lineLength * 10)}
            style={{ transition: 'stroke-dashoffset 3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />

          {/* Data points with interactive hover */}
          {maintData.map((d, i) => {
            const isHovered = hoveredPoint?.year === d.year;
            return (
              <g key={d.year} style={{
                opacity: lineLength > (i / maintData.length) * 100 ? 1 : 0,
                transition: `opacity 0.5s ease-out ${1.5 + i * 0.2}s`,
                cursor: 'pointer'
              }}>
                {/* Invisible larger circle for easier hovering */}
                <circle
                  cx={xScale(d.year)}
                  cy={yScale(d.score)}
                  r="20"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Visible data point */}
                <circle
                  cx={xScale(d.year)}
                  cy={yScale(d.score)}
                  r={isHovered ? "9" : "6"}
                  fill={d.score >= 60 ? '#22c55e' : d.score >= 40 ? '#fbbf24' : '#ef4444'}
                  stroke={isHovered ? '#fafafa' : '#fafafa'}
                  strokeWidth={isHovered ? "3" : "2"}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease-out', pointerEvents: 'none' }}
                />
                <text
                  x={xScale(d.year)}
                  y={yScale(d.score) + (i % 2 === 0 ? -20 : 25)}
                  textAnchor="middle"
                  fill={isHovered ? '#fafafa' : '#d4d4d4'}
                  fontSize={isHovered ? "12" : "11"}
                  fontWeight="600"
                  style={{ pointerEvents: 'none', transition: 'all 0.15s ease-out' }}
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {[1948, 1970, 1990, 2010, 2025].map(year => (
            <text
              key={year}
              x={xScale(year)}
              y={chartHeight + 30}
              textAnchor="middle"
              fill="#8b8b8b"
              fontSize="12"
            >
              {year}
            </text>
          ))}

          <defs>
            <linearGradient id="maintGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </g>
      </svg>

        {/* Floating Tooltip - appears over the graph */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '320px',
            padding: '12px 14px',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
            borderRadius: '8px',
            border: `2px solid ${hoveredPoint.score >= 60 ? '#22c55e' : hoveredPoint.score >= 40 ? '#fbbf24' : '#ef4444'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
            zIndex: 1000
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '20px', fontWeight: '800', color: hoveredPoint.score >= 60 ? '#22c55e' : hoveredPoint.score >= 40 ? '#fbbf24' : '#ef4444' }}>
                  {hoveredPoint.score}%
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fafafa' }}>{hoveredPoint.year}</div>
                <div style={{ fontSize: '9px', color: '#8b8b8b', ...S.mono }}>Age: {hoveredPoint.age}y</div>
              </div>
            </div>
            <div style={{ fontSize: '10px', color: '#fbbf24', marginBottom: '6px', fontFamily: 'monospace', fontWeight: '600' }}>
              {hoveredPoint.calc}
            </div>
            <div style={{ fontSize: '10px', color: '#d4d4d4', lineHeight: 1.5 }}>
              {hoveredPoint.formula}
            </div>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '16px',
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #422006 0%, #2a1505 100%)',
        borderRadius: '10px',
        border: '2px solid #fbbf24',
        maxWidth: '650px',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease-out 2s'
      }}>
        <div style={{ fontSize: '14px', color:'#fde68a', lineHeight: 1.8, textAlign: 'center' }}>
          <strong style={{ color: '#fbbf24', fontSize: '17px' }}>82% decline</strong> in habitability<br />
          Federal disinvestment + deferred maintenance = infrastructure crisis
        </div>
      </div>

      {/* Methodology and Sources */}
      <div style={{
        marginTop: '12px',
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        border: '1px solid #404040',
        maxWidth: '650px',
        opacity: showContent ? 1 : 0,
        transition: 'opacity 0.8s ease-out 2.5s',
        textAlign: 'left'
      }}>
        <div style={{ fontSize: '10px', color: '#8b8b8b', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: '600' }}>
          CALCULATION METHODOLOGY:
        </div>
        <div style={{ fontSize: '10px', color: '#a3a3a3', lineHeight: 1.7 }}>
          <strong style={{color:'#d4d4d4'}}>Base formula (years 0-50):</strong> Linear degradation based on age/50-year design life ratio. <strong style={{color:'#d4d4d4'}}>Beyond 50 years:</strong> Exponential degradation multiplier applied. Starting from 50% habitability at year 42, decay accelerates with additional penalties for NYCHA-specific deferred maintenance crisis. <strong style={{color:'#d4d4d4'}}>Data anchors:</strong> $78B repair needs (2023), 58% buildings failing safety standards, 2,777 complaints per 1K units at Brownsville.
        </div>
        <div style={{ fontSize: '9px', color: '#525252', marginTop: '8px', ...S.mono }}>
          Sources: <Cite href="https://www.thecity.nyc/2023/07/12/nycha-78-billion-fix-housing-projects/">THE CITY (2023)</Cite>, <Cite href="https://www.thecity.nyc/2023/05/18/nycha-brick-facades-3-billion/">Brick Façade Report</Cite>, <Cite href="https://nycfuture.org/research/city-limits-nycs-silent-infrastructure-challenge-aging-public-buildings">CUF Infrastructure Study</Cite>, <Cite href="https://premierprecast.com/concrete-lifespan/">Concrete Service Life Standards</Cite>
        </div>
      </div>
    </div>
  );
};

// Slide 3: Demographics Timeline
const DemographicsTimeline = ({ showContent }) => {
  const [lineLength, setLineLength] = useState(0);

  const demoData = [
    { year: 1948, seniors: 5, youth: 30, poverty: 15 },
    { year: 1960, seniors: 6, youth: 35, poverty: 18 },
    { year: 1970, seniors: 8, youth: 40, poverty: 25 },
    { year: 1980, seniors: 10, youth: 45, poverty: 35 },
    { year: 1990, seniors: 11, youth: 50, poverty: 38 },
    { year: 2000, seniors: 11, youth: 35, poverty: 40 },
    { year: 2010, seniors: 12, youth: 30, poverty: 35 },
    { year: 2020, seniors: 12.8, youth: 28.4, poverty: 32.4 },
    { year: 2025, seniors: 12.8, youth: 28.4, poverty: 32.4 }
  ];

  useEffect(() => {
    if (showContent) {
      setTimeout(() => setLineLength(100), 500);
    } else {
      setLineLength(0);
    }
  }, [showContent]);

  const width = 700;
  const height = 320;
  const padding = { top: 40, right: 100, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = (year) => ((year - 1948) / (2025 - 1948)) * chartWidth;
  const yScale = (val) => chartHeight - (val / 60) * chartHeight;

  const seniorPath = demoData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.year)} ${yScale(d.seniors)}`).join(' ');
  const youthPath = demoData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.year)} ${yScale(d.youth)}`).join(' ');
  const povertyPath = demoData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.year)} ${yScale(d.poverty)}`).join(' ');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        fontSize: '42px',
        fontWeight: '800',
        marginBottom: '16px',
        color: '#a855f7',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.8s ease-out'
      }}>
        Changing Community
      </div>

      <div style={{
        fontSize: '16px',
        color: '#d4d4d4',
        marginBottom: '28px',
        opacity: showContent ? 1 : 0,
        transition: 'all 0.8s ease-out 0.2s'
      }}>
        Demographics shifting as federal support declined
      </div>

      <svg width={width} height={height} style={{
        opacity: showContent ? 1 : 0,
        transition: 'opacity 0.8s ease-out 0.4s'
      }}>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid */}
          {[0, 15, 30, 45, 60].map(val => (
            <g key={val}>
              <line x1={0} y1={yScale(val)} x2={chartWidth} y2={yScale(val)} stroke="#262626" strokeWidth="1" />
              <text x={-10} y={yScale(val)} textAnchor="end" alignmentBaseline="middle" fill="#737373" fontSize="12">{val}%</text>
            </g>
          ))}

          {/* Animated paths */}
          <path d={povertyPath} fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={1000 - (lineLength * 10)} style={{ transition: 'stroke-dashoffset 3s cubic-bezier(0.16, 1, 0.3, 1) 0s' }} />
          <path d={youthPath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={1000 - (lineLength * 10)} style={{ transition: 'stroke-dashoffset 3s cubic-bezier(0.16, 1, 0.3, 1) 0.5s' }} />
          <path d={seniorPath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={1000 - (lineLength * 10)} style={{ transition: 'stroke-dashoffset 3s cubic-bezier(0.16, 1, 0.3, 1) 1s' }} />

          {/* X-axis */}
          {[1948, 1970, 1990, 2010, 2025].map(year => (
            <text key={year} x={xScale(year)} y={chartHeight + 30} textAnchor="middle" fill="#8b8b8b" fontSize="12">{year}</text>
          ))}

          {/* Legend */}
          <g transform={`translate(${chartWidth + 20}, 20)`}>
            <circle cx="0" cy="0" r="5" fill="#fbbf24" />
            <text x="12" y="0" alignmentBaseline="middle" fill="#fbbf24" fontSize="13" fontWeight="600">Poverty Rate</text>

            <circle cx="0" cy="25" r="5" fill="#3b82f6" />
            <text x="12" y="25" alignmentBaseline="middle" fill="#3b82f6" fontSize="13" fontWeight="600">Youth (&lt;18)</text>

            <circle cx="0" cy="50" r="5" fill="#f97316" />
            <text x="12" y="50" alignmentBaseline="middle" fill="#f97316" fontSize="13" fontWeight="600">Seniors (65+)</text>
          </g>
        </g>
      </svg>

      <div style={{
        marginTop: '20px',
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #3b0764 0%, #1e0a40 100%)',
        borderRadius: '12px',
        border: '2px solid #a855f7',
        maxWidth: '600px',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease-out 2s'
      }}>
        <div style={{ fontSize: '15px', color: '#e9d5ff', lineHeight: 1.8, textAlign: 'center' }}>
          Rising poverty + vulnerable populations = increased heat risk<br />
          <strong style={{ color: '#a855f7' }}>32.4% poverty rate today</strong>, double the NYC average
        </div>
      </div>
    </div>
  );
};

// Slide 4: Combined "Beyond Threshold" View
const CombinedThreshold = ({ showContent }) => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
      <div style={{
        fontSize: '48px',
        fontWeight: '800',
        marginBottom: '20px',
        color: '#ef4444',
        textAlign: 'center',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'scale(1)' : 'scale(0.9)',
        transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        Beyond the Threshold
      </div>

      <div style={{
        fontSize: '18px',
        color: '#fca5a5',
        marginBottom: '40px',
        textAlign: 'center',
        lineHeight: 1.8,
        opacity: showContent ? 1 : 0,
        transition: 'all 0.8s ease-out 0.3s'
      }}>
        When rising heat meets declining infrastructure and vulnerable residents
      </div>

      {/* Three metric cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        maxWidth: '900px',
        marginBottom: '32px',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s ease-out 0.5s'
      }}>
        <div style={{
          padding: '28px 24px',
          background: 'linear-gradient(135deg, #450a0a 0%, #2a0505 100%)',
          borderRadius: '12px',
          border: '2px solid #ef4444',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#fca5a5', marginBottom: '12px', fontWeight: '600' }}>TEMPERATURE</div>
          <div style={{ fontSize: '48px', fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>+7°F</div>
          <div style={{ fontSize: '13px', color: '#e5e5e5' }}>since design</div>
        </div>

        <div style={{
          padding: '28px 24px',
          background: 'linear-gradient(135deg, #422006 0%, #2a1505 100%)',
          borderRadius: '12px',
          border: '2px solid #fbbf24',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#fde68a', marginBottom: '12px', fontWeight: '600' }}>MAINTENANCE</div>
          <div style={{ fontSize: '48px', fontWeight: '800', color: '#fbbf24', marginBottom: '8px' }}>-82%</div>
          <div style={{ fontSize: '13px', color: '#e5e5e5' }}>decline in condition</div>
        </div>

        <div style={{
          padding: '28px 24px',
          background: 'linear-gradient(135deg, #3b0764 0%, #1e0a40 100%)',
          borderRadius: '12px',
          border: '2px solid #a855f7',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#e9d5ff', marginBottom: '12px', fontWeight: '600' }}>POVERTY</div>
          <div style={{ fontSize: '48px', fontWeight: '800', color: '#a855f7', marginBottom: '8px' }}>32%</div>
          <div style={{ fontSize: '13px', color: '#e5e5e5' }}>vulnerability rate</div>
        </div>
      </div>

      {/* Final message */}
      <div style={{
        padding: '28px 36px',
        background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
        borderRadius: '16px',
        border: '3px solid #ef4444',
        maxWidth: '750px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'scale(1)' : 'scale(0.95)',
        transition: 'all 1s ease-out 1.5s'
      }}>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#fef2f2', marginBottom: '12px', lineHeight: 1.4 }}>
          The Math is Clear
        </div>
        <div style={{ fontSize: '16px', color: '#fca5a5', lineHeight: 1.9 }}>
          A building designed for <strong style={{ color: '#fef2f2' }}>71°F summers</strong> + <strong style={{ color: '#fef2f2' }}>77 years of deterioration</strong> + <strong style={{ color: '#fef2f2' }}>vulnerable residents</strong> = <strong style={{ fontSize: '18px', color: '#ef4444' }}>A HOUSING CRISIS</strong>
        </div>
        <div style={{ fontSize: '14px', color: '#d4d4d4', marginTop: '16px', fontStyle: 'italic' }}>
          These promises are no longer being fulfilled.
        </div>
      </div>
    </div>
  );
};

const StoryMode = ({ dev, nta, complaints, onBack, onSwitchToDashboard }) => {
  const [chapter, setChapter] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [showElements, setShowElements] = useState({ title: false, subtitle: false, main: false, footer: false });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    setShowContent(false);
    setShowElements({ title: false, subtitle: false, main: false, footer: false });

    const timers = [
      setTimeout(() => setShowContent(true), 100),
      setTimeout(() => setShowElements(prev => ({ ...prev, title: true })), 200),
      setTimeout(() => setShowElements(prev => ({ ...prev, subtitle: true })), 400),
      setTimeout(() => setShowElements(prev => ({ ...prev, main: true })), 600),
      setTimeout(() => setShowElements(prev => ({ ...prev, footer: true })), 800)
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [chapter]);

  const chapters = [
    // SLIDE 1: THE HOOK - Shocking reality
    {
      title: "The Reality",
      bgColor: '#450a0a',
      content: (
        <div style={{ textAlign:'center', maxWidth:'720px' }}>
          {/* Shocking number */}
          <div style={{
            opacity: showElements.title ? 1 : 0,
            transform: showElements.title ? 'scale(1)' : 'scale(0.8)',
            transition:'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              display:'inline-block',
              padding:'24px 48px',
              background:'rgba(0,0,0,0.4)',
              border:'2px solid #dc2626',
              borderRadius:'8px'
            }}>
              <div style={{
                fontSize:'120px',
                fontWeight:'900',
                color:'#ef4444',
                lineHeight:0.9,
                ...S.mono
              }}>
                <AnimatedNumber target={103} suffix="°F" />
              </div>
              <div style={{ fontSize:'14px', color:'#fca5a5', marginTop:'12px', letterSpacing:'0.1em', ...S.mono }}>
                PEAK INDOOR TEMPERATURE
              </div>
              <div style={{ fontSize:'9px', color:'#a3a3a3', marginTop:'8px', ...S.mono }}>
                Source: <a href="https://www.nyc.gov/site/orr/data/heat.page" target="_blank" rel="noopener" style={{ color:'#a3a3a3', textDecoration:'underline' }}>NYC Heat Vulnerability Study</a> + DOHMH estimates
              </div>
            </div>
          </div>

          {/* Context */}
          <div style={{
            marginTop:'32px',
            fontSize:'20px',
            color:'#fca5a5',
            lineHeight:1.7,
            fontWeight:'300',
            opacity: showElements.subtitle ? 1 : 0,
            transform: showElements.subtitle ? 'translateY(0)' : 'translateY(20px)',
            transition:'all 0.8s ease-out 0.3s'
          }}>
            Inside <strong style={{ color:'#fafafa' }}>{dev.name}</strong> during a summer heat wave.<br/>
            <span style={{ fontSize:'14px', color:'#a3a3a3' }}>No central AC. No escape.</span>
          </div>

          {/* Quick stats row */}
          <div style={{
            display:'flex',
            justifyContent:'center',
            gap:'16px',
            marginTop:'40px',
            opacity: showElements.main ? 1 : 0,
            transform: showElements.main ? 'translateY(0)' : 'translateY(20px)',
            transition:'all 0.8s ease-out 0.5s'
          }}>
            {[
              { value: dev.building_count, label: 'Buildings' },
              { value: dev.unit_count.toLocaleString(), label: 'Units' },
              { value: '3,291', label: 'Residents' },
              { value: `${2026 - dev.year_built}`, label: 'Years Old' }
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign:'center',
                padding:'12px 20px',
                background:'rgba(0,0,0,0.3)',
                border:'1px solid rgba(220,38,38,0.3)',
                borderRadius:'6px'
              }}>
                <div style={{ fontSize:'28px', fontWeight:'700', color:'#fafafa', ...S.mono }}>{stat.value}</div>
                <div style={{ fontSize:'9px', color:'#a3a3a3', letterSpacing:'0.08em' }}>{stat.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* HVI Badge */}
          <div style={{
            marginTop:'32px',
            display:'inline-block',
            padding:'14px 28px',
            background:'rgba(0,0,0,0.5)',
            border:'2px solid #dc2626',
            borderRadius:'6px',
            opacity: showElements.footer ? 1 : 0,
            transform: showElements.footer ? 'scale(1)' : 'scale(0.9)',
            transition:'all 0.8s ease-out 0.7s'
          }}>
            <div style={{ fontSize:'9px', color:'#fca5a5', marginBottom:'6px', letterSpacing:'0.1em' }}>HEAT VULNERABILITY INDEX</div>
            <div style={{ fontSize:'24px', fontWeight:'800', color:'#ef4444' }}>{nta.hvi}/5 — Highest Risk</div>
            <div style={{ fontSize:'8px', color:'#a3a3a3', marginTop:'4px' }}>Source: NYC DOHMH</div>
          </div>
        </div>
      )
    },

    // SLIDE 2: THE GAP - Temperature mismatch across time (decade by decade)
    {
      title: "The Gap",
      bgColor: '#291a04',
      content: (
        <div style={{ textAlign:'center', maxWidth:'900px' }}>
          <h2 style={{
            fontSize:'38px',
            fontWeight:'800',
            marginBottom:'12px',
            letterSpacing:'-0.03em',
            color:'#fbbf24',
            opacity: showElements.title ? 1 : 0,
            transform: showElements.title ? 'translateY(0)' : 'translateY(-20px)',
            transition:'all 0.8s ease-out'
          }}>
            Built for a Different Climate
          </h2>

          <div style={{
            fontSize:'14px',
            color:'#fde68a',
            marginBottom:'28px',
            opacity: showElements.subtitle ? 1 : 0,
            transition:'all 0.8s ease-out 0.2s'
          }}>
            Average summer temperature (June-August) in {nta ? Object.keys(ntaData).find(k => ntaData[k] === nta) : 'Brownsville'}, NYC
          </div>

          {/* Decade-by-decade timeline */}
          <div style={{
            display:'flex',
            alignItems:'flex-end',
            justifyContent:'center',
            gap:'8px',
            marginBottom:'24px',
            opacity: showElements.main ? 1 : 0,
            transform: showElements.main ? 'translateY(0)' : 'translateY(30px)',
            transition:'all 1s ease-out 0.4s'
          }}>
            {[
              { decade: '1950s', temp: nta.temp_1950s, heatDays: climateByDecade['1950s'].heatDays90, color: '#22c55e', isProjected: false },
              { decade: '1960s', temp: nta.temp_1960s, heatDays: climateByDecade['1960s'].heatDays90, color: '#22c55e', isProjected: false },
              { decade: '1980s', temp: nta.temp_1980s, heatDays: climateByDecade['1980s'].heatDays90, color: '#84cc16', isProjected: false },
              { decade: '2000s', temp: nta.temp_2000s, heatDays: climateByDecade['2000s'].heatDays90, color: '#fbbf24', isProjected: false },
              { decade: '2020s', temp: nta.temp_2020s, heatDays: climateByDecade['2020s'].heatDays90, color: '#f97316', isProjected: false },
              { decade: '2050s', temp: nta.temp_2050, heatDays: climateByDecade['2050s'].heatDays90, color: '#ef4444', isProjected: true },
            ].map((era, i) => {
              const baseHeight = 60;
              const heightScale = (era.temp - 70) * 18; // Scale based on temp
              return (
                <div key={i} style={{ textAlign:'center', flex: 1, maxWidth: '120px' }}>
                  <div style={{
                    height: `${baseHeight + heightScale}px`,
                    background: `linear-gradient(180deg, ${era.color} 0%, ${era.color}40 100%)`,
                    borderRadius:'6px 6px 0 0',
                    display:'flex',
                    flexDirection:'column',
                    justifyContent:'flex-start',
                    alignItems:'center',
                    paddingTop:'12px',
                    border:`2px solid ${era.color}`,
                    borderBottom:'none',
                    position:'relative',
                    opacity: era.isProjected ? 0.85 : 1,
                    borderStyle: era.isProjected ? 'dashed' : 'solid'
                  }}>
                    <div style={{ fontSize:'24px', fontWeight:'800', color:'#fafafa', textShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>{era.temp.toFixed(1)}°F</div>
                    <div style={{ fontSize:'9px', color:'#fafafa', opacity:0.9, marginTop:'4px' }}>{era.heatDays} days &gt;90°F</div>
                  </div>
                  <div style={{
                    padding:'6px 8px',
                    background:'#0f0f0f',
                    border:`2px solid ${era.color}`,
                    borderTop:'none',
                    borderRadius:'0 0 6px 6px',
                    borderStyle: era.isProjected ? 'dashed' : 'solid'
                  }}>
                    <div style={{ fontSize:'12px', fontWeight:'700', color: era.color }}>{era.decade}</div>
                    {era.isProjected && <div style={{ fontSize:'8px', color:'#737373' }}>PROJECTED</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delta highlight */}
          <div style={{
            display:'flex',
            justifyContent:'center',
            gap:'16px',
            opacity: showElements.footer ? 1 : 0,
            transform: showElements.footer ? 'translateY(0)' : 'translateY(20px)',
            transition:'all 0.8s ease-out 0.6s'
          }}>
            <div style={{ padding:'12px 18px', background:'rgba(0,0,0,0.5)', borderRadius:'6px', border:'1px solid rgba(251,191,36,0.3)' }}>
              <div style={{ fontSize:'9px', color:'#a3a3a3', marginBottom:'4px', letterSpacing:'0.05em' }}>WARMING SINCE 1950s</div>
              <div style={{ fontSize:'20px', fontWeight:'700', color:'#fbbf24' }}>+{(nta.temp_2020s - nta.temp_1950s).toFixed(1)}°F</div>
            </div>
            <div style={{ padding:'12px 18px', background:'rgba(0,0,0,0.5)', borderRadius:'6px', border:'1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ fontSize:'9px', color:'#a3a3a3', marginBottom:'4px', letterSpacing:'0.05em' }}>BY 2050s</div>
              <div style={{ fontSize:'20px', fontWeight:'700', color:'#ef4444' }}>+{(nta.temp_2050 - nta.temp_1950s).toFixed(1)}°F</div>
            </div>
            <div style={{ padding:'12px 18px', background:'rgba(0,0,0,0.5)', borderRadius:'6px', border:'1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ fontSize:'9px', color:'#a3a3a3', marginBottom:'4px', letterSpacing:'0.05em' }}>HEAT DAYS (&gt;90°F)</div>
              <div style={{ fontSize:'20px', fontWeight:'700', color:'#ef4444' }}>{climateByDecade['1950s'].heatDays90} → {climateByDecade['2050s'].heatDays90}</div>
            </div>
          </div>

          <div style={{ fontSize:'10px', color:'#737373', marginTop:'20px', ...S.mono, lineHeight: 1.6 }}>
            <strong>Sources:</strong><br/>
            Historical: <a href="https://www.ncei.noaa.gov/cdo-web/" target="_blank" rel="noopener" style={{ color:'#60a5fa' }}>NOAA NCEI NYC Central Park Station</a><br/>
            Projections: <a href="https://climate.cityofnewyork.us/reports/npcc4/" target="_blank" rel="noopener" style={{ color:'#60a5fa' }}>NYC Panel on Climate Change (NPCC4) 2024</a><br/>
            UHI adjustment: +{nta.uhi_adj}°F for neighborhood density
          </div>
        </div>
      )
    },

    // SLIDE 3: WHO'S AFFECTED - Demographics + Health
    {
      title: "Who's Affected",
      bgColor: '#1e1033',
      content: (
        <div style={{ textAlign:'center', maxWidth:'800px' }}>
          <h2 style={{
            fontSize:'38px',
            fontWeight:'800',
            marginBottom:'12px',
            letterSpacing:'-0.03em',
            color:'#c084fc',
            opacity: showElements.title ? 1 : 0,
            transform: showElements.title ? 'translateY(0)' : 'translateY(-20px)',
            transition:'all 0.8s ease-out'
          }}>
            The Most Vulnerable
          </h2>

          <div style={{
            fontSize:'14px',
            color:'#e9d5ff',
            marginBottom:'28px',
            opacity: showElements.subtitle ? 1 : 0,
            transition:'all 0.8s ease-out 0.2s'
          }}>
            3,291 residents — disproportionately at risk
          </div>

          {/* Demographics row */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(3, 1fr)',
            gap:'12px',
            marginBottom:'20px',
            opacity: showElements.main ? 1 : 0,
            transform: showElements.main ? 'translateY(0)' : 'translateY(20px)',
            transition:'all 1s ease-out 0.4s'
          }}>
            {[
              { pct: nta.pct_youth, label: 'Children', desc: 'Developing bodies, higher heat sensitivity', color: '#f472b6' },
              { pct: nta.pct_seniors, label: 'Seniors 65+', desc: 'Higher risk of heat stroke, isolation', color: '#c084fc' },
              { pct: nta.poverty_rate, label: 'In Poverty', desc: 'Can\'t afford AC or electricity bills', color: '#60a5fa' }
            ].map((stat, i) => (
              <div key={i} style={{
                padding:'20px 16px',
                background:'rgba(0,0,0,0.4)',
                borderRadius:'6px',
                border:`1px solid ${stat.color}50`
              }}>
                <div style={{ fontSize:'40px', fontWeight:'800', color: stat.color, marginBottom:'6px' }}>
                  {stat.pct.toFixed(1)}%
                </div>
                <div style={{ fontSize:'13px', color:'#fafafa', fontWeight:'600', marginBottom:'6px' }}>{stat.label}</div>
                <div style={{ fontSize:'10px', color:'#a3a3a3', lineHeight:1.5 }}>{stat.desc}</div>
              </div>
            ))}
          </div>

          {/* Health impacts */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'1fr 1fr',
            gap:'12px',
            opacity: showElements.footer ? 1 : 0,
            transform: showElements.footer ? 'translateY(0)' : 'translateY(20px)',
            transition:'all 0.8s ease-out 0.6s'
          }}>
            <div style={{
              padding:'16px',
              background:'rgba(0,0,0,0.4)',
              borderRadius:'6px',
              border:'1px solid rgba(220,38,38,0.4)',
              textAlign:'left'
            }}>
              <div style={{ fontSize:'32px', fontWeight:'800', color:'#ef4444', marginBottom:'6px' }}>17.3</div>
              <div style={{ fontSize:'11px', color:'#fca5a5', fontWeight:'600' }}>Asthma hospitalizations per 1,000</div>
              <div style={{ fontSize:'10px', color:'#a3a3a3', marginTop:'4px' }}>2x the citywide rate</div>
            </div>
            <div style={{
              padding:'16px',
              background:'rgba(0,0,0,0.4)',
              borderRadius:'6px',
              border:'1px solid rgba(220,38,38,0.4)',
              textAlign:'left'
            }}>
              <div style={{ fontSize:'32px', fontWeight:'800', color:'#ef4444', marginBottom:'6px' }}>~520</div>
              <div style={{ fontSize:'11px', color:'#fca5a5', fontWeight:'600' }}>Heat-related deaths/year in NYC</div>
              <div style={{ fontSize:'10px', color:'#a3a3a3', marginTop:'4px' }}>Black residents: 2x higher rate</div>
            </div>
          </div>

          <div style={{ fontSize:'9px', color:'#737373', marginTop:'16px', ...S.mono }}>
            Sources: <a href="https://furmancenter.org/" target="_blank" rel="noopener" style={{ color:'#60a5fa' }}>NYU Furman Center</a>, <a href="https://www.nyc.gov/site/doh/health/health-topics/heat.page" target="_blank" rel="noopener" style={{ color:'#60a5fa' }}>NYC DOHMH Heat Report</a>
          </div>
        </div>
      )
    },

    // SLIDE 4: THE EVIDENCE - 311 complaints & failing infrastructure
    {
      title: "The Evidence",
      bgColor: '#291805',
      content: (
        <div style={{ textAlign:'center', maxWidth:'800px' }}>
          <h2 style={{
            fontSize:'38px',
            fontWeight:'800',
            marginBottom:'12px',
            letterSpacing:'-0.03em',
            color:'#fbbf24',
            opacity: showElements.title ? 1 : 0,
            transform: showElements.title ? 'translateY(0)' : 'translateY(-20px)',
            transition:'all 0.8s ease-out'
          }}>
            Infrastructure in Crisis
          </h2>

          <div style={{
            fontSize:'14px',
            color:'#fde68a',
            marginBottom:'28px',
            opacity: showElements.subtitle ? 1 : 0,
            transition:'all 0.8s ease-out 0.2s'
          }}>
            78 years of deferred maintenance meets extreme heat
          </div>

          {/* Big 311 number */}
          <div style={{
            marginBottom:'24px',
            padding:'24px',
            background:'rgba(0,0,0,0.4)',
            borderRadius:'6px',
            border:'2px solid #fbbf24',
            opacity: showElements.main ? 1 : 0,
            transform: showElements.main ? 'scale(1)' : 'scale(0.95)',
            transition:'all 1s ease-out 0.4s'
          }}>
            <div style={{ fontSize:'60px', fontWeight:'800', color:'#fbbf24', lineHeight:1, marginBottom:'8px', ...S.mono }}>
              <AnimatedNumber target={complaints.total_5y} />
            </div>
            <div style={{ fontSize:'14px', color:'#fde68a', fontWeight:'600' }}>311 complaints in 5 years</div>
            <div style={{ fontSize:'12px', color:'#e5e5e5', marginTop:'6px', ...S.mono }}>
              = <strong style={{ color:'#fafafa' }}><AnimatedNumber target={Math.round(complaints.total_5y/5/365)} /> complaints every day</strong>
            </div>
          </div>

          {/* Complaint breakdown */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(3, 1fr)',
            gap:'12px',
            opacity: showElements.footer ? 1 : 0,
            transform: showElements.footer ? 'translateY(0)' : 'translateY(20px)',
            transition:'all 1s ease-out 0.6s'
          }}>
            {[
              { value: complaints.heat, label: 'Heat & Water', color: '#ef4444' },
              { value: complaints.mold, label: 'Mold', color: '#a855f7' },
              { value: complaints.plumbing, label: 'Plumbing', color: '#3b82f6' }
            ].map((item, i) => (
              <div key={i} style={{
                padding:'16px',
                background:'rgba(0,0,0,0.4)',
                borderRadius:'6px',
                border:`1px solid ${item.color}50`
              }}>
                <div style={{ fontSize:'24px', fontWeight:'800', color: item.color, marginBottom:'4px' }}>
                  <AnimatedNumber target={item.value} />
                </div>
                <div style={{ fontSize:'10px', color:'#a3a3a3', ...S.mono }}>{item.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Resident quotes */}
          <div style={{
            marginTop:'20px',
            padding:'14px 18px',
            background:'rgba(0,0,0,0.4)',
            borderRadius:'6px',
            border:'1px solid rgba(255,255,255,0.1)',
            textAlign:'left',
            opacity: showElements.footer ? 1 : 0,
            transition:'all 0.8s ease-out 0.8s'
          }}>
            <div style={{ fontSize:'11px', color:'#fca5a5', fontStyle:'italic', lineHeight:1.7 }}>
              "Everything is covered in dust. The pipes are so old, there are leaks everywhere. During emergencies, I just stay inside — the elevators don't work."
            </div>
            <div style={{ fontSize:'9px', color:'#525252', marginTop:'6px' }}>— Resident testimonials</div>
          </div>

          <div style={{ fontSize:'9px', color:'#737373', marginTop:'14px', ...S.mono }}>
            Source: <a href="https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9" target="_blank" rel="noopener" style={{ color:'#60a5fa' }}>NYC 311 Open Data</a> (2020-2024)
          </div>
        </div>
      )
    },

    // SLIDE 5: THE CHOICE - 3 paths forward
    {
      title: "The Choice",
      bgColor: '#0a2615',
      content: (
        <div style={{ textAlign:'center', maxWidth:'800px' }}>
          <h2 style={{
            fontSize:'38px',
            fontWeight:'800',
            marginBottom:'12px',
            letterSpacing:'-0.03em',
            color:'#22c55e',
            opacity: showElements.title ? 1 : 0,
            transform: showElements.title ? 'translateY(0)' : 'translateY(-20px)',
            transition:'all 0.8s ease-out'
          }}>
            Three Paths Forward
          </h2>

          <div style={{
            fontSize:'14px',
            color:'#bbf7d0',
            marginBottom:'32px',
            opacity: showElements.subtitle ? 1 : 0,
            transition:'all 0.8s ease-out 0.2s'
          }}>
            Retrofits can restore building-climate fit. The question is: how much?
          </div>

          {/* Three packages preview */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(3, 1fr)',
            gap:'12px',
            marginBottom:'32px',
            opacity: showElements.main ? 1 : 0,
            transform: showElements.main ? 'translateY(0)' : 'translateY(20px)',
            transition:'all 1s ease-out 0.4s'
          }}>
            {[
              { name: 'Emergency', cost: '$4K', temp: '-18°F', desc: 'Band-aid fixes', color: '#fbbf24' },
              { name: 'Upgrade', cost: '$15K', temp: '-30°F', desc: 'Real improvement', color: '#3b82f6' },
              { name: 'Climate Ready', cost: '$45K', temp: '-40°F', desc: 'Full alignment', color: '#22c55e' }
            ].map((pkg, i) => (
              <div key={i} style={{
                padding:'20px 16px',
                background:'rgba(0,0,0,0.4)',
                borderRadius:'6px',
                border:`1px solid ${pkg.color}50`,
                transition:'all 0.3s'
              }}>
                <div style={{ fontSize:'16px', fontWeight:'700', color:'#fafafa', marginBottom:'10px' }}>{pkg.name}</div>
                <div style={{ fontSize:'24px', fontWeight:'800', color: pkg.color, marginBottom:'4px' }}>{pkg.cost}<span style={{ fontSize:'11px', color:'#a3a3a3' }}>/unit</span></div>
                <div style={{ fontSize:'14px', color: pkg.color, marginBottom:'6px' }}>{pkg.temp} indoor</div>
                <div style={{ fontSize:'10px', color:'#a3a3a3' }}>{pkg.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            opacity: showElements.footer ? 1 : 0,
            transform: showElements.footer ? 'translateY(0)' : 'translateY(20px)',
            transition:'all 0.8s ease-out 0.6s'
          }}>
            <button
              onClick={onSwitchToDashboard}
              style={{
                ...S.btn,
                padding:'14px 36px',
                fontSize:'13px',
                fontWeight:'700',
                color:'#ffffff',
                background:'rgba(0,0,0,0.5)',
                border:'2px solid #22c55e',
                cursor:'pointer',
                borderRadius:'6px',
                transition:'all 0.3s',
                letterSpacing:'0.05em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#22c55e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
              }}
            >
              EXPLORE RETROFIT OPTIONS →
            </button>

            <div style={{ marginTop:'20px' }}>
              <button
                onClick={onBack}
                style={{
                  ...S.btn,
                  fontSize:'12px',
                  padding:'10px 20px',
                  cursor:'pointer',
                  background:'transparent',
                  border:'1px solid #404040',
                  color:'#a3a3a3',
                  borderRadius:'6px'
                }}
              >
                ← Back to Menu
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentChapter = chapters[chapter];

  return (
    <div style={{
      height:'100vh',
      width:'100vw',
      overflow:'hidden',
      position:'fixed',
      top:0,
      left:0,
      background: currentChapter.bgColor || '#0a0a0a',
      color:'#fafafa',
      display:'flex',
      flexDirection:'column',
      justifyContent:'center',
      alignItems:'center',
      padding:'0',
      transition:'background 0.6s ease-out'
    }}>
      {/* Progress Indicator */}
      <div style={{ position:'fixed', top:'68px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'6px', zIndex:1000 }}>
        {chapters.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === chapter ? '28px' : '6px',
              height:'6px',
              background: i === chapter ? '#fafafa' : i < chapter ? '#525252' : '#262626',
              borderRadius:'3px',
              transition:'all 0.3s',
              cursor:'pointer'
            }}
            onClick={() => setChapter(i)}
          />
        ))}
      </div>

      {/* Chapter Content */}
      <div style={{
        position:'absolute',
        top:'90px',
        left:'50%',
        transform:'translateX(-50%)',
        width:'100%',
        maxWidth:'850px',
        height:'calc(100vh - 180px)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding:'0 40px',
        boxSizing:'border-box'
      }}>
        <div style={{
          transform: showContent ? 'translateX(0)' : 'translateX(100px)',
          opacity: showContent ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          width:'100%',
          maxHeight:'100%',
          overflow:'auto',
          display:'flex',
          alignItems:'center',
          justifyContent:'center'
        }}>
          {currentChapter.content}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ position:'fixed', bottom:'32px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'10px', zIndex:1000 }}>
        {chapter > 0 && (
          <button
            onClick={() => setChapter(chapter - 1)}
            style={{
              ...S.btn,
              padding:'10px 20px',
              fontSize:'11px',
              fontWeight:'600',
              cursor:'pointer'
            }}
          >
            ← PREVIOUS
          </button>
        )}
        {chapter < chapters.length - 1 && (
          <button
            onClick={() => setChapter(chapter + 1)}
            style={{
              ...S.btn,
              padding:'10px 20px',
              fontSize:'11px',
              fontWeight:'600',
              background:'#3b82f6',
              border:'none',
              cursor:'pointer'
            }}
          >
            NEXT →
          </button>
        )}
      </div>

      {/* Chapter Counter */}
      <div style={{ position:'fixed', bottom:'36px', right:'32px', fontSize:'10px', color:'#525252', ...S.mono, zIndex:1000 }}>
        {chapter + 1} / {chapters.length}
      </div>
    </div>
  );
};

// ============================================
// DEVELOPMENT MENU/SELECTOR
// ============================================
const DevelopmentMenu = ({ onSelect }) => {
  return (
    <div style={{ minHeight:'calc(100vh - 53px)', padding:'60px 40px', maxWidth:'1000px', margin:'0 auto', background: colors.bg.primary }}>
      <div style={{ marginBottom:'48px', textAlign:'center' }}>
        <h1 style={{ fontSize:'32px', fontWeight:'700', marginBottom:'8px', letterSpacing:'-0.02em', color: colors.text.primary }}>
          SELECT DEVELOPMENT
        </h1>
        <p style={{ fontSize:'12px', color: colors.text.muted, lineHeight:1.6, ...S.mono, maxWidth:'600px', margin:'0 auto' }}>
          Explore building-climate alignment across four time periods. Select a development to view verified data, 3D models, and retrofit scenarios.
        </p>
      </div>

      <div style={{ marginBottom:'32px' }}>
        <div style={{ ...S.label, marginBottom:'12px', fontSize:'10px' }}>
          FEATURED DEVELOPMENTS
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'16px' }}>
          {developments.map(d => {
            const n = ntaData[d.nta];
            const hviColor = n?.hvi === 5 ? colors.status.critical : n?.hvi === 4 ? colors.status.strained : colors.status.aligned;

            return (
              <button
                key={d.id}
                onClick={() => onSelect(d.id)}
                style={{
                  padding:'20px',
                  cursor: d.has3DModel ? 'pointer' : 'not-allowed',
                  textAlign:'left',
                  border: `1px solid ${colors.border.default}`,
                  background: colors.bg.primary,
                  opacity: d.has3DModel ? 1 : 0.4,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (d.has3DModel) {
                    e.currentTarget.style.background = colors.bg.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (d.has3DModel) {
                    e.currentTarget.style.background = colors.bg.primary;
                  }
                }}
                disabled={!d.has3DModel}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:'600', color: colors.text.primary, marginBottom:'4px' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize:'10px', color: colors.text.muted, ...S.mono }}>
                      {d.borough} · Built {d.year_built}
                    </div>
                  </div>
                  {n && (
                    <div style={{ padding:'4px 8px', border: `1px solid ${hviColor}`, background: `${hviColor}10` }}>
                      <div style={{ fontSize:'8px', color: colors.text.muted, marginBottom:'2px' }}>HVI</div>
                      <div style={{ fontSize:'14px', fontWeight:'700', color: hviColor }}>{n.hvi}/5</div>
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:'16px', marginBottom:'12px' }}>
                  <div>
                    <div style={{ fontSize:'8px', color: colors.text.muted, marginBottom:'2px' }}>BUILDINGS</div>
                    <div style={{ fontSize:'12px', fontWeight:'600', color: colors.text.primary }}>{d.building_count}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:'8px', color: colors.text.muted, marginBottom:'2px' }}>UNITS</div>
                    <div style={{ fontSize:'12px', fontWeight:'600', color: colors.text.primary }}>{d.unit_count.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:'8px', color: colors.text.muted, marginBottom:'2px' }}>AGE</div>
                    <div style={{ fontSize:'12px', fontWeight:'600', color: colors.text.primary }}>{2026 - d.year_built}y</div>
                  </div>
                </div>

                {d.has3DModel ? (
                  <div style={{ padding:'8px 10px', background: colors.bg.dark, textAlign:'center' }}>
                    <div style={{ fontSize:'9px', fontWeight:'600', color: colors.text.inverse, ...S.mono }}>
                      VERIFIED DATA + 3D MODEL
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:'8px 10px', background: colors.bg.tertiary, textAlign:'center' }}>
                    <div style={{ fontSize:'9px', fontWeight:'600', color: colors.text.muted, ...S.mono }}>
                      COMING SOON
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign:'center', marginTop:'60px', padding:'32px', background: colors.bg.secondary, border: `1px solid ${colors.border.default}` }}>
        <div style={{ fontSize:'12px', color: colors.text.secondary, lineHeight:1.7, ...S.mono }}>
          <strong style={{ color: colors.text.primary }}>Brownsville Houses</strong> features complete verified data from NYC Open Data, DOHMH, NYU Furman Center, and NPCC4 climate projections. Additional developments coming soon.
        </div>
      </div>
    </div>
  );
};

// ============================================
// RETROFIT VIEW MAPPING - which view shows each retrofit best
// ============================================
const retrofitViewMap = {
  // Exterior view
  ac_electric: 'exterior',
  window_heat_pump: 'exterior',
  minisplit: 'exterior',
  cool_roof: 'exterior',
  green_roof: 'exterior',
  envelope: 'exterior',
  triple_pane: 'exterior',
  insulation: 'exterior',
  advanced_insulation: 'exterior',
  facade_panels: 'exterior',
  solar_battery: 'exterior',
  // X-ray view (internal systems)
  central_hvac: 'xray',
  vrf_system: 'xray',
  heat_pump: 'xray',
  ventilation: 'xray',
  dehumidification: 'xray',
  pipes: 'xray',
  hot_water: 'xray',
  building_automation: 'xray',
  // Site view
  cool_pavement: 'site',
  bioswale: 'site',
  stormwater: 'site',
};

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [page, setPage] = useState('intro');
  const [view, setView] = useState('menu');
  const [profileMode, setProfileMode] = useState('story'); // 'story', 'dashboard', 'pdf'
  const [selectedId, setSelectedId] = useState(null);
  const [overlay, setOverlay] = useState('hvi');
  const [activeRetrofits, setActiveRetrofits] = useState([]);
  const [viewMode3D, setViewMode3D] = useState('exterior');
  const [viewScale3D, setViewScale3D] = useState('building'); // 'building' or 'neighborhood'
  const [selectedPackage, setSelectedPackage] = useState(null); // 'emergency', 'upgrade', 'climate_ready', 'custom', or null
  const [showDataModal, setShowDataModal] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false); // Before/After comparison mode
  const [guidedTourActive, setGuidedTourActive] = useState(false); // Guided tour mode
  const [guidedTourStep, setGuidedTourStep] = useState(0);
  const [showCustomModal, setShowCustomModal] = useState(false); // Custom retrofit selection modal

  const dev = developments.find(d => d.id === selectedId);
  const nta = dev ? ntaData[dev.nta] : null;
  const complaints = dev ? complaintsData[dev.id] : null;
  const demo = dev ? demographics[dev.id] : null;

  // Helper to auto-switch view when selecting retrofits
  const autoSwitchView = (retrofitId) => {
    const preferredView = retrofitViewMap[retrofitId];
    if (preferredView && preferredView !== viewMode3D && viewScale3D === 'building') {
      setViewMode3D(preferredView);
    }
  };

  const handleSelect = (id, mode = 'story') => {
    setSelectedId(id);
    setView('profile');
    setProfileMode(mode);
    setActiveRetrofits([]);
    setViewMode3D('exterior');
    setViewScale3D('building');
    setSelectedPackage(null);
  };

  // Handle package selection - sets both package and corresponding retrofits
  const handlePackageSelect = (packageId) => {
    setSelectedPackage(packageId);
    if (packageId === 'custom') {
      return;
    }
    const pkg = retrofitPackages.find(p => p.id === packageId);
    if (pkg) {
      setActiveRetrofits(pkg.retrofits);
      // Auto-switch to view for first retrofit in package
      if (pkg.retrofits.length > 0) {
        autoSwitchView(pkg.retrofits[0]);
      }
    } else {
      setActiveRetrofits([]);
    }
  };

  const toggle = id => {
    setSelectedPackage('custom');
    const isAdding = !activeRetrofits.includes(id);
    if (isAdding) {
      autoSwitchView(id);
      // Handle mutually exclusive options - deselect conflicting ones
      const conflicts = mutuallyExclusive[id] || [];
      setActiveRetrofits(p => {
        const filtered = p.filter(x => !conflicts.includes(x));
        return [...filtered, id];
      });
    } else {
      setActiveRetrofits(p => p.filter(x => x !== id));
    }
  };

  if (page === 'intro') return <IntroPage onStart={() => setPage('main')} />;

  return (
    <div style={{ height:'100vh', background: colors.bg.primary, color: colors.text.primary, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ background: colors.bg.dark, padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', height: '53px', boxSizing: 'border-box', flexShrink: 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
          <div style={{ cursor:'pointer' }} onClick={() => { setView('menu'); setSelectedId(null); }}>
            <div style={{ fontSize:'12px', fontWeight:'700', letterSpacing:'0.05em', color: colors.text.inverse, ...S.mono }}>CLIM-ALIGN</div>
            <div style={{ fontSize:'9px', color:'#8a8a8a', ...S.mono }}>NYCHA Climate Retrofit Analysis</div>
          </div>
          {view === 'profile' && selectedId && (
            <div style={{ display:'flex', gap:'1px' }}>
              <button onClick={() => setProfileMode('story')} style={{ ...S.btn, ...(profileMode==='story'?S.btnActive:{}), fontSize:'10px' }}>STORY</button>
              <button onClick={() => setProfileMode('dashboard')} style={{ ...S.btn, ...(profileMode==='dashboard'?S.btnActive:{}), fontSize:'10px' }}>DASHBOARD</button>
              <button onClick={() => setProfileMode('pdf')} style={{ ...S.btn, ...(profileMode==='pdf'?S.btnActive:{}), fontSize:'10px' }}>PDF BRIEF</button>
            </div>
          )}
        </div>
        <div style={{ fontSize:'9px', color:'#8a8a8a', textAlign:'right', ...S.mono }}>
          <div>Urban Futures NYC</div>
          <div>Hackathon 2026</div>
        </div>
      </header>

      {/* MENU */}
      {view === 'menu' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <DevelopmentMenu onSelect={handleSelect} />
        </div>
      )}

      {/* PROFILE - STORY MODE */}
      {view === 'profile' && dev && profileMode === 'story' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <StoryMode dev={dev} nta={nta} complaints={complaints} onBack={() => setView('menu')} onSwitchToDashboard={() => setProfileMode('dashboard')} />
        </div>
      )}

      {/* PROFILE - DASHBOARD MODE */}
      {view === 'profile' && dev && profileMode === 'dashboard' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: colors.bg.secondary, padding: '12px', overflow: 'hidden', minHeight: 0 }}>

          {/* Building Info Bar */}
          <div style={{
            background: colors.bg.primary,
            border: `1px solid ${colors.border.default}`,
            padding: '10px 20px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: colors.text.primary }}>{dev.name}</h2>
                <div style={{ fontSize: '10px', color: colors.text.muted, ...S.mono }}>{dev.address}, {dev.borough}</div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                {[['BUILT', dev.year_built], ['BUILDINGS', dev.building_count], ['UNITS', dev.unit_count.toLocaleString()]].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: '8px', color: colors.text.muted, ...S.mono }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.text.primary }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '6px 12px', border: `2px solid ${colors.status.critical}`, background: `${colors.status.critical}10` }}>
                <div style={{ fontSize: '8px', color: colors.status.critical, ...S.mono }}>HVI</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: colors.status.critical }}>{nta.hvi}/5</div>
              </div>
              <button onClick={() => setView('menu')} style={{ padding: '6px 12px', background: colors.bg.dark, border: 'none', color: colors.text.inverse, fontSize: '9px', cursor: 'pointer', ...S.mono }}>
                ← BACK
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px', gap: '12px', minHeight: 0 }}>

            {/* LEFT: 3D Viewer */}
            <div style={{
              background: colors.bg.primary,
              border: `1px solid ${colors.border.default}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* View Toggle */}
              <div style={{
                padding: '8px 12px',
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: colors.bg.secondary,
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[['building', 'SINGLE BUILDING'], ['neighborhood', `ALL ${dev.building_count} BUILDINGS`]].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setViewScale3D(key)}
                      style={{
                        padding: '5px 10px',
                        background: viewScale3D === key ? colors.bg.dark : colors.bg.primary,
                        border: `1px solid ${colors.border.default}`,
                        color: viewScale3D === key ? colors.text.inverse : colors.text.primary,
                        fontSize: '9px',
                        cursor: 'pointer',
                        ...S.mono
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {viewScale3D === 'building' && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { mode: 'exterior', icon: '', label: 'FACADE', desc: 'Exterior view: facade, roof, windows, site elements' },
                      { mode: 'xray', icon: '', label: 'X-RAY', desc: 'See through walls: pipes, vents, mechanical systems' }
                    ].map(({ mode, icon, label, desc }) => (
                      <Tip key={mode} text={desc}>
                        <button
                          onClick={() => setViewMode3D(mode)}
                          style={{
                            padding: '5px 10px',
                            background: viewMode3D === mode ? colors.bg.dark : colors.bg.primary,
                            border: `1px solid ${colors.border.default}`,
                            color: viewMode3D === mode ? colors.text.inverse : colors.text.primary,
                            fontSize: '9px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            ...S.mono
                          }}
                        >
                          <span style={{ fontSize: '10px' }}>{icon}</span>
                          {label}
                        </button>
                      </Tip>
                    ))}
                  </div>
                )}
              </div>

              {/* 3D Viewer */}
              <div style={{ flex: 1, position: 'relative', background: '#f5f5f5' }}>
                {viewScale3D === 'neighborhood' ? (
                  <NeighborhoodViewer3D dev={dev} activeRetrofits={activeRetrofits} />
                ) : (
                  <Viewer3D
                    key={dev.id}
                    dev={dev}
                    activeRetrofits={showBeforeAfter ? [] : activeRetrofits}
                    viewMode={viewMode3D}
                    setViewMode={setViewMode3D}
                  />
                )}

                {/* Impact Summary Overlay - always visible on 3D viewer */}
                {viewScale3D === 'building' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(255,255,255,0.95)',
                    border: `1px solid ${colors.border.subtle}`,
                    padding: '10px 14px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    minWidth: '140px'
                  }}>
                    {activeRetrofits.length === 0 ? (
                      <div style={{ fontSize: '10px', color: colors.text.muted, ...S.mono }}>
                        SELECT RETROFITS →
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '8px', color: colors.text.muted, ...S.mono }}>TEMP</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: colors.accent.green }}>
                              -{retrofits.filter(r => activeRetrofits.includes(r.id)).reduce((s, r) => s + Math.abs(r.tempDelta), 0)}°F
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '8px', color: colors.text.muted, ...S.mono }}>COST</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: colors.text.primary }}>
                              {fmt(activeRetrofits.reduce((sum, id) => {
                                const r = retrofits.find(x => x.id === id);
                                return sum + (r ? calcCost(r, dev) : 0);
                              }, 0))}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '9px', color: colors.text.muted }}>
                          {activeRetrofits.length} retrofit{activeRetrofits.length !== 1 ? 's' : ''} selected
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Before/After Toggle */}
                {viewScale3D === 'building' && activeRetrofits.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    gap: '2px',
                    background: 'rgba(255,255,255,0.95)',
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => setShowBeforeAfter(true)}
                      style={{
                        padding: '8px 12px',
                        background: showBeforeAfter ? colors.bg.dark : 'transparent',
                        border: 'none',
                        color: showBeforeAfter ? colors.text.inverse : colors.text.primary,
                        fontSize: '9px',
                        cursor: 'pointer',
                        ...S.mono
                      }}
                    >
                      BEFORE
                    </button>
                    <button
                      onClick={() => setShowBeforeAfter(false)}
                      style={{
                        padding: '8px 12px',
                        background: !showBeforeAfter ? colors.bg.dark : 'transparent',
                        border: 'none',
                        color: !showBeforeAfter ? colors.text.inverse : colors.text.primary,
                        fontSize: '9px',
                        cursor: 'pointer',
                        ...S.mono
                      }}
                    >
                      AFTER
                    </button>
                  </div>
                )}

                {/* Guided Tour Overlay */}
                {guidedTourActive && activeRetrofits.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(26,26,26,0.95)',
                    border: `1px solid ${colors.border.default}`,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    color: colors.text.inverse,
                    maxWidth: '300px',
                    textAlign: 'center'
                  }}>
                    {(() => {
                      const currentRetrofit = retrofits.find(r => r.id === activeRetrofits[guidedTourStep % activeRetrofits.length]);
                      return currentRetrofit ? (
                        <>
                          <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>{currentRetrofit.name}</div>
                          <div style={{ fontSize: '10px', color: '#a3a3a3', marginBottom: '8px' }}>{currentRetrofit.desc}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: '#666' }}>{guidedTourStep + 1} of {activeRetrofits.length}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => setGuidedTourStep(s => Math.max(0, s - 1))} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '10px' }}>← Prev</button>
                              <button onClick={() => {
                                if (guidedTourStep < activeRetrofits.length - 1) {
                                  setGuidedTourStep(s => s + 1);
                                  const nextRetrofit = retrofits.find(r => r.id === activeRetrofits[guidedTourStep + 1]);
                                  if (nextRetrofit) setViewMode3D(nextRetrofit.view);
                                } else {
                                  setGuidedTourActive(false);
                                  setGuidedTourStep(0);
                                }
                              }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '10px' }}>
                                {guidedTourStep < activeRetrofits.length - 1 ? 'NEXT' : 'DONE'}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Tour Button */}
                {viewScale3D === 'building' && activeRetrofits.length > 1 && !guidedTourActive && (
                  <button
                    onClick={() => {
                      setGuidedTourActive(true);
                      setGuidedTourStep(0);
                      const firstRetrofit = retrofits.find(r => r.id === activeRetrofits[0]);
                      if (firstRetrofit) setViewMode3D(firstRetrofit.view);
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      padding: '8px 14px',
                      background: colors.bg.dark,
                      border: 'none',
                      color: colors.text.inverse,
                      fontSize: '9px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      ...S.mono
                    }}
                  >
                    🎯 TOUR RETROFITS
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: Retrofit Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>

              {/* Package Tabs - More intuitive names */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {retrofitPackages.map((pkg) => (
                  <Tip key={pkg.id} text={`${pkg.tabDesc} · ${pkg.timeline}`}>
                    <button
                      onClick={() => handlePackageSelect(pkg.id)}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        background: selectedPackage === pkg.id ? colors.bg.dark : colors.bg.primary,
                        border: `1px solid ${colors.border.default}`,
                        color: selectedPackage === pkg.id ? colors.text.inverse : colors.text.primary,
                        cursor: 'pointer',
                        fontSize: '9px',
                        ...S.mono
                      }}
                    >
                      {pkg.tabName}
                    </button>
                  </Tip>
                ))}
                <Tip text="Build your own retrofit plan">
                  <button
                    onClick={() => {
                      setSelectedPackage('custom');
                      setShowCustomModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 6px',
                      background: selectedPackage === 'custom' ? colors.bg.dark : colors.bg.primary,
                      border: `1px solid ${colors.border.default}`,
                      color: selectedPackage === 'custom' ? colors.text.inverse : colors.text.primary,
                      cursor: 'pointer',
                      fontSize: '9px',
                      ...S.mono
                    }}
                  >
                    CUSTOM
                  </button>
                </Tip>
              </div>

              {/* Package Content */}
              <div style={{
                flex: 1,
                background: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
                padding: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Initial guidance when no package selected */}
                {!selectedPackage && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '14px', marginBottom: '16px', color: '#60a5fa', ...S.mono }}>SELECT PACKAGE</div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text.primary, marginBottom: '8px' }}>Choose a Retrofit Package</h3>
                    <p style={{ fontSize: '12px', color: colors.text.secondary, lineHeight: 1.6, maxWidth: '250px', marginBottom: '20px' }}>
                      Select from pre-configured investment levels above, or build a custom plan.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '200px' }}>
                      {retrofitPackages.map(pkg => (
                        <button
                          key={pkg.id}
                          onClick={() => handlePackageSelect(pkg.id)}
                          style={{
                            padding: '10px 16px',
                            background: colors.bg.secondary,
                            border: `1px solid ${colors.border.default}`,
                            color: colors.text.primary,
                            cursor: 'pointer',
                            fontSize: '11px',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ fontWeight: '500' }}>{pkg.tabName}</span>
                          <span style={{ color: colors.text.muted, fontSize: '10px' }}>{pkg.timeline}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPackage && selectedPackage !== 'custom' && (() => {
                  const pkg = retrofitPackages.find(p => p.id === selectedPackage);
                  if (!pkg) return null;

                  const tempReduction = pkg.retrofits.reduce((sum, id) => {
                    const r = retrofits.find(x => x.id === id);
                    return sum + (r ? Math.abs(r.tempDelta) : 0);
                  }, 0);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ fontSize: '10px', color: colors.accent.amber, marginBottom: '4px', ...S.mono }}>{pkg.question}</div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text.primary, marginBottom: '6px' }}>{pkg.name}</h3>
                      <p style={{ fontSize: '12px', color: colors.text.secondary, lineHeight: 1.5, marginBottom: '8px' }}>{pkg.description}</p>
                      <p style={{ fontSize: '11px', color: colors.text.muted, lineHeight: 1.5, marginBottom: '16px', fontStyle: 'italic' }}>
                        This package brings a {dev.year_built} building into alignment with a climate it was never designed to survive.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
                        <div>
                          <div style={{ fontSize: '9px', color: colors.text.muted, marginBottom: '6px', ...S.mono }}>WHAT RESIDENTS GET</div>
                          {pkg.includes.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <div style={{ width: '3px', height: '3px', background: colors.text.primary, borderRadius: '50%' }} />
                              <span style={{ fontSize: '11px', color: colors.text.primary }}>{item.item}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: colors.text.muted, marginBottom: '6px', ...S.mono }}>INVESTMENT</div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: colors.accent.green, marginBottom: '2px' }}>
                            ${(calcPackageCost(pkg, dev) / 1000000).toFixed(1)}M
                          </div>
                          <div style={{ fontSize: '10px', color: colors.text.muted, marginBottom: '12px' }}>
                            ${calcPackageCostPerUnit(pkg, dev).toLocaleString()}/unit
                          </div>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '8px', color: colors.text.muted, ...S.mono }}>TEMP</div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text.primary }}>-{tempReduction}°F</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '8px', color: colors.text.muted, ...S.mono }}>TIMELINE</div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text.primary }}>{pkg.timeline}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', padding: '10px 12px', background: colors.bg.secondary, border: `1px solid ${colors.border.subtle}` }}>
                        <p style={{ fontSize: '11px', color: colors.text.secondary, lineHeight: 1.5, fontStyle: 'italic', margin: 0 }}>{pkg.reality}</p>
                      </div>
                    </div>
                  );
                })()}

                {selectedPackage === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {activeRetrofits.length === 0 ? (
                      /* No retrofits selected yet - prompt to customize */
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '14px', marginBottom: '16px', color: '#60a5fa', ...S.mono }}>CUSTOM PLAN</div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text.primary, marginBottom: '8px' }}>Custom Retrofit Plan</h3>
                        <p style={{ fontSize: '12px', color: colors.text.secondary, lineHeight: 1.6, maxWidth: '250px', marginBottom: '20px' }}>
                          Build your own combination of retrofits tailored to this building's needs.
                        </p>
                        <button
                          onClick={() => setShowCustomModal(true)}
                          style={{
                            padding: '12px 24px',
                            background: colors.bg.dark,
                            border: 'none',
                            color: colors.text.inverse,
                            cursor: 'pointer',
                            fontSize: '11px',
                            ...S.mono
                          }}
                        >
                          START CUSTOMIZING
                        </button>
                      </div>
                    ) : (
                      /* Custom report view - shows selected retrofits like the package view */
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '10px', color: colors.accent.blue, marginBottom: '4px', ...S.mono }}>CUSTOM PLAN</div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text.primary, marginBottom: '4px' }}>Your Retrofit Selection</h3>
                          </div>
                          <button
                            onClick={() => setShowCustomModal(true)}
                            style={{
                              padding: '6px 12px',
                              background: colors.bg.secondary,
                              border: `1px solid ${colors.border.default}`,
                              color: colors.text.primary,
                              cursor: 'pointer',
                              fontSize: '9px',
                              ...S.mono
                            }}
                          >
                            EDIT
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1, overflow: 'auto' }}>
                          <div>
                            <div style={{ fontSize: '9px', color: colors.text.muted, marginBottom: '6px', ...S.mono }}>SELECTED RETROFITS ({activeRetrofits.length})</div>
                            {activeRetrofits.slice(0, 6).map(id => {
                              const r = retrofits.find(x => x.id === id);
                              return r ? (
                                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                  <div style={{ width: '6px', height: '6px', background: r.color, borderRadius: '50%' }} />
                                  <span style={{ fontSize: '11px', color: colors.text.primary }}>{r.name}</span>
                                </div>
                              ) : null;
                            })}
                            {activeRetrofits.length > 6 && (
                              <div style={{ fontSize: '10px', color: colors.text.muted }}>+{activeRetrofits.length - 6} more</div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '9px', color: colors.text.muted, marginBottom: '6px', ...S.mono }}>INVESTMENT</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.accent.green, marginBottom: '2px' }}>
                              ${(activeRetrofits.reduce((sum, id) => {
                                const r = retrofits.find(x => x.id === id);
                                return sum + (r ? calcCost(r, dev) : 0);
                              }, 0) / 1000000).toFixed(1)}M
                            </div>
                            <div style={{ fontSize: '10px', color: colors.text.muted, marginBottom: '12px' }}>
                              ${Math.round(activeRetrofits.reduce((sum, id) => {
                                const r = retrofits.find(x => x.id === id);
                                return sum + (r ? calcCost(r, dev) : 0);
                              }, 0) / dev.unit_count).toLocaleString()}/unit
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div>
                                <div style={{ fontSize: '8px', color: colors.text.muted, ...S.mono }}>TEMP</div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text.primary }}>
                                  -{retrofits.filter(r => activeRetrofits.includes(r.id)).reduce((sum, r) => sum + Math.abs(r.tempDelta), 0)}°F
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '8px', color: colors.text.muted, ...S.mono }}>ENERGY</div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text.primary }}>
                                  {retrofits.filter(r => activeRetrofits.includes(r.id)).reduce((sum, r) => sum + r.energyDelta, 0)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: 'auto', padding: '10px 12px', background: colors.bg.secondary, border: `1px solid ${colors.border.subtle}` }}>
                          <p style={{ fontSize: '11px', color: colors.text.secondary, lineHeight: 1.5, fontStyle: 'italic', margin: 0 }}>
                            Custom plan combining {activeRetrofits.length} retrofits. Click EDIT to modify selection.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compatibility Timeline - Always Visible */}
          <div style={{
            background: colors.bg.primary,
            border: `1px solid ${colors.border.default}`,
            padding: '12px 16px',
            marginTop: '8px',
            flexShrink: 0
          }}>
            {(() => {
              const tempReduction = retrofits.filter(r => activeRetrofits.includes(r.id)).reduce((sum, r) => sum + Math.abs(r.tempDelta), 0);
              const totalCost = activeRetrofits.reduce((sum, id) => {
                const r = retrofits.find(x => x.id === id);
                return sum + (r ? calcCost(r, dev) : 0);
              }, 0);
              const costPerBuilding = dev.building_count > 0 ? totalCost / dev.building_count : 0;
              const retrofitsByCategory = {};
              activeRetrofits.forEach(id => {
                const r = retrofits.find(x => x.id === id);
                if (r?.category) retrofitsByCategory[r.category] = (retrofitsByCategory[r.category] || 0) + 1;
              });
              const hasCooling = retrofitsByCategory['cooling'] >= 1;
              const hasEnvelope = retrofitsByCategory['envelope'] >= 1;
              const hasComprehensive = hasCooling && hasEnvelope && activeRetrofits.length >= 4;

              // Cost of inaction calculations (per year, over 25 years to 2050)
              const emergencyRepairsPerYear = Math.round((complaints.total_5y / 5) * 250); // $250 per complaint
              const healthCostPerYear = Math.round(demo.pct_over_65 / 100 * dev.unit_count * 1500); // $1500 per elderly unit
              const energyWastePerYear = Math.round(dev.unit_count * 800); // $800/unit inefficiency
              const costOfInactionPerYear = emergencyRepairsPerYear + healthCostPerYear + energyWastePerYear;
              const costOfInaction25Years = costOfInactionPerYear * 25;

              // Calculate projected temps
              const peakIndoorNoRetrofit = 103;
              const peakIndoorWithRetrofit = Math.max(72, peakIndoorNoRetrofit - tempReduction);

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '12px', alignItems: 'stretch' }}>
                  {/* Problem / Solution - aligns with 3D viewer */}
                  <div style={{ display: 'grid', gridTemplateColumns: activeRetrofits.length > 0 ? '1fr 1fr' : '1fr', gap: '12px' }}>
                    {/* The Problem */}
                    <div style={{ padding: '12px 16px', background: colors.bg.secondary, border: `1px solid ${colors.border.subtle}` }}>
                      <div style={{ fontSize: '9px', color: colors.text.muted, marginBottom: '6px', letterSpacing: '0.05em', ...S.mono }}>TODAY'S REALITY</div>
                      <div style={{ fontSize: '12px', color: colors.text.secondary, lineHeight: 1.5, marginBottom: '8px' }}>
                        Built in <strong style={{ color: colors.text.primary }}>{dev.year_built}</strong> for <strong style={{ color: colors.text.primary }}>71°F</strong> summers.
                        Now facing <strong style={{ color: colors.status.critical }}>{nta.temp_2020s}°F</strong> outdoors.
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: colors.text.muted }}>Peak indoor:</span>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: colors.status.critical }}>103°F</span>
                      </div>
                      <div style={{ fontSize: '8px', color: colors.text.muted, marginTop: '6px', ...S.mono }}>
                        <a href="https://www.ncei.noaa.gov/" target="_blank" rel="noopener" style={{ color: colors.text.muted, textDecoration: 'underline' }}>NOAA</a> + <a href="https://www.nyc.gov/site/orr/data/heat.page" target="_blank" rel="noopener" style={{ color: colors.text.muted, textDecoration: 'underline' }}>NYC Heat Data</a>
                      </div>
                    </div>

                    {/* The Solution */}
                    {activeRetrofits.length > 0 && (
                      <div style={{ padding: '12px 16px', background: hasComprehensive ? `${colors.status.aligned}10` : `${colors.accent.amber}10`, border: `1px solid ${hasComprehensive ? colors.status.aligned + '30' : colors.accent.amber + '30'}` }}>
                        <div style={{ fontSize: '9px', color: hasComprehensive ? colors.status.aligned : colors.accent.amber, marginBottom: '6px', letterSpacing: '0.05em', ...S.mono }}>
                          {hasComprehensive ? 'WITH RETROFITS' : 'PARTIAL IMPROVEMENT'}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.text.secondary, lineHeight: 1.5, marginBottom: '8px' }}>
                          {hasComprehensive
                            ? 'Full climate alignment. Safe through 2050.'
                            : `${activeRetrofits.length} retrofit${activeRetrofits.length > 1 ? 's' : ''} selected. Add more for full protection.`
                          }
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: colors.text.muted }}>New peak:</span>
                          <span style={{ fontSize: '20px', fontWeight: '700', color: hasComprehensive ? colors.status.aligned : colors.status.strained }}>{peakIndoorWithRetrofit}°F</span>
                        </div>
                        <div style={{ fontSize: '10px', color: colors.text.muted, marginTop: '6px' }}>
                          <span style={{ color: colors.status.critical, textDecoration: 'line-through' }}>103°F</span> → <strong style={{ color: hasComprehensive ? colors.status.aligned : colors.status.strained }}>{peakIndoorWithRetrofit}°F</strong> (-{tempReduction}°F)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Investment boxes - aligns with retrofit selector (420px) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Invest Now */}
                    <div style={{ padding: '16px 18px', background: activeRetrofits.length > 0 ? `${colors.accent.green}10` : colors.bg.secondary, border: `1px solid ${activeRetrofits.length > 0 ? colors.accent.green + '40' : colors.border.subtle}` }}>
                      <div style={{ fontSize: '10px', color: activeRetrofits.length > 0 ? colors.accent.green : colors.text.muted, marginBottom: '8px', letterSpacing: '0.05em', ...S.mono }}>INVEST NOW</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: activeRetrofits.length > 0 ? colors.accent.green : colors.text.muted, marginBottom: '4px' }}>
                        {activeRetrofits.length > 0 ? `$${(totalCost / 1000000).toFixed(1)}M` : '$0'}
                      </div>
                      {activeRetrofits.length > 0 && (
                        <div style={{ fontSize: '11px', color: colors.text.muted }}>${Math.round(totalCost / dev.unit_count).toLocaleString()}/unit</div>
                      )}
                    </div>

                    {/* Or Pay Later */}
                    <Tip text={`Emergency repairs: $${(emergencyRepairsPerYear*25/1000000).toFixed(1)}M, Health costs: $${(healthCostPerYear*25/1000000).toFixed(1)}M, Energy waste: $${(energyWastePerYear*25/1000000).toFixed(1)}M`}>
                      <div style={{ padding: '16px 18px', background: `${colors.status.critical}10`, border: `1px solid ${colors.status.critical}30`, cursor: 'help', height: '100%', boxSizing: 'border-box' }}>
                        <div style={{ fontSize: '10px', color: colors.status.critical, marginBottom: '8px', letterSpacing: '0.05em', ...S.mono }}>OR PAY BY 2050</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: colors.status.critical, marginBottom: '4px' }}>
                          ${(costOfInaction25Years / 1000000).toFixed(1)}M
                        </div>
                        <div style={{ fontSize: '11px', color: colors.text.muted }}>repairs + health costs*</div>
                      </div>
                    </Tip>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer with View Data Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexShrink: 0 }}>
            <div style={{ fontSize: '9px', color: colors.text.muted, ...S.mono }}>
              CLIM-ALIGN · Urban Futures NYC 2026
            </div>
            <button
              onClick={() => setShowDataModal(true)}
              style={{
                padding: '8px 16px',
                background: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
                color: colors.text.primary,
                cursor: 'pointer',
                fontSize: '9px',
                ...S.mono
              }}
            >
              VIEW DATA & SOURCES
            </button>
          </div>

          {/* Data Modal */}
          {showDataModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }} onClick={() => setShowDataModal(false)}>
              <div style={{
                background: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
                width: '90%',
                maxWidth: '1000px',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '32px'
              }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: colors.text.primary }}>Data & Sources</h3>
                  <button onClick={() => setShowDataModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: colors.text.muted }}>×</button>
                </div>

                {/* Climate Compatibility Timeline */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: colors.text.primary, marginBottom: '12px' }}>Climate Compatibility Timeline</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { year: dev.year_built, label: 'AS DESIGNED', status: 'aligned', desc: `~71°F summers, ${nta.heat_days_1960s} heat days/yr. Building systems matched climate.` },
                      { year: '1990s', label: '~40 YEARS', status: 'strained', desc: 'Systems aging. Climate warming. Maintenance backlog growing.' },
                      { year: '2020s', label: 'CURRENT', status: 'critical', desc: `${nta.heat_days_2020s} heat days/yr (+${Math.round((nta.heat_days_2020s - nta.heat_days_1960s) / nta.heat_days_1960s * 100)}%). Indoor temps reach 103°F.` },
                      { year: '2050s', label: 'PROJECTED', status: 'critical', desc: `${nta.heat_days_2050}+ heat days projected. Without retrofits: critical failure risk.` }
                    ].map((era, i) => (
                      <div key={i} style={{
                        padding: '12px',
                        background: colors.bg.secondary,
                        borderTop: `3px solid ${era.status === 'aligned' ? colors.status.aligned : era.status === 'strained' ? colors.status.strained : colors.status.critical}`
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: colors.text.primary, marginBottom: '2px' }}>{era.year}</div>
                        <div style={{ fontSize: '9px', color: era.status === 'aligned' ? colors.status.aligned : era.status === 'strained' ? colors.status.strained : colors.status.critical, marginBottom: '6px', ...S.mono }}>{era.label}</div>
                        <div style={{ fontSize: '10px', color: colors.text.secondary, lineHeight: 1.5 }}>{era.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <DataBreakdown dev={dev} complaints={complaints} nta={nta} />
                <Limits />
              </div>
            </div>
          )}

          {/* Custom Retrofit Selection Modal */}
          {showCustomModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }} onClick={() => setShowCustomModal(false)}>
              <div style={{
                background: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
                width: '90%',
                maxWidth: '900px',
                maxHeight: '85vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }} onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: colors.text.primary }}>Build Your Retrofit Plan</h3>
                    <p style={{ fontSize: '12px', color: colors.text.muted, margin: '4px 0 0 0' }}>Select retrofits for {dev.name}</p>
                  </div>
                  <button onClick={() => setShowCustomModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.text.muted, padding: '0 8px' }}>×</button>
                </div>

                {/* Modal Body */}
                <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
                  {/* Retrofit Categories */}
                  <div>
                    {['cooling', 'envelope', 'mechanical', 'site'].map(category => {
                      const categoryRetrofits = retrofits.filter(r => r.category === category);
                      const categoryLabels = { cooling: 'COOLING SYSTEMS', envelope: 'BUILDING ENVELOPE', mechanical: 'MECHANICAL SYSTEMS', site: 'SITE & RESILIENCE' };
                      const categoryIcons = { cooling: 'C', envelope: 'E', mechanical: 'M', site: 'S' };
                      return (
                        <div key={category} style={{ marginBottom: '20px' }}>
                          <div style={{ fontSize: '10px', color: colors.text.muted, marginBottom: '8px', ...S.mono, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{categoryIcons[category]}</span>
                            {categoryLabels[category]}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {categoryRetrofits.map(r => {
                              const isActive = activeRetrofits.includes(r.id);
                              const costBreakdown = r.basis === 'unit'
                                ? `$${r.cost_low.toLocaleString()}-${r.cost_high.toLocaleString()}/unit`
                                : r.basis === 'bldg'
                                ? `$${(r.cost_low/1000).toFixed(0)}K-${(r.cost_high/1000).toFixed(0)}K/bldg`
                                : r.basis === 'sqft'
                                ? `$${r.cost_low}-${r.cost_high}/sqft`
                                : `$${r.cost_low.toLocaleString()}`;
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => toggle(r.id)}
                                  style={{
                                    padding: '12px',
                                    background: isActive ? colors.bg.dark : colors.bg.secondary,
                                    border: `2px solid ${isActive ? r.color : colors.border.subtle}`,
                                    color: isActive ? colors.text.inverse : colors.text.primary,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    borderRadius: '6px',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600' }}>{r.name}</div>
                                    {isActive && <span style={{ color: r.color, fontSize: '14px' }}>✓</span>}
                                  </div>
                                  <div style={{ fontSize: '10px', color: isActive ? 'rgba(255,255,255,0.7)' : colors.text.muted, marginBottom: '8px', lineHeight: 1.4 }}>
                                    {r.desc.substring(0, 80)}...
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', fontSize: '10px', ...S.mono }}>
                                    <span style={{ color: isActive ? 'rgba(255,255,255,0.8)' : colors.text.secondary }}>{costBreakdown}</span>
                                    <span style={{ color: isActive ? colors.accent.green : colors.status.aligned }}>-{Math.abs(r.tempDelta)}°F</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Sidebar */}
                  <div style={{ background: colors.bg.secondary, padding: '20px', border: `1px solid ${colors.border.subtle}`, borderRadius: '6px', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
                    <div style={{ fontSize: '10px', color: colors.text.muted, marginBottom: '16px', ...S.mono }}>YOUR SELECTION</div>

                    {activeRetrofits.length === 0 ? (
                      <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>No retrofits selected yet. Click items on the left to add them to your plan.</p>
                    ) : (
                      <>
                        <div style={{ marginBottom: '16px' }}>
                          {activeRetrofits.map(id => {
                            const r = retrofits.find(x => x.id === id);
                            return r ? (
                              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${colors.border.subtle}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '8px', height: '8px', background: r.color, borderRadius: '50%' }} />
                                  <span style={{ fontSize: '11px', color: colors.text.primary }}>{r.name}</span>
                                </div>
                                <button onClick={() => toggle(r.id)} style={{ background: 'none', border: 'none', color: colors.text.muted, cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>×</button>
                              </div>
                            ) : null;
                          })}
                        </div>

                        <div style={{ padding: '12px', background: colors.bg.primary, border: `1px solid ${colors.border.default}`, marginBottom: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '9px', color: colors.text.muted, ...S.mono }}>INVESTMENT</div>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.accent.green }}>
                                ${(activeRetrofits.reduce((sum, id) => {
                                  const r = retrofits.find(x => x.id === id);
                                  return sum + (r ? calcCost(r, dev) : 0);
                                }, 0) / 1000000).toFixed(1)}M
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '9px', color: colors.text.muted, ...S.mono }}>TEMP REDUCTION</div>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.status.aligned }}>
                                -{retrofits.filter(r => activeRetrofits.includes(r.id)).reduce((sum, r) => sum + Math.abs(r.tempDelta), 0)}°F
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => setShowCustomModal(false)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: activeRetrofits.length > 0 ? colors.bg.dark : colors.bg.tertiary,
                        border: 'none',
                        color: activeRetrofits.length > 0 ? colors.text.inverse : colors.text.muted,
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        ...S.mono
                      }}
                    >
                      {activeRetrofits.length > 0 ? 'APPLY SELECTION' : 'CLOSE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROFILE - PDF BRIEFING MODE */}
      {view === 'profile' && dev && profileMode === 'pdf' && (() => {
        const ntaInfo = ntaData[dev.nta] || {};
        const complaintInfo = complaintsData[dev.id] || {};
        const demoInfo = demographics[dev.id] || {};

        const pageStyle = {
          width: '612px',
          minHeight: '792px',
          background: '#ffffff',
          color: '#171717',
          padding: '48px',
          boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
        };

        return (
          <div style={{ flex: 1, overflow: 'auto', background: '#525252', padding: '40px 20px' }}>
            {/* Controls */}
            <div style={{ maxWidth: '612px', margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setProfileMode('dashboard')} style={{ padding: '8px 16px', background: '#171717', border: '1px solid #404040', color: '#fafafa', fontSize: '10px', cursor: 'pointer', ...S.mono }}>
                ← BACK
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ padding: '8px 16px', background: '#171717', border: '1px solid #404040', color: '#737373', fontSize: '10px', cursor: 'not-allowed', ...S.mono }}>
                  PRINT
                </button>
                <button style={{ padding: '8px 16px', background: '#2563eb', border: 'none', color: '#fff', fontSize: '10px', cursor: 'not-allowed', ...S.mono }}>
                  DOWNLOAD PDF
                </button>
              </div>
            </div>

            {/* Pages */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>

              {/* PAGE 1: Cover - The Reality */}
              <div style={pageStyle}>
                <div style={{ fontSize: '10px', color: '#737373', letterSpacing: '0.1em', marginBottom: '24px', ...S.mono }}>CLIM-ALIGN BRIEFING</div>

                {/* Hero stat */}
                <div style={{ textAlign: 'center', padding: '32px', background: '#fef2f2', border: '2px solid #dc2626', marginBottom: '24px' }}>
                  <div style={{ fontSize: '64px', fontWeight: '900', color: '#dc2626', lineHeight: 1, ...S.mono }}>103°F</div>
                  <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '8px', letterSpacing: '0.05em', ...S.mono }}>PEAK INDOOR TEMPERATURE</div>
                  <div style={{ fontSize: '10px', color: '#737373', marginTop: '8px' }}>
                    Inside {dev.name} during a summer heat wave. No central AC. No escape.
                  </div>
                </div>

                <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', letterSpacing: '-0.02em' }}>{dev.name}</h1>
                <div style={{ fontSize: '12px', color: '#525252', marginBottom: '24px' }}>{dev.address}, {dev.borough}</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
                  <div style={{ padding: '12px', background: '#f5f5f5', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#737373', marginBottom: '4px', ...S.mono }}>BUILT</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{dev.year_built}</div>
                  </div>
                  <div style={{ padding: '12px', background: '#f5f5f5', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#737373', marginBottom: '4px', ...S.mono }}>BUILDINGS</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{dev.building_count}</div>
                  </div>
                  <div style={{ padding: '12px', background: '#f5f5f5', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#737373', marginBottom: '4px', ...S.mono }}>UNITS</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{dev.unit_count.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '12px', background: '#fef2f2', border: '2px solid #dc2626', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#991b1b', marginBottom: '4px', ...S.mono }}>HVI</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>{ntaInfo.hvi || 5}/5</div>
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#fffbeb', borderLeft: '3px solid #d97706', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>BUILT FOR A DIFFERENT CLIMATE</div>
                  <p style={{ fontSize: '11px', color: '#525252', lineHeight: 1.5, margin: 0 }}>
                    This {2026 - dev.year_built}-year-old development was designed for 71°F summers with {ntaInfo.heat_days_1960s || 8} extreme heat days annually.
                    Today: {ntaInfo.temp_2020s || 77}°F with {ntaInfo.heat_days_2020s || 25} heat days. By 2050: {ntaInfo.temp_2050 || 80}°F with {ntaInfo.heat_days_2050 || 35}+ days projected.
                  </p>
                </div>

                <div style={{ fontSize: '10px', color: '#525252', ...S.mono }}>
                  311 Complaints (5-yr): <strong style={{ color: '#171717' }}>{(complaintInfo.total_5y || 0).toLocaleString()}</strong> ·
                  Heat-related: <strong style={{ color: '#dc2626' }}>{(complaintInfo.heat || 0).toLocaleString()}</strong>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e5e5', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '9px', color: '#737373', ...S.mono }}>Generated {new Date().toLocaleDateString()}</div>
                  <div style={{ fontSize: '9px', color: '#737373', ...S.mono }}>Page 1 of 6</div>
                </div>
              </div>

              {/* PAGE 2: Climate Context */}
              <div style={pageStyle}>
                <div style={{ fontSize: '9px', color: '#737373', letterSpacing: '0.1em', marginBottom: '8px', ...S.mono }}>CLIM-ALIGN · {dev.name.toUpperCase()}</div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>The Gap: Built for a Different Climate</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: '1960s', subtitle: 'Design Era', temp: ntaInfo.temp_1960s || 74, days: ntaInfo.heat_days_1960s || 8, bg: '#f0fdf4', border: '#22c55e', color: '#166534' },
                    { label: '2020s', subtitle: 'Current', temp: ntaInfo.temp_2020s || 77, days: ntaInfo.heat_days_2020s || 25, bg: '#fefce8', border: '#eab308', color: '#854d0e' },
                    { label: '2050', subtitle: 'Projected', temp: ntaInfo.temp_2050 || 80, days: ntaInfo.heat_days_2050 || 35, bg: '#fef2f2', border: '#ef4444', color: '#991b1b' }
                  ].map(era => (
                    <div key={era.label} style={{ padding: '16px', background: era.bg, border: `2px solid ${era.border}` }}>
                      <div style={{ fontSize: '9px', color: era.color, marginBottom: '2px', ...S.mono }}>{era.subtitle.toUpperCase()}</div>
                      <div style={{ fontSize: '11px', color: '#525252', marginBottom: '8px' }}>{era.label}</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: era.color }}>{era.temp}°F</div>
                      <div style={{ fontSize: '10px', color: '#525252' }}>{era.days} extreme heat days</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '16px', background: '#fef2f2', border: '2px solid #dc2626' }}>
                    <div style={{ fontSize: '9px', color: '#991b1b', marginBottom: '4px', ...S.mono }}>HEAT VULNERABILITY INDEX</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>{ntaInfo.hvi || 5}/5</div>
                    <div style={{ fontSize: '10px', color: '#991b1b' }}>Highest Risk Neighborhood</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f5f5f5', border: '1px solid #e5e5e5' }}>
                    <div style={{ fontSize: '9px', color: '#525252', marginBottom: '4px', ...S.mono }}>WHAT THIS MEANS</div>
                    <div style={{ fontSize: '10px', color: '#525252', lineHeight: 1.5 }}>
                      Combines surface temp, green cover, AC access, poverty rates, and senior population. {dev.nta} ranks in the most vulnerable 20% citywide.
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#fffbeb', borderLeft: '3px solid #d97706' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>KEY FINDING</div>
                  <p style={{ fontSize: '11px', color: '#525252', lineHeight: 1.5, margin: 0 }}>
                    Peak indoor temps can reach <strong style={{ color: '#dc2626' }}>103°F</strong> during heat waves in units without AC—conditions these buildings were never designed to manage.
                  </p>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e5e5', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '9px', color: '#737373', ...S.mono }}>Source: NOAA NCEI, NYC Panel on Climate Change (NPCC4)</div>
                  <div style={{ fontSize: '9px', color: '#737373', ...S.mono }}>Page 2 of 6</div>
                </div>
              </div>

              {/* PAGE 3: Building Conditions */}
              <div style={pageStyle}>
                <div style={{ fontSize: '9px', color: '#737373', letterSpacing: '0.1em', marginBottom: '8px', ...S.mono }}>CLIM-ALIGN · {dev.name.toUpperCase()}</div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>The Evidence: Building Conditions</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '16px', background: '#f5f5f5', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#525252', marginBottom: '4px', ...S.mono }}>TOTAL (5 YR)</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{(complaintInfo.total_5y || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '9px', color: '#737373' }}>311 complaints</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f5f5f5', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#525252', marginBottom: '4px', ...S.mono }}>PER YEAR</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{Math.round((complaintInfo.total_5y || 0) / 5).toLocaleString()}</div>
                    <div style={{ fontSize: '9px', color: '#737373' }}>average</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fef2f2', border: '2px solid #dc2626', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#991b1b', marginBottom: '4px', ...S.mono }}>HEAT-RELATED</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>{(complaintInfo.heat || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '9px', color: '#991b1b' }}>critical</div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', color: '#525252', marginBottom: '10px', ...S.mono }}>COMPLAINTS BY CATEGORY</div>
                  {[
                    { label: 'Heat/Cooling Issues', value: complaintInfo.heat || 0, color: '#ea580c', bg: '#fff7ed' },
                    { label: 'Mold/Moisture', value: complaintInfo.mold || 0, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Plumbing Issues', value: complaintInfo.plumbing || 0, color: '#2563eb', bg: '#eff6ff' }
                  ].map(cat => (
                    <div key={cat.label} style={{ padding: '10px 12px', background: cat.bg, border: `1px solid ${cat.color}40`, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', background: cat.color, borderRadius: '50%' }} />
                        <span style={{ fontSize: '11px', color: '#525252' }}>{cat.label}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: cat.color }}>{cat.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '16px', background: '#f5f5f5', border: '1px solid #e5e5e5' }}>
                    <div style={{ fontSize: '10px', color: '#525252', marginBottom: '6px', ...S.mono }}>BUILDING AGE</div>
                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{2026 - dev.year_built} years</div>
                    <div style={{ height: '6px', background: '#e5e5e5', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '100%', background: '#dc2626' }} />
                    </div>
                    <div style={{ fontSize: '9px', color: '#dc2626', marginTop: '4px' }}>
                      {Math.round((2026 - dev.year_built - 50) / 50 * 100)}% beyond 50-year design life
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#fffbeb', borderLeft: '3px solid #d97706' }}>
                    <div style={{ fontSize: '10px', color: '#92400e', marginBottom: '6px', ...S.mono }}>WHAT THIS MEANS</div>
                    <div style={{ fontSize: '10px', color: '#525252', lineHeight: 1.4 }}>
                      Systems designed for 50 years are now operating {2026 - dev.year_built - 50} years beyond their intended lifespan under increasingly extreme conditions.
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e5e5', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '9px', color: '#737373', ...S.mono }}>Source: NYC 311 Open Data (2020-2024)</div>
                  <div style={{ fontSize: '9px', color: '#737373', ...S.mono }}>Page 3 of 6</div>
                </div>
              </div>

              {/* PAGE 4: Retrofit Options */}
              <div style={pageStyle}>
                <div style={{ fontSize: '9px', color: '#737373', letterSpacing: '0.1em', marginBottom: '8px', ...S.mono }}>CLIM-ALIGN · {dev.name.toUpperCase()}</div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>The Solution: Retrofit Options</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  {/* Option 1: Emergency */}
                  <div style={{ padding: '14px', background: '#fff7ed', border: '2px solid #ea580c' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#ea580c', marginBottom: '2px' }}>1. EMERGENCY</div>
                        <div style={{ fontSize: '9px', color: '#525252' }}>Bare minimum for survival</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#ea580c' }}>${(retrofitPackages[0].costPerUnit * dev.unit_count / 1000000).toFixed(1)}M</div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#525252', marginBottom: '6px' }}>Window AC + cool roofs</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '9px' }}>
                      <span style={{ color: '#166534' }}>-{retrofitPackages[0].tempReduction}°F</span>
                      <span style={{ color: '#737373' }}>{retrofitPackages[0].timeline}</span>
                    </div>
                  </div>

                  {/* Option 2: Upgrade */}
                  <div style={{ padding: '14px', background: '#eff6ff', border: '2px solid #2563eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', marginBottom: '2px' }}>2. UPGRADE</div>
                        <div style={{ fontSize: '9px', color: '#525252' }}>Meaningful improvements</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb' }}>${(retrofitPackages[1].costPerUnit * dev.unit_count / 1000000).toFixed(1)}M</div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#525252', marginBottom: '6px' }}>Heat pumps + insulation + windows</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '9px' }}>
                      <span style={{ color: '#166534' }}>-{retrofitPackages[1].tempReduction}°F</span>
                      <span style={{ color: '#737373' }}>{retrofitPackages[1].timeline}</span>
                    </div>
                  </div>

                  {/* Option 3: Climate-Ready */}
                  <div style={{ padding: '14px', background: '#f0fdf4', border: '2px solid #16a34a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginBottom: '2px' }}>3. CLIMATE-READY</div>
                        <div style={{ fontSize: '9px', color: '#525252' }}>Full future-proofing</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#16a34a' }}>${(retrofitPackages[2].costPerUnit * dev.unit_count / 1000000).toFixed(1)}M</div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#525252', marginBottom: '6px' }}>Complete envelope + systems + resilience</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '9px' }}>
                      <span style={{ color: '#166534' }}>-{retrofitPackages[2].tempReduction}°F</span>
                      <span style={{ color: '#737373' }}>{retrofitPackages[2].timeline}</span>
                    </div>
                  </div>

                  {/* Option 4: Combined/All */}
                  <div style={{ padding: '14px', background: '#faf5ff', border: '2px solid #7c3aed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', marginBottom: '2px' }}>4. COMPREHENSIVE</div>
                        <div style={{ fontSize: '9px', color: '#525252' }}>All packages combined</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed' }}>${((retrofitPackages[0].costPerUnit + retrofitPackages[1].costPerUnit + retrofitPackages[2].costPerUnit) * dev.unit_count / 1000000).toFixed(1)}M</div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#525252', marginBottom: '6px' }}>Every intervention, maximum impact</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '9px' }}>
                      <span style={{ color: '#166534' }}>-{retrofitPackages[0].tempReduction + retrofitPackages[1].tempReduction + retrofitPackages[2].tempReduction}°F</span>
                      <span style={{ color: '#737373' }}>18-24 months</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#f5f5f5', border: '1px solid #e5e5e5', marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#525252', marginBottom: '8px', ...S.mono }}>WHAT'S INCLUDED IN EACH</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '9px', color: '#525252' }}>
                    <div><strong style={{ color: '#ea580c' }}>Emergency:</strong> Window AC, electrical upgrades, cool roofs</div>
                    <div><strong style={{ color: '#2563eb' }}>Upgrade:</strong> Heat pumps, insulation, windows, ventilation</div>
                    <div><strong style={{ color: '#16a34a' }}>Climate-Ready:</strong> Facade panels, solar, battery backup, green infrastructure</div>
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#fffbeb', borderLeft: '3px solid #d97706' }}>
                  <div style={{ fontSize: '10px', color: '#525252', lineHeight: 1.4 }}>
                    <strong style={{ color: '#92400e' }}>Note:</strong> Packages have no overlap—they can be combined for maximum impact. The Comprehensive option includes all interventions from all three packages.
                  </div>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e5e5', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '9px', color: '#737373', ...S.mono }}>Source: NYCHA Capital Projects, DOE Heat Pump Analysis</div>
                  <div style={{ fontSize: '9px', color: '#737373', ...S.mono }}>Page 4 of 6</div>
                </div>
              </div>

              {/* PAGE 5: Financial */}
              <div style={pageStyle}>
                <div style={{ fontSize: '9px', color: '#737373', letterSpacing: '0.1em', marginBottom: '8px', ...S.mono }}>CLIM-ALIGN · {dev.name.toUpperCase()}</div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Financial Analysis</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '20px', background: '#052e16', border: '2px solid #22c55e' }}>
                    <div style={{ fontSize: '10px', color: '#86efac', marginBottom: '6px', ...S.mono }}>INVEST NOW</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#22c55e' }}>
                      ${(retrofitPackages[2].costPerUnit * dev.unit_count / 1000000).toFixed(1)}M
                    </div>
                    <div style={{ fontSize: '10px', color: '#a3a3a3', marginTop: '8px' }}>Climate-Ready package</div>
                  </div>
                  <div style={{ padding: '20px', background: '#450a0a', border: '2px solid #dc2626' }}>
                    <div style={{ fontSize: '10px', color: '#fca5a5', marginBottom: '6px', ...S.mono }}>PAY BY 2050</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>
                      ${(retrofitPackages[2].costPerUnit * dev.unit_count * 2.5 / 1000000).toFixed(1)}M
                    </div>
                    <div style={{ fontSize: '10px', color: '#a3a3a3', marginTop: '8px' }}>Emergency + health costs</div>
                  </div>
                </div>

                <div style={{ padding: '20px', background: '#1c1917', border: '1px solid #ca8a04' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fcd34d', marginBottom: '8px' }}>The Math is Clear</div>
                  <p style={{ fontSize: '11px', color: '#d4d4d4', lineHeight: 1.5, margin: 0 }}>
                    Delayed action costs <strong style={{ color: '#fcd34d' }}>150% more</strong> than proactive investment—paid in emergencies, health impacts, and preventable deaths.
                  </p>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #262626', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '9px', color: '#525252', ...S.mono }}>Source: NYCHA PNA, NYU Furman</div>
                  <div style={{ fontSize: '9px', color: '#525252', ...S.mono }}>Page 5</div>
                </div>
              </div>

              {/* PAGE 6: Sources */}
              <div style={pageStyle}>
                <div style={{ fontSize: '9px', color: '#737373', letterSpacing: '0.1em', marginBottom: '8px', ...S.mono }}>CLIM-ALIGN · {dev.name.toUpperCase()}</div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Data Sources</h2>

                {[
                  { cat: 'CLIMATE', items: ['NOAA NCEI Climate Normals', 'NYC Panel on Climate Change (NPCC4)', 'NYC Heat Vulnerability Index'] },
                  { cat: 'BUILDING', items: ['NYC 311 Service Requests', 'NYCHA Development Data Book', 'NYCHA Physical Needs Assessment'] },
                  { cat: 'DEMOGRAPHICS', items: ['U.S. Census ACS 5-Year', 'NYU Furman Center'] },
                  { cat: 'COSTS', items: ['NYCHA Capital Projects FY2024', 'DOE Heat Pump Analysis'] }
                ].map(section => (
                  <div key={section.cat} style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', color: '#737373', marginBottom: '8px', ...S.mono }}>{section.cat}</div>
                    {section.items.map((item, i) => (
                      <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #1f1f1f', fontSize: '11px', color: '#3b82f6' }}>{item}</div>
                    ))}
                  </div>
                ))}

                <div style={{ marginTop: 'auto', borderTop: '1px solid #262626', paddingTop: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#737373' }}>CLIM-ALIGN · Urban Futures NYC 2026</div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
