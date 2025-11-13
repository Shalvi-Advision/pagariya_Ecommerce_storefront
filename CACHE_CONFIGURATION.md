# Cache Configuration

## Current Setup (Updated: 2025-01-13)

### Cache Expiry Time: **10 Minutes** ⏱️

The merchandising data cache has been configured with a **10-minute expiry** time, providing a balanced approach between:
- ✅ **Data Freshness** - Users see updated content within 10 minutes
- ✅ **Performance** - Reduced network requests and faster load times
- ✅ **User Experience** - Smooth browsing with minimal staleness

---

## Cache Layers

### 1. IndexedDB Cache (Merchandising Data)
**Location:** `src/api/merchandisingApi.js:9`

```javascript
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds
```

**What's Cached:**
- Best Sellers sections with enriched product data
- Popular Categories sections with enriched subcategory data
- Active Advertisements with enriched product data

**Behavior:**
- Data cached when fetched from API
- Served from cache if less than 10 minutes old
- Automatically re-fetched if cache is expired
- Falls back to cache during offline mode (regardless of age)

**Cache Keys:**
- `best_sellers_{store_code}`
- `popular_categories_{store_code}`
- `advertisements_{category}_{store_code}`

### 2. Service Worker Cache
**Location:** `public/sw.js`

**Strategies:**
- **Static Assets** (JS, CSS, images): Cache First
- **API Requests**: Network First (with IndexedDB cache above)
- **HTML Pages**: Network First

**Note:** Service Worker cache is separate from IndexedDB and uses browser cache API. It's primarily for offline support of static assets.

---

## Manual Cache Clearing

Users can manually clear all caches using the **"Clear Cache"** button:

**Desktop:** My Account → Clear Cache
**Mobile:** User Menu → Clear Cache

This clears:
- ✅ All IndexedDB merchandising data
- ✅ All Service Worker caches
- ✅ Triggers page reload for fresh data

---

## Cache Flow Diagram

```
User Requests Data
        ↓
Is Online?
   ├─ NO  → Try IndexedDB (any age) → Display cached data or fallback
   └─ YES → Check IndexedDB cache
              ├─ Cache exists & < 10 min old? → Return cached data
              └─ Cache missing or expired?
                    ↓
              Fetch from API
                    ↓
              Cache in IndexedDB (with timestamp)
                    ↓
              Return fresh data
```

---

## Cache Metrics

### Before (2 hours cache):
- ❌ Stale data for up to 2 hours
- ✅ Fewer network requests
- ⚠️ Users see old merchandising content

### After (10 minutes cache):
- ✅ Fresh data within 10 minutes
- ✅ Still benefits from caching
- ✅ Better balance between performance and freshness
- ✅ Reduced cache-related support issues

---

## Configuration Options

If you need to adjust cache duration in the future:

### Very Fresh (5 minutes)
```javascript
const CACHE_EXPIRY = 5 * 60 * 1000;
```
**Use when:** Content changes very frequently
**Trade-off:** More network requests

### Balanced (10 minutes) ⭐ **CURRENT**
```javascript
const CACHE_EXPIRY = 10 * 60 * 1000;
```
**Use when:** Regular content updates expected
**Trade-off:** Good balance

### Extended (30 minutes)
```javascript
const CACHE_EXPIRY = 30 * 60 * 1000;
```
**Use when:** Content rarely changes
**Trade-off:** Better performance, longer stale period

### Long-term (2 hours)
```javascript
const CACHE_EXPIRY = 2 * 60 * 60 * 1000;
```
**Use when:** Content very stable
**Trade-off:** Minimal network usage, potential stale data

---

## When Cache is Bypassed

Cache is automatically bypassed when:
1. **Cache expired** (older than 10 minutes)
2. **Network request fails** → Uses any cached data as fallback
3. **User clears cache** → Immediately fetches fresh data
4. **Store code changes** → Different cache key, fresh fetch

---

## Monitoring Cache Behavior

### Browser DevTools

