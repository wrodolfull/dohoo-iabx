const API_URL = import.meta.env.VITE_API_URL || 'http://31.97.250.190:3001';

// Debug: Log da URL da API
console.log('🔧 API URL configurada:', API_URL);
console.log('🔧 VITE_API_URL env:', import.meta.env.VITE_API_URL);

export const api = {
  // Authentication
  login: (credentials: { email: string; password: string }) => {
    console.log('🔧 Login API call to:', `${API_URL}/auth/login`);
    return fetch(`${API_URL}/auth/login`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(credentials) 
    }).then(r => r.json());
  },
  
  logout: () => {
    console.log('🔧 Logout API call to:', `${API_URL}/auth/logout`);
    return fetch(`${API_URL}/auth/logout`, { method: 'POST' }).then(r => r.json());
  },
  
  me: (token: string) => {
    console.log('🔧 Me API call to:', `${API_URL}/auth/me`);
    return fetch(`${API_URL}/auth/me`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    }).then(r => r.json());
  },

  // Tenants
  getTenants: () => {
    console.log('🔧 GetTenants API call to:', `${API_URL}/tenants`);
    return fetch(`${API_URL}/tenants`).then(r => {
      console.log('🔧 GetTenants response status:', r.status);
      return r.json();
    });
  },
  createTenant: (body: any) => fetch(`${API_URL}/tenants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateTenant: (id: string, body: any) => fetch(`${API_URL}/tenants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteTenant: (id: string) => fetch(`${API_URL}/tenants/${id}`, { method: 'DELETE' }),
  
  // FreeSWITCH Integration
  syncTenantWithFreeSWITCH: (tenantId: string) => 
    fetch(`${API_URL}/tenants/${tenantId}/sync-freeswitch`, { method: 'POST' }).then(r => r.json()),
  
  provisionExtensionInFreeSWITCH: (extension: any, tenantId: string) => 
    fetch(`${API_URL}/freeswitch/provision-extension`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ extension, tenant_id: tenantId }) 
    }).then(r => r.json()),

  // Extensions
  getExtensions: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/extensions`).then(r => r.json()),
  createExtension: (tenantId: string, body: any) => fetch(`${API_URL}/tenants/${tenantId}/extensions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateExtension: (id: string, body: any) => fetch(`${API_URL}/extensions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteExtension: (id: string) => fetch(`${API_URL}/extensions/${id}`, { method: 'DELETE' }),

  // Plans (Global - não vinculados a tenant)
  getPlans: () => fetch(`${API_URL}/plans`).then(r => r.json()),
  createPlan: (body: any) => fetch(`${API_URL}/plans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updatePlan: (id: string, body: any) => fetch(`${API_URL}/plans/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deletePlan: (id: string) => fetch(`${API_URL}/plans/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/users`).then(r => r.json()),
  createUser: (tenantId: string, body: any) => fetch(`${API_URL}/tenants/${tenantId}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateUser: (id: string, body: any) => fetch(`${API_URL}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteUser: (id: string) => fetch(`${API_URL}/users/${id}`, { method: 'DELETE' }),

  // Ring Groups
  getRingGroups: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/ringgroups`).then(r => r.json()),
  createRingGroup: (tenantId: string, body: any) => fetch(`${API_URL}/tenants/${tenantId}/ringgroups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateRingGroup: (id: string, body: any) => fetch(`${API_URL}/ringgroups/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteRingGroup: (id: string) => fetch(`${API_URL}/ringgroups/${id}`, { method: 'DELETE' }),

  // Trunks
  getTrunks: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/trunks`).then(r => r.json()),
  createTrunk: (tenantId: string, body: any) => fetch(`${API_URL}/tenants/${tenantId}/trunks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateTrunk: (id: string, body: any) => fetch(`${API_URL}/trunks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteTrunk: (id: string) => fetch(`${API_URL}/trunks/${id}`, { method: 'DELETE' }),

  // Inbound Routes
  getInboundRoutes: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/inbound`).then(r => r.json()),
  createInboundRoute: (tenantId: string, body: any) => fetch(`${API_URL}/tenants/${tenantId}/inbound`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateInboundRoute: (id: string, body: any) => fetch(`${API_URL}/inbound/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteInboundRoute: (id: string) => fetch(`${API_URL}/inbound/${id}`, { method: 'DELETE' }),

  // Outbound Routes
  getOutboundRoutes: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/outbound`).then(r => r.json()),
  createOutboundRoute: (tenantId: string, body: any) => fetch(`${API_URL}/tenants/${tenantId}/outbound`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateOutboundRoute: (id: string, body: any) => fetch(`${API_URL}/outbound/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteOutboundRoute: (id: string) => fetch(`${API_URL}/outbound/${id}`, { method: 'DELETE' }),

  // URA
  getURA: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/ura`).then(r => r.json()),
  createURA: (tenantId: string, body: any) => fetch(`${API_URL}/tenants/${tenantId}/ura`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateURA: (id: string, body: any) => fetch(`${API_URL}/ura/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteURA: (id: string) => fetch(`${API_URL}/ura/${id}`, { method: 'DELETE' }),

  // Audit Logs
  getAuditLogs: (filters: any) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    return fetch(`${API_URL}/audit-logs?${params}`).then(r => r.json());
  },
  exportAuditLogs: (filters: any) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    return fetch(`${API_URL}/audit-logs/export?${params}`).then(r => r.text());
  },

  // Schedules (Horários de Atendimento)
  getSchedules: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/schedules`).then(r => r.json()),
  createSchedule: (body: any) => fetch(`${API_URL}/tenants/${body.tenant_id}/schedules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateSchedule: (id: string, body: any) => fetch(`${API_URL}/schedules/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteSchedule: (id: string) => fetch(`${API_URL}/schedules/${id}`, { method: 'DELETE' }),

  // Active Calls
  getActiveCalls: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/active-calls`).then(r => r.json()),
  hangupCall: (callId: string) => fetch(`${API_URL}/calls/${callId}/hangup`, { method: 'POST' }).then(r => r.json()),

  // Reports
  getCallReports: (tenantId: string, filters: any) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    return fetch(`${API_URL}/tenants/${tenantId}/reports/calls?${params}`).then(r => r.json());
  },
  exportCallReports: (tenantId: string, filters: any) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    return fetch(`${API_URL}/tenants/${tenantId}/reports/calls/export?${params}`).then(r => r.text());
  },

  // FreeSWITCH Advanced Admin
  // Dialplans
  getDialplans: () => fetch(`${API_URL}/freeswitch/dialplans`).then(r => r.json()),
  createDialplan: (body: any) => fetch(`${API_URL}/freeswitch/dialplans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateDialplan: (id: string, body: any) => fetch(`${API_URL}/freeswitch/dialplans/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteDialplan: (id: string) => fetch(`${API_URL}/freeswitch/dialplans/${id}`, { method: 'DELETE' }),

  // SIP Profiles
  getSipProfiles: () => fetch(`${API_URL}/freeswitch/sip-profiles`).then(r => r.json()),
  createSipProfile: (body: any) => fetch(`${API_URL}/freeswitch/sip-profiles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateSipProfile: (id: string, body: any) => fetch(`${API_URL}/freeswitch/sip-profiles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteSipProfile: (id: string) => fetch(`${API_URL}/freeswitch/sip-profiles/${id}`, { method: 'DELETE' }),

  // FreeSWITCH Configuration
  getFreeSwitchConfig: () => fetch(`${API_URL}/freeswitch/config`).then(r => r.json()),
  updateFreeSwitchConfig: (body: any) => fetch(`${API_URL}/freeswitch/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),

  // FreeSWITCH Control
  getFreeSwitchStatus: () => fetch(`${API_URL}/freeswitch/status`).then(r => r.json()),
  reloadFreeSWITCH: () => fetch(`${API_URL}/freeswitch/reload`, { method: 'POST' }).then(r => r.json()),

  // Call Center APIs
  getCallCenterMetrics: () => fetch(`${API_URL}/callcenter/metrics`).then(r => r.json()),
  getCallCenterAgents: () => fetch(`${API_URL}/callcenter/agents`).then(r => r.json()),
  getCallCenterQueues: () => fetch(`${API_URL}/callcenter/queues`).then(r => r.json()),
  getCallCenterCalls: () => fetch(`${API_URL}/callcenter/calls`).then(r => r.json()),
  updateAgentStatus: (agentId: string, status: string) => 
    fetch(`${API_URL}/callcenter/agents/${agentId}/status`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status }) 
    }).then(r => r.json()),
  
  // Server-Sent Events para atualizações em tempo real
  createCallCenterEventSource: () => new EventSource(`${API_URL}/callcenter/events`)
}; 