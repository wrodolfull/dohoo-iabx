const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = {
  // Tenants
  getTenants: () => fetch(`${API_URL}/tenants`).then(r => r.json()),
  createTenant: (body: any) => fetch(`${API_URL}/tenants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),

  // Extensions
  getExtensions: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/extensions`).then(r => r.json()),
  createExtension: (tenantId: string, body: any) => fetch(`${API_URL}/tenants/${tenantId}/extensions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateExtension: (id: string, body: any) => fetch(`${API_URL}/extensions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteExtension: (id: string) => fetch(`${API_URL}/extensions/${id}`, { method: 'DELETE' }),

  // Plans
  getPlans: (tenantId: string) => fetch(`${API_URL}/tenants/${tenantId}/plans`).then(r => r.json()),
  createPlan: (tenantId: string, body: any) => fetch(`${API_URL}/tenants/${tenantId}/plans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),

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
  deleteURA: (id: string) => fetch(`${API_URL}/ura/${id}`, { method: 'DELETE' })
}; 