import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { Product, Order } from "./types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAUiqnpve7YrZZG_yUGS8d4GpPF-dFZdz0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "central-bonfire-c7c1c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "central-bonfire-c7c1c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "central-bonfire-c7c1c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "264391057493",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:264391057493:web:6351ee41313c7610c5f4dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific custom database ID
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-smartphone-3dc5c4e2-b707-457a-b6ef-045103cac795";
export const db = getFirestore(app, databaseId);

// Helper to remove 'undefined' fields recursively before writing to Firestore
function sanitizeData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item)) as any;
  }
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = (obj as any)[key];
        if (val !== undefined) {
          cleaned[key] = sanitizeData(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

// Collection references
const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");

// ---------------- PRODUCTS OPERATIONS ----------------

// Real-time listener for products
export function subscribeToProducts(callback: (products: Product[]) => void) {
  const q = query(productsCollection, orderBy("id", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list: Product[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Product);
    });
    callback(list);
  }, (error) => {
    console.error("Error listening to products:", error);
  });
}

// Save or Update a single product
export async function saveProductToDb(product: Product) {
  const docRef = doc(productsCollection, product.id.toString());
  await setDoc(docRef, sanitizeData(product));
}

// Delete a single product
export async function deleteProductFromDb(productId: number) {
  const docRef = doc(productsCollection, productId.toString());
  await deleteDoc(docRef);
}

// Initialize default products if none exist
export async function seedProductsIfEmpty(defaultProducts: Product[]) {
  const snapshot = await getDocs(productsCollection);
  if (snapshot.empty) {
    console.log("Seeding default products in Firestore...");
    for (const product of defaultProducts) {
      await saveProductToDb(product);
    }
  } else {
    console.log("Syncing sortOrder of default products in Firestore...");
    for (const product of defaultProducts) {
      if (product.sortOrder !== undefined) {
        const docRef = doc(productsCollection, product.id.toString());
        await updateDoc(docRef, { sortOrder: product.sortOrder }).catch((err) => {
          console.log(`Could not update sortOrder for product ${product.id}:`, err.message);
        });
      }
    }
  }
}

// ---------------- ORDERS OPERATIONS ----------------

// Real-time listener for orders
export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const q = query(ordersCollection, orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: Order[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Order);
    });
    callback(list);
  }, (error) => {
    console.error("Error listening to orders:", error);
  });
}

// Save or Update a single order
export async function saveOrderToDb(order: Order) {
  const docRef = doc(ordersCollection, order.id.toString());
  await setDoc(docRef, sanitizeData(order));
}

// Update order status in Db
export async function updateOrderStatusInDb(orderId: number, status: Order["status"]) {
  const docRef = doc(ordersCollection, orderId.toString());
  await updateDoc(docRef, { status });
}
