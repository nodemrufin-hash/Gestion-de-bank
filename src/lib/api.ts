/**
 * Client HTTP de l'application (frontend → API Express).
 *
 * Centralise l'URL de base de l'API et expose une fonction typée par domaine
 * (clients, transactions, opérations, bénéficiaires, objectifs, alertes, admin)
 * au-dessus du helper `request`. L'URL est configurable via
 * `NEXT_PUBLIC_API_URL`, avec repli sur `http://localhost:3001/api`.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Helper générique d'appel à l'API : sérialise/parse le JSON et gère les erreurs.
 * @param path Chemin relatif à `BASE_URL` (ex: `/clients`).
 * @param options Options `fetch` (méthode, corps, en-têtes…).
 * @returns La réponse JSON typée `T`.
 * @throws Error avec le message d'erreur du serveur si la réponse n'est pas 2xx.
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
    const error = new Error(err.error || `HTTP ${res.status}`);
    // On attache le corps d'erreur pour permettre au client d'inspecter des
    // indicateurs (ex: `needsVerification` lors d'une connexion non vérifiée).
    (error as any).info = err;
    throw error;
  }
  return res.json();
}

// --- Authentification ---
export const loginClient = (email: string, password: string) =>
  request<{ success: boolean; role: "client"; client: { id: string; firstName: string; lastName: string; email: string } }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
export const loginAdmin = (email: string, password: string) =>
  request<{ success: boolean; role: "admin"; email: string }>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// --- Vérification du courriel ---
export const verifyEmail = (email: string, code: string) =>
  request<{ success: boolean; alreadyVerified?: boolean }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
export const resendVerification = (email: string) =>
  request<{ success: boolean; sent?: boolean; alreadyVerified?: boolean }>(
    "/auth/resend-verification",
    { method: "POST", body: JSON.stringify({ email }) }
  );

// --- Clients ---
export const getClients = () => request<any[]>("/clients");
export const createClient = (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  dateNaissance: string;
}) =>
  request<{ success: boolean; id: string; emailVerificationRequired?: boolean; emailSent?: boolean }>(
    "/clients",
    { method: "POST", body: JSON.stringify(data) }
  );
export const getClient = (id: string) => request<any>(`/clients/${id}`);
export const getClientAccounts = (clientId: string) => request<any[]>(`/clients/${clientId}/accounts`);
export const getClientBalances = (clientId: string) => request<any[]>(`/clients/${clientId}/balances`);
export const resetClient = (clientId: string) => request<any>(`/clients/${clientId}/reset`, { method: "POST" });

// --- Transactions ---
export const getTransactions = (accountId: string) => request<any[]>(`/accounts/${accountId}/transactions`);
export const getFutureTransactions = (accountId: string) => request<any[]>(`/accounts/${accountId}/transactions/future`);
export const getRecurringTransactions = (accountId: string) => request<any[]>(`/accounts/${accountId}/transactions/recurring`);

// --- Operations ---
export const internalTransfer = (data: { fromAccountId: string; toAccountId: string; amount: number; description?: string }) =>
  request<any>("/transactions/transfer", { method: "POST", body: JSON.stringify(data) });

export const interacTransfer = (data: { fromAccountId: string; beneficiaryId: string; amount: number; description?: string }) =>
  request<any>("/transactions/interac", { method: "POST", body: JSON.stringify(data) });

export const payBill = (data: { fromAccountId: string; fournisseurId: string; amount: number }) =>
  request<any>("/transactions/paybill", { method: "POST", body: JSON.stringify(data) });

export const deposit = (data: { accountId: string; amount: number; description?: string }) =>
  request<any>("/transactions/deposit", { method: "POST", body: JSON.stringify(data) });

export const withdraw = (data: { accountId: string; amount: number; description?: string }) =>
  request<any>("/transactions/withdraw", { method: "POST", body: JSON.stringify(data) });

export const depositCheque = (data: FormData) =>
  fetch(`${BASE_URL}/transactions/deposit-cheque`, { method: "POST", body: data }).then((r) => r.json());

export const payCreditCard = (accountId: string, data: { fromAccountId: string; amount: number }) =>
  request<any>(`/accounts/${accountId}/pay-credit`, { method: "POST", body: JSON.stringify(data) });

// --- Beneficiaries ---
export const getBeneficiaries = (clientId: string) => request<any[]>(`/clients/${clientId}/beneficiaries`);
export const createBeneficiary = (data: { clientId: string; name: string; email?: string; phone?: string; isFournisseur?: boolean }) =>
  request<any>("/beneficiaries", { method: "POST", body: JSON.stringify(data) });

// --- Goals ---
export const getGoals = (clientId: string) => request<any[]>(`/clients/${clientId}/goals`);
export const createGoal = (data: { clientId: string; accountId: string; name: string; targetAmount: number }) =>
  request<any>("/goals", { method: "POST", body: JSON.stringify(data) });
export const updateGoalProgress = (data: { id: string; amount: number }) =>
  request<any>("/goals/progress", { method: "PUT", body: JSON.stringify(data) });

// --- Alerts ---
export const getAlerts = (clientId: string) => request<any[]>(`/clients/${clientId}/alerts`);
export const updateAlert = (id: string, data: { threshold: number; enabled: boolean }) =>
  request<any>(`/alerts/${id}`, { method: "PUT", body: JSON.stringify(data) });

// --- Admin ---
export const getParameters = () => request<any[]>("/admin/parameters");
export const updateParameter = (key: string, value: string) =>
  request<any>("/admin/parameters", { method: "PUT", body: JSON.stringify({ key, value }) });
export const resetAllData = () => request<any>("/admin/reset", { method: "POST" });

// --- Gestion des administrateurs ---
export const getAdmins = () => request<any[]>("/admin/admins");
export const createAdmin = (data: { email: string; password: string; currentEmail: string; currentPassword: string }) =>
  request<{ success: boolean; id: string }>("/admin/admins", { method: "POST", body: JSON.stringify(data) });
export const deleteAdmin = (id: string, data: { currentEmail: string; currentPassword: string }) =>
  request<any>(`/admin/admins/${id}`, { method: "DELETE", body: JSON.stringify(data) });

// --- Account detail ---
export const getAccount = (id: string) => request<any>(`/accounts/${id}`);

// --- Assistant IA ---
export const askAssistant = (
  clientId: string,
  messages: { role: "user" | "assistant"; content: string }[]
) =>
  request<{ reply: string }>("/assistant", {
    method: "POST",
    body: JSON.stringify({ clientId, messages }),
  });
