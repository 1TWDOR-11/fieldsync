# ⚡ FieldSync — Plataforma de Gestão para Equipes em Campo

Plataforma integrada composta por **app mobile** (React Native / Expo), **dashboard web** (React) e **backend API REST** (Node.js + Express + SQLite).

## Estrutura do Repositório

```
fieldsync/
├── backend/   → API REST (Node.js + Express + SQLite)
├── web/       → Dashboard Web (React + Vite)
└── mobile/    → App Mobile (React Native + Expo)
```

## Funcionalidades

- Autenticação JWT (coordenador e técnico de campo)
- Criação, atribuição e acompanhamento de tarefas
- Atualização de status em tempo real (pendente → em andamento → concluído)
- Registro de ocorrências com foto (mobile e web)
- Dashboard com estatísticas e histórico

## Como rodar localmente

### Backend
```bash
cd backend
npm install
npm run dev   # porta 3001
```

### Web
```bash
cd web
npm install
npm run dev   # porta 5173
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Deploy

| Serviço | URL |
|---------|-----|
| API     | https://fieldsync-api.onrender.com |
| Web     | https://fieldsync.vercel.app |
| Mobile  | Expo Go — `exp://...` |

## Variáveis de Ambiente

**web/.env**
```
VITE_API_URL=https://fieldsync-api.onrender.com/api
```

**mobile/.env**
```
EXPO_PUBLIC_API_URL=https://fieldsync-api.onrender.com/api
```

## Aluno

**Hannya Silva Cavalcante** — RM560954  
FIAP — Global Solution 2025
