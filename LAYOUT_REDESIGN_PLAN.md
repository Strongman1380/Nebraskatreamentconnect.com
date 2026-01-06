# Nebraska Treatment Connect Layout Redesign Plan

## Task Overview
Redesign the application layout to improve user experience by:
- Removing confusing search/filter boxes while preserving functionality
- Relocating navigation elements to more intuitive positions
- Adding map integration for facility locations
- Implementing tabbed facility browsing

## Detailed Tasks

### Phase 1: Analysis & Planning
- [x] Examine current file structure and identify all relevant files
- [x] Analyze current layout and search functionality
- [x] Identify all pages that need updates
- [x] Research map API options for facility locations

### Phase 2: Layout Restructuring
- [x] Remove the main search/filter box from all pages
- [x] Extract and preserve navigation functionality
- [x] Extract and preserve search by name/zip functionality
- [x] Design new centered header with title only

### Phase 3: Header Redesign
- [x] Create new centered header with "Nebraska Treatment Connect" title
- [x] Move provider portal to upper right corner as small button
- [x] Remove facility type navigation from header
- [x] Update responsive design for new header

### Phase 4: Facility Navigation Implementation
- [x] Create new tabbed navigation for facility types:
  - Residential Detox
  - Halfway Houses
  - Outpatient Services
  - Detox Centers
- [x] Implement tab switching functionality
- [x] Add highlighting/active state for selected facility type
- [x] Connect tabs to filter facility listings

### Phase 5: Search Functionality Updates
- [x] Maintain search by name functionality
- [x] Maintain search by zip code functionality
- [x] Integrate search with new tabbed navigation
- [x] Ensure search works across all facility types

### Phase 6: CSS Styling for New Layout
- [ ] Create new styles.css file for redesigned layout
- [ ] Style new header with centered title
- [ ] Style compact search section
- [ ] Style facility navigation tabs
- [ ] Style collapsible advanced filters

### Phase 7: Map Integration
- [ ] Research and select appropriate map API (Google Maps, Mapbox, etc.)
- [ ] Implement facility location display
- [ ] Add map preview functionality
- [ ] Integrate map with facility listings

### Phase 8: Testing & Validation
- [ ] Test layout changes across all pages
- [ ] Verify search functionality works correctly
- [ ] Test tabbed navigation
- [ ] Validate map integration
- [ ] Ensure responsive design works on mobile

### Phase 9: Apply Changes to Other Pages
- [ ] Update detox.html
- [ ] Update halfway-houses.html
- [ ] Update outpatient.html
- [ ] Update all related files

### Phase 10: Deployment
- [ ] Update deploy folder with new files
- [ ] Test deployed version
- [ ] Create deployment summary

## Files to Update
- index.html ✅ (Redesigned)
- styles-new.css ⏳ (In Progress)
- detox.html
- halfway-houses.html
- outpatient.html
- scripts.js
- All related JavaScript and CSS files

## Map API Research

### Recommended APIs:

#### 1. Google Maps API (Recommended)
- **Pros:**
  - Most comprehensive and accurate data
  - Excellent geocoding and reverse geocoding
  - Rich feature set (markers, info windows, directions)
  - Good mobile support
  - Reliable uptime
- **Cons:**
  - Pay-per-use model can be expensive for high traffic
  - Requires API key and billing setup
- **Best for:** Production applications with moderate to high budget

#### 2. Mapbox
- **Pros:**
  - Highly customizable styling
  - Good performance and speed
  - Competitive pricing
  - Open-source core with cloud services
- **Cons:**
  - Less comprehensive POI data than Google
  - Learning curve for customization
- **Best for:** Applications requiring custom styling and moderate budget

#### 3. Leaflet with OpenStreetMap
- **Pros:**
  - Completely free and open source
  - No API key required for basic usage
  - Large community and plugins
  - Lightweight and fast
- **Cons:**
  - Limited POI data
  - Requires third-party geocoding service
  - Less polished appearance
- **Best for:** Budget-conscious projects or development/testing

### Implementation Recommendation:
Start with **Leaflet/OpenStreetMap** for development and testing, then upgrade to **Google Maps API** for production if budget allows.

## Key Changes Summary:
1. **Simplified Header:** Center title with provider portal button
2. **Relocated Search:** Compact search bar in results section
3. **Tabbed Navigation:** Facility type tabs where listings appear
4. **Improved UX:** Less visual clutter, clearer navigation flow

## Current Progress:
- ✅ Created new index.html with redesigned layout
- ⏳ Creating styles-new.css for styling
- ⏳ Next: Apply changes to other pages and deploy
