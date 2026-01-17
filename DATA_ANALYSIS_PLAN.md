# Climate Fit Data Analysis Plan

## Overview
This document maps all data needs across the application and defines the methodology for calculating building-climate "fit" (aligned/strained/misaligned) across four time periods.

---

## Timeline Periods & Data Needs

### **Era 1: 1950s (As Designed)**
**Status: ALIGNED** - Building designed for this climate

**Data Needed:**
- ✅ Building design year (have)
- ✅ Historical temperature data (1960s baseline)
- ✅ Historical heat days (1960s baseline)
- ⏳ Design cooling capacity (estimated)
- ⏳ Original building specifications
- ⏳ Population at opening

**Sources:**
- NYCHA building records
- NOAA historical weather data
- NYC Panel on Climate Change (NPCC)
- Building design standards (1940s-1950s)

---

### **Era 2: 1990s (~40 years old)**
**Status: STRAINED** - Aging infrastructure, warming climate

**Data Needed:**
- ⏳ Temperature data (1990s)
- ⏳ Heat days (1990s)
- ⏳ 311 complaint data (if available for 1990s)
- ⏳ Demographic data (1990 Census)
- ⏳ Building condition reports
- ⏳ Infrastructure age/degradation

**Sources:**
- NOAA historical weather
- Census 1990
- NYCHA maintenance records (FOIL)
- Historical 311 data (if exists)

---

### **Era 3: 2026 (Current)**
**Status: Based on current metrics**

**Data Needed:**
- ✅ Current temperature (2020s) - HAVE
- ✅ Current heat days - HAVE
- ✅ 311 complaints (2020-2025) - HAVE
- ✅ Demographics (2023) - HAVE
- ✅ Heat Vulnerability Index (2020) - HAVE
- ⏳ Current building condition
- ⏳ AC coverage/penetration rate

**Sources:**
- ✅ NYC Open Data (311)
- ✅ NYU Furman Center (demographics)
- ✅ NYC DOHMH (HVI)
- ⏳ NYCHA property condition assessments

---

### **Era 4: 2050s (Projected)**
**Status: Based on climate projections + retrofits**

**Data Needed:**
- ✅ Temperature projections (2050) - HAVE
- ✅ Heat days projections - HAVE
- ⏳ Demographic projections
- ⏳ Infrastructure degradation projections
- ✅ Retrofit effectiveness data - HAVE (estimated)

**Sources:**
- ✅ NYC Panel on Climate Change (NPCC4)
- ⏳ Census projections
- ⏳ Building science studies (retrofit effectiveness)

---

## Alignment Methodology

### **Thermal Dimension**
Measures: Building's ability to maintain safe indoor temperatures

**Metrics:**
1. **Peak Indoor Temperature** (calculated from ambient + building characteristics)
2. **Heat Vulnerability Index** (HVI score 1-5)
3. **Extreme Heat Days** (days >90°F)

**Thresholds:**
- **ALIGNED**: Indoor temp ≤85°F, HVI ≤2, <15 heat days/year
- **STRAINED**: Indoor temp 86-95°F, HVI 3-4, 15-25 heat days/year
- **MISALIGNED**: Indoor temp >95°F, HVI 5, >25 heat days/year

**Calculation for 2026:**
```javascript
if (nta.hvi >= 4 && indoor_temp > 95) return 'misaligned';
if (nta.hvi >= 3 || indoor_temp > 85) return 'strained';
return 'aligned';
```

**Retrofit Impact:**
- Cooling systems: -18°F to -23°F indoor temp reduction
- Envelope: -5°F to -11°F reduction
- Site improvements: -4°F to -6°F ambient reduction

---

### **Infrastructure Dimension**
Measures: Building systems' ability to meet resident needs

**Metrics:**
1. **311 Complaint Rate** (per 1,000 units, 5-year)
2. **Heat/Hot Water Complaints** (absolute count)
3. **Building Age** (years since construction)

**Thresholds:**
- **ALIGNED**: <1,500 complaints/1k, <500 heat complaints, age <30y
- **STRAINED**: 1,500-3,000 complaints/1k, 500-1,500 heat, age 30-60y
- **MISALIGNED**: >3,000 complaints/1k, >1,500 heat, age >60y

