const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// --- Clients ---
export const getClients = () => request<any[]>("/clients");
export const createClient = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  dateNaissance: string;
}) => request<{ success: boolean; id: string }>("/clients", { method: "POST", body: JSON.stringify(data) });
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

// --- Account detail ---
export const getAccount = (id: string) => request<any>(`/accounts/${id}`);
