export interface PasswordValidation {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
  isValid: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  const length = password.length >= 8;
  const upper = /[A-Z]/.test(password);
  const lower = /[a-z]/.test(password);
  const number = /[0-9]/.test(password);
  const special = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    length,
    upper,
    lower,
    number,
    special,
    isValid: length && upper && lower && number && special,
  };
}
