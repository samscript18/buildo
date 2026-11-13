export function passwordRequirements(password: string) {
  return [
    {
      id: "length",
      label: "10–128 characters",
      met: password.length >= 10 && password.length <= 128,
    },
    { id: "lowercase", label: "Lowercase letter", met: /[a-z]/.test(password) },
    { id: "uppercase", label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { id: "number", label: "One number", met: /[0-9]/.test(password) },
    {
      id: "symbol",
      label: "Symbol (!, @, -)",
      met: /[^\p{L}\p{N}\s]/u.test(password),
    },
  ];
}
export function validNewPassword(password: string) {
  return passwordRequirements(password).every((check) => check.met);
}
export function passwordChecklist(password: string, confirmation: string) {
  return [
    ...passwordRequirements(password),
    {
      id: "match",
      label: "Passwords match",
      met: password.length > 0 && password === confirmation,
    },
  ];
}
