# Guide de déploiement - 4AS Application

## Prérequis

- [ ] Compte Netlify créé
- [ ] Compte Supabase créé avec projet initialisé
- [ ] Compte Stripe créé (mode test puis production)
- [ ] (Optionnel) Compte Make.com pour webhooks
- [ ] Repository Git configuré

## Étape 1: Configuration Supabase

### 1.1 Créer le projet
1. Créer un nouveau projet Supabase
2. Noter l'URL du projet et les clés API
3. Configurer les providers OAuth:
   - Activer Google OAuth
   - Activer Microsoft OAuth
   - Configurer les redirect URLs: `https://votre-domaine.netlify.app/auth/callback`

### 1.2 Configurer la base de données
1. Dans Supabase, aller dans "Database" → "Connection Pooler"
2. Copier la connection string (mode Transaction)
3. Créer un fichier `.env.local` local avec:
   ```
   DATABASE_URL="votre-connection-string"
   ```
4. Exécuter les migrations:
   ```bash
   npx prisma db push
   ```
5. Dans Supabase SQL Editor, exécuter le contenu de `prisma/rls-policies.sql`
6. Vérifier que RLS est activé sur toutes les tables

### 1.3 Seed initial (optionnel)
```bash
npm run prisma:seed
```

## Étape 2: Configuration Stripe

### 2.1 Créer le compte
1. Créer un compte Stripe
2. Activer le mode Test
3. Noter les clés API (Publishable et Secret)

### 2.2 Configurer les webhooks
1. Aller dans "Developers" → "Webhooks"
2. Ajouter un endpoint:
   - URL: `https://votre-domaine.netlify.app/api/webhooks/stripe`
   - Événements à écouter:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
3. Noter le Webhook Secret (`whsec_...`)

### 2.3 Configuration produit
1. Dans Stripe Dashboard, vérifier que le mode de paiement "card" est activé
2. Configurer les paramètres de compte (nom, logo, etc.)

## Étape 3: Configuration Netlify

### 3.1 Connecter le repository
1. Aller sur Netlify Dashboard
2. "Add new site" → "Import an existing project"
3. Connecter votre repository Git
4. Branch: `main` (ou votre branche de production)

### 3.2 Configuration du build
1. Build command: `npm run build`
2. Publish directory: `.next`
3. Node version: `18` (dans Build environment)

### 3.3 Variables d'environnement
Aller dans "Site settings" → "Environment variables" et ajouter:

```
# Database
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_... en prod)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (ou pk_live_... en prod)
STRIPE_WEBHOOK_SECRET=whsec_...

# Make.com
MAKE_SIGNUP_WEBHOOK_URL=https://hook.make.com/...
MAKE_BOOKING_WEBHOOK_URL=https://hook.make.com/...

# Google OAuth (si utilisé)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Microsoft OAuth (si utilisé)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Encryption
ENCRYPTION_SECRET=votre-cle-secrete-tres-longue-aleatoire

# App URL
NEXT_PUBLIC_APP_URL=https://votre-domaine.netlify.app
```

### 3.4 Déployer
1. Cliquer sur "Deploy site"
2. Attendre que le build se termine
3. Vérifier que le site est accessible

## Étape 4: Configuration post-déploiement

### 4.1 Mettre à jour Stripe
1. Retourner dans Stripe → Webhooks
2. Mettre à jour l'URL du webhook avec votre domaine Netlify

### 4.2 Mettre à jour Supabase
1. Dans Supabase → Authentication → URL Configuration
2. Ajouter votre domaine Netlify aux Redirect URLs

