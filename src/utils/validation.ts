/**
 * Validates that a string is in PascalCase format.
 * PascalCase: starts with uppercase letter, contains only alphanumeric characters.
 *
 * @param name - The string to validate
 * @returns true if the string is valid PascalCase, false otherwise
 */
export function validatePascalCase(name: string): boolean {
  if (name.length === 0) {
    return false;
  }

  // Must start with uppercase letter
  if (!/^[A-Z]/.test(name)) {
    return false;
  }

  // Must contain only alphanumeric characters
  if (!/^[A-Za-z0-9]+$/.test(name)) {
    return false;
  }

  return true;
}
