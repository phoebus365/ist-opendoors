/* Validated selection for invitations to a class that is already open.
   API also enforces 12 recipients, IST email domain, and host authentication. */
export const MAX_CLASS_INVITEES = 12;
const IST_EMAIL = /^[a-z0-9._%+-]+@istianjin\.org\.cn$/;

export function addClassInvitee(existing = [], candidate = "", ownEmail = "") {
  const email = String(candidate).trim().toLowerCase();
  const self = String(ownEmail).trim().toLowerCase();
  if (!IST_EMAIL.test(email)) {
    return { recipients: existing, error: "Enter a valid colleague's IST email address." };
  }
  if (email === self) {
    return { recipients: existing, error: "You cannot invite yourself to your own classroom." };
  }
  if (existing.includes(email)) {
    return { recipients: existing, error: null };
  }
  if (existing.length >= MAX_CLASS_INVITEES) {
    return { recipients: existing, error: "You can invite up to 12 colleagues at once." };
  }
  return { recipients: [...existing, email], error: null };
}
