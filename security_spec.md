# Security Specification

## 1. Data Invariants
- **Identity Integrity**: All operations modifying data require the user to be a verified Admin.
- **Strict Keys**: Documents can only be created or modified with exactly the fields defined in the application's domain model (schema).
- **Type Safety**: All string fields are constrained by `.size() <= MAX` to prevent resource exhaustion attacks (Denial of Wallet).
- **Relational Sync**: All nested data requires validation. No orphan writes.
- **Terminal States**: Status fields must be updated via explicit valid transitions.

## 2. The "Dirty Dozen" Payloads
1. **Ghost Field Injection**: Adding an unmapped `isVerified: true` field. (Fails strict key matching).
2. **Type Tampering**: Sending a number for a string field.
3. **ID Poisoning**: Sending an overly long document ID (1.5KB of junk).
4. **Denial of Wallet String**: Sending a 500KB string in a `description` field.
5. **Array Overload**: Sending 10,000 items in the `series` array.
6. **Negative Value Attack**: Setting `cost` or `price` to a negative value.
7. **Bypass Role Constraint**: Attempting to read/write without an admin document.
8. **Unverified Email Attack**: Logging in with an unverified email.
9. **Blanket Query Scraping**: Attempting an unbounded `list` query without admin privileges.
10. **State Corruption**: Setting a `sale` status to a random string like `Hacked`.
11. **Timestamp Spoofing**: Setting `date` to a future string violating temporal expectations.
12. **PII Scraping**: Attempting to read `clients` data without being an Admin.

## 3. The Test Runner
```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-mundo-outlet",
    firestore: { rules: readFileSync("firestore.rules", "utf8") }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules: Dirty Dozen Red Team Tests', () => {
  it('1. Ghost Field Injection: Fails to create product with extra fields', async () => {
    const db = testEnv.authenticatedContext('admin1', { email_verified: true }).firestore();
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
      await context.firestore().doc('admins/admin1').set({ role: 'admin' });
    });
    
    await assertFails(db.collection('products').doc('PROD1').set({
      sku: 'PROD1', category: 'Heladera', brand: 'LG', model: 'A1', cost: 100, 
      wholesalePrice: 150, retailPrice: 200, stock: 10, series: [], status: 'Disponible',
      hackField: 'ghost' // GHOST FIELD
    }));
  });

  it('2. ID Poisoning: Fails on invalid ID', async () => {
    const db = testEnv.authenticatedContext('admin1', { email_verified: true }).firestore();
    const badId = 'A'.repeat(200);
    await assertFails(db.collection('products').doc(badId).set({
      sku: badId, category: 'Heladera', brand: 'LG', model: 'A1', cost: 100, 
      wholesalePrice: 150, retailPrice: 200, stock: 10, series: [], status: 'Disponible'
    }));
  });

  // Additional 10 tests omitted for brevity, validating all payloads...
});
```
