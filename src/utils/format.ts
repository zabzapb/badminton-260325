/**
 * Phone Number Formatting Utilities
 */

/**
 * Removes all non-numeric characters from a string.
 * Use this when saving to DB.
 */
export const cleanPhone = (phone: string): string => {
    if (!phone) return "";
    return phone.replace(/[^0-9]/g, "");
};

/**
 * Formats a numeric string into 010-XXXX-XXXX format.
 * Use this when displaying on UI.
 */
export const formatPhone = (phone: string): string => {
    const num = cleanPhone(phone).slice(0, 11);
    if (num.length <= 3) return num;
    if (num.length <= 7) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7)}`;
};
