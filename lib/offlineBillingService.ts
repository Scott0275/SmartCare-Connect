import { createBill as originalCreateBill, addItemToBill as originalAddItemToBill } from './billingService';
import { queueAction, executeWithOfflineSupport } from './syncService';
import { cacheData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

export async function createBill(patientId: string, createdBy: string, items: any[]) {
  const billId = uuidv4();
  const billData = {
    patientId,
    createdBy,
    items,
    totalAmount: items.reduce((s, it) => s + (it.total || it.cost * it.quantity || 0), 0),
    status: 'unpaid',
    createdAt: Timestamp.now(),
  };

  return executeWithOfflineSupport(
    async () => {
      const result = await originalCreateBill(patientId, createdBy, items);
      await cacheData('cachedBilling', result);
      return result;
    },
    async () => {
      await queueAction('billing', billId, billData, 'create');
      await cacheData('cachedBilling', { id: billId, ...billData });
      return { id: billId, ...billData };
    }
  );
}

export async function addItemToBill(billId: string, item: any) {
  return executeWithOfflineSupport(
    async () => {
      const result = await originalAddItemToBill(billId, item);
      await cacheData('cachedBilling', { id: billId, ...result });
      return result;
    },
    async () => {
      await queueAction('billing', billId, { addItem: item }, 'update');
      // Cache the item addition locally
      const cachedBill = await cacheData('cachedBilling', { id: billId, addedItem: item });
      return cachedBill;
    }
  );
}