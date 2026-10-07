import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

const EVENT_DATE = "2026-10-11";
const PRICE_PER_BIRIYANI = 180;

/**
 * Creates a new Biriyani order using Firestore Transaction
 * to guarantee atomic, sequential token numbers.
 */
export const createOrder = async (customerDetails) => {
  const { name, phone, quantity } = customerDetails;
  const numQuantity = Number(quantity);
  const totalAmount = numQuantity * PRICE_PER_BIRIYANI;

  try {
    const counterRef = doc(db, 'settings', 'orderCounter');
    const newOrderRef = doc(collection(db, 'orders'));

    const resultToken = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      
      let currentToken = 0;
      if (counterSnap.exists()) {
        const data = counterSnap.data();
        currentToken = data.currentToken || 0;
      }

      const newToken = currentToken + 1;

      // Update the order counter atomically
      transaction.set(counterRef, {
        currentToken: newToken,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Create the new order document
      const orderPayload = {
        tokenNumber: newToken,
        name: name.trim(),
        phone: phone.trim(),
        quantity: numQuantity,
        pricePerBiriyani: PRICE_PER_BIRIYANI,
        totalAmount: totalAmount,
        createdAt: serverTimestamp(),
        orderDate: EVENT_DATE,
        // Distribution & Payment tracking fields
        collectionStatus: "pending",
        paymentMode: null,
        collectedAt: null,
        collectedByCounter: null
      };

      transaction.set(newOrderRef, orderPayload);

      return {
        tokenNumber: newToken,
        orderId: newOrderRef.id,
        payload: orderPayload
      };
    });

    return {
      success: true,
      tokenNumber: resultToken.tokenNumber,
      orderId: resultToken.orderId,
      order: {
        ...resultToken.payload,
        createdAt: new Date()
      }
    };
  } catch (error) {
    console.error('Error placing order in Firestore:', error);
    let userMessage = 'Unable to place your order right now. Please check your internet connection and try again.';
    
    if (error.code === 'permission-denied') {
      userMessage = 'Order placement failed due to permissions. Please contact administrator.';
    }
    
    throw new Error(userMessage);
  }
};

/**
 * Marks an order as collected using an atomic transaction to prevent double collection.
 * @param {string} orderId - Document ID of order
 * @param {string} paymentMode - "gpay" or "cash"
 * @param {string} counterName - "Counter 1", "Counter 2", "Counter 3", or "Counter 4"
 * @param {string} remark - Optional collection remark
 */
export const collectOrder = async (orderId, paymentMode, counterName, remark = '') => {
  if (!orderId) throw new Error('Order ID is required.');
  if (!paymentMode || (paymentMode !== 'gpay' && paymentMode !== 'cash')) {
    throw new Error('Please select a valid payment mode (GPay or Cash).');
  }
  if (!counterName) throw new Error('Counter identifier is required.');

  try {
    const orderRef = doc(db, 'orders', orderId);

    const updatedData = await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found in database.');
      }

      const orderData = orderSnap.data();

      // Guard against double collection
      if (orderData.collectionStatus === 'collected') {
        const collector = orderData.collectedByCounter || 'another counter';
        throw new Error(`This order has already been collected at ${collector}.`);
      }

      const existingHistory = Array.isArray(orderData.collectionHistory) ? orderData.collectionHistory : [];
      const historyEntry = {
        action: 'collected',
        paymentMode: paymentMode.toLowerCase(),
        counter: counterName,
        remark: (remark || '').trim(),
        timestamp: new Date().toISOString()
      };

      const collectionPayload = {
        collectionStatus: 'collected',
        paymentMode: paymentMode.toLowerCase(),
        collectedAt: serverTimestamp(),
        collectedByCounter: counterName,
        collectionRemark: (remark || '').trim(),
        collectionHistory: [...existingHistory, historyEntry]
      };

      transaction.update(orderRef, collectionPayload);

      return {
        ...orderData,
        ...collectionPayload,
        collectedAt: new Date()
      };
    });

    return { success: true, order: updatedData };
  } catch (error) {
    console.error('Error marking order as collected:', error);
    throw new Error(error.message || 'Failed to process collection. Please try again.');
  }
};

/**
 * Revokes an order collection using an atomic Firestore transaction.
 * Resets collectionStatus to "pending", clears paymentMode, collectedAt, collectedByCounter, collectionRemark,
 * and records an audit log entry in collectionHistory.
 * @param {string} orderId - Document ID of order
 * @param {string} performedBy - "Admin" or Counter name e.g. "Counter 2"
 */
