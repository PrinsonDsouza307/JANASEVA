# JANASEVA Shared Database Architecture & Schema Specification

**Authoritative Backend:** Firebase (Cloud Firestore, Firebase Authentication, Cloud Storage, Cloud Functions).
Supabase initialization remains disabled; legacy SQL schemas are reference documentation only.

---

## 1. Unified Client-Backend Architecture

Both the Web Application and the Hosted-Origin Android Client communicate with ONE shared backend service layer:
- **Authority:** Cloud Firestore rules (`firestore.rules`) and Firebase Storage rules (`storage.rules`) provide server-side policy enforcement.
- **Client Configuration Contract:** `js/firebase-config.js` provides centralized project endpoints.
- **Shared Authentication:** Firebase Authentication (Email/Password & Custom Claims) provides single identity across web and mobile.

---

## 2. Authoritative Database Schema Model

### 2.1 Collection: `users`
- **Document ID:** `{userId}` (strictly matches Firebase Auth `request.auth.uid`).
- **Fields:**
  - `uid` (string, immutable): Firebase Auth UID.
  - `name` (string, 1-100 chars): Full name.
  - `email` (string, 5-100 chars, immutable by owner): Verified email.
  - `mobile` (string, 10-20 chars): Contact number.
  - `role` (string, immutable by owner): `'citizen' | 'receiver' | 'admin'`.
  - `panchayatId` (string, optional, immutable by owner): Gram Panchayat ID (required for receivers).
  - `panchayatName` (string, optional): Display name of Panchayat.
  - `preferredLang` (string, optional): `'kn' | 'en' | 'hi'`.
  - `uiPreferences` (map, optional): User interface settings.
  - `createdAt` (timestamp / ISO string, immutable): Creation timestamp.
  - `updatedAt` (timestamp / ISO string): Last modification timestamp.

### 2.2 Subcollection: `users/{userId}/chatSessions`
- **Document ID:** `{sessionId}` (1-80 chars).
- **Access:** Strictly owner-only (`request.auth.uid == userId`).
- **Fields:** `sessionId`, `userId`, `title`, `language`, `messages` (array up to 100), `conversationStatus`, `createdAt`, `updatedAt`.

### 2.3 Collection: `panchayats`
- **Document ID:** `{panchayatId}` (e.g. `gp-001`).
- **Access:** Public read; Admin write.
- **Fields:** `panchayatId`, `name`, `district`, `block`, `receiverEmail`, `contactNumber`, `president`, `secretary`, `officeAddress`, `createdAt`.

### 2.4 Collection: `officers`
- **Document ID:** `{officerId}`.
- **Access:** Public read; Admin write.
- **Fields:** `name`, `designation`, `panchayatId`, `email`, `phone`.

### 2.5 Collection: `complaints`
- **Document ID:** `{complaintId}` (e.g. `JAN-<sha256>`).
- **Access:**
  - Citizen: Read/create own complaints; update feedback, reopen, or soft-delete.
  - Receiver: Read complaints in assigned Panchayat (`panchayatId == receiverPanchayatId`); update status, notes, assignment.
  - Admin: Full read/write/delete.
- **Fields:**
  - `complaintId` (string, immutable): Primary unique key.
  - `userId` (string, immutable): Citizen Firebase Auth UID.
  - `citizenName` (string): Full name of submitter.
  - `citizenEmail` (string): Contact email.
  - `panchayatId` (string): Target Gram Panchayat ID.
  - `panchayatName` (string, optional): Denormalized display name.
  - `category` (string): Grievance category (e.g. Water Supply, Road, Sanitation).
  - `description` (string, 5-2000 chars): Detailed description.
  - `photoURL` (string, optional, max 1000 chars): HTTPS URL pointing to Cloud Storage evidence.
  - `supportingDocuments` (array of strings): Storage URLs for uploaded documents.
  - `status` (string): Current status (`'Submitted' | 'In Progress' | 'Under Review' | 'Action Taken' | 'Resolved' | 'Rejected' | 'Reopened'`).
  - `aiPriority` (string, optional): Urgency classification (`'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'`).
  - `assignedReceiverId` (string, optional): Assigned official ID.
  - `officialResponse` (string, optional): Public official remark.
  - `rejectionReason` (string, optional): Explanation if rejected.
  - `reopenReason` (string, optional): Citizen explanation if reopened.
  - `createdAt` (timestamp / ISO string, immutable): Submission time.
  - `updatedAt` (timestamp / ISO string): Last transition time.

