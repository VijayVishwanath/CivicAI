// Mock API client - Toggle USE_MOCK for real backend
const USE_MOCK = true;

export interface DashboardMetrics {
  predictedEscalations: number;
  avgTriageTime: number;
  autoTriagedPct: number;
  totalCases: number;
  pendingCases: number;
  resolvedToday: number;
}

export interface Case {
  id: string;
  location: string;
  category: string;
  score: number;
  priority: "high" | "medium" | "low";
  features: string[];
  recommendedAction: string;
  description: string;
  submittedAt: string;
  status: "pending" | "assigned" | "resolved";
  affectedCitizens?: number;
  duplicateReports?: number;
}

export interface ChatResponse {
  message: string;
  sources: string[];
}

export interface AuditLog {
  id: string;
  caseId: string;
  action: string;
  user: string;
  timestamp: string;
  inputHash: string;
  modelScore: number;
  explanation: string;
}

// Mock data
const mockMetrics: DashboardMetrics = {
  predictedEscalations: 23,
  avgTriageTime: 4.2,
  autoTriagedPct: 78,
  totalCases: 1247,
  pendingCases: 89,
  resolvedToday: 34,
};

// Load mock cases from JSON file for easier syncing with CSV-derived data
let mockCases: Case[] = [];

// Use dynamic import with top-level await so bundlers include the JSON and we avoid runtime 'require' errors.
// Vite supports top-level await and will bundle the JSON file.
(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const casesModule = await import('../mocks/cases.json');
    const casesJson = (casesModule as any).default ?? casesModule;
    mockCases = (casesJson as any).map((c: any) => ({
      id: c.id,
      location: c.location || `${c.city || ''}${c.city && c.district ? ', ' : ''}${c.district || ''}`,
      category: c.category || c.sub_category || 'general',
      score: c.score ?? 0.5,
      priority: (c.priority as any) ?? 'medium',
      features: c.features ?? [],
      recommendedAction: c.recommendedAction ?? 'Investigate',
      description: c.description ?? '',
      submittedAt: c.submittedAt ?? c.created_at ?? new Date().toISOString(),
      status: (c.status as any) ?? 'pending',
      affectedCitizens: c.affectedCitizens ?? c.affected ?? undefined,
      duplicateReports: c.duplicateReports ?? undefined,
    }));
  } catch (err) {
    // Fall back to built-in array if file not present or import fails
    mockCases = [
      {
        id: 'CASE-2024-0847',
        location: 'Dharavi, Mumbai',
        category: 'Sanitation',
        score: 0.92,
        priority: 'high',
        features: ['High population density', 'Previous escalations', 'Media attention'],
        recommendedAction: 'Immediate field inspection',
        description: 'Severe drainage blockage affecting 200+ households. Third complaint in 2 weeks.',
        submittedAt: '2024-01-15T09:23:00Z',
        status: 'pending',
      },
    ];
    console.warn('Failed to load src/mocks/cases.json; falling back to single-sample mock', err);
  }
})();

const mockAuditLogs: AuditLog[] = [
  {
    id: "AUDIT-001",
    caseId: "CASE-2024-0847",
    action: "AI_PRIORITIZATION",
    user: "system",
    timestamp: "2024-01-15T09:23:15Z",
    inputHash: "a3f8d9e2...",
    modelScore: 0.92,
    explanation: "High priority due to population impact (0.45), escalation history (0.28), media risk (0.19)",
  },
  {
    id: "AUDIT-002",
    caseId: "CASE-2024-0848",
    action: "AI_PRIORITIZATION",
    user: "system",
    timestamp: "2024-01-15T10:15:08Z",
    inputHash: "b7e4c1a9...",
    modelScore: 0.85,
    explanation: "High priority due to safety risk (0.52), traffic impact (0.23), main road location (0.10)",
  },
];

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(mockMetrics), 300));
  }
  const response = await fetch("/api/metrics");
  return response.json();
}

export interface PagedCases {
  cases: Case[];
  total: number;
}

/**
 * Get prioritized cases with pagination and optional priority filter.
 * - Limits the returned universe to the top 100 most recent cases before paging.
 */
export async function getPrioritizedCases(
  page = 1,
  pageSize = 10,
  priority?: "high" | "medium" | "low"
): Promise<PagedCases> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = mockCases.slice();
        if (priority) filtered = filtered.filter((c) => c.priority === priority);
        // sort by submittedAt desc (most recent first)
        filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        const total = filtered.length;
        // limit universe to top 100
        const limited = filtered.slice(0, 100);
        const start = (page - 1) * pageSize;
        const paged = limited.slice(start, start + pageSize);
        resolve({ cases: paged, total: Math.min(total, 100) });
      }, 300);
    });
  }

  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (priority) qs.set('priority', priority);
  const response = await fetch(`/api/cases?${qs.toString()}`);
  return response.json();
}

export async function postScoreCase(caseId: string): Promise<Case> {
  if (USE_MOCK) {
    const caseItem = mockCases.find((c) => c.id === caseId);
    if (!caseItem) throw new Error("Case not found");
    return new Promise((resolve) => setTimeout(() => resolve(caseItem), 200));
  }
  const response = await fetch(`/api/case/${caseId}/score`, {
    method: "POST",
  });
  return response.json();
}

export async function assignCase(caseId: string, assignee: string): Promise<Case> {
  if (USE_MOCK) {
    const caseItem = mockCases.find((c) => c.id === caseId);
    if (!caseItem) throw new Error("Case not found");
    return new Promise((resolve) =>
      setTimeout(() => resolve({ ...caseItem, status: "assigned" as const }), 300)
    );
  }
  const response = await fetch(`/api/case/${caseId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignee }),
  });
  return response.json();
}

export async function queryCitizenChat(
  prompt: string,
  language: string = "en"
): Promise<ChatResponse> {
  if (USE_MOCK) {
    const responses: Record<string, ChatResponse> = {
      default: {
        message: "I found information about your query. The average response time for sanitation complaints is 48 hours. You can track your complaint status using your case ID.",
        sources: ["Municipal Guidelines 2024", "Case Database Record #847"],
      },
      marathi: {
        message: "मला तुमच्या प्रश्नाबद्दल माहिती सापडली. स्वच्छता तक्रारींसाठी सरासरी प्रतिसाद वेळ 48 तास आहे.",
        sources: ["नगरपालिका मार्गदर्शक तत्त्वे 2024", "केस डेटाबेस रेकॉर्ड #847"],
      },
    };
    const response = language === "mr" ? responses.marathi : responses.default;
    return new Promise((resolve) => setTimeout(() => resolve(response), 500));
  }
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, language }),
  });
  return response.json();
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(mockAuditLogs), 300));
  }
  const response = await fetch("/api/audit");
  return response.json();
}
