# Deals Grouping by Date Range

## Overview
Deals are now organized by their valid date ranges, similar to how the pet-sitting app groups sitters by categories. Deals with the same `start_date` and `end_date` are grouped together.

## Available Functions

### 1. `getDateRangeSummary()`
Get a quick overview of all date range groups without fetching full deal data.

**Returns:** Array of date range groups with counts
```typescript
[
  {
    dateRange: "2-9 Jan 2026",
    startDate: "2026-01-02",
    endDate: "2026-01-09",
    dealCount: 382
  },
  {
    dateRange: "Dec 17, 2025 - Jan 11, 2026",
    startDate: "2025-12-17",
    endDate: "2026-01-11",
    dealCount: 83
  }
  // ... more groups
]
```

**Use case:** Display section headers showing how many deals are in each date range

---

### 2. `fetchDealsGroupedByDateRange(limit?: number)`
Fetch all active deals grouped by date range. Optionally limit how many deals to fetch per group.

**Parameters:**
- `limit` (optional): Maximum number of deals to fetch per group

**Returns:** Array of grouped deals
```typescript
[
  {
    dateRange: "2-9 Jan 2026",
    startDate: "2026-01-02",
    endDate: "2026-01-09",
    dealCount: 382,  // Total count
    deals: [         // Actual deals (limited if limit specified)
      {
        deal_id: 123,
        title: "Fresh Milk 1L",
        deal_price: 42,
        original_price: 50,
        discount: 16,
        // ... more fields
      }
      // ... more deals
    ]
  }
  // ... more groups
]
```

**Use case:** Display grouped sections with preview deals (use limit to show only a few per group)

---

### 3. `fetchDealsByDateRange(startDate: string, endDate: string)`
Fetch all deals for a specific date range.

**Parameters:**
- `startDate`: ISO date string (e.g., "2026-01-02")
- `endDate`: ISO date string (e.g., "2026-01-09")

**Returns:** Array of deals for that specific date range

**Use case:** When user taps "View all" for a specific date range group

---

## UI Structure Example

Similar to the pet-sitting app shown:

```
┌─────────────────────────────────┐
│  Pet-sit                        │  →  Your App Title
├─────────────────────────────────┤
│  [Search/Filter Bar]            │
├─────────────────────────────────┤
│  Top rated          View all    │  →  Valid: 2-9 Jan 2026    View all
│  ┌──────┐ ┌──────┐ ┌──────┐   │  →  ┌──────┐ ┌──────┐ ┌──────┐
│  │ Nela │ │ Anu  │ │ Brett│   │  →  │ Milk │ │ Bread│ │ Rice │
│  │ 4.9⭐│ │ 4.9⭐│ │ 4.8⭐│   │  →  │ R42  │ │ R25  │ │ R85  │
│  └──────┘ └──────┘ └──────┘   │  →  └──────┘ └──────┘ └──────┘
├─────────────────────────────────┤
│  In your area       View all    │  →  Valid: Dec 29-Jan 12    View all
│  ┌──────┐ ┌──────┐ ┌──────┐   │  →  ┌──────┐ ┌──────┐ ┌──────┐
│  │Cindy │ │ Paul │ │ Alice│   │  →  │Coca  │ │Chips │ │Juice │
│  └──────┘ └──────┘ └──────┘   │  →  └──────┘ └──────┘ └──────┘
└─────────────────────────────────┘
```

## Implementation Steps

### Step 1: Import the utility
```typescript
import { 
  getDateRangeSummary, 
  fetchDealsGroupedByDateRange,
  fetchDealsByDateRange 
} from '@/utils/deals-grouping';
```

### Step 2: Fetch data in your component
```typescript
// For showing preview with 3 deals per group
const groupedDeals = await fetchDealsGroupedByDateRange(3);

// Or get just the summary first
const summary = await getDateRangeSummary();
```

### Step 3: Render grouped sections
```tsx
{groupedDeals.map((group) => (
  <View key={`${group.startDate}-${group.endDate}`}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{group.dateRange}</Text>
      <TouchableOpacity 
        onPress={() => navigateToFullList(group.startDate, group.endDate)}
      >
        <Text style={styles.viewAll}>View all ({group.dealCount})</Text>
      </TouchableOpacity>
    </View>
    
    <ScrollView horizontal>
      {group.deals.map((deal) => (
        <DealCard key={deal.deal_id} deal={deal} />
      ))}
    </ScrollView>
  </View>
))}
```

### Step 4: Handle "View all" navigation
```typescript
const navigateToFullList = async (startDate: string, endDate: string) => {
  const allDeals = await fetchDealsByDateRange(startDate, endDate);
  navigation.navigate('DealsList', { deals: allDeals, dateRange: formatDateRange(startDate, endDate) });
};
```

## Features

✅ **Automatic Grouping**: Deals with identical date ranges are automatically grouped
✅ **Sorted by Expiry**: Groups are sorted by end date (expiring soonest first)
✅ **Performance Optimized**: Can limit preview deals to reduce data transfer
✅ **Formatted Display**: Date ranges are automatically formatted for readability
✅ **Active Deals Only**: Only shows deals that haven't expired

## Example Output

```
📅 2-9 Jan 2026 (382 deals)
   - Fresh Milk 1L: R42
   - White Bread: R25
   - Coca Cola 2L: R65
   ...

📅 Dec 29, 2025 - Jan 12, 2026 (3 deals)
   - Basmati Rice 5kg: R450
   - Cooking Oil: R89
   ...

📅 Dec 31, 2025 - Jan 31, 2026 (28 deals)
   - Ice Cream: R199
   - Frozen Pizza: R75
   ...
```

## Files Created

1. `backend/utils/deals-grouping.ts` - Main utility functions
2. `backend/test-deals-grouping.ts` - Test file to verify functionality
3. `backend/test-frontend-db.ts` - Updated to show grouping example

## Testing

Run the test file to see the grouping in action:
```bash
npx tsx test-deals-grouping.ts
```

## Next Steps for Frontend

1. Create a `DealsGroupedView` component
2. Add horizontal scrolling for deal cards within each group
3. Implement "View all" navigation to full list view
4. Add loading states and error handling
5. Consider adding filters (by retailer, category, etc.)
