# Database

`firestore.rules`, `firestore.indexes.json`, and `storage.rules` configure **one shared Firebase project**; they contain rules, not database data. `supabase-schema.sql` is historical/reference-only and must never be executed against live data without review and backup. No live credentials or populated database files are included.

At project root, after configuring a separate staging Firebase project and auditing roles/security rules:

```
firebase deploy --only firestore:rules,firestore:indexes,storage --project YOUR_PROJECT_ID
```

Website and Android use the same Firestore only after configuring web SDK, deploying rules and hosting, and rebuilding Android to load that HTTPS origin. The provided historical APK does not satisfy this.
