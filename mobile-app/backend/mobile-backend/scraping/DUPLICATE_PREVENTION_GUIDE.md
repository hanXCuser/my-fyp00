# Complete Duplicate Prevention Strategy

## Three-Step Solution

### Step 1: Run the Constraint SQL ✅ **MOST IMPORTANT**
**File**: `prevent-duplicates-constraints.sql`

Run this in **Supabase SQL Editor** to add database constraints:
- Prevents duplicate deals at database level
- Prevents duplicate price history records
- Makes duplicates **impossible** to create

```bash
# Just copy the SQL file content and run it in Supabase
```

### Step 2: Clean Existing Duplicates
**File**: `check-duplicates.sql`

Before adding constraints, clean up existing duplicates:

1. Run queries **1-5** to see what duplicates exist
2. Run query **6** to automatically delete them
3. Verify with query **5** (Summary Statistics)

### Step 3: Your Code Already Works! ✅
**File**: `database.ts`

Your current `upsertDeal()` method already:
- ✅ Checks for existing deals before inserting
- ✅ Updates only if price changed
- ✅ Archives old prices automatically
- ✅ Won't try to create duplicates

**No code changes needed!**

---

## How It All Works Together

### Before Constraints (Current Problem):
```
Scraper runs → Creates deal #1
Scraper runs again → Creates deal #2 (DUPLICATE! 😡)
```

### After Constraints (Solution):
```
Scraper runs → Creates deal #1 ✅
Scraper runs again → Database blocks duplicate ✅
                   → Your code sees existing deal ✅
                   → Updates if price changed ✅
                   → Archives old price automatically ✅
```

---

## What Gets Prevented

### ✅ Deals Table
**UNIQUE** on: `(product_id, supermarket_id, start_date, end_date)`

```sql
-- ✅ ALLOWED:
Deal 1: Coca-Cola R45 at Super U Phoenix, Feb 19-26
Deal 2: Coca-Cola R50 at Super U Quatre Bornes, Feb 19-26  -- Different location
Deal 3: Coca-Cola R45 at Super U Phoenix, Feb 27-Mar 5      -- Different dates

-- ❌ BLOCKED:
Deal 1: Coca-Cola R45 at Super U Phoenix, Feb 19-26
Deal 2: Coca-Cola R45 at Super U Phoenix, Feb 19-26  -- EXACT DUPLICATE!
```

### ✅ Price History Table
**UNIQUE** on: `(product_id, supermarket_id, old_price, collected_at)`

```sql
-- ✅ ALLOWED:
Record 1: Coca-Cola was R45 at 10:00:00
Record 2: Coca-Cola was R45 at 10:00:05  -- Different time (5 seconds later)
Record 3: Coca-Cola was R50 at 10:00:05  -- Different price

-- ❌ BLOCKED:
Record 1: Coca-Cola was R45 at 10:00:00
Record 2: Coca-Cola was R45 at 10:00:00  -- EXACT DUPLICATE!
```

---

## Testing After Setup

### Test 1: Run Scraper Twice
```bash
npm run scrape:superu
# Wait for completion
npm run scrape:superu  # Run again immediately
```

**Expected Result**: 
- First run: Creates new deals
- Second run: "Deal already exists - No changes needed"
- ✅ NO DUPLICATES!

### Test 2: Check Database
```sql
-- Should return 0 rows (no duplicates)
SELECT product_id, supermarket_id, start_date, end_date, COUNT(*) 
FROM deals
GROUP BY product_id, supermarket_id, start_date, end_date
HAVING COUNT(*) > 1;
```

### Test 3: Run All Scrapers
```bash
npm run scrape:all
```

**Expected**:
- ✅ Archives 574+ prices to history
- ✅ Updates existing deals (no duplicates)
- ✅ Creates only new deals
- ✅ No constraint violation errors

---

## Error Handling

### If You See: "duplicate key value violates unique constraint"
**This is GOOD!** It means:
1. ✅ Constraints are working
2. ✅ Duplicate was prevented
3. ⚠️ Your code needs to check before inserting

**Fix**: Your code already does this! The error means something outside your scrapers tried to create a duplicate.

### If Scraper Fails After Adding Constraints
**Unlikely** - your code already checks for duplicates. But if it happens:
1. Check the error message
2. The constraint will tell you which fields are duplicated
3. Update the scraper to handle that case

---

## Performance Impact

### ✅ Better Performance
- Unique constraints create indexes automatically
- Queries checking for duplicates run **faster**
- Database does less work (no duplicate data)

### 📊 Before vs After
```
Before: 2000 deals (500 duplicates) = wasted storage
After:  1500 deals (0 duplicates)   = clean data ✅
```

---

## Maintenance

### Weekly: Check for any issues
```sql
-- Run query 5 from check-duplicates.sql
SELECT 'Total Deals' as metric, COUNT(*) as count FROM deals
UNION ALL
SELECT 'Deals with Potential Duplicates', COUNT(*)
FROM (
  SELECT product_id, supermarket_id, start_date, end_date
  FROM deals
  GROUP BY product_id, supermarket_id, start_date, end_date
  HAVING COUNT(*) > 1
) sub;
```

Should show: **0 duplicates**

### Monthly: Review price history growth
```sql
SELECT COUNT(*) FROM price_history;
-- Should grow steadily, not explosively
```

---

## Quick Start Checklist

- [ ] 1. Run `check-duplicates.sql` query 6 (clean existing duplicates)
- [ ] 2. Run `prevent-duplicates-constraints.sql` (add constraints)
- [ ] 3. Test with `npm run scrape:superu`
- [ ] 4. Run again, confirm no duplicates
- [ ] 5. Run `npm run scrape:all` for full test
- [ ] ✅ Done! Duplicates now impossible

---

## Summary

**What you need to do:**
1. ✅ Clean existing duplicates (check-duplicates.sql, query 6)
2. ✅ Add database constraints (prevent-duplicates-constraints.sql)
3. ✅ Test scrapers

**What happens automatically:**
- ✅ Database blocks all duplicate attempts
- ✅ Your code handles updates gracefully  
- ✅ Price history archives without duplicates
- ✅ Clean data forever!

The database will enforce uniqueness at the lowest level - the most reliable approach!
