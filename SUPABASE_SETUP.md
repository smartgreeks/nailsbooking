# Supabase Setup για Local Development

## Πρόβλημα που λύνουμε

Το project ήταν ρυθμισμένο να χρησιμοποιεί SQLite τοπικά αλλά PostgreSQL (Supabase) στην production. Αυτό προκαλούσε προβλήματα όταν οι αλλαγές που γίνονταν τοπικά δεν λειτουργούσαν στην production.

## Λύση

Τώρα το project χρησιμοποιεί Supabase PostgreSQL και τοπικά και στην production.

## Βήματα Ρύθμισης

### 1. Δημιουργία Supabase Project

1. Πηγαίνετε στο [supabase.com](https://supabase.com)
2. Δημιουργήστε νέο project
3. Σημειώστε το Project URL και τα API keys

### 2. Ρύθμιση Environment Variables

1. Αντιγράψτε το `.env.example` σε `.env`
2. Συμπληρώστε τις πραγματικές τιμές:

```bash
# Από Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Από Supabase Dashboard > Settings > Database
DATABASE_URL="postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres"
```

### 3. Database Setup

1. Πηγαίνετε στο Supabase Dashboard > SQL Editor
2. Αντιγράψτε και εκτελέστε το περιεχόμενο του `supabase_migration.sql`
3. Αυτό θα δημιουργήσει όλους τους πίνακες και sample data

### 4. Prisma Setup

```bash
# Δημιουργία Prisma client
npx prisma generate

# Sync schema με database (προαιρετικό)
npx prisma db push
```

### 5. Έλεγχος

1. Εκκινήστε την εφαρμογή: `npm run dev`
2. Πηγαίνετε στο `/admin` panel
3. Ελέγξτε ότι φαίνονται οι employees (Maria Papadopoulou, Anna Georgiou)

## Σημαντικές Σημειώσεις

- **Πλέον το local development χρησιμοποιεί την ίδια βάση με την production**
- **Όλες οι αλλαγές που κάνετε τοπικά θα επηρεάζουν την production database**
- **Για testing, δημιουργήστε ξεχωριστό Supabase project**

## Employees που υπάρχουν ήδη

Η Supabase database περιέχει ήδη:
- Maria Papadopoulou (maria@nailsalon.gr)
- Anna Georgiou (anna@nailsalon.gr)

Αυτοί οι εργαζόμενοι θα πρέπει να φαίνονται στο admin panel μετά τη σωστή ρύθμιση.