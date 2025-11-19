# SmartCare Connect - Online-First Fix Test Plan

## Pre-Test Setup
1. Clear browser cache and IndexedDB
2. Ensure internet connection is available
3. Login as nurse user

## Test 1: Online Operations (Expected: Direct Firestore writes)
- [ ] Create vitals → Should save immediately online
- [ ] Create billing entry → Should save immediately online  
- [ ] Create triage → Should save immediately online
- [ ] Create shift report → Should save immediately online
- [ ] Network status should show "Synced" (green)
- [ ] No items in sync queue

## Test 2: Offline Fallback (Expected: Queue for sync)
- [ ] Disconnect internet (airplane mode)
- [ ] Create vitals → Should queue for sync
- [ ] Create billing entry → Should queue for sync
- [ ] Network status should show "Offline - X pending items"
- [ ] Reconnect internet
- [ ] Click "Sync Now" → Should upload all queued items
- [ ] Network status should return to "Synced"

## Test 3: Doctor List Loading (Expected: Online fetch with cache)
- [ ] Go to appointments page
- [ ] Doctor dropdown should populate from Firestore
- [ ] Disconnect internet
- [ ] Refresh page
- [ ] Doctor dropdown should show cached doctors

## Test 4: Service Worker Cache Bypass (Expected: API calls never cached)
- [ ] Open DevTools Network tab
- [ ] Make API calls (create vitals, etc.)
- [ ] Verify API calls go to network, not cache
- [ ] Verify /api/health calls are not cached

## Test 5: PWA Installation & Network Monitoring
- [ ] Install PWA from browser
- [ ] Open installed app
- [ ] Network status should initialize correctly
- [ ] Toggle airplane mode → Status should update immediately

## Success Criteria
✅ All online operations write directly to Firestore
✅ Offline operations queue properly and sync when online
✅ Network status accurately reflects connection state
✅ No "stuck in offline mode" behavior
✅ Service worker doesn't cache API routes
✅ Doctor lists load online-first with offline fallback