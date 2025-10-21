# 4AS - Application de Réservation de Tutorat

Plateforme de réservation de séances de tutorat en ligne avec paiement Stripe, gestion de disponibilités et tableaux de bord pour étudiants, tuteurs et administrateurs.

## Fonctionnalités

- **Authentification**: Email/mot de passe + OAuth (Google/Microsoft) via Supabase
- **Réservation de cours**: Sélection de créneaux avec durées variables (60/90/120 min)
- **Système de panier**: Ajout de plusieurs séances avec réservation temporaire (holds de 15 minutes)
- **Paiement Stripe**: Checkout sécurisé en CAD avec collecte d'adresse
- **Gestion des coupons**: Rabais en pourcentage ou montant fixe
- **Tableaux de bord**:
  - Étudiant: Rendez-vous, réservations, historique
  - Tuteur: Disponibilités, rendez-vous, statistiques
  - Admin: CRUD cours/tuteurs, assignations, coupons
- **Webhooks Make.com**: Notifications pour inscriptions et réservations
- **Interface en français canadien**: Toute l'UI en fr-CA

## Stack Technique

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Next.js Server Actions, Netlify Functions
- **Base de données**: Supabase (PostgreSQL) avec Prisma ORM
- **Authentification**: Supabase Auth
- **Paiements**: Stripe Checkout
- **Déploiement**: Netlify

## Prérequis

- Node.js 18+
- Compte Supabase
- Compte Stripe
- (Optionnel) Compte Make.com pour les webhooks

## Installation

### 1. Cloner le projet

```bash
cd "votre-dossier"
npm install
```

### 2. Configuration de l'environnement

Créez un fichier `.env.local` à la racine du projet:

```env
# Database (Supabase Connection Pooler)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true&connection_limit=1"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Make.com Webhooks
MAKE_SIGNUP_WEBHOOK_URL="https://hook.make.com/..."
MAKE_BOOKING_WEBHOOK_URL="https://hook.make.com/..."

# Encryption (générez une clé aléatoire de 32+ caractères)
ENCRYPTION_SECRET="votre-cle-secrete-tres-longue-et-aleatoire"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Configuration Supabase

1. Créez un nouveau projet Supabase
2. Copiez l'URL et les clés API
3. Dans Supabase SQL Editor, exécutez:

```bash
npx prisma db push
```

4. Ensuite, appliquez les politiques RLS:

```bash
# Dans Supabase SQL Editor, exécutez le contenu de:
# prisma/rls-policies.sql
```

### 4. Configuration Stripe

1. Créez un compte Stripe (mode test)
2. Copiez vos clés API
3. Configurez le webhook:
   - URL: `https://votre-domaine.netlify.app/api/webhooks/stripe`
   - Événements: `checkout.session.completed`, `payment_intent.succeeded`
   - Copiez le secret du webhook

### 5. Générer le client Prisma

```bash
npm run prisma:generate
```

### 6. Lancer en développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## Structure du projet

```
├── app/                      # Pages Next.js (App Router)
│   ├── api/                 # Routes API et webhooks
│   ├── auth/                # Callback OAuth
│   ├── connexion/           # Page de connexion
│   ├── inscription/         # Page d'inscription
│   ├── cours/               # Liste et détail des cours
│   ├── panier/              # Panier d'achat
│   ├── paiement/            # Pages succès/annulation
│   └── tableau-de-bord/     # Dashboards
├── components/              # Composants React
│   ├── auth/               # Formulaires d'authentification
│   ├── booking/            # Calendrier de réservation
│   ├── cart/               # Panier
│   ├── dashboard/          # Tableaux de bord
│   ├── layout/             # Navigation
│   └── ui/                 # Composants UI (shadcn)
├── lib/                     # Utilitaires et logique métier
│   ├── actions/            # Server Actions Next.js
│   ├── slots/              # Moteur de génération de créneaux
│   ├── webhooks/           # Gestionnaires webhooks
│   ├── i18n/               # Traductions fr-CA
│   ├── prisma.ts           # Client Prisma
│   ├── stripe.ts           # Client Stripe
│   └── supabase/           # Clients Supabase
├── netlify/                # Fonctions Netlify
│   └── functions/          # Scheduled functions
├── prisma/                 # Schéma et migrations
└── public/                 # Assets statiques
```

## Schéma de base de données

Principales tables:
- `users`: Utilisateurs (miroir de Supabase Auth)
- `courses`: Cours disponibles
- `tutors`: Profils tuteurs
- `tutor_courses`: Assignations tuteur-cours
- `availability_rules`: Disponibilités récurrentes
- `availability_exceptions`: Exceptions ponctuelles
- `time_off`: Congés des tuteurs
- `carts` / `cart_items`: Paniers d'achat
- `slot_holds`: Réservations temporaires (15 min)
- `orders` / `order_items`: Commandes
- `appointments`: Rendez-vous confirmés
- `coupons`: Codes promotionnels
- `webhook_events`: Journal des webhooks

## Déploiement sur Netlify

### 1. Connecter le repository

1. Connectez votre repo GitHub/GitLab à Netlify
2. Configurez les variables d'environnement (identiques à `.env.local`)

### 2. Configuration du build

Le fichier `netlify.toml` est déjà configuré:
- Build command: `npm run build`
- Publish directory: `.next`

### 3. Webhooks Stripe

Mettez à jour l'URL du webhook Stripe pour pointer vers:
```
https://votre-site.netlify.app/api/webhooks/stripe
```

### 4. Fonction de nettoyage

La fonction `cleanup-holds` s'exécute automatiquement chaque minute pour supprimer les réservations expirées.

## Développement

### Server Actions

Les actions serveur sont dans `lib/actions/`:
- `auth.ts`: Authentification et profils
- `cart.ts`: Gestion du panier et holds
- `checkout.ts`: Création de sessions Stripe
- `appointments.ts`: Annulation de rendez-vous
- `slots.ts`: Récupération des créneaux disponibles

### Moteur de créneaux

Le moteur de génération de créneaux (`lib/slots/generator.ts`) gère:
1. Récupération des disponibilités des tuteurs
2. Application des exceptions et congés
3. Soustraction des rendez-vous et holds existants
4. Respect des contraintes (lead time, durée max)
5. Union des disponibilités par cours
6. Priorisation des tuteurs

### Tests

Pour tester le système de réservation:
1. Créez des cours et tuteurs via l'interface admin
2. Assignez des tuteurs aux cours
3. Définissez les disponibilités des tuteurs
4. Testez le flux de réservation complet

## Roadmap V2

Fonctionnalités prévues:
- [ ] Intégration calendriers externes (Google/Microsoft)
- [ ] Téléchargement ICS des rendez-vous
- [ ] Messagerie tuteur-étudiant
- [ ] Replanification de rendez-vous
- [ ] Statistiques et rapports avancés
- [ ] Notifications par email
- [ ] Mode sombre complet

## Support

Pour toute question ou problème:
- Vérifiez la console du navigateur et les logs Netlify
- Consultez les logs Supabase pour les erreurs de base de données
- Vérifiez le dashboard Stripe pour les problèmes de paiement

## Licence

Propriétaire - Tous droits réservés

