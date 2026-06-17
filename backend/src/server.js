const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/occurrences', require('./routes/occurrences'));
app.use('/api/users', require('./routes/users'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

initDb().then(() => {
  app.listen(PORT, () => console.log(`FieldSync API rodando na porta ${PORT}`));
}).catch(err => { console.error('Falha ao inicializar DB:', err); process.exit(1); });
