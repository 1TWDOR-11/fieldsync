const bcrypt = require('bcryptjs');

async function seed(db) {
  const hash = p => bcrypt.hashSync(p, 10);

  // ── Users ─────────────────────────────────────────────
  const usersData = [
    { name: 'Hannya Cavalcante', email: 'hannya@fieldsync.io',  password: hash('123456'), role: 'coordinator' },
    { name: 'Carlos Menezes',   email: 'carlos@fieldsync.io',  password: hash('123456'), role: 'coordinator' },
    { name: 'Lucas Ferreira',   email: 'lucas@fieldsync.io',   password: hash('123456'), role: 'field' },
    { name: 'Mariana Costa',    email: 'mariana@fieldsync.io', password: hash('123456'), role: 'field' },
    { name: 'Renan Oliveira',   email: 'renan@fieldsync.io',   password: hash('123456'), role: 'field' },
    { name: 'Beatriz Santos',   email: 'beatriz@fieldsync.io', password: hash('123456'), role: 'field' },
    { name: 'Diego Almeida',    email: 'diego@fieldsync.io',   password: hash('123456'), role: 'field' },
  ];

  const userIds = [];
  for (const u of usersData) {
    await db.execute({ sql: 'INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)', args: [u.name, u.email, u.password, u.role] });
    const row = await db.execute({ sql: 'SELECT id FROM users WHERE email=?', args: [u.email] });
    userIds.push({ ...u, id: Number(row.rows[0].id) });
  }

  const coords = userIds.filter(u => u.role === 'coordinator');
  const field  = userIds.filter(u => u.role === 'field');

  // ── Departments ───────────────────────────────────────
  const depts = [
    { name: 'Operações de Campo',   description: 'Equipes que executam instalações, manutenções e inspeções in loco.', color: '#1A6FFF', lead_id: coords[0]?.id },
    { name: 'Administrativo',       description: 'Gestão de contratos, financeiro e suporte interno.',                  color: '#6366F1', lead_id: coords[1]?.id },
    { name: 'Produto e Tecnologia', description: 'Desenvolvimento de software, apps e novas funcionalidades.',          color: '#00C9A7', lead_id: coords[0]?.id },
    { name: 'Comercial',            description: 'Relacionamento com clientes e prospecção de novos contratos.',        color: '#F59E0B', lead_id: coords[1]?.id },
    { name: 'Suporte ao Cliente',   description: 'Atendimento, SAC e pós-venda para todos os clientes ativos.',        color: '#FF4D6A', lead_id: coords[1]?.id },
    { name: 'Engenharia de Dados',  description: 'Infraestrutura de dados, integrações e relatórios analíticos.',      color: '#10B981', lead_id: coords[0]?.id },
  ];
  for (const d of depts) {
    const ex = await db.execute({ sql: 'SELECT id FROM departments WHERE name=?', args: [d.name] });
    if (!ex.rows.length) await db.execute({ sql: 'INSERT INTO departments (name,description,color,lead_id) VALUES (?,?,?,?)', args: [d.name, d.description, d.color, d.lead_id || null] });
  }

  // ── Clients ────────────────────────────────────────────
  const clientsData = [
    { name: 'TechVision S.A.',         contact_name: 'Ana Ramos',      contact_email: 'ana@techvision.com',   segment: 'Tecnologia', status: 'active',   needs: 'Expansão da rede interna e segurança perimetral.',  service: 'Infraestrutura de TI' },
    { name: 'EnergyBR Ltda.',          contact_name: 'Pedro Lima',     contact_email: 'pedro@energybr.com',  segment: 'Indústria',  status: 'active',   needs: 'Manutenção preventiva e inspeção elétrica.',        service: 'Manutenção Elétrica' },
    { name: 'Saúde Total Clínicas',    contact_name: 'Fernanda Neto',  contact_email: 'fneto@saudetotal.com',segment: 'Saúde',      status: 'active',   needs: 'Implantação e treinamento de novo ERP hospitalar.', service: 'Consultoria ERP' },
    { name: 'EduFácil Plataformas',    contact_name: 'João Torres',    contact_email: 'joao@edufacil.com',   segment: 'Educação',   status: 'prospect', needs: 'App mobile para alunos e professores.',             service: 'Desenvolvimento Mobile' },
    { name: 'RetailMax Group',         contact_name: 'Clara Vieira',   contact_email: 'clara@retailmax.com', segment: 'Varejo',     status: 'inactive', needs: 'Coletores de dados e rastreamento de estoque.',     service: 'IoT e Automação' },
    { name: 'LogiFast Transportes',    contact_name: 'João Almeida',   contact_email: 'joao@logifast.com',   segment: 'Serviços',   status: 'active',   needs: 'Otimização de rotas e rastreamento em tempo real.', service: 'Sistemas de Logística' },
    { name: 'AgroVerde Cooperativa',   contact_name: 'Patrícia Souza', contact_email: 'patricia@agroverde.com',segment: 'Indústria', status: 'active',  needs: 'Sensores de solo e monitoramento de safra.',        service: 'Agrotecnologia' },
    { name: 'Construtora Horizonte',   contact_name: 'Marcos Lima',    contact_email: 'marcos@horizonte.com',segment: 'Indústria',  status: 'prospect', needs: 'Acompanhamento de obras e conformidade regulatória.',service: 'Consultoria Técnica' },
  ];

  const clientIds = {};
  for (const c of clientsData) {
    const ex = await db.execute({ sql: 'SELECT id FROM clients WHERE name=?', args: [c.name] });
    if (ex.rows.length) { clientIds[c.name] = Number(ex.rows[0].id); continue; }
    const r = await db.execute({ sql: 'INSERT INTO clients (name,contact_name,contact_email,segment,status,needs,service) VALUES (?,?,?,?,?,?,?)', args: [c.name, c.contact_name, c.contact_email, c.segment, c.status, c.needs, c.service] });
    clientIds[c.name] = Number(r.lastInsertRowid);
  }

  // ── Projects ───────────────────────────────────────────
  const projectsData = [
    { name: 'Infraestrutura de Rede TechVision',  client: 'TechVision S.A.',       team: 'operational',    status: 'active',    progress: 65, start_date: '2026-03-01', end_date: '2026-07-30', description: 'Expansão da rede cabeada e Wi-Fi para 3 andares do campus.' },
    { name: 'Manutenção Subestação EnergyBR',     client: 'EnergyBR Ltda.',        team: 'field',          status: 'active',    progress: 42, start_date: '2026-04-10', end_date: '2026-08-20', description: 'Inspeção e manutenção preventiva das subestações elétricas.' },
    { name: 'Implantação ERP Saúde Total',        client: 'Saúde Total Clínicas',  team: 'administrative', status: 'active',    progress: 80, start_date: '2026-01-15', end_date: '2026-06-30', description: 'Migração e configuração do novo sistema de gestão hospitalar.' },
    { name: 'Desenvolvimento App EduFácil',       client: 'EduFácil Plataformas',  team: 'product',        status: 'planning',  progress: 10, start_date: '2026-06-01', end_date: '2026-12-31', description: 'Criação da versão mobile da plataforma educacional.' },
    { name: 'Auditoria Interna Q2/2026',          client: null,                    team: 'administrative', status: 'completed', progress: 100,start_date: '2026-04-01', end_date: '2026-05-31', description: 'Auditoria trimestral de processos e conformidade.' },
    { name: 'Expansão Cobertura RetailMax',       client: 'RetailMax Group',        team: 'field',          status: 'on_hold',   progress: 25, start_date: '2026-02-01', end_date: '2026-09-30', description: 'Instalação de pontos de coleta em 12 lojas.' },
    { name: 'Otimização de Rotas LogiFast',       client: 'LogiFast Transportes',  team: 'operational',    status: 'active',    progress: 55, start_date: '2026-03-15', end_date: '2026-08-30', description: 'Reestruturação das rotas de entrega com rastreamento em tempo real.' },
    { name: 'Monitoramento de Safra AgroVerde',   client: 'AgroVerde Cooperativa', team: 'field',          status: 'active',    progress: 30, start_date: '2026-05-01', end_date: '2026-11-30', description: 'Instalação de sensores de solo e monitoramento remoto das lavouras.' },
    { name: 'Compliance Construtora Horizonte',   client: 'Construtora Horizonte', team: 'administrative', status: 'planning',  progress: 0,  start_date: '2026-07-01', end_date: '2026-09-30', description: 'Revisão de contratos e adequação a normas regulatórias.' },
    { name: 'App de Acompanhamento de Obras',     client: 'Construtora Horizonte', team: 'product',        status: 'planning',  progress: 5,  start_date: '2026-07-15', end_date: '2027-01-31', description: 'App mobile para acompanhamento de progresso de obras.' },
    { name: 'Reestruturação Financeira Interna',  client: null,                    team: 'administrative', status: 'active',    progress: 45, start_date: '2026-04-01', end_date: '2026-10-31', description: 'Revisão de processos financeiros e centralização de relatórios.' },
    { name: 'Dashboard de Indicadores v2',        client: null,                    team: 'product',        status: 'active',    progress: 60, start_date: '2026-02-01', end_date: '2026-08-15', description: 'Nova versão do painel analítico com métricas por equipe.' },
  ];

  const projIds = [];
  for (const p of projectsData) {
    const ex = await db.execute({ sql: 'SELECT id FROM projects WHERE name=?', args: [p.name] });
    if (ex.rows.length) { projIds.push(Number(ex.rows[0].id)); continue; }
    const r = await db.execute({
      sql: 'INSERT INTO projects (name,client_id,team,status,progress,start_date,end_date,description) VALUES (?,?,?,?,?,?,?,?)',
      args: [p.name, clientIds[p.client] || null, p.team, p.status, p.progress, p.start_date, p.end_date, p.description]
    });
    projIds.push(Number(r.lastInsertRowid));
  }

  // ── Tasks (25 tasks, rich distribution) ───────────────
  const tasksData = [
    // TechVision – Infraestrutura de Rede
    { title: 'Instalação de switches – Andar 2',        description: 'Configurar 8 switches gerenciáveis HP Aruba com VLANs definidas.',       objective: 'Segmentar a rede por departamento e garantir QoS.',      status: 'done',        priority: 'high',   assigned: field[0], project: projIds[0], location: 'TechVision – Andar 2',    due: '2026-05-20', creator: coords[0] },
    { title: 'Passagem de cabeamento Cat6',              description: 'Cabeamento estruturado para 40 novos pontos de rede.',                    objective: 'Cobrir todos os postos de trabalho do andar 1.',         status: 'done',        priority: 'high',   assigned: field[1], project: projIds[0], location: 'TechVision – Andar 1',    due: '2026-05-15', creator: coords[0] },
    { title: 'Configuração de firewall perimetral',      description: 'Setup FortiGate 200F com regras de segurança, IPS e VPN site-to-site.',  objective: 'Proteção perimetral com zero-trust network.',            status: 'in_progress', priority: 'high',   assigned: field[0], project: projIds[0], location: 'TechVision – Sala NOC',   due: '2026-06-25', creator: coords[0] },
    { title: 'Teste de carga Wi-Fi – Auditório',         description: 'Simular 200 dispositivos simultâneos por AP durante evento.',            objective: 'Garantir estabilidade para conferências de grande porte.',status: 'pending',     priority: 'medium', assigned: field[2], project: projIds[0], location: 'TechVision – Auditório',  due: '2026-07-05', creator: coords[0] },
    { title: 'Documentação da topologia de rede',        description: 'Desenhar diagrama lógico e físico completo da infraestrutura.',          objective: 'Facilitar manutenções futuras e onboarding da equipe.',  status: 'pending',     priority: 'low',    assigned: field[1], project: projIds[0], location: 'Remoto',                  due: '2026-07-15', creator: coords[0] },

    // EnergyBR – Subestação
    { title: 'Inspeção transformador T-01',              description: 'Verificar temperatura, vibração e nível de óleo do transformador principal.', objective: 'Prevenir falha catastrófica e garantir continuidade.',  status: 'done',        priority: 'high',   assigned: field[3], project: projIds[1], location: 'EnergyBR – Unidade SP',  due: '2026-05-30', creator: coords[1] },
    { title: 'Substituição de disjuntores B3/B4',        description: 'Trocar disjuntores de 400A com desligamento total da faixa.',             objective: 'Eliminar risco de arco elétrico nos painéis B3 e B4.',  status: 'in_progress', priority: 'high',   assigned: field[3], project: projIds[1], location: 'EnergyBR – Unidade SP',  due: '2026-06-28', creator: coords[1] },
    { title: 'Inspeção termográfica cabos BT',           description: 'Identificar pontos de aquecimento anormal em cabos de baixa tensão.',     objective: 'Mapa térmico para planejamento de manutenção corretiva.',status: 'pending',     priority: 'medium', assigned: field[2], project: projIds[1], location: 'EnergyBR – Unidade RJ',  due: '2026-07-15', creator: coords[1] },
    { title: 'Calibração de relés de proteção',          description: 'Ajustar curvas de disparo dos relés conforme norma ABNT NBR 5410.',      objective: 'Conformidade normativa e resposta correta a faltas.',    status: 'pending',     priority: 'medium', assigned: field[4], project: projIds[1], location: 'EnergyBR – Unidade MG',  due: '2026-07-25', creator: coords[1] },

    // Saúde Total – ERP
    { title: 'Migração base de dados hospitalar',        description: 'Transferir 2,4 M de registros para novo ERP com validação de integridade.',objective: 'Zero perda de dados e consistência referencial.',       status: 'done',        priority: 'high',   assigned: field[0], project: projIds[2], location: 'Remoto',                  due: '2026-04-30', creator: coords[0] },
    { title: 'Treinamento equipe administrativa',         description: 'Capacitar 32 funcionários no uso diário do novo sistema ERP.',           objective: '100% da equipe apta antes do go-live.',                 status: 'in_progress', priority: 'medium', assigned: field[1], project: projIds[2], location: 'Saúde Total – Sede',     due: '2026-06-20', creator: coords[0] },
    { title: 'Configuração módulo de faturamento',       description: 'Parametrizar regras fiscais, TISS e integração com planos de saúde.',    objective: 'Faturamento automático a partir de 01/07.',              status: 'in_progress', priority: 'high',   assigned: field[2], project: projIds[2], location: 'Remoto',                  due: '2026-06-28', creator: coords[0] },

    // EduFácil – App
    { title: 'Levantamento de requisitos App',           description: 'Entrevistas com 15 stakeholders e documentação de user stories.',        objective: 'Backlog priorizado com critérios de aceitação.',        status: 'done',        priority: 'medium', assigned: field[1], project: projIds[3], location: 'Remoto',                  due: '2026-06-10', creator: coords[1] },
    { title: 'Prototipação UI/UX mobile',                description: 'Wireframes e protótipo navegável no Figma com 24 telas.',                objective: 'Aprovação do cliente antes do desenvolvimento.',        status: 'in_progress', priority: 'medium', assigned: field[2], project: projIds[3], location: 'Remoto',                  due: '2026-06-30', creator: coords[1] },
    { title: 'Setup ambiente de desenvolvimento',        description: 'Configurar repositório, pipelines CI/CD, ambientes staging e produção.', objective: 'Time pronto para iniciar sprints sem bloqueios.',       status: 'pending',     priority: 'medium', assigned: field[0], project: projIds[3], location: 'Remoto',                  due: '2026-07-07', creator: coords[1] },

    // RetailMax – Coletores
    { title: 'Instalação coletores – Loja Centro',       description: 'Instalar e configurar 3 coletores de dados com leitor de código de barras.',objective: 'Inventário automatizado na loja Centro.',             status: 'pending',     priority: 'low',    assigned: field[3], project: projIds[5], location: 'RetailMax – Loja Centro', due: '2026-07-20', creator: coords[0] },
    { title: 'Instalação coletores – Loja Norte',        description: 'Instalar 3 coletores com integração ao sistema de estoque.',             objective: 'Inventário automatizado na filial Norte.',              status: 'pending',     priority: 'low',    assigned: field[4], project: projIds[5], location: 'RetailMax – Loja Norte',  due: '2026-07-28', creator: coords[0] },

    // LogiFast – Otimização de Rotas
    { title: 'Mapeamento de rotas atuais',               description: 'Auditar todas as 47 rotas de entrega com dados de GPS histórico.',       objective: 'Baseline para comparar otimização.',                    status: 'done',        priority: 'medium', assigned: field[2], project: projIds[6], location: 'LogiFast – Sede',        due: '2026-05-15', creator: coords[0] },
    { title: 'Implantação sistema de rastreamento',      description: 'Instalar dispositivos de rastreamento em 28 veículos da frota.',         objective: 'Visibilidade em tempo real para central de operações.', status: 'in_progress', priority: 'high',   assigned: field[3], project: projIds[6], location: 'LogiFast – Garagem',     due: '2026-06-30', creator: coords[0] },
    { title: 'Treinamento motoristas – App de Rota',     description: 'Capacitar 28 motoristas no uso do app de otimização de rota.',          objective: 'Reduzir km rodado em 15% no primeiro trimestre.',       status: 'pending',     priority: 'medium', assigned: field[1], project: projIds[6], location: 'LogiFast – Sede',        due: '2026-07-10', creator: coords[0] },

    // AgroVerde – Monitoramento
    { title: 'Instalação sensores de umidade – Lote A', description: 'Instalar 12 sensores de umidade e temperatura do solo nas lavouras.',   objective: 'Dados em tempo real para irrigação inteligente.',       status: 'in_progress', priority: 'high',   assigned: field[4], project: projIds[7], location: 'AgroVerde – Fazenda Lote A',due: '2026-06-25', creator: coords[1] },
    { title: 'Configuração dashboard agronômico',        description: 'Setup do painel de métricas com alertas automáticos por e-mail.',        objective: 'Agrônomo recebe alertas antes de falha crítica.',       status: 'pending',     priority: 'medium', assigned: field[2], project: projIds[7], location: 'Remoto',                  due: '2026-07-20', creator: coords[1] },

    // Dashboard interno
    { title: 'Integração API métricas equipe',           description: 'Conectar dashboard a APIs de tarefas, ocorrências e projetos.',          objective: 'Métricas atualizadas em tempo real sem intervenção manual.', status: 'in_progress', priority: 'high', assigned: field[0], project: projIds[11], location: 'Remoto', due: '2026-06-28', creator: coords[0] },
    { title: 'Relatório de performance – Q2',            description: 'Consolidar métricas de entrega, SLA e satisfação do cliente no Q2.',    objective: 'Apresentação ao board em 15/07.',                       status: 'pending',     priority: 'medium', assigned: field[1], project: projIds[10], location: 'Remoto', due: '2026-07-10', creator: coords[1] },
    { title: 'Revisão de processos de RH',               description: 'Mapear e propor melhorias nos processos de onboarding e offboarding.',  objective: 'Reduzir tempo de onboarding de 15 para 7 dias.',        status: 'pending',     priority: 'low',    assigned: field[2], project: projIds[10], location: 'Sede', due: '2026-07-30', creator: coords[1] },
  ];

  for (const t of tasksData) {
    const ex = await db.execute({ sql: 'SELECT id FROM tasks WHERE title=?', args: [t.title] });
    if (!ex.rows.length) {
      await db.execute({
        sql: 'INSERT INTO tasks (title,description,objective,status,priority,assigned_to,project_id,location,due_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
        args: [t.title, t.description, t.objective || null, t.status, t.priority, t.assigned?.id || null, t.project, t.location, t.due, t.creator?.id || null]
      });
    }
  }

  // ── Occurrences (12, varied statuses) ────────────────
  const taskRows = await db.execute('SELECT id, title FROM tasks LIMIT 25');
  const tMap = {};
  taskRows.rows.forEach(r => { tMap[r.title] = Number(r.id); });

  const occsData = [
    { task: 'Configuração de firewall perimetral',   user: field[0], description: 'Acesso ao rack principal bloqueado por obra no teto. Reprogramando para quinta-feira após conclusão da reforma.',             status: 'open' },
    { task: 'Substituição de disjuntores B3/B4',     user: field[3], description: 'Disjuntor B3 apresentou faísca durante substituição. Serviço interrompido, equipe de segurança acionada imediatamente.',      status: 'in_progress' },
    { task: 'Inspeção transformador T-01',           user: field[3], description: 'Temperatura do transformador acima do limite (87°C). Solicitado desligamento preventivo para inspeção detalhada.',            status: 'resolved' },
    { task: 'Migração base de dados hospitalar',     user: field[0], description: 'Migração concluída com sucesso. Todos os 2,4 M de registros validados. Backup confirmado em 2 sites redundantes.',            status: 'resolved' },
    { task: 'Instalação de switches – Andar 2',      user: field[0], description: 'Dois switches chegaram com portas danificadas (portas 4 e 7). Solicitada reposição ao fornecedor. ETA: 3 dias úteis.',        status: 'resolved' },
    { task: 'Implantação sistema de rastreamento',   user: field[3], description: 'Dispositivo de rastreamento do veículo VW-0312 com sinal intermitente. Verificando antena e firmware. Aguardando suporte.',    status: 'open' },
    { task: 'Instalação sensores de umidade – Lote A', user: field[4], description: 'Sensor S-07 com leitura incorreta (umidade 0% em solo úmido). Enviado para calibração. Instalação temporária de reserva.',  status: 'in_progress' },
    { task: 'Configuração módulo de faturamento',   user: field[2], description: 'Integração com plano de saúde Bradesco retornando erro 422 na validação de guias. Aberto chamado com a operadora.',            status: 'in_progress' },
    { task: 'Treinamento equipe administrativa',     user: field[1], description: 'Sala de treinamento sem projetor disponível na data agendada. Turma reagendada para a semana seguinte sem prejuízo ao prazo.', status: 'resolved' },
    { task: 'Mapeamento de rotas atuais',            user: field[2], description: 'Dados de GPS de 8 veículos corrompidos no período de março. Solicitados relatórios manuais junto aos motoristas responsáveis.',status: 'resolved' },
    { task: 'Prototipação UI/UX mobile',             user: field[2], description: 'Cliente solicitou inclusão de fluxo de gamificação não previsto no escopo inicial. Impacto de +5 dias na entrega estimada.',   status: 'open' },
    { task: 'Integração API métricas equipe',        user: field[0], description: 'API de projetos retornando timeout em queries com mais de 500 registros. Implementando paginação e cache para resolver.',       status: 'in_progress' },
  ];

  for (const o of occsData) {
    const taskId = tMap[o.task];
    if (!taskId) continue;
    const ex = await db.execute({ sql: 'SELECT id FROM occurrences WHERE task_id=? AND description=?', args: [taskId, o.description] });
    if (!ex.rows.length) {
      await db.execute({
        sql: 'INSERT INTO occurrences (task_id, user_id, description, status) VALUES (?,?,?,?)',
        args: [taskId, o.user.id, o.description, o.status || 'open']
      });
    }
  }
}

// ── Standalone runner ──────────────────────────────────
if (require.main === module) {
  const { db, initDb } = require('./db');
  initDb().then(() => seed(db)).then(() => {
    console.log('✅ Seed concluído! Login: hannya@fieldsync.io / 123456');
    process.exit(0);
  }).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { seed };
