/** Matches AWS Cognito password policy in terraform/cognito.tf */
export function validateCognitoPassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Include at least one number";
  return null;
}