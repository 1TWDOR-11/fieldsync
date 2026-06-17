const router = require('express').Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { task_id } = req.query;
  const args = task_id ? [task_id] : [];
  const where = task_id ? ' WHERE o.task_id = ?' : '';
  const { rows } = await db.execute({
    sql: `SELECT o.*, u.name as user_name, t.title as task_title, a.name as assigned_name
          FROM occurrences o
          LEFT JOIN users u ON o.user_id = u.id
          LEFT JOIN tasks t ON o.task_id = t.id
          LEFT JOIN users a ON o.assigned_to = a.id${where}
          ORDER BY o.created_at DESC`,
    args
  });
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.execute({
    sql: `SELECT o.*, u.name as user_name, t.title as task_title, a.name as assigned_name
          FROM occurrences o
          LEFT JOIN users u ON o.user_id = u.id
          LEFT JOIN tasks t ON o.task_id = t.id
          LEFT JOIN users a ON o.assigned_to = a.id
          WHERE o.id = ?`,
    args: [req.params.id]
  });
  if (!rows.length) return res.status(404).json({ error: 'Ocorrência não encontrada' });
  res.json(rows[0]);
});

router.get('/:id/comments', async (req, res) => {
  const { rows } = await db.execute({
    sql: `SELECT c.*, u.name as user_name
          FROM occurrence_comments c LEFT JOIN users u ON u.id = c.user_id
          WHERE c.occurrence_id = ? ORDER BY c.created_at ASC`,
    args: [req.params.id]
  });
  res.json(rows);
});

router.post('/:id/comments', async (req, res) => {
  const { comment } = req.body;
  if (!comment?.trim()) return res.status(400).json({ error: 'Comentário obrigatório' });
  const r = await db.execute({
    sql: 'INSERT INTO occurrence_comments (occurrence_id, user_id, comment) VALUES (?,?,?)',
    args: [req.params.id, req.user.id, comment.trim()]
  });
  res.json({ id: Number(r.lastInsertRowid) });
});

router.post('/', upload.single('image'), async (req, res) => {
  const { task_id, description } = req.body;
  if (!description) return res.status(400).json({ error: 'Descrição obrigatória' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const result = await db.execute({
    sql: 'INSERT INTO occurrences (task_id, user_id, description, image_url) VALUES (?, ?, ?, ?)',
    args: [task_id || null, req.user.id, description, image_url]
  });
  res.json({ id: Number(result.lastInsertRowid), task_id, description, image_url });
});

router.patch('/:id', async (req, res) => {
  const { status, assigned_to } = req.body;
  const fields = [];
  const args = [];
  if (status !== undefined) {
    if (!['open', 'in_progress', 'resolved'].includes(status)) return res.status(400).json({ error: 'Status inválido' });
    fields.push('status=?'); args.push(status);
  }
  if (assigned_to !== undefined) { fields.push('assigned_to=?'); args.push(assigned_to || null); }
  if (!fields.length) return res.status(400).json({ error: 'Nada para atualizar' });
  args.push(req.params.id);
  await db.execute({ sql: `UPDATE occurrences SET ${fields.join(', ')} WHERE id=?`, args });
  res.json({ success: true });
});

module.exports = router;
