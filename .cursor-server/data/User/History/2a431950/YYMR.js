import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Mock Data
let tenants = [
  { 
    id: '1', 
    name: 'Empresa Alpha', 
    domain: 'alpha.dahoo.com', 
    owner: 'admin@alpha.com', 
    plan: 'Profissional', 
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

// Mock Extensions
let extensions = Array.from({ length: 15 }, (_, i) => ({
  id: `ext-${i + 1000}`,
  number: (1000 + i).toString(),
  name: `Ramal ${1000 + i}`,
  email: `user${1000 + i}@empresa.com`,
  department: ['Vendas', 'Suporte', 'Administrativo'][i % 3],
  status: ['online', 'offline', 'busy'][i % 3],
  tenantId: '1',
  password: '123456',
  codec: 'PCMU',
  enabled: true,
  createdAt: new Date().toISOString()
}));

// Mock Ring Groups
let ringGroups = Array.from({ length: 5 }, (_, i) => ({
  id: `rg-${i + 1}`,
  name: `Grupo ${i + 1}`,
  strategy: ['round_robin', 'sequential', 'simultaneous'][i % 3],
  timeout: 30,
  extensions: extensions.slice(i * 3, (i + 1) * 3).map(ext => ext.id),
  enabled: true,
  tenantId: '1',
  createdAt: new Date().toISOString()
}));

// Mock Trunks
let trunks = Array.from({ length: 3 }, (_, i) => ({
  id: `trunk-${i + 1}`,
  name: `Trunk ${i + 1}`,
  type: ['sip', 'iax2', 'dahdi'][i % 3],
  host: `trunk${i + 1}.provider.com`,
  username: `user${i + 1}`,
  password: 'password123',
  enabled: true,
  tenantId: '1',
  maxChannels: 10,
  createdAt: new Date().toISOString()
}));

// Mock Users
let users = Array.from({ length: 8 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `Usuário ${i + 1}`,
  email: `user${i + 1}@empresa.com`,
  role: ['admin', 'user', 'operator'][i % 3],
  department: ['Vendas', 'Suporte', 'Administrativo'][i % 3],
  extensionId: extensions[i]?.id,
  enabled: true,
  tenantId: '1',
  createdAt: new Date().toISOString()
}));

// Mock Inbound Routes
let inboundRoutes = Array.from({ length: 4 }, (_, i) => ({
  id: `inbound-${i + 1}`,
  name: `Rota Entrada ${i + 1}`,
  pattern: `55119999000${i}`,
  destination_type: ['extension', 'ringgroup', 'ura'][i % 3],
  destination_id: i % 3 === 0 ? extensions[0]?.id : i % 3 === 1 ? ringGroups[0]?.id : 'ura-1',
  enabled: true,
  tenantId: '1',
  createdAt: new Date().toISOString()
}));

// Mock Outbound Routes
let outboundRoutes = Array.from({ length: 3 }, (_, i) => ({
  id: `outbound-${i + 1}`,
  name: `Rota Saída ${i + 1}`,
  pattern: i === 0 ? '9XXXXXXXXX' : i === 1 ? '0800XXXXXXX' : 'XXXX',
  trunkId: trunks[i]?.id,
  enabled: true,
  tenantId: '1',
  createdAt: new Date().toISOString()
}));

// Mock URAs
let uras = Array.from({ length: 2 }, (_, i) => ({
  id: `ura-${i + 1}`,
  name: `URA ${i + 1}`,
  welcome_message: `Bem-vindo à URA ${i + 1}`,
  options: [
    { key: '1', action: 'transfer', destination: extensions[0]?.id, label: 'Vendas' },
    { key: '2', action: 'transfer', destination: ringGroups[0]?.id, label: 'Suporte' }
  ],
  enabled: true,
  tenantId: '1',
  createdAt: new Date().toISOString()
}));

// --- AUTH ---
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({
    token: 'jwt-token-12345',
    user: {
      id: 'user-1',
      name: 'Admin Alpha',
      email: email,
      role: 'superadmin',
      tenantId: '1'
    }
  });
});

