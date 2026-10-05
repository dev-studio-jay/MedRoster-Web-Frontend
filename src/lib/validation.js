import {
    isStaffOnLeave,
    classifyStaffType,
    staffDisplayName,
    getStaffById,
} from './staff-utils';

// All validation functions in this module take plain JS objects (POJOs), not
// Mongoose documents. API routes should call .lean() or .toObject() before
// passing data in. This keeps the module usable from both server and client.

// Resolve staffType: prefer the persisted field, fall back to deriving from rank.
function resolveStaffType(staff) {
    return staff?.staffType || classifyStaffType(staff?.rank);
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dateKey(date) {
    return new Date(date).toISOString().split('T')[0];
}

function shiftName(shiftType) {
    return shiftType?.name || '';
}

function isNightShift(shiftType) {
    return shiftName(shiftType) === 'Night';
}

function isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
}

function holidayKeys(schedule) {
    return new Set((schedule?.holidays || []).map((h) => dateKey(h.date || h)));
}

function isHoliday(date, schedule) {
    return holidayKeys(schedule).has(dateKey(date));
}

// --- Single-assignment checks ------------------------------------------------

export function validateLeaveConflict(staff, date) {
    if (!staff) return { valid: false, error: 'Staff member not found' };

    if (isStaffOnLeave(staff, date)) {
        const dateStr = new Date(date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
        return { valid: false, error: `${staffDisplayName(staff)} is on leave on ${dateStr}` };
    }
    return { valid: true };
}

export function validateRoleShiftCompatibility(staff, shiftType) {
    if (!staff || !shiftType) return { valid: true };
    if (
        isNightShift(shiftType) &&
        (staff.noNightShift || staff.maternityNoNight || staff.wardRole === 'incharge' || staff.wardRole === 'assistant')
    ) {
        return {
            valid: false,
            error: `${staffDisplayName(staff)} cannot be assigned to night shifts`,
        };
    }
    return { valid: true };
}

export function validateWorkRestriction(staff, date, shiftType, schedule) {
    if (!staff || !shiftType) return { valid: true };
    const name = shiftName(shiftType);
    const restriction = staff.workRestriction || 'none';

    if ((staff.wardRole === 'incharge' || staff.wardRole === 'assistant') && name !== 'Morning') {
        return { valid: false, error: `${staffDisplayName(staff)} is ${staff.wardRole} and should work morning shifts only` };
    }

    if ((staff.wardRole === 'incharge' || staff.wardRole === 'assistant') && isWeekend(date)) {
        return { valid: false, error: `${staffDisplayName(staff)} is ${staff.wardRole} and should not work weekends` };
    }

    if ((staff.wardRole === 'incharge' || staff.wardRole === 'assistant') && isHoliday(date, schedule)) {
        return { valid: false, error: `${staffDisplayName(staff)} is ${staff.wardRole} and should be off on marked holidays` };
    }

    if (restriction === 'onlyMorning' && name !== 'Morning') {
        return { valid: false, error: `${staffDisplayName(staff)} is restricted to morning shifts` };
    }

    if (restriction === 'onlyAfternoon' && name !== 'Afternoon') {
        return { valid: false, error: `${staffDisplayName(staff)} is restricted to afternoon shifts` };
    }

    if ((restriction === 'weekdayOnly' || restriction === 'studyLeave') && isWeekend(date)) {
        return { valid: false, error: `${staffDisplayName(staff)} should not work weekend shifts` };
    }

    return { valid: true };
}

// --- Aggregate checks (across a schedule) ------------------------------------

// Coverage: at least N senior or in-charge staff on Morning that day.
export function validateSupervisoryCoverage({ date, assignments, staffById, settings }) {
    const minSeniorStaff = Math.max(1, settings?.minSeniorStaffPerDay ?? 1);

    const dateStr = dateKey(date);
    const morningAssignments = assignments.filter((a) => {
        if (dateKey(a.date) !== dateStr) return false;
        return shiftName(a.shiftType) === 'Morning';
    });

    const seniorCount = morningAssignments.filter((a) => {
        const staff = staffById.get(String(a.staffId));
        if (!staff) return false;
        const type = resolveStaffType(staff);
        return type === 'senior' || type === 'pno' || staff.wardRole === 'incharge';
    }).length;

    if (seniorCount < minSeniorStaff) {
        const dateFormatted = new Date(date).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
        return {
            valid: false,
            error: `${dateFormatted} morning has no senior / in-charge`,
            missingCount: minSeniorStaff - seniorCount,
        };
    }
    return { valid: true };
}

// Hours-per-week soft check.
export function validateMaxHoursPerWeek({ staffId, assignments, settings }) {
    const maxHours = settings?.maxHoursPerWeek ?? 48;
    const target = String(staffId);
    const own = assignments.filter((a) => String(a.staffId) === target);

    let total = 0;
    own.forEach((a) => {
        const st = a.shiftType;
        if (!st?.startTime || !st?.endTime) return;
        const [sh] = st.startTime.split(':').map(Number);
        const [eh] = st.endTime.split(':').map(Number);
        let hours = eh - sh;
        if (hours < 0) hours += 24;
        total += hours;
    });

    if (total > maxHours) {
        return { valid: true, warning: `Total ${total}h this week (limit: ${maxHours}h)` };
    }
    return { valid: true };
}

// Consecutive-days soft check (single staff, single new date).
export function validateConsecutiveShifts({ staffId, date, assignments, settings }) {
    const maxDays = settings?.maxConsecutiveDays ?? 6;
    const maxNights = settings?.maxConsecutiveNights ?? 3;

    const target = String(staffId);
    const own = assignments
        .filter((a) => String(a.staffId) === target)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Walk backwards to count consecutive days
    let consecutive = 1;
    let cur = new Date(checkDate);
    cur.setDate(cur.getDate() - 1);
    while (consecutive < maxDays + 2) {
        const ds = dateKey(cur);
        const has = own.some((a) => dateKey(a.date) === ds);
        if (!has) break;
        consecutive++;
        cur.setDate(cur.getDate() - 1);
    }
    if (consecutive > maxDays) {
        return { valid: true, warning: `${consecutive} consecutive days of work` };
    }

    // Consecutive night check
    const today = own.find(
        (a) => dateKey(a.date) === dateKey(checkDate)
    );
    if (today?.shiftType?.name === 'Night') {
        let nights = 1;
        let nd = new Date(checkDate);
        nd.setDate(nd.getDate() - 1);
        while (nights < maxNights + 2) {
            const ds = dateKey(nd);
            const found = own.find(
                (a) =>
                    dateKey(a.date) === ds &&
                    a.shiftType?.name === 'Night'
            );
            if (!found) break;
            nights++;
            nd.setDate(nd.getDate() - 1);
        }
        if (nights > maxNights) {
            return { valid: true, warning: `${nights} consecutive night shifts; fourth nights should only be used with caution` };
        }
    }
    return { valid: true };
}

// --- Top-level entry points --------------------------------------------------

// Validate a single new/updated assignment.
// Args:
//   staff: the staff doc receiving the assignment
//   date: ISO string or Date
//   shiftType: { name, color, startTime, endTime }
//   context: { assignments, settings } — full schedule's assignments + hospital settings
export function validateAssignment({ staff, date, shiftType, context }) {
    const errors = [];
    const warnings = [];

    if (!staff) return { valid: false, errors: ['Staff member not found'], warnings: [] };
    if (!shiftType) return { valid: false, errors: ['Shift type not found'], warnings: [] };

    const settings = context?.settings || {};
    const rules = settings.validationRules || {};
    const assignments = context?.assignments || [];
    const schedule = context?.schedule;

    const leave = validateLeaveConflict(staff, date);
    if (!leave.valid) errors.push(leave.error);

    const role = validateRoleShiftCompatibility(staff, shiftType);
    if (!role.valid) errors.push(role.error);

    const restriction = validateWorkRestriction(staff, date, shiftType, schedule);
    if (!restriction.valid) errors.push(restriction.error);

    if (rules.warnConsecutiveShifts !== false) {
        const r = validateConsecutiveShifts({
            staffId: staff._id || staff.id,
            date,
            assignments,
            settings,
        });
        if (r.warning) warnings.push(r.warning);
    }

    const hoursCheck = validateMaxHoursPerWeek({
        staffId: staff._id || staff.id,
        assignments,
        settings,
    });
    if (hoursCheck.warning) warnings.push(hoursCheck.warning);

    return { valid: errors.length === 0, errors, warnings };
}

// Validate the full schedule. Returns errors[], warnings[], summary stats, and
// dateViolations (used by the calendar to mark days with issues).
export function validateFullSchedule({ staff, assignments, settings, schedule }) {
    const errors = [];
    const warnings = [];
    const dateViolations = {};

    const staffById = new Map((staff || []).map((s) => [String(s._id || s.id), s]));

    const dates = [
        ...new Set((assignments || []).map((a) => dateKey(a.date))),
    ];

    dates.forEach((dateStr) => {
        const date = new Date(dateStr);

        const r = validateSupervisoryCoverage({ date, assignments, staffById, settings });
        if (!r.valid) {
            errors.push({
                type: 'supervisory_coverage',
                date: dateStr,
                message: r.error,
                severity: 'error',
            });
            if (!dateViolations[dateStr]) dateViolations[dateStr] = [];
            dateViolations[dateStr].push('missing_supervisor');
        }

        const dayAssignments = assignments.filter(
            (a) => dateKey(a.date) === dateStr
        );

        dayAssignments.forEach((a) => {
            const staffMember = staffById.get(String(a.staffId));
            if (!staffMember) return;

            if (isStaffOnLeave(staffMember, date)) {
                errors.push({
                    type: 'leave_conflict',
                    date: dateStr,
                    staffId: String(staffMember._id || staffMember.id),
                    staffName: staffDisplayName(staffMember),
                    message: `${staffDisplayName(staffMember)} is on leave`,
                    severity: 'error',
                });
            }

            if (a.shiftType) {
                const roleCheck = validateRoleShiftCompatibility(staffMember, a.shiftType);
                if (!roleCheck.valid) {
                    errors.push({
                        type: 'role_shift_incompatible',
                        date: dateStr,
                        staffId: String(staffMember._id || staffMember.id),
                        staffName: staffDisplayName(staffMember),
                        message: roleCheck.error,
                        severity: 'error',
                    });
                }

                const restriction = validateWorkRestriction(staffMember, date, a.shiftType, schedule);
                if (!restriction.valid) {
                    errors.push({
                        type: 'work_restriction',
                        date: dateStr,
                        staffId: String(staffMember._id || staffMember.id),
                        staffName: staffDisplayName(staffMember),
                        message: restriction.error,
                        severity: 'error',
                    });
                }
            }
        });
    });

    (staff || []).forEach((sm) => {
        const id = String(sm._id || sm.id);
        const own = assignments.filter((a) => String(a.staffId) === id);
        if (own.length === 0) return;

        const r = validateMaxHoursPerWeek({ staffId: id, assignments, settings });
        if (r.warning) {
            warnings.push({
                type: 'max_hours',
                staffId: id,
                staffName: staffDisplayName(sm),
                message: r.warning,
                severity: 'warning',
            });
        }

        if (schedule?.startDate && schedule?.endDate && sm.wardRole === 'regular') {
            const start = new Date(schedule.startDate);
            const end = new Date(schedule.endDate);
            const totalDays = Math.floor((end - start) / (24 * 3600 * 1000)) + 1;
            const targetOffDays = Math.min(totalDays, 12 + holidayKeys(schedule).size);
            const workedDays = new Set(own.map((a) => dateKey(a.date))).size;
            const offDays = totalDays - workedDays;
            if (offDays < targetOffDays) {
                warnings.push({
                    type: 'off_day_target',
                    staffId: id,
                    staffName: staffDisplayName(sm),
                    message: `${offDays} off days in this cycle (target: ${targetOffDays})`,
                    severity: 'warning',
                });
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        dateViolations,
        summary: {
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            leaveConflicts: errors.filter((e) => e.type === 'leave_conflict').length,
            roleViolations: errors.filter((e) => e.type === 'role_shift_incompatible').length,
            coverageIssues: errors.filter((e) => e.type === 'supervisory_coverage').length,
            restrictionViolations: errors.filter((e) => e.type === 'work_restriction').length,
        },
    };
}

// Re-export getStaffById for any UI code that wants it from this module.
export { getStaffById };
