/**
 * Normalizes arbitrary phone input into a stable display string (Taiwan-oriented).
 * Strips spaces/dashes; handles +886 → 0 local prefix when applicable.
 */
export function formatDisplayPhone(raw: string | undefined | null): string {
    let digits = String(raw ?? "").replace(/\D/g, "");
    if (!digits) return "-";

    if (digits.startsWith("886") && digits.length >= 11) {
        digits = `0${digits.slice(3)}`;
    }

    if (digits.length === 10 && digits.startsWith("09")) {
        return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10 && digits.startsWith("0") && digits[1] !== "9") {
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    if (digits.length === 9 && digits.startsWith("0") && digits[1] !== "9") {
        return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }

    const parts: string[] = [];
    let remaining = digits;
    while (remaining.length > 4) {
        parts.unshift(remaining.slice(-3));
        remaining = remaining.slice(0, -3);
    }
    if (remaining) parts.unshift(remaining);
    return parts.join("-");
}