### 4.3 Tester le flux complet
1. Créer un compte test
2. Créer des cours (en tant qu'admin)
3. Créer des tuteurs et disponibilités
4. Tester une réservation complète avec Stripe test mode
5. Vérifier les webhooks dans Stripe Dashboard

## Étape 5: Créer les premiers utilisateurs

### 5.1 Créer un compte admin
1. S'inscrire via l'interface
2. Dans Supabase → Table Editor → users
3. Trouver votre utilisateur et changer `role` à `admin`

### 5.2 Créer des tuteurs
1. Créer des comptes via l'interface
2. Dans Supabase SQL Editor:
```sql
-- Changer le rôle
UPDATE users SET role = 'tutor' WHERE email = 'tuteur@example.com';

-- Créer le profil tuteur
INSERT INTO tutors (id, display_name, bio_fr, hourly_base_rate_cad, priority, active)
SELECT id, first_name || ' ' || last_name, 'Bio du tuteur', 75.00, 1, true
FROM users WHERE email = 'tuteur@example.com';
```

### 5.3 Ajouter des disponibilités
Via interface admin ou SQL:
```sql
-- Disponibilité Lundi-Vendredi 9h-17h
INSERT INTO availability_rules (id, tutor_id, weekday, start_time, end_time)
SELECT gen_random_uuid(), id, 1, '09:00', '17:00' FROM tutors WHERE display_name = 'Nom Tuteur'
UNION ALL
SELECT gen_random_uuid(), id, 2, '09:00', '17:00' FROM tutors WHERE display_name = 'Nom Tuteur'
UNION ALL
SELECT gen_random_uuid(), id, 3, '09:00', '17:00' FROM tutors WHERE display_name = 'Nom Tuteur'
UNION ALL
SELECT gen_random_uuid(), id, 4, '09:00', '17:00' FROM tutors WHERE display_name = 'Nom Tuteur'
UNION ALL
SELECT gen_random_uuid(), id, 5, '09:00', '17:00' FROM tutors WHERE display_name = 'Nom Tuteur';
```

## Étape 6: Passage en production

### 6.1 Stripe production
1. Activer votre compte Stripe (vérification d'identité)
2. Passer en mode Live
3. Mettre à jour les clés API dans Netlify
4. Reconfigurer le webhook avec les nouvelles URLs

### 6.2 Domaine personnalisé
1. Dans Netlify → Domain settings
2. Ajouter votre domaine personnalisé
3. Configurer les DNS selon les instructions
4. Activer HTTPS (automatique avec Netlify)
5. Mettre à jour `NEXT_PUBLIC_APP_URL` dans les variables d'environnement

### 6.3 Monitoring
1. Configurer les alertes Netlify
2. Surveiller les logs de fonctions
3. Vérifier les webhooks Stripe régulièrement
4. Monitorer les erreurs dans Supabase Dashboard

## Checklist de déploiement

### Pre-déploiement
- [ ] Tests locaux passés
- [ ] Variables d'environnement documentées
- [ ] RLS policies testées
- [ ] Webhooks configurés en test
- [ ] Flux de paiement testé avec Stripe test mode

### Déploiement
- [ ] Code pushé sur Git
- [ ] Netlify build réussi
- [ ] Variables d'environnement configurées
- [ ] Domaine configuré et HTTPS actif
- [ ] Webhooks pointent vers le bon domaine

### Post-déploiement
- [ ] Compte admin créé et testé
- [ ] Au moins un cours créé
- [ ] Au moins un tuteur avec disponibilités
- [ ] Test de réservation complète
- [ ] Webhooks reçus et traités correctement
- [ ] Emails de confirmation fonctionnels (si configurés)

### Production
- [ ] Stripe en mode Live
- [ ] Clés API production configurées
- [ ] Domaine personnalisé configuré
- [ ] Monitoring activé
- [ ] Plan de backup en place
- [ ] Documentation utilisateur disponible

## Dépannage

### Build Netlify échoue
- Vérifier les variables d'environnement
- Vérifier que toutes les dépendances sont dans package.json
- Consulter les logs de build

### Webhooks Stripe ne fonctionnent pas
- Vérifier la signature du webhook
- Vérifier que l'URL est correcte
- Consulter les logs de la fonction dans Netlify
- Tester avec Stripe CLI localement

### Erreurs de base de données
- Vérifier la connection string
- Vérifier que RLS est configuré correctement
- Consulter les logs Supabase
- Vérifier les permissions des tables

### Problèmes d'authentification
- Vérifier les Redirect URLs dans Supabase
- Vérifier les clés API
- Vérifier que le middleware est configuré
- Consulter les cookies dans le navigateur

## Support et ressources

- Documentation Supabase: https://supabase.com/docs
- Documentation Stripe: https://stripe.com/docs
- Documentation Netlify: https://docs.netlify.com
- Documentation Prisma: https://www.prisma.io/docs
- Documentation Next.js: https://nextjs.org/docs

