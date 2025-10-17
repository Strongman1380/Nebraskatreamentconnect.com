// Shared facility helpers for filtering, sanitization, and normalization
(function(global) {
    const SecurityUtils = global.SecurityUtils || {
        sanitizeHTML: (value) => value ?? '',
        sanitizeAttribute: (value) => value ?? '',
        sanitizePhone: (value) => value ?? '',
        sanitizeURL: (value) => value ?? ''
    };

    function toKey(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function normalizeFacilityRecord(record) {
        if (!record || typeof record !== 'object') return null;

        return {
            id: record.id ?? null,
            name: (record.name || '').trim(),
            type: (record.type || '').trim(),
            treatmentType: (record.treatmentType || '').trim(),
            genderServed: (record.genderServed || '').trim(),
            ageGroup: (record.ageGroup || '').trim(),
            status: (record.status || '').trim() || 'Contact for Availability',
            lastUpdated: record.lastUpdated || null,
            address: (record.address || '').trim(),
            phone: (record.phone || '').trim(),
            website: (record.website || '').trim(),
            coordinates: record.coordinates && typeof record.coordinates.lat === 'number' && typeof record.coordinates.lng === 'number'
                ? { lat: record.coordinates.lat, lng: record.coordinates.lng }
                : null
        };
    }

    function normalizeFacilityDataset(facilities) {
        if (!Array.isArray(facilities)) return [];

        const map = new Map();

        facilities.forEach((facility) => {
            const normalized = normalizeFacilityRecord(facility);
            if (!normalized) return;

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
        const R = 3959;
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

        const searchTerm = (criteria.searchTerm || '').trim().toLowerCase();
        const searchDigits = sanitizedDigits(searchTerm);
        const radius = Number.parseInt(criteria.radius, 10) || 999;
        const ageGroup = criteria.ageGroup || '';
        const genderServed = criteria.genderServed || '';
        const treatmentType = criteria.treatmentType || '';
        const facilityType = criteria.facilityType || '';

        return facilities.filter((facility) => {
            let matchesSearch = true;
            if (searchTerm) {
                matchesSearch = facility.searchIndex.includes(searchTerm) ||
                    (searchDigits && facility.phoneDigits.includes(searchDigits));
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
            if (userLocation && radius < 999 && facility.coordinates) {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    facility.coordinates.lat,
                    facility.coordinates.lng
                );
                matchesDistance = distance <= radius;
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

        const treatmentTypes = Array.isArray(facility.treatmentTypes) && facility.treatmentTypes.length
            ? facility.treatmentTypes
            : [facility.treatmentType].filter(Boolean);

        const sanitizedTreatmentTypes = treatmentTypes.map((type) =>
            SecurityUtils.sanitizeHTML(type)
        );

        const sanitizedWebsite = SecurityUtils.sanitizeURL(facility.website || '');

        return {
            id: facility.id,
            name: SecurityUtils.sanitizeHTML(facility.name || ''),
            type: SecurityUtils.sanitizeHTML(facility.type || ''),
            facilityTypes: facility.facilityTypes ? facility.facilityTypes.map((type) => SecurityUtils.sanitizeHTML(type)) : [],
            treatmentTypes: sanitizedTreatmentTypes,
            primaryTreatmentType: sanitizedTreatmentTypes[0] || 'Unknown',
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
        sanitizeFacilityForRender
    };
})(window);
