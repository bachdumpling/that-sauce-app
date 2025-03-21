/**
 * Validation utility functions
 */

/**
 * Validates if a string is a valid UUID
 */
export const isUUID = (str: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Validates if a string is a valid email address
 */
export const isEmail = (str: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(str);
};

/**
 * Validates if a string is a valid URL
 */
export const isURL = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validates if a string has at least a minimum length
 */
export const hasMinLength = (str: string, minLength: number): boolean => {
  return str.length >= minLength;
};

/**
 * Validates if a string does not exceed a maximum length
 */
export const hasMaxLength = (str: string, maxLength: number): boolean => {
  return str.length <= maxLength;
};

/**
 * Validates if a value is a number (can be string representation)
 */
export const isNumeric = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validates if a value is a positive number
 */
export const isPositiveNumber = (value: any): boolean => {
  return isNumeric(value) && parseFloat(value) > 0;
};

/**
 * Validates if a value is a non-negative number (zero or positive)
 */
export const isNonNegativeNumber = (value: any): boolean => {
  return isNumeric(value) && parseFloat(value) >= 0;
};

/**
 * Validates if a string contains only alphanumeric characters
 */
export const isAlphanumeric = (str: string): boolean => {
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(str);
};

/**
 * Validates if a string is a valid date in ISO format
 */
export const isISODate = (str: string): boolean => {
  try {
    const date = new Date(str);
    return !isNaN(date.getTime()) && date.toISOString().includes(str);
  } catch (e) {
    return false;
  }
};
