# Barbaar Wellness Security Specification

## Data Invariants
1. **Therapist Profile Integrity**: Only administrators (`barbaaryp@gmail.com`) can create, delete, or bulk-edit clinical therapist profiles. A therapist can only update their own profile fields.
2. **PII and Booking Isolation**: A booking record can only be viewed or modified by the client who booked it, the specific therapist assigned, or the system administrator.
3. **Secure Communications**: Message records can only be read or written by the sender client, the recipient therapist, or the administrator.
4. **Anonymous & Guest Read-Only Fallbacks**: Therapist directory profiles and content blocks must be readable by anonymous and unauthenticated users so they can browse the site before logging in.

## The "Dirty Dozen" Payloads
The following payloads describe illegal data shapes or unauthorized write attempts that must be strictly rejected by our `firestore.rules` gate:

1. **Unauthenticated Booking Injection**: A client booking injected without a valid Firebase Auth session.
2. **Booking Identity Spoofing**: An authenticated client attempting to create a booking under another user's email.
3. **Therapist Price Alteration**: A client attempting to alter a therapist's session price.
4. **Therapist Impersonation**: A client attempting to edit a therapist's specialties or description.
5. **Admin Access Escalation**: A user attempting to write to `/admins` or create an admin profile.
6. **Chat Message Tampering**: A client writing a message pretending to be the therapist.
7. **Junk ID Poisoning**: Attempting to write a booking with a 10KB junk ID string to waste resource quota.
8. **Negative Session Price**: Submitting a session booking with a negative cost value.
9. **Content Override**: A normal user attempting to alter the terms of service or privacy policy.
10. **Booking State Shortcutting**: A client attempting to force approve financial aid.
11. **Orphaned Message Creation**: Creating a message with a non-existent therapist ID.
12. **Future Timestamp Spoofing**: Clients submitting a booking with a falsified future `createdAt` value.