### 2.6 Subcollection & Root: `statusHistory` / `complaints/{complaintId}/statusHistory`
- **Document ID:** `{historyId}`.
- **Access:** Append-only audit ledger by authorized actors (`updatedBy == auth.uid` for citizens, or assigned receiver/admin).
- **Fields:** `historyId`, `complaintId`, `oldStatus`, `newStatus`, `updatedBy` (UID), `timestamp`, `officialNote`.

### 2.7 Subcollection & Root: `complaintMessages` / `complaints/{complaintId}/messages`
- **Document ID:** `{messageId}`.
- **Access:** Creator, assigned receiver, admin.
- **Fields:** `messageId`, `complaintId`, `senderId` (UID), `senderName`, `senderEmail`, `senderRole`, `message`, `visibility` (`'public' | 'internal'`), `createdAt`.

### 2.8 Collection: `notifications`
- **Document ID:** `{notifId}`.
- **Access:** Recipient owner (`userId == auth.uid`) or admin read; Receiver/Admin create.
- **Fields:** `id`, `eventId`, `userId`, `recipientRole`, `title`, `message`, `category`, `priority`, `targetUrl`, `isRead`, `readAt`, `createdAt`.

### 2.9 Collection: `receiverSettings`
- **Document ID:** `global` (and `{panchayatId}`).
- **Access:** Admin write; Receiver/Admin read.
- **Fields:** `receiverEmail`, `emailNotificationsEnabled`, `whatsappNotificationsEnabled`, `updatedAt`, `updatedBy`.

### 2.10 Collections: `adminAuditLogs`, `emergencyResetAuditLogs`
- **Document ID:** `{logId}`.
- **Access:** Admin-only immutable audit trail.
- **Fields:** `logId`, `actorUid`, `actorEmail`, `action`, `targetCollection`, `details`, `timestamp`.

---

## 3. Object Storage Hierarchy (`storage.rules`)

File bytes are stored in Google Cloud Storage via Firebase Storage; only HTTPS URLs/references are persisted in Firestore.
1. **Complaints Evidence:**
   `complaints/{panchayatId}/{userId}/{fileName}`
   - Size <= 5MB.
   - MIME: `image/jpeg`, `image/png`, `image/webp`.
   - Access: Submitting citizen, assigned panchayat receiver, admin.
2. **Supporting Documents:**
   `documents/{userId}/{allPaths=**}`
   - Size <= 10MB.
   - MIME: `image/*`, `application/pdf`.
   - Access: Submitting citizen, admin.

---

## 4. Database Composite Indexes (`firestore.indexes.json`)

The following composite indexes are configured in `firestore.indexes.json` and registered in `firebase.json`:
- `complaints`: `panchayatId` ASC + `createdAt` DESC
- `complaints`: `userId` ASC + `createdAt` DESC
- `complaints`: `panchayatId` ASC + `status` ASC + `createdAt` DESC
- `complaints`: `citizenEmail` ASC + `createdAt` DESC
- `complaint_updates`: `panchayatId` ASC + `timestamp` DESC
- `complaint_updates`: `authorUid` ASC + `timestamp` DESC
- `chatSessions`: `userId` ASC + `updatedAt` DESC
- `notifications`: `userId` ASC + `createdAt` DESC
- `notifications`: `recipientRole` ASC + `createdAt` DESC
- `knowledge_documents`: `status` ASC + `enabled` ASC + `quarantined` ASC + `deleted` ASC + `uploadedAt` DESC
- `knowledge_chunks`: `docId` ASC + `chunkIndex` ASC

---

## 5. Non-Destructive Database Migration Plan & Tooling

To migrate legacy client records safely to Cloud Firestore, use `scripts/migrate_database.cjs`:
1. **Export:**
   ```bash
   node scripts/migrate_database.cjs --export backup_pre_migration.json
   ```
   Captures all current records without modifying existing state.
2. **ID Mapping & Duplicate Detection (Dry Run):**
   ```bash
   node scripts/migrate_database.cjs --dry-run backup_pre_migration.json
   ```
   - Maps legacy IDs to deterministic SHA-256 stable IDs matching client offline queues.
   - Identifies duplicates by comparing citizen email, panchayat, category, and description hash.
   - Validates all records against `firestore.rules` constraints.
   - Produces a comprehensive validation report. Zero live database writes.
3. **Rollback:**
   ```bash
   node scripts/migrate_database.cjs --rollback backup_pre_migration.json
   ```
   Restores state if any issue is discovered.
