// Transforme une erreur technique en message clair, dans la langue du visiteur.
// t = fonction de traduction (useT). Les erreurs de l'API qui sont déjà des
// phrases pour l'utilisateur (ex. "Numéro de téléphone trop court.") sont
// gardées ; tout le reste devient un message générique.

const AUTH_CODES = {
  email_address_invalid: "autherr.email_invalid",
  validation_failed: "autherr.email_invalid",
  user_already_exists: "autherr.exists",
  email_exists: "autherr.exists",
  weak_password: "autherr.weak_password",
  invalid_credentials: "autherr.bad_credentials",
  email_not_confirmed: "autherr.not_confirmed",
  over_request_rate_limit: "autherr.rate_limit",
  over_email_send_rate_limit: "autherr.rate_limit",
  signup_disabled: "autherr.signup_disabled",
  provider_disabled: "auth.google_off",
  session_expired: "autherr.unauthorized",
  session_not_found: "autherr.unauthorized",
};

export function friendlyError(err, t) {
  if (!err) return t("autherr.generic");

  const message = String(err.message || "");
  const code = err.code || err.error_code;

  if (code && AUTH_CODES[code]) return t(AUTH_CODES[code]);

  if (
    code === "network" ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(message)
  ) {
    return t("autherr.network");
  }

  // Anciens messages Supabase sans code
  if (/invalid login credentials/i.test(message)) return t("autherr.bad_credentials");
  if (/already registered|already been registered/i.test(message)) return t("autherr.exists");
  if (/email.*invalid|invalid.*email/i.test(message)) return t("autherr.email_invalid");
  if (/provider is not enabled/i.test(message)) return t("auth.google_off");

  if (err.status === 429) return t("autherr.rate_limit");

  if (err.status === 401 || err.status === 403) return t("autherr.unauthorized");

  // Message écrit par notre API (erreur 4xx) : lisible tel quel
  const isAuthLib = /^Auth/.test(err.name || "");

  if (!isAuthLib && err.status >= 400 && err.status < 500 && message) {
    return message;
  }

  return t("autherr.generic");
}
