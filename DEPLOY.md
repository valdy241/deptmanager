# 🚀 Guide de Déploiement — DeptManager

## Pré-requis
- Docker + Docker Compose installés
- Node.js 20+ (pour développement local)

---

## ⚡ Démarrage rapide (Docker — recommandé)

```bash
# 1. Copier les variables d'environnement
cp .env.docker .env
# ➡ MODIFIEZ les mots de passe dans .env avant de continuer

# 2. Lancer l'application + base de données
docker-compose up -d

# 3. Pousser le schéma vers la base (première fois uniquement)
docker exec deptmanager_app sh -c "DATABASE_URL=\$DATABASE_URL npm run db:push"
```

✅ L'application est disponible sur **http://localhost:3000**

> **Note :** Le premier utilisateur inscrit devient automatiquement **Super Administrateur**.

---

## 🌐 Déploiement en ligne (URL publique)

### Option 1 — Railway.app (le plus simple)
1. Créez un compte sur [railway.app](https://railway.app)
2. New Project → Deploy from GitHub → sélectionnez votre repo
3. Add Plugin → MySQL
4. Variables d'environnement à définir dans Railway :
   - `APP_SECRET` → une longue chaîne aléatoire
   - `DATABASE_URL` → copier depuis le plugin MySQL
   - `NODE_ENV` → `production`
5. Railway vous donne une URL publique automatiquement ✅

### Option 2 — Render.com
1. [render.com](https://render.com) → New Web Service
2. Connectez votre repo GitHub
3. Build Command: `npm ci && npm run build`
4. Start Command: `npm start`
5. Ajoutez une base MySQL (Add-on)
6. Définissez `APP_SECRET`, `DATABASE_URL`, `NODE_ENV=production`

### Option 3 — VPS (DigitalOcean, OVH, Hetzner...)
```bash
# Sur votre serveur
git clone <votre-repo>
cd deptmanager
cp .env.docker .env
# Modifiez .env
docker-compose up -d --build

# Première migration
docker exec deptmanager_app npm run db:push
```

Utilisez **nginx** comme reverse proxy pour HTTPS avec Let's Encrypt.

---

## 🛠 Développement local

```bash
# Installer les dépendances
npm install

# Démarrer MySQL (Docker)
docker run -d --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=deptmanager \
  -p 3306:3306 mysql:8.0

# Configurer .env
cp .env.example .env
# Modifiez DATABASE_URL=mysql://root:root@localhost:3306/deptmanager
# APP_SECRET=n_importe_quelle_chaine_longue

# Pousser le schéma
npm run db:push

# Lancer en mode développement
npm run dev
```

---

## 🔑 Rôles et permissions

| Rôle | Accès |
|------|-------|
| **super_admin** | Tout + gestion des admins et départements |
| **admin** | Utilisateurs, tâches, rendez-vous, documents de son département |
| **user** | Ses tâches, rendez-vous partagés, documents publics |

> Le 1er utilisateur inscrit = Super Administrateur automatiquement.

---

## 📋 Variables d'environnement

| Variable | Description |
|----------|-------------|
| `APP_SECRET` | Clé secrète JWT (min 32 chars, gardez-la secrète !) |
| `DATABASE_URL` | `mysql://user:pass@host:3306/deptmanager` |
| `PORT` | Port du serveur (défaut: 3000) |
| `NODE_ENV` | `production` ou `development` |
