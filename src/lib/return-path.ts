export function safeReturnPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return "/dashboard";
  try {
    const u = new URL(value, "https://buildo.invalid");
    if (u.origin !== "https://buildo.invalid") return "/dashboard";
    if (
      !/^\/(?:dashboard|assets|settings|projects\/new|studio\/[a-f\d]{24}|admin\/challenges|explore|challenges(?:\/[a-f\d]{24})?|designs\/[a-f\d]{24}|creators\/[a-f\d]{24})\/?$/i.test(
        u.pathname,
      )
    )
      return "/dashboard";
    return u.pathname + u.search + u.hash;
  } catch {
    return "/dashboard";
  }
}
export function signInPath(next: string, register = false) {
  return `/${register ? "register" : "login"}?next=${encodeURIComponent(safeReturnPath(next))}`;
}
