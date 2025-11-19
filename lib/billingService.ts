import { createDocument, updateDocument } from './syncEngine';
import { cacheData, getCachedData } from './offlineDb';

export async function createBill(patientId: string, userId: string, items: any[]) {
  const billData = {
    patientId,
    createdBy: userId,
    items,
    total: items.reduce((sum, item) => sum + (item.total || 0), 0),
    status: 'pending',
    createdAt: new Date(),
    id: `bill_${patientId}_${Date.now()}`
  };

  try {
    const docId = await createDocument('billing', billData);
    return docId;
  } catch (error) {
    await cacheData('cachedBilling', billData);
    throw error;
  }
}

export async function getBillById(billId: string) {
  try {
    const cached = await getCachedData('cachedBilling', billId);
    return cached;
  } catch (error) {
    console.error('Error getting bill:', error);
    return null;
  }
}

export async function getBillsForPatient(patientId: string) {
  try {
    const cached = await getCachedData('cachedBilling') as any[];
    return cached?.filter(bill => bill.patientId === patientId) || [];
  } catch (error) {
    console.error('Error getting bills:', error);
    return [];
  }
}

export async function updateBillItem(billId: string, itemIndex: number, itemData: any) {
  try {
    const bill = await getBillById(billId);
    if (bill && bill.items[itemIndex]) {
      bill.items[itemIndex] = { ...bill.items[itemIndex], ...itemData };
      bill.total = bill.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      await updateDocument('billing', billId, { items: bill.items, total: bill.total });
      return true;
    }
    return false;
  } catch (error) {
    throw error;
  }
}

export async function addItemToBill(billId: string, item: any) {
  try {
    const bill = await getBillById(billId);
    if (bill) {
      bill.items.push(item);
      bill.total = bill.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      await updateDocument('billing', billId, { items: bill.items, total: bill.total });
      return true;
    }
    return false;
  } catch (error) {
    throw error;
  }
}

export async function deleteBillItem(billId: string, itemIndex: number) {
  try {
    const bill = await getBillById(billId);
    if (bill && bill.items[itemIndex]) {
      bill.items.splice(itemIndex, 1);
      bill.total = bill.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      await updateDocument('billing', billId, { items: bill.items, total: bill.total });
      return true;
    }
    return false;
  } catch (error) {
    throw error;
  }
}

export async function markBillAsPaid(billId: string, userId: string) {
  try {
    await updateDocument('billing', billId, {
      status: 'paid',
      paidAt: new Date(),
      paidBy: userId
    });
    return true;
  } catch (error) {
    throw error;
  }
}