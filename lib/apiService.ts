const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || '/api';
const USE_AWS = process.env.NEXT_PUBLIC_USE_AWS === 'true';

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = USE_AWS ? `${API_BASE_URL}${endpoint}` : `/api${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health check
  static async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return this.makeRequest('/health');
  }

  // User management
  static async createUser(userData: {
    email: string;
    password: string;
    role: string;
  }, authToken: string): Promise<{ success: boolean; userId: string }> {
    return this.makeRequest('/createUser', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(userData),
    });
  }

  // Analytics
  static async getAnalyticsSummary(params?: {
    dateRange?: string;
    department?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams(params || {});
    const endpoint = `/analytics/summary${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // Patients
  static async getPatients(): Promise<any[]> {
    return this.makeRequest('/patients');
  }

  static async getPatient(id: string): Promise<any> {
    return this.makeRequest(`/patients/${id}`);
  }

  static async createPatient(patientData: any): Promise<{ message: string }> {
    return this.makeRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  static async updatePatient(id: string, updates: any): Promise<{ message: string }> {
    return this.makeRequest(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  static async deletePatient(id: string): Promise<{ message: string }> {
    return this.makeRequest(`/patients/${id}`, {
      method: 'DELETE',
    });
  }
}

export default ApiService;