**Calculation for 2026:**
```javascript
if (complaints.per_1k > 3000 && complaints.heat > 1500) return 'misaligned';
if (complaints.per_1k > 1500 || building_age > 60) return 'strained';
return 'aligned';
```

**Retrofit Impact:**
- Mechanical systems: -30% to -50% complaint reduction
- Envelope: -20% to -35% reduction
- Building automation: -15% to -25% reduction

---

### **Social Dimension**
Measures: Population vulnerability to climate impacts

**Metrics:**
1. **Seniors (65+)** - Heat-vulnerable population
2. **Youth (<18)** - Vulnerable to extreme heat
3. **Disabled** - Limited mobility/adaptive capacity
4. **Poverty Rate** - Access to cooling resources

**Thresholds:**
- **ALIGNED**: <12% seniors, <25% youth, <10% disabled, <20% poverty
- **STRAINED**: 12-20% seniors, 25-35% youth, 10-15% disabled, 20-35% poverty
- **MISALIGNED**: >20% seniors, >35% youth, >15% disabled, >35% poverty

**Calculation for 2026:**
```javascript
const vulnerability_score =
  (nta.pct_seniors > 20 ? 2 : nta.pct_seniors > 12 ? 1 : 0) +
  (nta.pct_youth > 35 ? 2 : nta.pct_youth > 25 ? 1 : 0) +
  (nta.pct_disabled > 15 ? 2 : nta.pct_disabled > 10 ? 1 : 0) +
  (nta.poverty_rate > 35 ? 2 : nta.poverty_rate > 20 ? 1 : 0);

if (vulnerability_score >= 6) return 'misaligned';
if (vulnerability_score >= 3) return 'strained';
return 'aligned';
```

**Retrofit Impact:**
- Site improvements (trees, cooling centers): +1 point improvement
- Nature-based solutions: +0.5 points
- (Demographics don't change with building retrofits, but access improves)

---

## Data Collection Priority

### **HIGH PRIORITY** (Implement First)
1. ✅ **Current 311 complaints** - COMPLETED
2. ✅ **Current demographics** - COMPLETED
3. ✅ **Current HVI** - COMPLETED
4. ⏳ **Historical climate data (1960s, 1990s, 2020s)**
5. ⏳ **2050s climate projections**

### **MEDIUM PRIORITY**
6. ⏳ Historical 311 data (if available)
7. ⏳ Historical demographics (1990 Census)
8. ⏳ Building design specifications
9. ⏳ AC penetration rates by development

### **LOW PRIORITY** (Nice to have)
10. ⏳ Demographic projections (2050)
11. ⏳ Historical building condition reports
12. ⏳ Retrofit effectiveness case studies

---

## Data Breakdown Reorganization

### **Proposed New Structure:**

Instead of:
- ~~HVI section~~
- ~~311 section~~
- ~~Demographics section~~

Use:
```
DATA SOURCES & METHODOLOGY
├── 1950s (As Designed)
│   ├── Climate: 82°F avg, 8 heat days
│   ├── Building: Designed for natural ventilation
│   └── Status: ALIGNED
│
├── 1990s (~40 years old)
│   ├── Climate: 87°F avg, 18 heat days (+6°F warming)
│   ├── Infrastructure: Aging systems, early degradation
│   └── Status: STRAINED
│
├── 2026 (Current)
│   ├── Climate: 89°F avg, 25 heat days
│   ├── 311 Complaints: 3,716 total (2,777 per 1k)
│   ├── Demographics: 12.8% seniors, 28.4% youth, 13.9% disabled
│   ├── HVI: 5/5 (Highest Risk)
│   └── Status: MISALIGNED
│
└── 2050s (Projected)
    ├── Climate: 94°F avg, 35+ heat days (projected)
    ├── With Retrofits: Can achieve ALIGNED status
    └── Methodology: Shows how retrofits improve each dimension
```

---

## Next Steps

1. **Research historical climate data** for 1960s and 1990s
2. **Implement transparent methodology display** in each era section
3. **Reorganize DataBreakdown component** by timeline period
4. **Add calculation explanations** showing thresholds and current values
5. **Expand to other developments** once Brownsville is complete

---

## Notes

- All thresholds based on building science, NYCHA standards, and climate research
- Methodology will be displayed transparently in the UI
- Each metric will show: Current Value | Threshold | Status
- Retrofit calculations will show before/after for each dimension