export const revokeOrderCollection = async (orderId, performedBy = 'Admin') => {
  if (!orderId) throw new Error('Order ID is required.');

  try {
    const orderRef = doc(db, 'orders', orderId);

    const updatedData = await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found in database.');
      }

      const orderData = orderSnap.data();

      // Guard against revoking an order that is not currently collected
      if (orderData.collectionStatus !== 'collected') {
        throw new Error('This order is not currently marked as collected or has already been revoked.');
      }

      // Permission check: Counter staff can only revoke orders collected by their own counter
      if (performedBy !== 'Admin' && orderData.collectedByCounter && orderData.collectedByCounter !== performedBy) {
        throw new Error(`This order was collected by ${orderData.collectedByCounter}. You can only revoke orders collected by ${performedBy}.`);
      }

      const existingHistory = Array.isArray(orderData.collectionHistory) ? orderData.collectionHistory : [];
      const historyEntry = {
        action: 'revoked',
        counter: orderData.collectedByCounter || 'Unknown',
        revokedBy: performedBy,
        timestamp: new Date().toISOString()
      };

      const revokePayload = {
        collectionStatus: 'pending',
        paymentMode: null,
        collectedAt: null,
        collectedByCounter: null,
        collectionRemark: '',
        collectionHistory: [...existingHistory, historyEntry]
      };

      transaction.update(orderRef, revokePayload);

      return {
        ...orderData,
        ...revokePayload
      };
    });

    return { success: true, order: updatedData };
  } catch (error) {
    console.error('Error revoking order collection:', error);
    throw new Error(error.message || 'Failed to revoke order collection.');
  }
};

/**
 * Updates customer details for an existing order by Admin.
 * Keeps token number, order ID, and collection status intact.
 * Automatically recalculates totalAmount based on quantity * PRICE_PER_BIRIYANI.
 * @param {string} orderId - Firestore document ID
 * @param {Object} details - { name, phone, quantity }
 */
export const updateOrderDetails = async (orderId, details) => {
  if (!orderId) throw new Error('Order ID is required.');
  const { name, phone, quantity } = details;

  const numQuantity = Number(quantity);
  if (isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity < 1) {
    throw new Error('Quantity must be a positive whole number (minimum 1).');
  }

  if (!name || !name.trim()) {
    throw new Error('Customer name is required.');
  }

  if (!phone || !phone.trim()) {
    throw new Error('Phone number is required.');
  }

  const totalAmount = numQuantity * PRICE_PER_BIRIYANI;

  try {
    const orderRef = doc(db, 'orders', orderId);

    const updatePayload = {
      name: name.trim(),
      phone: phone.trim(),
      quantity: numQuantity,
      totalAmount: totalAmount,
      updatedAt: serverTimestamp()
    };

    await updateDoc(orderRef, updatePayload);

    return { success: true, payload: updatePayload };
  } catch (error) {
    console.error('Error updating order details in Firestore:', error);
    throw new Error(error.message || 'Failed to update order details. Please try again.');
  }
};

/**
 * Listens to orders in realtime.
 */
export const subscribeToOrders = (onData, onError) => {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('tokenNumber', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const ordersList = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    onData(ordersList);
  }, (error) => {
    console.error('Realtime Firestore Listener Error:', error);
    if (onError) onError(error);
  });
};

/**
 * Deletes an individual order by ID.
 * Does not reuse token counter.
 */
export const deleteOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    throw new Error('Failed to delete the order. Please try again.');
  }
};

/**
 * Resets the Token Counter back to 0.
 * Next placed order will get Token #1.
 */
export const resetOrderCounter = async () => {
  try {
    const counterRef = doc(db, 'settings', 'orderCounter');
    await setDoc(counterRef, {
      currentToken: 0,
      resetAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error resetting token counter:', error);
    throw new Error('Failed to reset the token counter. Please check admin privileges.');
  }
};

/**
 * Retrieves latest order counter document value.
 */
export const getOrderCounter = async () => {
  try {
    const counterRef = doc(db, 'settings', 'orderCounter');
    const snap = await getDoc(counterRef);
    if (snap.exists()) {
      return snap.data().currentToken || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching order counter:', error);
    return 0;
  }
};