app.post('/auth/register', (req, res) => {
  res.json({
    token: 'jwt-token-54321',
    user: {
      id: 'user-new',
      name: req.body.name,
      email: req.body.email,
      role: 'admin',
      tenantId: 'new-tenant-id'
    }
  });
});

app.get('/auth/me', (req, res) => {
  res.json({
    user: {
      id: 'user-1',
      name: 'Admin Alpha',
      email: 'admin@alpha.com',
      role: 'superadmin',
      tenantId: '1'
    }
  });
});

// --- TENANTS ---
app.get('/tenants', (req, res) => {
  res.json(tenants);
});

app.post('/tenants', (req, res) => {
  const newTenant = { ...req.body, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
  tenants.push(newTenant);
  res.status(201).json(newTenant);
});

app.put('/tenants/:id', (req, res) => {
  const { id } = req.params;
  tenants = tenants.map(t => t.id === id ? { ...t, ...req.body } : t);
  res.json(tenants.find(t => t.id === id));
});

app.delete('/tenants/:id', (req, res) => {
    const { id } = req.params;
    tenants = tenants.filter(t => t.id !== id);
    res.status(204).send();
});

// --- EXTENSIONS ---
app.get('/tenants/:tenantId/extensions', (req, res) => {
  const { tenantId } = req.params;
  const tenantExtensions = extensions.filter(ext => ext.tenantId === tenantId);
  res.json(tenantExtensions);
});

app.post('/tenants/:tenantId/extensions', (req, res) => {
  const { tenantId } = req.params;
  const newExtension = { 
    ...req.body, 
    id: Math.random().toString(36).substr(2, 9), 
    tenantId,
    createdAt: new Date().toISOString() 
  };
  extensions.push(newExtension);
  res.status(201).json(newExtension);
});

app.put('/extensions/:id', (req, res) => {
  const { id } = req.params;
  extensions = extensions.map(ext => ext.id === id ? { ...ext, ...req.body } : ext);
  res.json(extensions.find(ext => ext.id === id));
});

app.delete('/extensions/:id', (req, res) => {
  const { id } = req.params;
  extensions = extensions.filter(ext => ext.id !== id);
  res.status(204).send();
});

// --- RING GROUPS ---
app.get('/tenants/:tenantId/ringgroups', (req, res) => {
  const { tenantId } = req.params;
  const tenantRingGroups = ringGroups.filter(rg => rg.tenantId === tenantId);
  res.json(tenantRingGroups);
});

app.post('/tenants/:tenantId/ringgroups', (req, res) => {
  const { tenantId } = req.params;
  const newRingGroup = { 
    ...req.body, 
    id: Math.random().toString(36).substr(2, 9), 
    tenantId,
    createdAt: new Date().toISOString() 
  };
  ringGroups.push(newRingGroup);
  res.status(201).json(newRingGroup);
});

app.put('/ringgroups/:id', (req, res) => {
  const { id } = req.params;
  ringGroups = ringGroups.map(rg => rg.id === id ? { ...rg, ...req.body } : rg);
  res.json(ringGroups.find(rg => rg.id === id));
});

app.delete('/ringgroups/:id', (req, res) => {
  const { id } = req.params;
  ringGroups = ringGroups.filter(rg => rg.id !== id);
  res.status(204).send();
});

// --- TRUNKS ---
app.get('/tenants/:tenantId/trunks', (req, res) => {
  const { tenantId } = req.params;
  const tenantTrunks = trunks.filter(trunk => trunk.tenantId === tenantId);
  res.json(tenantTrunks);
});

app.post('/tenants/:tenantId/trunks', (req, res) => {
  const { tenantId } = req.params;
  const newTrunk = { 
    ...req.body, 
    id: Math.random().toString(36).substr(2, 9), 
    tenantId,
    createdAt: new Date().toISOString() 
  };
  trunks.push(newTrunk);
  res.status(201).json(newTrunk);
});

app.put('/trunks/:id', (req, res) => {
  const { id } = req.params;
  trunks = trunks.map(trunk => trunk.id === id ? { ...trunk, ...req.body } : trunk);
  res.json(trunks.find(trunk => trunk.id === id));
});

app.delete('/trunks/:id', (req, res) => {
  const { id } = req.params;
  trunks = trunks.filter(trunk => trunk.id !== id);
  res.status(204).send();
});

// --- USERS ---
app.get('/tenants/:tenantId/users', (req, res) => {
  const { tenantId } = req.params;
  const tenantUsers = users.filter(user => user.tenantId === tenantId);
  res.json(tenantUsers);
});

app.post('/tenants/:tenantId/users', (req, res) => {
  const { tenantId } = req.params;
  const newUser = { 
    ...req.body, 
    id: Math.random().toString(36).substr(2, 9), 
    tenantId,
    createdAt: new Date().toISOString() 
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  users = users.map(user => user.id === id ? { ...user, ...req.body } : user);
  res.json(users.find(user => user.id === id));
});

app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  users = users.filter(user => user.id !== id);
  res.status(204).send();
});

