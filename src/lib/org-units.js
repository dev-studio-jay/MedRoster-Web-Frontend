export function normalizeOrgName(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function collapseOrgUnits(departments = [], wards = []) {
    const byName = new Map();
    for (const department of departments) {
        const key = normalizeOrgName(department.name);
        if (!key) continue;
        const existing = byName.get(key);
        if (!existing) {
            byName.set(key, { ...department, _aliasIds: [String(department._id)] });
            continue;
        }
        existing._aliasIds.push(String(department._id));
    }

    const collapsedDepartments = [...byName.values()];
    const departmentIdMap = new Map();
    for (const department of collapsedDepartments) {
        for (const id of department._aliasIds) {
            departmentIdMap.set(String(id), String(department._id));
        }
    }

    const remappedWards = wards.map((ward) => ({
        ...ward,
        departmentId: departmentIdMap.get(String(ward.departmentId)) || ward.departmentId,
    }));

    const seenWards = new Set();
    const collapsedWards = [];
    for (const ward of remappedWards) {
        const key = `${ward.departmentId}::${normalizeOrgName(ward.name)}`;
        if (seenWards.has(key)) continue;
        seenWards.add(key);
        collapsedWards.push(ward);
    }

    return { departments: collapsedDepartments, wards: collapsedWards };
}

export function getDisplayWardsForDepartment(department, wards = []) {
    const departmentWards = wards.filter((ward) => String(ward.departmentId) === String(department._id));
    const realWards = departmentWards.filter(
        (ward) => normalizeOrgName(ward.name) !== normalizeOrgName(department.name)
    );
    return realWards.length > 0 ? realWards : departmentWards;
}

export function getDisplayWards(departments = [], wards = []) {
    return wards.filter((ward) => {
        const department = departments.find((d) => String(d._id) === String(ward.departmentId));
        if (!department) return true;
        const departmentWards = wards.filter((w) => String(w.departmentId) === String(department._id));
        const hasRealWards = departmentWards.some(
            (w) => normalizeOrgName(w.name) !== normalizeOrgName(department.name)
        );
        return !hasRealWards || normalizeOrgName(ward.name) !== normalizeOrgName(department.name);
    });
}
