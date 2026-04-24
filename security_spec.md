# Security Specification - Barbaar

## 1. Data Invariants
- A **Profile** must be tied to the current user's UID and cannot be modified by others (except admins).
- **Tasks**, **Journal Entries**, **Mood Logs**, **User Challenges**, and **Notifications** are strictly private and owned by the user.
- **Resources**, **Nasasho**, and **Therapists** are public but only writable by admins.
- **Challenges** can be created by users but only modified/deleted by the creator or admin.
- **Bookings** are private to the user and accessible by admins. All booking data must include a valid UID.
- **Chat Rooms** are private between the user and the team. Messages must belong to a room the user is part of.
- **Identity Integrity**: Any `user_id` or `userId` field in a payload MUST match `request.auth.uid`.
- **Temporal Integrity**: `created_at` or `timestamp` fields must match `request.time`.

## 2. The "Dirty Dozen" Payloads (Denial Expected)

1. **Identity Spoofing**: Attempt to create a profile for another user.
   ```json
   { "id": "ATTACKER_UID", "name": "Victim", "user_id": "VICTIM_UID" }
   ```
2. **Shadow Field Injection**: Adding an `isAdmin: true` field to a profile update.
   ```json
   { "name": "Hackey", "isAdmin": true }
   ```
3. **Resource Poisoning**: Creating a task with a 1MB title.
   ```json
   { "user_id": "MY_UID", "title": "A".repeat(1000000) }
   ```
4. **Orphaned Writes**: Creating a journal entry with a fake `user_id` to link to someone else.
5. **PII Leak**: Non-admin user attempting to list ALL profiles to scrape names.
6. **State Shortcutting**: Updating a user challenge status directly to 'completed' without fulfilling tasks (via `affectedKeys` bypassing).
7. **Bypass Immutable**: Attempting to change the `created_at` date of an existing task.
8. **Invalid ID Injection**: Using a very large string or invalid characters as a document ID.
9. **Relational Sync Break**: Posting a message to a chat room the user doesn't own.
10. **Admin Escalation**: Manually setting a `role: 'admin'` field in the `profiles` collection if not protected.
11. **Spoofing Verification**: Authenticating with an unverified email that matches an admin email.
12. **Denial of Wallet**: Repeatedly calling `get()` on related docs in a list query rule (if rules are poorly designed).

## 3. Test Runner Plan
I will implement `firestore.rules.test.ts` using `@firebase/rules-unit-testing` if possible, or simulate logic checks in my own rationale. 

*(Wait, I don't have the testing library installed yet. I'll stick to writing the hardened rules first and verify them against these payloads.)*
