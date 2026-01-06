// Shared facility helpers for filtering, sanitization, and normalization
(function(global) {
    const SecurityUtils = global.SecurityUtils || {
        sanitizeHTML: (value) => value ?? '',
        sanitizeAttribute: (value) => value ?? '',
        sanitizePhone: (value) => value ?? '',
        sanitizeURL: (value) => value ?? '',
        validateInput: (value, type = 'text', maxLength = 1000) => true
    };

    function toKey(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function validateFacilityRecord(record) {
        if (!record || typeof record !== 'object') return false;

        // Validate required fields (website is now optional - don't fail validation for missing/invalid website)
        if (record.name && !SecurityUtils.validateInput(record.name, 'text', 200)) return false;
        if (record.address && !SecurityUtils.validateInput(record.address, 'text', 500)) return false;
        if (record.phone && record.phone.length > 50) return false;
        
        // Website is optional - only enforce length to keep records from being skipped.
        if (record.website && record.website.trim()) {
            const trimmedWebsite = record.website.trim();
            if (trimmedWebsite.length > 500) return false;
        }

        // Validate field lengths
        if (record.type && record.type.length > 50) return false;
        if (record.treatmentType && record.treatmentType.length > 50) return false;
        if (record.genderServed && record.genderServed.length > 20) return false;
        if (record.ageGroup && record.ageGroup.length > 20) return false;
        if (record.status && record.status.length > 50) return false;

        return true;
    }

    function normalizeFacilityRecord(record) {
        if (!record || typeof record !== 'object' || !validateFacilityRecord(record)) return null;

        return {
            id: record.id ?? null,
            name: SecurityUtils.sanitizeHTML((record.name || '').trim()),
            type: SecurityUtils.sanitizeHTML((record.type || '').trim()),
            treatmentType: SecurityUtils.sanitizeHTML((record.treatmentType || '').trim()),
            genderServed: SecurityUtils.sanitizeHTML((record.genderServed || '').trim()),
            ageGroup: SecurityUtils.sanitizeHTML((record.ageGroup || '').trim()),
            status: SecurityUtils.sanitizeHTML((record.status || '').trim()) || 'Contact for Availability',
            lastUpdated: record.lastUpdated || null,
            address: SecurityUtils.sanitizeHTML((record.address || '').trim()),
            phone: SecurityUtils.sanitizePhone((record.phone || '').trim()),
            website: SecurityUtils.sanitizeURL((record.website || '').trim()),
            coordinates: record.coordinates && typeof record.coordinates.lat === 'number' && typeof record.coordinates.lng === 'number'
                ? {
                    lat: Math.max(-90, Math.min(90, record.coordinates.lat)),
                    lng: Math.max(-180, Math.min(180, record.coordinates.lng))
                }
                : null,
            description: SecurityUtils.sanitizeHTML((record.description || '').trim())
        };
    }

    function normalizeFacilityDataset(facilities) {
        if (!Array.isArray(facilities)) return [];

        const map = new Map();

        facilities.forEach((facility) => {
            const normalized = normalizeFacilityRecord(facility);
            if (!normalized) {
                console.warn('Invalid facility record skipped:', facility);
                return;
            }

            const key = normalized.id !== null
                ? `id:${normalized.id}`
                : `name:${toKey(normalized.name)}|address:${toKey(normalized.address)}`;

            const entry = map.get(key) || {
                id: normalized.id !== null ? normalized.id : null,
                key,
                name: normalized.name,
                address: normalized.address,
                phone: normalized.phone,
                website: normalized.website,
                genderServed: normalized.genderServed || 'Co-ed',
                ageGroup: normalized.ageGroup || 'Adult',
                status: normalized.status,
                lastUpdated: normalized.lastUpdated,
                coordinates: normalized.coordinates,
                description: normalized.description || '',
                treatmentTypes: new Set(),
                facilityTypes: new Set(),
                sourceIds: new Set(),
                bestStatusPriority: getStatusPriority(normalized.status),
                phoneDigits: sanitizedDigits(normalized.phone)
            };

            if (normalized.id !== null) {
                entry.sourceIds.add(normalized.id);
            }

            if (normalized.name && !entry.name) {
                entry.name = normalized.name;
            }

            if (normalized.address && !entry.address) {
                entry.address = normalized.address;
            }

            if (normalized.phone && !entry.phone) {
                entry.phone = normalized.phone;
                entry.phoneDigits = sanitizedDigits(normalized.phone);
            }

            if (normalized.website && !entry.website) {
                entry.website = normalized.website;
            }

            if (normalized.genderServed) {
                entry.genderServed = normalized.genderServed;
            }

            if (normalized.ageGroup) {
                entry.ageGroup = normalized.ageGroup;
            }

            if (normalized.coordinates && !entry.coordinates) {
                entry.coordinates = normalized.coordinates;
            }

            if (normalized.description && !entry.description) {
                entry.description = normalized.description;
            }

            entry.treatmentTypes.add(normalized.treatmentType || 'Unknown');
            entry.facilityTypes.add(normalized.type || 'Treatment Center');

            const priority = getStatusPriority(normalized.status);
            if (priority < entry.bestStatusPriority) {
                entry.status = normalized.status;
                entry.bestStatusPriority = priority;
            }

            entry.lastUpdated = resolveLatestDate(entry.lastUpdated, normalized.lastUpdated);

            map.set(key, entry);
        });

        return Array.from(map.values()).map((entry, index) => {
            const treatmentTypes = Array.from(entry.treatmentTypes).filter(Boolean);
            const facilityTypes = Array.from(entry.facilityTypes).filter(Boolean);

            const id = entry.id !== null ? entry.id : index + 1;
            const searchFields = [
                entry.name,
                entry.address,
                entry.phone,
                entry.description,
                treatmentTypes.join(' '),
                facilityTypes.join(' ')
            ].join(' ').toLowerCase();

            return {
                id,
                sourceIds: Array.from(entry.sourceIds),
                name: entry.name,
                address: entry.address,
                phone: entry.phone,
                website: entry.website,
                genderServed: entry.genderServed,
                ageGroup: entry.ageGroup,
                status: entry.status,
                lastUpdated: entry.lastUpdated,
                coordinates: entry.coordinates,
                description: entry.description,
                treatmentType: treatmentTypes[0] || '',
                treatmentTypes,
                type: facilityTypes[0] || '',
                facilityTypes,
                searchIndex: searchFields,
                phoneDigits: entry.phoneDigits,
                key: entry.key
            };
        });
    }

    function getStatusPriority(status) {
        const priority = {
            'Emergency/Crisis Only': 0,
            'Openings Available': 1,
            'Accepting Assessments': 2,
            'Waitlist': 3,
            'No Openings': 4,
            'Contact for Availability': 5
        };
        return priority[status] !== undefined ? priority[status] : 5;
    }

    function resolveLatestDate(current, candidate) {
        if (!candidate) return current;
        if (!current) return candidate;
        const currentDate = new Date(current);
        const candidateDate = new Date(candidate);
        return candidateDate > currentDate ? candidate : current;
    }

    function sanitizedDigits(value) {
        return (value || '').replace(/\D/g, '');
    }

    function calculateDistance(lat1, lng1, lat2, lng2) {
        // Validate coordinates
        if (typeof lat1 !== 'number' || typeof lng1 !== 'number' ||
            typeof lat2 !== 'number' || typeof lng2 !== 'number') {
            return Infinity;
        }

        // Validate coordinate ranges
        if (Math.abs(lat1) > 90 || Math.abs(lng1) > 180 ||
            Math.abs(lat2) > 90 || Math.abs(lng2) > 180) {
            return Infinity;
        }

        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function filterFacilities(facilities, criteria = {}, userLocation = null) {
        if (!Array.isArray(facilities)) return [];

        // Validate criteria
        const searchTerm = (criteria.searchTerm || '').trim().toLowerCase();
        if (searchTerm.length > 200) return []; // Prevent abuse

        const searchDigits = sanitizedDigits(searchTerm);
        const radius = Math.min(999, Math.max(1, Number.parseInt(criteria.radius, 10) || 999));
        const ageGroup = (criteria.ageGroup || '').substring(0, 20);
        const genderServed = (criteria.genderServed || '').substring(0, 20);
        const treatmentType = (criteria.treatmentType || '').substring(0, 50);
        const facilityType = (criteria.facilityType || '').substring(0, 50);

        console.log('FacilityUtils.filterFacilities called with:', {
            searchTerm,
            facilitiesCount: facilities.length,
            hasSearchIndex: facilities[0] && 'searchIndex' in facilities[0]
        });

        return facilities.filter((facility) => {
            let matchesSearch = true;
            if (searchTerm) {
                // Split search term into individual words for more flexible matching
                const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);

                // Check if facility has searchIndex (should be present if normalized)
                if (!facility.searchIndex) {
                    console.error('Facility missing searchIndex:', facility);
                    return false;
                }

                // Check if ANY of the search words match (OR logic for better results)
                if (searchWords.length > 0) {
                    matchesSearch = searchWords.some(word =>
                        facility.searchIndex.includes(word)
                    ) || (searchDigits && facility.phoneDigits && facility.phoneDigits.includes(searchDigits));
                } else {
                    matchesSearch = facility.searchIndex.includes(searchTerm) ||
                        (searchDigits && facility.phoneDigits && facility.phoneDigits.includes(searchDigits));
                }
            }

            const matchesAge = !ageGroup || facility.ageGroup === ageGroup || facility.ageGroup === 'Both';
            const matchesGender = !genderServed || facility.genderServed === genderServed || facility.genderServed === 'Co-ed';

            const matchesTreatment = !treatmentType ||
                facility.treatmentTypes.includes(treatmentType) ||
                facility.treatmentType === treatmentType ||
                facility.treatmentTypes.includes('Both');

            const matchesFacilityType = !facilityType ||
                facility.facilityTypes.includes(facilityType) ||
                facility.type === facilityType;

            let matchesDistance = true;
            if (userLocation && radius < 999) {
                if (facility.coordinates) {
                    const distance = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        facility.coordinates.lat,
                        facility.coordinates.lng
                    );
                    matchesDistance = distance <= radius;
                } else {
                    // If radius filtering is active but a facility lacks coordinates,
                    // exclude it rather than showing it at an unknown distance.
                    matchesDistance = false;
                }
            }

            return matchesSearch &&
                matchesAge &&
                matchesGender &&
                matchesTreatment &&
                matchesFacilityType &&
                matchesDistance;
        });
    }

    function sanitizeFacilityForRender(facility) {
        if (!facility) return null;

        // Validate the facility object before sanitizing
        if (typeof facility !== 'object') {
            console.error('Invalid facility object passed to sanitizeFacilityForRender:', facility);
            return null;
        }

        const treatmentTypes = Array.isArray(facility.treatmentTypes) && facility.treatmentTypes.length
            ? facility.treatmentTypes.map(t => SecurityUtils.sanitizeHTML(t))
            : [SecurityUtils.sanitizeHTML(facility.treatmentType || '')].filter(Boolean);

        const sanitizedWebsite = SecurityUtils.sanitizeURL(facility.website || '');

        return {
            id: facility.id,
            name: SecurityUtils.sanitizeHTML(facility.name || ''),
            type: SecurityUtils.sanitizeHTML(facility.type || ''),
            facilityTypes: Array.isArray(facility.facilityTypes)
                ? facility.facilityTypes.map((type) => SecurityUtils.sanitizeHTML(type))
                : [],
            treatmentTypes: treatmentTypes,
            primaryTreatmentType: treatmentTypes[0] || 'Unknown',
            status: SecurityUtils.sanitizeHTML(facility.status || 'Contact for Availability'),
            address: SecurityUtils.sanitizeHTML(facility.address || ''),
            genderServed: SecurityUtils.sanitizeHTML(facility.genderServed || 'Co-ed'),
            ageGroup: SecurityUtils.sanitizeHTML(facility.ageGroup || 'Adult'),
            phone: SecurityUtils.sanitizePhone(facility.phone || ''),
            website: sanitizedWebsite,
            lastUpdated: facility.lastUpdated || null,
            dataAttributes: {
                address: SecurityUtils.sanitizeAttribute(facility.address || ''),
                phone: SecurityUtils.sanitizeAttribute(facility.phone || ''),
                website: sanitizedWebsite ? SecurityUtils.sanitizeAttribute(sanitizedWebsite) : ''
            }
        };
    }

    global.FacilityUtils = {
        normalizeFacilityDataset,
        filterFacilities,
        calculateDistance,
        sanitizeFacilityForRender,
        validateFacilityRecord
    };
})(window);