**Check IndexedDB:**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Expand "IndexedDB" → "ShalviEcommerceDB" → "merchandising"
4. View cached items with timestamps

**Check Service Worker:**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Service Workers"
4. View "Cache Storage" to see cached assets

### Console Logs

The app logs cache behavior:
- `✅ Merchandising data cached successfully: {key}`
- `✅ Retrieved merchandising data from cache: {key}`
- `🔗 Fetching from network...`
- `✅ Serving from cache`

---

## Performance Impact

### Network Requests (10-minute window):

**Example: User browsing for 30 minutes**

| Time | Action | Network Request? |
|------|--------|-----------------|
| 0:00 | Load homepage | ✅ Initial fetch |
| 0:05 | Browse products | ❌ Served from cache |
| 0:08 | View category | ❌ Served from cache |
| 0:10 | Return to home | ✅ Cache expired, re-fetch |
| 0:15 | Browse more | ❌ Served from cache |
| 0:20 | View cart | ❌ Served from cache |
| 0:20 | Return to home | ✅ Cache expired, re-fetch |
| 0:25 | Continue browsing | ❌ Served from cache |
| 0:30 | View favorites | ✅ Cache expired, re-fetch |

**Result:** 4 API calls in 30 minutes (vs. 1 with 2-hour cache or 6+ without cache)

---

## Best Practices

### For Developers:
1. ✅ Use "Clear Cache" button when testing new merchandising data
2. ✅ Check cache timestamps in IndexedDB during debugging
3. ✅ Monitor console logs for cache hit/miss patterns
4. ✅ Test both online and offline scenarios

### For Content Managers:
1. ✅ Know that content updates appear within 10 minutes
2. ✅ Use "Clear Cache" button to see changes immediately
3. ✅ Inform users to refresh if they report seeing old content
4. ✅ Schedule major updates during low-traffic periods

---

## Offline Support

**When Offline:**
- Cached data served regardless of age
- Users can browse previously loaded content
- Static assets (images, CSS, JS) served from Service Worker cache
- "Offline" indicator shown to users

**When Back Online:**
- Normal 10-minute cache rules apply
- Fresh data fetched on next request
- Background sync happens automatically

---

## Technical Details

### Cache Implementation
**File:** `src/api/merchandisingApi.js`

```javascript
// Check cache age before serving
if (result && (Date.now() - result.timestamp) < CACHE_EXPIRY) {
  console.log('✅ Retrieved merchandising data from cache:', cacheKey);
  resolve(result.data);
} else {
  resolve(null); // Cache expired, will fetch fresh
}
```

### Cache Storage Structure
```javascript
{
  cacheKey: "best_sellers_AVB",
  data: { /* merchandising data */ },
  timestamp: 1705147200000 // Unix timestamp
}
```

---

## Troubleshooting

### Issue: Seeing stale data
**Solution:**
1. Wait up to 10 minutes for automatic refresh
2. OR use "Clear Cache" button for immediate refresh
3. OR hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

### Issue: Too many network requests
**Solution:**
1. Check if cache is working (see console logs)
2. Verify IndexedDB is not full
3. Check cache timestamps in DevTools

### Issue: Data not updating
**Solution:**
1. Check API is returning new data
2. Verify cache is being set (console logs)
3. Clear cache and refresh
4. Check network tab for 200 responses

---

## Future Considerations

If you need different cache strategies:

1. **Per-Store Cache Duration**
   - Configure different expiry times per store
   - Busy stores = shorter cache
   - Slow stores = longer cache

2. **Time-of-Day Cache**
   - Shorter cache during business hours
   - Longer cache during off-hours

3. **Content-Type Cache**
   - Different expiry for advertisements vs. categories
   - Example: Ads = 5 min, Categories = 30 min

4. **Smart Cache Invalidation**
   - Server sends cache-control headers
   - Backend webhook triggers cache clear
   - Real-time updates via WebSocket

---

**Status:** ✅ Optimized and Production-Ready
**Cache Duration:** 10 minutes (balanced approach)
**Last Updated:** 2025-01-13
