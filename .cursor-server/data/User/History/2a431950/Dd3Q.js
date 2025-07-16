const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');

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
    id: 'user-1',
    name: 'Admin Alpha',
    email: 'admin@alpha.com',
    role: 'superadmin',
    tenantId: '1'
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