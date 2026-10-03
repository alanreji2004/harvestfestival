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
  setDoc 
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
 */
export const collectOrder = async (orderId, paymentMode, counterName) => {
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

      const collectionPayload = {
        collectionStatus: 'collected',
        paymentMode: paymentMode.toLowerCase(),
        collectedAt: serverTimestamp(),
        collectedByCounter: counterName
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
