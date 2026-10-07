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
import { DFT_PRO_IMAGE, UNLOCK_TOOL_IMAGE, TSM_TOOL_IMAGE, CF_TOOLS_IMAGE } from "./constants";

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

export const TOOL_PERMANENT_IMAGES: Record<number, string> = {
  5: "./tools/dft-pro.png",
  8: "./tools/unlock-tool.png",
  3: "./tools/tsm-tool.png",
  2: "./tools/android-multi-tool.svg",
  12: "./tools/eft-pro.svg",
  13: "./tools/arab-frp.svg",
  22: "./tools/cm2.svg",
  11: "./tools/anonyshu.svg",
  1: "./tools/mdm-fix.svg",
  7: "./tools/cf-tools.png",
  9: "./tools/android-win.svg",
  15: "./tools/tfm-tool.svg",
  17: "./tools/griffin.svg",
  14: "./tools/hydra.svg",
  21: "./tools/t-tool.svg",
  10: "./tools/egsm.svg",
  18: "./tools/frt-tool.svg",
  6: "./tools/samsung-tool.svg",
  19: "./tools/pandora.svg",
  102: "./tools/android-multi-tool.svg",
  103: "./tools/tsm-tool.png",
  111: "./tools/anonyshu.svg",
  107: "./tools/cf-tools.png",
  109: "./tools/android-win.svg",
  115: "./tools/tfm-tool.svg",
  114: "./tools/hydra.svg",
  110: "./tools/egsm.svg",
  106: "./tools/samsung-tool.svg",
  120: "./tools/phoenix.svg",
  104: "./tools/chimera.svg",
  201: "./tools/apple-id.svg",
  202: "./tools/halabtech.svg",
  203: "./tools/honor-frp.svg",
  1783948579571: "./tools/xiaomi-frp.svg"
};

// Real-time listener for products
export function subscribeToProducts(callback: (products: Product[]) => void) {
  const q = query(productsCollection, orderBy("id", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list: Product[] = [];
    snapshot.forEach((doc) => {
      const prod = doc.data() as Product;
      const permanentImg = TOOL_PERMANENT_IMAGES[prod.id];
      if (permanentImg && (!prod.image || prod.image.includes("i.ibb.co") || prod.image.startsWith("/static/") || prod.image.includes("yt3.googleusercontent.com"))) {
        prod.image = permanentImg;
        updateProductFieldInDb(prod.id, { image: permanentImg }).catch(() => {});
      }
      list.push(prod);
    });
    callback(list);
  }, (error) => {
    console.error("Error listening to products:", error);
  });
}

// Save or Update a single product
export async function saveProductToDb(product: Product) {
  const docRef = doc(productsCollection, product.id.toString());
  await setDoc(docRef, sanitizeData(product), { merge: true });
}

// Update specific fields of a product safely without overwriting other properties
export async function updateProductFieldInDb(productId: number, fields: Partial<Product>) {
  const docRef = doc(productsCollection, productId.toString());
  await updateDoc(docRef, sanitizeData(fields));
}

// Delete a single product
export async function deleteProductFromDb(productId: number) {
  const docRef = doc(productsCollection, productId.toString());
  await deleteDoc(docRef);
}

// Initialize default products ONLY if database is truly empty (0 products)
// Never touches or overwrites existing products in Firestore
export async function seedProductsIfEmpty(defaultProducts: Product[]) {
  try {
    const snapshot = await getDocs(productsCollection);
    if (snapshot.empty) {
      console.log("Seeding default products in Firestore...");
      for (const product of defaultProducts) {
        await saveProductToDb(product);
      }
    }
  } catch (err) {
    console.error("Error in seedProductsIfEmpty:", err);
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
