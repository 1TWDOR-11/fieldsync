// Run: node src/seed.js
const { db, initDb } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  await initDb();
  console.log('DB initialized');

  const hash = p => bcrypt.hashSync(p, 10);

  // ── Users ──────────────────────────────────────────────
  const users = [
    { name: 'Hannya Silva',      email: 'hannya@fieldsync.io',    password: hash('123456'), role: 'coordinator' },
    { name: 'Carlos Menezes',    email: 'carlos@fieldsync.io',    password: hash('123456'), role: 'coordinator' },
    { name: 'Lucas Ferreira',    email: 'lucas@fieldsync.io',     password: hash('123456'), role: 'field' },
    { name: 'Mariana Costa',     email: 'mariana@fieldsync.io',   password: hash('123456'), role: 'field' },
    { name: 'Renan Oliveira',    email: 'renan@fieldsync.io',     password: hash('123456'), role: 'field' },
    { name: 'Beatriz Santos',    email: 'beatriz@fieldsync.io',   password: hash('123456'), role: 'field' },
    { name: 'Diego Almeida',     email: 'diego@fieldsync.io',     password: hash('123456'), role: 'field' },
  ];

  const userIds = [];
  for (const u of users) {
    try {
      const r = await db.execute({
        sql: 'INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)',
        args: [u.name, u.email, u.password, u.role]
      });
      const row = await db.execute({ sql: 'SELECT id FROM users WHERE email=?', args: [u.email] });
      userIds.push({ ...u, id: Number(row.rows[0].id) });
    } catch { console.warn('skip user', u.email); }
  }
  console.log('Users seeded:', userIds.length);

  const byRole = r => userIds.filter(u => u.role === r);
  const coords = byRole('coordinator');
  const field  = byRole('field');

  // ── Departments (company areas) ──────────────────────────
  const departments = [
    { name: 'Operações de Campo',     description: 'Equipes que executam instalações, manutenções e inspeções in loco.', color: '#1A6FFF', lead_id: coords[0]?.id },
    { name: 'Administrativo',         description: 'Gestão de contratos, financeiro e suporte interno.',                color: '#6366F1', lead_id: coords[1]?.id || coords[0]?.id },
    { name: 'Produto e Tecnologia',   description: 'Desenvolvimento de software, apps e novas funcionalidades.',        color: '#00C9A7', lead_id: coords[0]?.id },
    { name: 'Comercial',              description: 'Relacionamento com clientes e prospecção de novos contratos.',      color: '#F59E0B', lead_id: coords[1]?.id || coords[0]?.id },
  ];
  for (const d of departments) {
    const existing = await db.execute({ sql: 'SELECT id FROM departments WHERE name=?', args: [d.name] });
    if (existing.rows.length) continue;
    await db.execute({
      sql: 'INSERT INTO departments (name,description,color,lead_id) VALUES (?,?,?,?)',
      args: [d.name, d.description, d.color, d.lead_id || null]
    });
  }
  console.log('Departments seeded:', departments.length);

  // ── More fictitious company areas ──────────────────────
  const moreDepartments = [
    { name: 'Suporte ao Cliente',     description: 'Atendimento, SAC e pós-venda para todos os clientes ativos.',          color: '#FF4D6A', lead_id: coords[1]?.id || coords[0]?.id },
    { name: 'Engenharia de Dados',    description: 'Infraestrutura de dados, integrações e relatórios analíticos.',       color: '#10B981', lead_id: coords[0]?.id },
  ];
  for (const d of moreDepartments) {
    const existing = await db.execute({ sql: 'SELECT id FROM departments WHERE name=?', args: [d.name] });
    if (existing.rows.length) continue;
    await db.execute({ sql: 'INSERT INTO departments (name,description,color,lead_id) VALUES (?,?,?,?)', args: [d.name, d.description, d.color, d.lead_id || null] });
  }
  console.log('Extra departments seeded:', moreDepartments.length);

  // ── Clients ────────────────────────────────────────────
  const clients = [
    { name: 'TechVision S.A.',      contact_name: 'Ana Ramos',     contact_email: 'ana@techvision.com',   segment: 'Tecnologia',  status: 'active' },
    { name: 'EnergyBR Ltda.',       contact_name: 'Pedro Lima',    contact_email: 'pedro@energybr.com',   segment: 'Indústria',   status: 'active' },
    { name: 'Saúde Total Clínicas', contact_name: 'Fernanda Neto', contact_email: 'fneto@saudetotal.com', segment: 'Saúde',       status: 'active' },
    { name: 'EduFácil Plataformas', contact_name: 'João Torres',   contact_email: 'joao@edufacil.com',    segment: 'Educação',    status: 'prospect' },
    { name: 'RetailMax Group',      contact_name: 'Clara Vieira',  contact_email: 'clara@retailmax.com',  segment: 'Varejo',      status: 'inactive' },
    { name: 'LogiFast Transportes',     contact_name: 'João Almeida',   contact_email: 'joao@logifast.com',   segment: 'Serviços', status: 'active' },
    { name: 'AgroVerde Cooperativa',    contact_name: 'Patrícia Souza', contact_email: 'patricia@agroverde.com', segment: 'Indústria', status: 'active' },
    { name: 'Construtora Horizonte',    contact_name: 'Marcos Lima',    contact_email: 'marcos@horizonte.com', segment: 'Indústria', status: 'prospect' },
  ];

  const clientIds = {};
  for (const c of clients) {
    const existing = await db.execute({ sql: 'SELECT id FROM clients WHERE name=?', args: [c.name] });
    if (existing.rows.length) { clientIds[c.name] = Number(existing.rows[0].id); continue; }
    const r = await db.execute({
      sql: 'INSERT INTO clients (name,contact_name,contact_email,segment,status) VALUES (?,?,?,?,?)',
      args: [c.name, c.contact_name, c.contact_email, c.segment, c.status]
    });
    clientIds[c.name] = Number(r.lastInsertRowid);
  }
  const clientIdList = clients.map(c => clientIds[c.name]);
  console.log('Clients seeded:', clients.length);

  // ── Projects ───────────────────────────────────────────
  const projects = [
    { name: 'Infraestrutura de Rede TechVision',   client_id: clientIds['TechVision S.A.'],      team: 'operational',    status: 'active',    progress: 65, start_date: '2026-03-01', end_date: '2026-07-30', description: 'Expansão da rede cabeada e Wi-Fi para 3 andares do campus.' },
    { name: 'Manutenção Subestação EnergyBR',       client_id: clientIds['EnergyBR Ltda.'],       team: 'field',          status: 'active',    progress: 40, start_date: '2026-04-10', end_date: '2026-08-20', description: 'Inspeção e manutenção preventiva das subestações elétricas.' },
    { name: 'Implantação ERP Saúde Total',          client_id: clientIds['Saúde Total Clínicas'], team: 'administrative', status: 'active',    progress: 80, start_date: '2026-01-15', end_date: '2026-06-30', description: 'Migração e configuração do novo sistema de gestão hospitalar.' },
    { name: 'Desenvolvimento App EduFácil',         client_id: clientIds['EduFácil Plataformas'], team: 'product',        status: 'planning',  progress: 10, start_date: '2026-06-01', end_date: '2026-12-31', description: 'Criação da versão mobile da plataforma educacional.' },
    { name: 'Auditoria Interna Q2',                 client_id: null,         team: 'administrative', status: 'completed', progress: 100, start_date: '2026-04-01', end_date: '2026-05-31', description: 'Auditoria trimestral de processos e conformidade.' },
    { name: 'Expansão Cobertura Campo RetailMax',   client_id: clientIds['RetailMax Group'],      team: 'field',          status: 'on_hold',   progress: 25, start_date: '2026-02-01', end_date: '2026-09-30', description: 'Instalação de pontos de coleta em 12 lojas.' },
    { name: 'Otimização de Rotas LogiFast',         client_id: clientIds['LogiFast Transportes'], team: 'operational',    status: 'active',    progress: 55, start_date: '2026-03-15', end_date: '2026-08-30', description: 'Reestruturação das rotas de entrega com rastreamento em tempo real.' },
    { name: 'Monitoramento de Safra AgroVerde',     client_id: clientIds['AgroVerde Cooperativa'],team: 'field',          status: 'active',    progress: 30, start_date: '2026-05-01', end_date: '2026-11-30', description: 'Instalação de sensores de solo e monitoramento remoto das lavouras.' },
    { name: 'Auditoria de Compliance Horizonte',    client_id: clientIds['Construtora Horizonte'],team: 'administrative', status: 'planning',  progress: 0,  start_date: '2026-07-01', end_date: '2026-09-30', description: 'Revisão de contratos e adequação a normas regulatórias.' },
    { name: 'App de Acompanhamento de Obras',       client_id: clientIds['Construtora Horizonte'],team: 'product',        status: 'planning',  progress: 5,  start_date: '2026-07-15', end_date: '2027-01-31', description: 'Aplicativo mobile para acompanhamento de progresso de obras pelos clientes.' },
    { name: 'Reestruturação Financeira Interna',    client_id: null,         team: 'administrative', status: 'active',    progress: 45, start_date: '2026-04-01', end_date: '2026-10-31', description: 'Revisão de processos financeiros e centralização de relatórios.' },
    { name: 'Dashboard de Indicadores v2',          client_id: null,         team: 'product',        status: 'active',    progress: 60, start_date: '2026-02-01', end_date: '2026-08-15', description: 'Nova versão do painel analítico com métricas por equipe.' },
  ];

  const projectIds = [];
  for (const p of projects) {
    const existing = await db.execute({ sql: 'SELECT id FROM projects WHERE name=?', args: [p.name] });
    if (existing.rows.length) { projectIds.push(Number(existing.rows[0].id)); continue; }
    const r = await db.execute({
      sql: 'INSERT INTO projects (name,client_id,team,status,progress,start_date,end_date,description) VALUES (?,?,?,?,?,?,?,?)',
      args: [p.name, p.client_id, p.team, p.status, p.progress, p.start_date, p.end_date, p.description]
    });
    projectIds.push(Number(r.lastInsertRowid));
  }
  console.log('Projects seeded:', projectIds.length);

  // ── Tasks ──────────────────────────────────────────────
  const tasks = [
    { title: 'Instalação de switches no andar 2',    description: 'Configurar 8 switches gerenciáveis HP Aruba.',      status: 'done',        priority: 'high',   assigned: field[0],  project: projectIds[0], location: 'TechVision – Andar 2',   due_date: '2026-05-20', created_by: coords[0] },
    { title: 'Passagem de cabeamento Cat6',           description: 'Cabeamento estruturado para 40 pontos de rede.',    status: 'done',        priority: 'high',   assigned: field[1],  project: projectIds[0], location: 'TechVision – Andar 1',   due_date: '2026-05-15', created_by: coords[0] },
    { title: 'Configuração de firewall perimetral',  description: 'Setup FortiGate 200F com regras de segurança.',     status: 'in_progress', priority: 'high',   assigned: field[0],  project: projectIds[0], location: 'TechVision – Sala NOC',  due_date: '2026-06-25', created_by: coords[0] },
    { title: 'Teste de carga Wi-Fi',                  description: 'Simular 200 dispositivos simultâneos por AP.',      status: 'pending',     priority: 'medium', assigned: field[2],  project: projectIds[0], location: 'TechVision – Auditório', due_date: '2026-07-05', created_by: coords[0] },
    { title: 'Inspeção transformador T-01',           description: 'Verificar temperatura, vibração e nível de óleo.',  status: 'done',        priority: 'high',   assigned: field[3],  project: projectIds[1], location: 'EnergyBR – Unidade SP',  due_date: '2026-05-30', created_by: coords[1] },
    { title: 'Substituição de disjuntores B3/B4',    description: 'Trocar disjuntores de 400A com desligamento total.',status: 'in_progress', priority: 'high',   assigned: field[3],  project: projectIds[1], location: 'EnergyBR – Unidade SP',  due_date: '2026-06-28', created_by: coords[1] },
    { title: 'Inspeção termográfica cabos BT',        description: 'Identificar pontos de aquecimento anormal.',        status: 'pending',     priority: 'medium', assigned: field[2],  project: projectIds[1], location: 'EnergyBR – Unidade RJ',  due_date: '2026-07-15', created_by: coords[1] },
    { title: 'Migração base de dados hospitalar',    description: 'Transferir 2.4M registros para novo ERP.',          status: 'done',        priority: 'high',   assigned: field[0],  project: projectIds[2], location: 'Remoto',                 due_date: '2026-04-30', created_by: coords[0] },
    { title: 'Treinamento equipe administrativa',    description: 'Capacitar 32 funcionários no novo sistema.',        status: 'in_progress', priority: 'medium', assigned: field[1],  project: projectIds[2], location: 'Saúde Total – Sede',     due_date: '2026-06-20', created_by: coords[0] },
    { title: 'Levantamento de requisitos App',       description: 'Entrevistas com stakeholders e documentação.',      status: 'done',        priority: 'medium', assigned: field[1],  project: projectIds[3], location: 'Remoto',                 due_date: '2026-06-10', created_by: coords[1] },
    { title: 'Prototipação UI/UX mobile',            description: 'Wireframes e protótipo navegável no Figma.',        status: 'in_progress', priority: 'medium', assigned: field[2],  project: projectIds[3], location: 'Remoto',                 due_date: '2026-06-30', created_by: coords[1] },
    { title: 'Instalação coletores loja Centro',     description: 'Instalar e configurar 3 coletores de dados.',      status: 'pending',     priority: 'low',    assigned: field[3],  project: projectIds[5], location: 'RetailMax – Loja Centro', due_date: '2026-07-20', created_by: coords[0] },
  ];

  for (const t of tasks) {
    const existing = await db.execute({ sql: 'SELECT id FROM tasks WHERE title=?', args: [t.title] });
    if (existing.rows.length) continue;
    await db.execute({
      sql: 'INSERT INTO tasks (title,description,status,priority,assigned_to,project_id,location,due_date,created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      args: [t.title, t.description, t.status, t.priority, t.assigned?.id || null, t.project, t.location, t.due_date, t.created_by?.id || null]
    });
  }
  console.log('Tasks seeded:', tasks.length);

  // ── Task IDs para occurrences ──
  const taskRows = await db.execute('SELECT id FROM tasks LIMIT 12');
  const tIds = taskRows.rows.map(r => Number(r.id));

  // ── Occurrences ────────────────────────────────────────
  const occs = [
    { task_id: tIds[0], user_id: field[0].id, description: 'Dois switches chegaram com portas danificadas. Aguardando reposição do fornecedor. ETA: 3 dias.' },
    { task_id: tIds[2], user_id: field[0].id, description: 'Acesso ao rack principal bloqueado por obra no teto. Reprogramando para quinta-feira.' },
    { task_id: tIds[4], user_id: field[3].id, description: 'Temperatura do transformador T-01 acima do limite (87°C). Solicitado desligamento preventivo para inspeção.' },
    { task_id: tIds[5], user_id: field[3].id, description: 'Disjuntor B3 apresentou faísca durante substituição. Serviço interrompido, equipe de segurança acionada.' },
    { task_id: tIds[7], user_id: field[0].id, description: 'Migração concluída com sucesso. Todos os registros validados. Backup confirmado.' },
  ];

  for (const o of occs) {
    const existing = await db.execute({ sql: 'SELECT id FROM occurrences WHERE task_id=? AND description=?', args: [o.task_id, o.description] });
    if (existing.rows.length) continue;
    await db.execute({
      sql: 'INSERT INTO occurrences (task_id,user_id,description) VALUES (?,?,?)',
      args: [o.task_id, o.user_id, o.description]
    });
  }
  console.log('Occurrences seeded:', occs.length);

  console.log('\n✅ Seed concluído! Login: hannya@fieldsync.io / 123456');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
