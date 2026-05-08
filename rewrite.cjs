const fs = require('fs');
let content = fs.readFileSync('src/store/useStore.ts', 'utf8');

[
  ['batches', '(newBatch as any).sku || newBatch.id', 'newBatch'],
  ['workshop_expenses', '(newExpense as any).sku || newExpense.id', 'newExpense'],
  ['clients', '(newClient as any).sku || newClient.id', 'newClient'],
  ['transactions', '(newTx as any).sku || newTx.id', 'newTx'],
  ['workshop_jobs', '(newJob as any).sku || newJob.id', 'newJob'],
  ['providers', '(newProvider as any).sku || newProvider.id', 'newProvider']
].forEach(([table, id, obj]) => {
  content = content.replace(
    `try { await setDoc(doc(db, '${table}', ${id}), ${obj}); } catch (e) { error = e; }`,
    `try { await setDoc(doc(db, '${table}', ${id}), ${obj}); } catch (e) { handleFirestoreError(e, OperationType.WRITE, '${table}'); }`
  );
});

fs.writeFileSync('src/store/useStore.ts', content, 'utf8');