// --- INBOUND ROUTES ---
app.get('/tenants/:tenantId/inbound', (req, res) => {
  const { tenantId } = req.params;
  const tenantRoutes = inboundRoutes.filter(route => route.tenantId === tenantId);
  res.json(tenantRoutes);
});

app.post('/tenants/:tenantId/inbound', (req, res) => {
  const { tenantId } = req.params;
  const newRoute = { 
    ...req.body, 
    id: Math.random().toString(36).substr(2, 9), 
    tenantId,
    createdAt: new Date().toISOString() 
  };
  inboundRoutes.push(newRoute);
  res.status(201).json(newRoute);
});

app.put('/inbound/:id', (req, res) => {
  const { id } = req.params;
  inboundRoutes = inboundRoutes.map(route => route.id === id ? { ...route, ...req.body } : route);
  res.json(inboundRoutes.find(route => route.id === id));
});

app.delete('/inbound/:id', (req, res) => {
  const { id } = req.params;
  inboundRoutes = inboundRoutes.filter(route => route.id !== id);
  res.status(204).send();
});

// --- OUTBOUND ROUTES ---
app.get('/tenants/:tenantId/outbound', (req, res) => {
  const { tenantId } = req.params;
  const tenantRoutes = outboundRoutes.filter(route => route.tenantId === tenantId);
  res.json(tenantRoutes);
});

app.post('/tenants/:tenantId/outbound', (req, res) => {
  const { tenantId } = req.params;
  const newRoute = { 
    ...req.body, 
    id: Math.random().toString(36).substr(2, 9), 
    tenantId,
    createdAt: new Date().toISOString() 
  };
  outboundRoutes.push(newRoute);
  res.status(201).json(newRoute);
});

app.put('/outbound/:id', (req, res) => {
  const { id } = req.params;
  outboundRoutes = outboundRoutes.map(route => route.id === id ? { ...route, ...req.body } : route);
  res.json(outboundRoutes.find(route => route.id === id));
});

app.delete('/outbound/:id', (req, res) => {
  const { id } = req.params;
  outboundRoutes = outboundRoutes.filter(route => route.id !== id);
  res.status(204).send();
});

// --- URA ---
app.get('/tenants/:tenantId/ura', (req, res) => {
  const { tenantId } = req.params;
  const tenantUras = uras.filter(ura => ura.tenantId === tenantId);
  res.json(tenantUras);
});

app.post('/tenants/:tenantId/ura', (req, res) => {
  const { tenantId } = req.params;
  const newUra = { 
    ...req.body, 
    id: Math.random().toString(36).substr(2, 9), 
    tenantId,
    createdAt: new Date().toISOString() 
  };
  uras.push(newUra);
  res.status(201).json(newUra);
});

app.put('/ura/:id', (req, res) => {
  const { id } = req.params;
  uras = uras.map(ura => ura.id === id ? { ...ura, ...req.body } : ura);
  res.json(uras.find(ura => ura.id === id));
});

app.delete('/ura/:id', (req, res) => {
  const { id } = req.params;
  uras = uras.filter(ura => ura.id !== id);
  res.status(204).send();
});

// --- PLANS ---
app.get('/plans', (req, res) => {
  const plans = [
    { id: '1', name: 'Básico', price: 49.90, features: ['10 Agentes', '1 Fila', 'Relatórios Básicos'] },
    { id: '2', name: 'Profissional', price: 99.90, features: ['50 Agentes', '10 Filas', 'Relatórios Avançados', 'CTI'] },
    { id: '3', name: 'Enterprise', price: 299.90, features: ['Agentes Ilimitados', 'Filas Ilimitadas', 'Suporte Premium', 'WebPhone'] }
  ];
  res.json(plans);
});

// --- SCHEDULES ---
app.get('/tenants/:tenantId/schedules', (req, res) => {
    const schedules = [
        { id: '1', name: 'Horário Comercial', description: 'Seg-Sex, 08h-18h', active: true },
        { id: '2', name: 'Plantão Final de Semana', description: 'Sáb-Dom, 09h-13h', active: false },
    ];
    res.json(schedules);
});

// --- CALL CENTER API ---
const generateCallCenterData = () => {
    const metrics = {
        totalCalls: Math.floor(Math.random() * 1000) + 500,
        activeCalls: Math.floor(Math.random() * 20),
        waitingCalls: Math.floor(Math.random() * 10),
        completedCalls: Math.floor(Math.random() * 800) + 400,
        abandonedCalls: Math.floor(Math.random() * 50),
        averageWaitTime: Math.floor(Math.random() * 60) + 15,
        averageCallDuration: Math.floor(Math.random() * 180) + 60,
        serviceLevel: Math.floor(Math.random() * 20) + 80,
        activeAgents: Math.floor(Math.random() * 10) + 5,
        totalAgents: 20
    };

    const agents = Array.from({ length: 5 }, (_, i) => ({
        id: `agent-${i + 1}`,
        name: `Agente ${i + 1}`,
        email: `agente${i+1}@empresa.com`,
        status: ['available', 'busy', 'break', 'offline'][Math.floor(Math.random() * 4)],
        queue: ['support', 'sales'][i % 2],
        lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        callsHandled: Math.floor(Math.random() * 50),
        averageCallTime: Math.floor(Math.random() * 180) + 60,
        skills: [['Suporte', 'Vendas'], ['Técnico', 'Atendimento']][i%2]
    }));

    const queues = [
        { id: 'support', name: 'Suporte Técnico', waitingCalls: metrics.waitingCalls, agentCount: 10, strategy: 'round_robin', enabled: true, priority: 1, description: 'Fila de suporte técnico' },
        { id: 'sales', name: 'Vendas', waitingCalls: Math.floor(Math.random() * 5), agentCount: 10, strategy: 'least_recent', enabled: true, priority: 2, description: 'Fila de vendas' },
    ];

    const calls = Array.from({ length: 10 }, (_, i) => ({
        id: `call-${i + 1}`,
        callId: `uuid-${Math.random()}`,
        callerNumber: `+55119876543${i}${i}`,
        calledNumber: '4004',
        queue: ['Suporte Técnico', 'Vendas'][i % 2],
        agent: `Agente ${i % 5 + 1}`,
        startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        duration: Math.floor(Math.random() * 300),
        waitTime: Math.floor(Math.random() * 60),
        status: ['completed', 'abandoned', 'active'][i % 3],
        recordingUrl: 'https://example.com/recording.wav'
    }));

    return { metrics, agents, queues, calls };
};

app.get('/callcenter/metrics', (req, res) => res.json(generateCallCenterData().metrics));
app.get('/callcenter/agents', (req, res) => res.json(generateCallCenterData().agents));
app.get('/callcenter/queues', (req, res) => res.json(generateCallCenterData().queues));
app.get('/callcenter/calls', (req, res) => res.json(generateCallCenterData().calls));

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
}); 