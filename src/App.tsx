import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Wallet, Smartphone, QrCode, X, Monitor, Laptop, AlertTriangle, Check, CheckCircle2,
  XCircle, Clock, CreditCard, Hash, User, Mail, Phone, Facebook, Instagram, Link,
  ChevronRight, AlertCircle, ArrowRight, ShieldCheck, Zap, Info, Moon, Sun, Home, Menu,
  Plus, Trash2, Edit3, Save, Lock, Unlock, Settings, Headphones, ClipboardList, LogOut,
  Eye, EyeOff
} from 'lucide-react';
import { 
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, EXCHANGE_RATE, CASH_FEE_EGP, VODAFONE_NUMBER, 
  VODAFONE_QR_URL, BINANCE_ID, BINANCE_QR_URL, INSTAPAY_NUMBER, INSTAPAY_LOGO_URL, 
  PAYPAL_LINK, PAYPAL_LOGO_URL, WHATSAPP_LINK, productsData, translations 
} from './constants';
import { Product, Language, Currency, OrderStatus, RemoteTool, PaymentType, Order } from './types';
import {
  seedProductsIfEmpty,
  subscribeToProducts,
  subscribeToOrders,
  saveProductToDb,
  deleteProductFromDb,
  saveOrderToDb,
  updateOrderStatusInDb
} from './firebase';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function App() {
  const [lang, setLang] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'support' | 'admin'>('home');
  const [homeCategory, setHomeCategory] = useState<Product['category']>('rent');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [timer, setTimer] = useState(300);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending");
  const [lastUpdateId, setLastUpdateId] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Checkout form fields
  const [remoteTool, setRemoteTool] = useState<RemoteTool>("ultra");
  const [ultraId, setUltraId] = useState("");
  const [ultraPass, setUltraPass] = useState("");
  const [anyDeskId, setAnyDeskId] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("vodafone");
  const [senderPhone, setSenderPhone] = useState("");
  const [binanceTx, setBinanceTx] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [sn, setSn] = useState("");

  // Admin section state
  const [isAdminTabVisible, setIsAdminTabVisible] = useState(() => sessionStorage.getItem('ws_admin_tab_visible') === 'true');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => sessionStorage.getItem('ws_admin_logged') === 'true');
  const [adminPassword, setAdminPassword] = useState("");
  const [adminTab, setAdminTab] = useState<'tools' | 'orders'>('tools');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for creating/editing product
  const [formNameAr, setFormNameAr] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formPrice, setFormPrice] = useState(1);
  const [formDuration, setFormDuration] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formCategory, setFormCategory] = useState<Product['category']>('rent');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formRequiresSN, setFormRequiresSN] = useState(false);
  const [formTooltip, setFormTooltip] = useState("");

  const t = translations[lang as keyof typeof translations];

  // Load and sync products & orders with Firestore in real-time
  useEffect(() => {
    // Seed default products in Firestore if they don't exist
    seedProductsIfEmpty(productsData).catch(err => {
      console.error("Error seeding products:", err);
    });

    // Real-time listener for products
    const unsubscribeProducts = subscribeToProducts((realtimeProducts) => {
      setProducts(realtimeProducts);
    });

    // Real-time listener for orders
    const unsubscribeOrders = subscribeToOrders((realtimeOrders) => {
      setOrders(realtimeOrders);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

  // Send a visitor notification to Telegram once per session
  useEffect(() => {
    const notifyVisit = async () => {
      // Check if already notified in this session to avoid spamming on page refreshes
      const alreadyNotified = sessionStorage.getItem('telegram_notified_visit');
      if (alreadyNotified) return;

      sessionStorage.setItem('telegram_notified_visit', 'true');

      let geoText = "⚠️ غير قادر على جلب الموقع الجغرافي";
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const country = data.country_name || "";
          const city = data.city || "";
          const ip = data.ip || "";
          const org = data.org || "";
          geoText = `📍 البلد: ${country}\n🏙️ المدينة: ${city}\n🔌 IP: ${ip}\n🏢 الشبكة: ${org}`;
        }
      } catch (err) {
        console.log("Could not fetch IP info", err);
      }

      const userAgent = navigator.userAgent;
      let deviceType = "💻 جهاز كمبيوتر (Desktop)";
      if (/Mobi|Android|iPhone|iPad/i.test(userAgent)) {
        deviceType = "📱 هاتف محمول أو تابلت (Mobile/Tablet)";
      }

      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const browserLang = navigator.language || "غير معروفة";
      const siteUrl = window.location.href;

      const messageText = `👀 *دخول جديد للموقع!* 📢\n\n` +
        `🌐 *رابط الموقع:* ${siteUrl}\n` +
        `📱 *نوع الجهاز:* ${deviceType}\n` +
        `🖥️ *دقة الشاشة:* ${screenRes}\n` +
        `🗣️ *لغة المتصفح:* ${browserLang}\n\n` +
        `🌍 *بيانات الاتصال:* \n${geoText}\n\n` +
        `⏰ *الوقت الحالي:* ${new Date().toLocaleString('ar-EG')}`;

      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: messageText,
            parse_mode: 'Markdown'
          })
        });
      } catch (e) {
        console.error("Error sending visit notification to Telegram", e);
      }
    };

    notifyVisit();
  }, []);

  const saveProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    // Write each product to Firestore to ensure consistency
    try {
      for (const prod of newProducts) {
        await saveProductToDb(prod);
      }
    } catch (e) {
      console.error("Error saving products to Firestore:", e);
    }
  };

  const saveOrders = async (newOrders: Order[]) => {
    setOrders(newOrders);
    // Write each order to Firestore to ensure consistency
    try {
      for (const ord of newOrders) {
        await saveOrderToDb(ord);
      }
    } catch (e) {
      console.error("Error saving orders to Firestore:", e);
    }
  };

  // Dark mode class handler
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#060B18';
      document.body.style.color = '#f8fafc';
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
  }, [isDarkMode]);

  // Listen for F7 key to toggle admin tab visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F7' || e.key === 'f7') {
        e.preventDefault();
        setIsAdminTabVisible(prev => {
          const next = !prev;
          sessionStorage.setItem('ws_admin_tab_visible', String(next));
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Telebot updates polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    const hasPendingOrders = orders.some(o => o.status === "pending");
    if (hasPendingOrders || (orderSuccess && orderStatus === "pending" && orderId)) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
          const data = await res.json();
          if (data.ok && data.result.length > 0) {
            let updatedOrders = [...orders];
            let changed = false;
            let maxUpdateId = lastUpdateId;

            for (const update of data.result) {
              maxUpdateId = Math.max(maxUpdateId, update.update_id);
              
              let action = '';
              let id = '';

              if (update.callback_query && update.callback_query.data) {
                const [act, ordId] = update.callback_query.data.split('_');
                action = act;
                id = ordId;
                fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery?callback_query_id=${update.callback_query.id}`).catch(() => {});
              } else {
                const msgText = update.message?.text || update.channel_post?.text;
                if (msgText) {
                  const trimmed = msgText.trim();
                  if (trimmed.includes('_')) {
                    const parts = trimmed.split('_');
                    if (parts.length >= 2) {
                      const act = parts[0].toLowerCase();
                      if (act === 'accept' || act === 'reject') {
                        action = act;
                        id = parts[1].split('\n')[0].trim(); // Extract ID and ignore any description
                      }
                    }
                  }
                }
              }

              if (action && id) {
                if (orderId && id === orderId.toString()) {
                  if (action === 'accept') setOrderStatus("accepted");
                  if (action === 'reject') setOrderStatus("rejected");
                }
                updateOrderStatusInDb(Number(id), action === 'accept' ? 'accepted' : 'rejected').catch(() => {});
              }
            }
            setLastUpdateId(maxUpdateId);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [orderSuccess, orderStatus, orderId, lastUpdateId, orders]);

  // Checkout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (orderSuccess && timer > 0 && orderStatus === "pending") {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && orderStatus === "pending") {
      setTimeout(() => {
        setSelectedProduct(null);
        setOrderSuccess(false);
        setTimer(300);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [orderSuccess, timer, orderStatus]);

  // Sync client modal orderStatus state with real-time orders array
  useEffect(() => {
    if (orderId) {
      const activeOrder = orders.find(o => o.id === orderId);
      if (activeOrder && activeOrder.status !== orderStatus) {
        setOrderStatus(activeOrder.status);
      }
    }
  }, [orders, orderId, orderStatus]);

  const formatPrice = (usdAmount: number, useQuantity = false, isCredit = false) => {
    let finalUsd = usdAmount;
    if (useQuantity) finalUsd = usdAmount * quantity;
    if (currency === 'USD') return `$${finalUsd.toFixed(2)}`;
    let finalEgp = finalUsd * EXCHANGE_RATE;
    if (useQuantity && paymentType === 'vodafone' && !isCredit) finalEgp += CASH_FEE_EGP;
    return `${Math.round(finalEgp)} EGP`;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(type);
    setTimeout(() => setCopyStatus(""), 2000);
  };

  const handleFinalOrder = async () => {
    if (!selectedProduct) return;
    const newOrderId = Date.now();
    setOrderId(newOrderId);
    setOrderStatus("pending");
    const currentPrice = (selectedProduct.sizeOptions && selectedSize && selectedProduct.sizePrices?.[selectedSize]) 
      ? selectedProduct.sizePrices[selectedSize] 
      : selectedProduct.priceUsd;

    let message = `🚀 New Order\n🔢 Order ID: ${newOrderId}\n\n📦 Product: ${lang === 'en' && selectedProduct.nameEn ? selectedProduct.nameEn : selectedProduct.name}\n`;
    if (selectedProduct.category === 'credit' || selectedProduct.category === 'server') {
      if (selectedProduct.requiresSN) message += `🆔 SN: ${sn}\n`;
      if (selectedProduct.sizeOptions) {
        message += `📏 Size: ${selectedSize}\n🔗 Link: ${downloadLink}\n`;
      } else {
        message += `🔢 Qty: ${quantity}\n`;
      }
      if (selectedProduct.category === 'credit') message += `📧 Email: ${email}\n`;
      else message += `📱 WhatsApp: ${whatsappNumber}\n`;
    }
    message += `💰 Total: ${formatPrice(currentPrice, true, selectedProduct.category !== 'rent')}\n`;
    if (selectedProduct.category === 'rent') {
      if (remoteTool === 'ultra') message += `🖥️ Tool: UltraViewer\n🆔 ID: ${ultraId}\n🔑 Pass: ${ultraPass}\n`;
      else message += `🖥️ Tool: AnyDesk\n🆔 ID: ${anyDeskId}\n`;
    }
    if (paymentType === 'vodafone') message += `📱 Method: Vodafone Cash\n📞 From: ${senderPhone}\n`;
    else if (paymentType === 'binance') message += `🔶 Method: Binance\n🧾 ID: ${binanceTx}\n`;
    else if (paymentType === 'instapay') message += `💸 Method: InstaPay\n📞 From: ${senderPhone}\n`;
    else if (paymentType === 'paypal') message += `🅿️ Method: PayPal\n👤 From: ${senderPhone}\n`;
    
    const newOrder: Order = {
      id: newOrderId,
      productName: selectedProduct.name,
      productImage: selectedProduct.image,
      category: selectedProduct.category,
      priceUsd: currentPrice,
      quantity: selectedProduct.sizeOptions ? 1 : quantity,
      totalPrice: formatPrice(currentPrice, true, selectedProduct.category !== 'rent'),
      status: "pending",
      timestamp: Date.now(),
      paymentType: paymentType,
      details: {
        sn: selectedProduct.requiresSN ? sn : undefined,
        email: selectedProduct.category === 'credit' ? email : undefined,
        whatsappNumber: selectedProduct.category === 'server' ? whatsappNumber : undefined,
        remoteTool: selectedProduct.category === 'rent' ? remoteTool : undefined,
        ultraId: remoteTool === 'ultra' ? ultraId : undefined,
        anyDeskId: remoteTool === 'anydesk' ? anyDeskId : undefined,
        size: selectedSize || undefined,
      }
    };
    await saveOrderToDb(newOrder);

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          reply_markup: {
            inline_keyboard: [[
              { text: "Accept ✅", callback_data: `accept_${newOrderId}` },
              { text: "Reject ❌", callback_data: `reject_${newOrderId}` }
            ]]
          }
        })
      });
    } catch (e) {}
    setTimer(300);
    setOrderSuccess(true);
  };

  const isFormValid = () => {
    if (!selectedProduct) return false;
    if (selectedProduct.requiresSN && !sn.trim()) return false;
    const isRemoteValid = selectedProduct.category !== 'rent' || (remoteTool === 'ultra' ? (ultraId.trim() && ultraPass.trim()) : anyDeskId.trim());
    const isPaymentValid = paymentType === 'vodafone' 
      ? senderPhone.trim().length >= 11 
      : paymentType === 'instapay' 
        ? senderPhone.trim().length >= 11 
        : paymentType === 'paypal'
          ? senderPhone.trim().length > 2
          : binanceTx.trim().length > 0;
    if (selectedProduct.category === 'credit' || selectedProduct.category === 'server') {
      const isContactValid = selectedProduct.category === 'credit' ? email.trim().includes('@') : whatsappNumber.trim().length >= 11;
      if (selectedProduct.sizeOptions) {
        return isRemoteValid && isPaymentValid && isContactValid && selectedSize !== "" && downloadLink.trim().length > 5;
      }
      return isRemoteValid && isPaymentValid && isContactValid && quantity >= (selectedProduct.minQty || 1);
    }
    return isRemoteValid && isPaymentValid;
  };

  // Product addition and editing handlers
  const openAddProduct = () => {
    setFormNameAr("");
    setFormNameEn("");
    setFormPrice(1);
    setFormDuration("");
    setFormImage("");
    setFormCategory("rent");
    setFormIsAvailable(true);
    setFormRequiresSN(false);
    setFormTooltip("");
    setIsAddingProduct(true);
  };

  const openEditProduct = (prod: Product) => {
    setFormNameAr(prod.name);
    setFormNameEn(prod.nameEn || "");
    setFormPrice(prod.priceUsd);
    setFormDuration(prod.duration || "");
    setFormImage(prod.image);
    setFormCategory(prod.category);
    setFormIsAvailable(prod.isAvailable !== false);
    setFormRequiresSN(!!prod.requiresSN);
    setFormTooltip(prod.tooltip || "");
    setEditingProduct(prod);
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameAr.trim() || !formImage.trim()) return;

    const savedItem: Product = {
      id: editingProduct ? editingProduct.id : Date.now(),
      name: formNameAr,
      nameEn: formNameEn || undefined,
      priceUsd: Number(formPrice),
      duration: formDuration || undefined,
      image: formImage,
      category: formCategory,
      isAvailable: formIsAvailable,
      requiresSN: formRequiresSN,
      tooltip: formTooltip || undefined,
    };

    try {
      await saveProductToDb(savedItem);
    } catch (err) {
      console.error("Error saving product:", err);
    }

    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm(lang === 'ar' ? "هل أنت متأكد من حذف هذه الأداة؟" : "Are you sure you want to delete this tool?")) {
      try {
        await deleteProductFromDb(id);
      } catch (err) {
        console.error("Error deleting product:", err);
      }
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "15102001Ww" || adminPassword === "walidsala7") {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('ws_admin_logged', 'true');
    } else {
      alert(t.adminIncorrectPassword);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('ws_admin_logged');
  };

  const handleToggleOrder = async (orderId: number, status: OrderStatus) => {
    try {
      await updateOrderStatusInDb(orderId, status);
    } catch (e) {
      console.error("Error updating order status in Firestore:", e);
    }

    try {
      const actionCmd = status === 'accepted' ? 'accept' : 'reject';
      const actionEmoji = status === 'accepted' ? '✅' : '❌';
      
      // Send a status update command to Telegram so all client browsers polling Telegram get this status change instantly
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `${actionCmd}_${orderId}\n\n🔔 Order #${orderId} was ${status.toUpperCase()} ${actionEmoji} from the Web Admin Panel.`
        })
      });
    } catch (e) {
      console.error("Error sending status sync to Telegram", e);
    }
  };

  const sidebarItems = [
    { id: 'home', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: <Home size={18} /> },
    { id: 'orders', label: lang === 'ar' ? 'سجل الطلبات' : 'Order History', icon: <ClipboardList size={18} /> },
    { id: 'support', label: lang === 'ar' ? 'الدعم الفني' : 'Technical Support', icon: <Headphones size={18} /> },
    ...(isAdminTabVisible || isAdminLoggedIn ? [{ id: 'admin', label: lang === 'ar' ? 'لوحة الإدارة' : 'Admin Panel', icon: <Settings size={18} /> }] : []),
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 relative ${isDarkMode ? 'dark bg-[#060B18] text-slate-100' : 'bg-slate-50 text-slate-900'}`} dir={t.dir}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[150px] rounded-full"></div>
      </div>

      {/* Responsive Header / Mobile Nav Toggle */}
      <header className="lg:hidden sticky top-0 z-[60] bg-white/90 dark:bg-[#060B18]/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div 
          onClick={() => {
            setActiveTab('home');
            setSearchQuery("");
          }}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center shadow-md">
            <span className="text-[#060B18] font-black text-xs">WS</span>
          </div>
          <span className="font-display font-black text-sm tracking-tight uppercase">Smart Phone</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-xs font-black bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg text-gold uppercase"
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-500 hover:text-gold dark:text-slate-400 dark:hover:text-gold"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar Component */}
        <aside 
          className={`fixed lg:sticky top-0 z-50 h-screen w-72 bg-white dark:bg-[#0D1425] border-r border-slate-100 dark:border-slate-800/60 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen 
              ? 'translate-x-0' 
              : t.dir === 'rtl' 
                ? 'translate-x-full lg:translate-x-0' 
                : '-translate-x-full lg:translate-x-0'
          } ${t.dir === 'rtl' ? 'right-0 border-l border-r-0' : 'left-0'}`}
        >
          <div>
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
              <div 
                onClick={() => {
                  setActiveTab('home');
                  setSearchQuery("");
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/20">
                  <span className="text-[#060B18] font-black text-base">WS</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-base tracking-tight uppercase leading-none">Smart Phone</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Walid Salah</span>
                </div>
              </div>
              <button lg-hidden="true" onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X size={18} />
              </button>
            </div>

            {/* Currency, Lang and Theme switcher above Home */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 text-xs">
                <button onClick={() => setCurrency('USD')} className={`px-2.5 py-1 rounded-lg font-black tracking-wider transition-all uppercase ${currency === 'USD' ? 'bg-white dark:bg-[#060B18] text-gold shadow-sm' : 'text-slate-500'}`}>USD</button>
                <button onClick={() => setCurrency('EGP')} className={`px-2.5 py-1 rounded-lg font-black tracking-wider transition-all uppercase ${currency === 'EGP' ? 'bg-white dark:bg-[#060B18] text-gold shadow-sm' : 'text-slate-500'}`}>EGP</button>
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 text-xs">
                <button onClick={() => setLang('ar')} className={`px-2 py-1 rounded-lg font-black transition-all ${lang === 'ar' ? 'bg-white dark:bg-[#060B18] text-gold shadow-sm' : 'text-slate-500'}`}>AR</button>
                <button onClick={() => setLang('en')} className={`px-2 py-1 rounded-lg font-black transition-all ${lang === 'en' ? 'bg-white dark:bg-[#060B18] text-gold shadow-sm' : 'text-slate-500'}`}>EN</button>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-gold"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <nav className="p-4 space-y-2 mt-4">
              {sidebarItems.map(item => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setSidebarOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                      active 
                        ? 'bg-gold text-[#060B18] shadow-md shadow-gold/10' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {isAdminLoggedIn && (
            <div className="p-6 border-t border-slate-100 dark:border-slate-800/50">
              <button 
                onClick={handleAdminLogout} 
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl font-bold text-xs uppercase transition-all"
              >
                <LogOut size={14} />
                <span>{t.adminLogoutButton}</span>
              </button>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow p-4 lg:p-8 pt-6 lg:pt-12 min-w-0 z-10 relative overflow-y-auto">
          {/* Header Search Box on Top */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="relative group">
              <Search className={`absolute ${t.dir === 'rtl' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gold transition-colors`} size={20} />
              <input 
                type="text" 
                placeholder={activeTab === 'orders' ? t.searchOrdersPlaceholder : t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-4 ${t.dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} rounded-2xl border border-slate-200 dark:border-slate-800/80 focus:border-gold outline-none bg-white dark:bg-[#0D1425] shadow-sm font-bold text-sm`}
              />
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* Branding Block */}
                <div className="text-center py-4 relative z-10">
                  <span className="text-gold font-black text-xs uppercase tracking-widest bg-gold/10 px-4 py-1.5 rounded-full border border-gold/15">Smart Phone Store</span>
                  <h1 className="text-3xl lg:text-5xl font-black mt-4 font-display text-slate-900 dark:text-white leading-none">Smart Phone - Walid Salah</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-sm lg:text-base mt-3 max-w-2xl mx-auto leading-relaxed">{t.heroSub}</p>
                </div>

                {/* Categories Tabs inside Home Tab */}
                <div className="flex justify-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'rent', label: t.rentalsTab, icon: <Laptop size={16} /> },
                    { id: 'credit', label: t.creditsTab, icon: <Zap size={16} /> },
                    { id: 'server', label: t.serverTab, icon: <Monitor size={16} /> }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setHomeCategory(cat.id as any)}
                      className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 border transition-all shrink-0 ${
                        homeCategory === cat.id 
                          ? 'bg-gold text-[#060B18] border-gold shadow-md' 
                          : 'bg-white dark:bg-[#0D1425] text-slate-400 border-slate-100 dark:border-slate-800/60 hover:border-gold/30'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products
                    .filter(p => p.category === homeCategory)
                    .filter(p => {
                      const query = searchQuery.toLowerCase();
                      const nameAr = p.name.toLowerCase();
                      const nameEn = (p.nameEn || "").toLowerCase();
                      return nameAr.includes(query) || nameEn.includes(query);
                    })
                    .sort((a, b) => {
                      const orderA = a.sortOrder !== undefined ? a.sortOrder : 9999;
                      const orderB = b.sortOrder !== undefined ? b.sortOrder : 9999;
                      if (orderA !== orderB) {
                        return orderA - orderB;
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map(product => {
                      const available = product.isAvailable !== false;
                      return (
                        <div 
                          key={product.id}
                          onClick={() => {
                            if (!available) {
                              alert(lang === 'ar' ? 'هذه الأداة غير متوفرة حالياً، يرجى التواصل مع الدعم الفني لتفعيلها.' : 'This tool is currently unavailable. Please contact support to activate it.');
                              return;
                            }
                            setSelectedProduct(product); 
                            setOrderSuccess(false); 
                            setQuantity(product.minQty || 1); 
                            setSelectedSize(""); 
                            setDownloadLink(product.downloadLink || ""); 
                            setSn("");
                          }}
                          className={`bg-white dark:bg-[#0D1425] rounded-2xl border p-4 flex gap-4 items-center group relative cursor-pointer hover:shadow-lg transition-all ${
                            available ? 'border-slate-100 dark:border-gold/10' : 'border-rose-500/20 opacity-75'
                          }`}
                        >
                          <div className="w-20 h-16 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center p-0.5 shadow-inner">
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover rounded-lg group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-grow min-w-0 space-y-1">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              available ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            }`}>
                              {available ? (lang === 'ar' ? 'متوفر' : 'Available') : (lang === 'ar' ? 'غير متوفر' : 'Unavailable')}
                            </span>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight uppercase truncate group-hover:text-gold transition-colors">
                              {lang === 'en' && product.nameEn ? product.nameEn : product.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gold">
                                {formatPrice(product.priceUsd, false, product.category === 'credit')}
                              </span>
                              {product.duration && (
                                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                                  • {product.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Subtitle placed under the store grid section as requested */}
                <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800/80">
                  <p className="text-gold font-black text-sm tracking-wide leading-relaxed font-sans select-none">{t.subtitle}</p>
                </div>
              </motion.div>
            )}

            {/* TAB: ORDERS HISTORY */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <ClipboardList className="text-gold" />
                  <h2 className="text-2xl font-black font-display uppercase">{t.ordersTab}</h2>
                </div>
                {orders.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-[#0D1425] rounded-3xl border border-slate-100 dark:border-slate-800">
                    <Smartphone className="mx-auto text-slate-400 mb-4" size={40} />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-1">{lang === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}</h3>
                    <p className="text-slate-400 text-sm font-medium">{lang === 'ar' ? 'ابدأ في طلب الخدمات وستظهر هنا' : 'Place orders and they will appear here'}</p>
                  </div>
                ) : (
                  (() => {
                    if (!searchQuery) {
                      return (
                        <div className="text-center py-16 bg-white dark:bg-[#0D1425] rounded-3xl border border-slate-100 dark:border-slate-800">
                          <Hash className="mx-auto text-gold mb-4 animate-pulse" size={40} />
                          <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-1">{lang === 'ar' ? 'أدخل كود الطلب لمتابعته' : 'Enter Order ID to Track'}</h3>
                          <p className="text-slate-400 text-sm font-medium max-w-[320px] mx-auto">{lang === 'ar' ? 'يرجى إدخال كود الطلب المكون من أرقام في مربع البحث بالأعلى لمتابعة حالته' : 'Please type your numeric order code in the top search bar to view details'}</p>
                        </div>
                      );
                    }
                    const filtered = orders.filter(o => o.id.toString() === searchQuery.trim() || o.productName.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-16 bg-white dark:bg-[#0D1425] rounded-3xl border border-slate-100 dark:border-slate-800">
                          <Search className="mx-auto text-rose-500 mb-4" size={40} />
                          <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-1">{lang === 'ar' ? 'لم يتم العثور على أي نتائج' : 'No Matches Found'}</h3>
                          <p className="text-slate-400 text-sm font-medium">{lang === 'ar' ? 'تأكد من كتابة كود الطلب بشكل صحيح' : 'Verify the order ID and try again'}</p>
                        </div>
                      );
                    }
                    return filtered.map(order => (
                      <div key={order.id} className="bg-white dark:bg-[#0D1425] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-16 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-0.5">
                          <img src={order.productImage} alt={order.productName} className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div className="flex-grow text-center sm:text-left space-y-1">
                          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">{order.productName}</h4>
                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                              order.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              order.status === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse'
                            }`}>
                              {order.status === 'accepted' ? t.statusAccepted : order.status === 'rejected' ? t.statusRejected : t.statusPending}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(order.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          <span className="text-sm font-black text-gold bg-gold/5 border border-gold/10 px-3 py-1 rounded-lg">{order.totalPrice}</span>
                          <button 
                            onClick={() => handleCopy(order.id.toString(), order.id.toString())}
                            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:text-gold rounded-lg font-mono text-xs font-black"
                          >
                            {copyStatus === order.id.toString() ? t.copied : `ID: ${order.id}`}
                          </button>
                        </div>
                      </div>
                    ));
                  })()
                )}
              </motion.div>
            )}

            {/* TAB: TECHNICAL SUPPORT */}
            {activeTab === 'support' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                  <Headphones className="text-gold" />
                  <h2 className="text-2xl font-black font-display uppercase">{t.supportTab}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Whatsapp */}
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 bg-white dark:bg-[#0D1425] rounded-3xl border border-slate-100 dark:border-gold/10 hover:border-gold transition-all group shadow-sm">
                    <div className="p-4 bg-[#25D366]/10 rounded-2xl text-[#25D366] group-hover:scale-105 transition-transform shrink-0">
                      <WhatsAppIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp Tech Support</p>
                      <p className="text-slate-900 dark:text-white font-black text-base">{VODAFONE_NUMBER}</p>
                    </div>
                  </a>

                  {/* Facebook */}
                  <a href="https://www.facebook.com/walid.salah.359716/about" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 bg-white dark:bg-[#0D1425] rounded-3xl border border-slate-100 dark:border-gold/10 hover:border-gold transition-all group shadow-sm">
                    <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                      <Facebook size={32} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Facebook Developer Profile</p>
                      <p className="text-slate-900 dark:text-white font-black text-base">Walid Salah</p>
                    </div>
                  </a>

                  {/* Instagram */}
                  <a href="https://www.instagram.com/waleed_salah_00/" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 bg-white dark:bg-[#0D1425] rounded-3xl border border-slate-100 dark:border-gold/10 hover:border-gold transition-all group shadow-sm col-span-1 md:col-span-2">
                    <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500 group-hover:scale-105 transition-transform shrink-0">
                      <Instagram size={32} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Instagram Business Updates</p>
                      <p className="text-slate-900 dark:text-white font-black text-base">@waleed_salah_00</p>
                    </div>
                  </a>
                </div>

                {/* Available Payment Systems info panel */}
                <div className="bg-white dark:bg-[#0D1425] p-6 rounded-3xl border border-slate-100 dark:border-gold/15 mt-8 text-center space-y-4">
                  <Wallet size={28} className="text-gold mx-auto" />
                  <h3 className="font-bold text-lg font-display uppercase">{t.paymentTitle}</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">{t.helpText}</p>
                </div>
              </motion.div>
            )}

            {/* TAB: ADMIN PANEL */}
            {activeTab === 'admin' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* LOGIN CARD */}
                {!isAdminLoggedIn ? (
                  <div className="max-w-md mx-auto bg-white dark:bg-[#0D1425] p-8 rounded-3xl border border-slate-100 dark:border-gold/15 shadow-xl text-center space-y-6">
                    <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto text-gold border border-gold/25">
                      <Lock size={28} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black font-display uppercase">{t.adminLoginTitle}</h2>
                    </div>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="relative">
                        <input 
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder={t.adminPasswordPlaceholder}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center font-bold outline-none text-slate-900 dark:text-white"
                        />
                      </div>
                      <button type="submit" className="w-full py-4 bg-gold hover:bg-[#D4B06A] text-[#060B18] rounded-xl font-black text-sm uppercase transition-all shadow-md active:scale-95">
                        {t.adminLoginButton}
                      </button>
                    </form>
                  </div>
                ) : (
                  /* SECURE LOGGED IN VIEW */
                  <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <Unlock className="text-gold" />
                        <div>
                          <h2 className="text-2xl font-black font-display uppercase">{t.adminPanelTitle}</h2>
                          <p className="text-[10px] text-emerald-500 font-bold uppercase">Session Authenticated</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => setAdminTab('tools')}
                          className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wide border transition-all ${
                            adminTab === 'tools' ? 'bg-gold text-[#060B18] border-gold shadow-sm' : 'bg-white dark:bg-[#0D1425] text-slate-400 border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          {t.adminManageProducts}
                        </button>
                        <button 
                          onClick={() => setAdminTab('orders')}
                          className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wide border transition-all ${
                            adminTab === 'orders' ? 'bg-gold text-[#060B18] border-gold shadow-sm' : 'bg-white dark:bg-[#0D1425] text-slate-400 border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          {t.adminManageOrders} ({orders.length})
                        </button>
                      </div>
                    </div>

                    {/* ADMIN VIEW: TOOLS MANAGER */}
                    {adminTab === 'tools' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{products.length} Products Installed</span>
                          <button 
                            onClick={openAddProduct}
                            className="px-5 py-3 bg-gold hover:bg-[#D4B06A] text-[#060B18] rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95"
                          >
                            <Plus size={16} />
                            <span>{t.adminAddProduct}</span>
                          </button>
                        </div>

                        <div className="bg-white dark:bg-[#0D1425] rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden">
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {products
                              .filter(p => {
                                const q = searchQuery.toLowerCase();
                                return p.name.toLowerCase().includes(q) || (p.nameEn || "").toLowerCase().includes(q);
                              })
                              .sort((a, b) => b.id - a.id) // Newest first in admin list
                              .map(product => (
                                <div key={product.id} className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-0.5">
                                      <img src={product.image} alt="" className="w-full h-full object-cover rounded-md" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{product.name}</h4>
                                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 uppercase font-black tracking-wider">
                                        <span className="text-gold">{product.priceUsd}$</span>
                                        <span>•</span>
                                        <span>{product.category}</span>
                                        {product.duration && (
                                          <>
                                            <span>•</span>
                                            <span>{product.duration}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 shrink-0">
                                    {/* Availability Status Quick Switcher */}
                                    <button 
                                      onClick={() => {
                                        const updated = products.map(p => p.id === product.id ? { ...p, isAvailable: p.isAvailable === false } : p);
                                        saveProducts(updated);
                                      }}
                                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                                        product.isAvailable !== false
                                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                                          : 'bg-rose-500/15 text-rose-500 border-rose-500/25'
                                      }`}
                                    >
                                      {product.isAvailable !== false ? (lang === 'ar' ? 'متاحة' : 'Available') : (lang === 'ar' ? 'غير متاحة' : 'Unavailable')}
                                    </button>

                                    <div className="flex gap-1">
                                      <button 
                                        onClick={() => openEditProduct(product)} 
                                        className="p-2 text-slate-400 hover:text-gold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                        title={t.adminEditProduct}
                                      >
                                        <Edit3 size={15} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteProduct(product.id)} 
                                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                        title={t.adminDeleteProduct}
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ADMIN VIEW: ORDERS MANAGER */}
                    {adminTab === 'orders' && (
                      <div className="space-y-6">
                        {orders.length === 0 ? (
                          <div className="text-center py-12 bg-white dark:bg-[#0D1425] rounded-2xl border">
                            <p className="text-slate-400 font-bold text-sm">No user orders found in this browser context.</p>
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-[#0D1425] rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {orders.map(order => (
                              <div key={order.id} className="p-5 space-y-4">
                                <div className="flex justify-between items-start gap-4 flex-wrap">
                                  <div className="flex gap-3 items-center">
                                    <div className="w-12 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-0.5">
                                      <img src={order.productImage} alt="" className="w-full h-full object-cover rounded-md" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-sm">{order.productName}</h4>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">{order.paymentType} • ID: {order.id}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                                      order.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                      order.status === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                      'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse'
                                    }`}>
                                      {order.status === 'accepted' ? t.statusAccepted : order.status === 'rejected' ? t.statusRejected : t.statusPending}
                                    </span>
                                    <span className="text-xs font-black text-gold bg-gold/5 border border-gold/10 px-2.5 py-1 rounded">{order.totalPrice}</span>
                                  </div>
                                </div>

                                {/* Order Client Filled Fields Details */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2 text-xs font-medium text-slate-500 dark:text-slate-300">
                                  {order.details.sn && <p>• <span className="font-bold">SN:</span> {order.details.sn}</p>}
                                  {order.details.email && <p>• <span className="font-bold">Email:</span> {order.details.email}</p>}
                                  {order.details.whatsappNumber && <p>• <span className="font-bold">WhatsApp:</span> {order.details.whatsappNumber}</p>}
                                  {order.details.size && <p>• <span className="font-bold">Size:</span> {order.details.size}</p>}
                                  {order.details.remoteTool && (
                                    <p>• <span className="font-bold">Remote:</span> {order.details.remoteTool.toUpperCase()} (ID: {order.details.ultraId || order.details.anyDeskId})</p>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleToggleOrder(order.id, 'accepted')}
                                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl transition-all shadow-sm active:scale-95"
                                  >
                                    Accept Order ✅
                                  </button>
                                  <button 
                                    onClick={() => handleToggleOrder(order.id, 'rejected')}
                                    className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase rounded-xl transition-all shadow-sm active:scale-95"
                                  >
                                    Reject Order ❌
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>



      {/* CHECKOUT POPUP MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="bg-white dark:bg-[#060B18] rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gold/10"
            >
              <div className="p-5 border-b dark:border-gold/10 flex justify-between items-center bg-white dark:bg-[#060B18] sticky top-0 z-20">
                <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight font-display">{t.selectPayment}</h3>
                <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-gold/10 rounded-xl">
                  <X className="text-slate-400 hover:text-gold" size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-5 space-y-6">
                {orderSuccess ? (
                  <div className="text-center py-8 space-y-6">
                    {orderStatus === "pending" ? (
                      <div className="space-y-4">
                        <div className="w-24 h-24 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto border border-gold/25 animate-pulse">
                          <span className="text-xl font-black">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <h3 className="font-black text-xl tracking-tight uppercase font-display">{t.statusPending}</h3>
                        <div className="bg-gold/5 p-4 rounded-2xl border border-gold/10">
                          <p className="text-[10px] text-gold font-black uppercase tracking-wider mb-2">{t.orderCodeLabel}</p>
                          <span className="text-2xl font-black font-mono block text-slate-900 dark:text-white">{orderId}</span>
                          <button onClick={() => handleCopy(orderId?.toString() || "", 'order_code')} className="mt-3 px-4 py-1.5 bg-white dark:bg-[#060B18] text-gold border border-gold/20 hover:border-gold rounded-xl font-black text-xs">
                            {copyStatus === 'order_code' ? t.copied : t.copyCode}
                          </button>
                        </div>
                        <p className="text-slate-400 font-bold text-xs leading-relaxed max-w-[280px] mx-auto">{t.waitOwner}</p>
                      </div>
                    ) : orderStatus === "accepted" ? (
                      <div className="space-y-4">
                        <CheckCircle2 className="mx-auto text-emerald-500 animate-bounce" size={64} />
                        <h3 className="font-black text-xl uppercase tracking-tight">{t.accepted}</h3>
                        <p className="text-slate-400 font-bold text-xs">{t.acceptedMsg}</p>
                        <button onClick={() => setSelectedProduct(null)} className="w-full py-4 bg-gold text-[#060B18] rounded-xl font-black text-sm uppercase">
                          {t.close}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <XCircle className="mx-auto text-rose-500" size={64} />
                        <h3 className="font-black text-xl uppercase tracking-tight">{t.rejected}</h3>
                        <p className="text-slate-400 font-bold text-xs">{t.rejectedMsg}</p>
                        <button onClick={() => setOrderSuccess(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-sm uppercase">
                          {t.backToStore}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Step 1: Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex items-center gap-4">
                      <img src={selectedProduct.image} className="w-16 h-12 object-cover rounded-lg" alt="" />
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm">{selectedProduct.name}</h4>
                        <span className="text-xs font-black text-gold mt-1 block">
                          {formatPrice(
                            (selectedProduct.sizeOptions && selectedSize && selectedProduct.sizePrices?.[selectedSize]) 
                              ? selectedProduct.sizePrices[selectedSize] 
                              : selectedProduct.priceUsd, 
                            true, 
                            selectedProduct.category !== 'rent'
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Step 2: Configuration inputs */}
                    <div className="space-y-4">
                      {/* Optional Sizes for Halabtech */}
                      {selectedProduct.sizeOptions && (
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'اختر الحجم:' : 'Select Size:'}</label>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedProduct.sizeOptions.map(option => (
                              <button 
                                key={option} 
                                onClick={() => setSelectedSize(option)} 
                                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                                  selectedSize === option ? 'border-gold bg-gold/10 text-gold' : 'border-slate-100 dark:border-slate-800 bg-transparent'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                          <div className="pt-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">{lang === 'ar' ? 'رابط الملف:' : 'File Link:'}</label>
                            <input type="text" value={downloadLink} onChange={(e) => setDownloadLink(e.target.value)} placeholder="https://halabtech.com/..." className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs focus:border-gold outline-none" />
                          </div>
                        </div>
                      )}

                      {/* Regular Quantity for credit/server */}
                      {!selectedProduct.sizeOptions && selectedProduct.id !== 203 && selectedProduct.category !== 'rent' && (
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">{t.quantityLabel}</label>
                          <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border focus:border-gold outline-none font-bold text-center" />
                        </div>
                      )}

                      {/* Remote Credentials */}
                      {selectedProduct.category === 'rent' && (
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">{t.remoteMethod}</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setRemoteTool('ultra')} className={`py-3.5 rounded-xl font-black text-xs uppercase border ${remoteTool === 'ultra' ? 'border-gold bg-gold/5 text-gold' : 'border-slate-100 dark:border-slate-800'}`}>UltraViewer</button>
                            <button onClick={() => setRemoteTool('anydesk')} className={`py-3.5 rounded-xl font-black text-xs uppercase border ${remoteTool === 'anydesk' ? 'border-rose-500 bg-rose-500/5 text-rose-500' : 'border-slate-100 dark:border-slate-800'}`}>AnyDesk</button>
                          </div>
                          {remoteTool === 'ultra' ? (
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder={t.ultraId} value={ultraId} onChange={(e) => setUltraId(e.target.value)} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs focus:border-gold outline-none font-bold" />
                              <input type="text" placeholder={t.ultraPass} value={ultraPass} onChange={(e) => setUltraPass(e.target.value)} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs focus:border-gold outline-none font-bold" />
                            </div>
                          ) : (
                            <input type="text" placeholder={t.anyDeskId} value={anyDeskId} onChange={(e) => setAnyDeskId(e.target.value)} className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs focus:border-rose-500 outline-none font-bold" />
                          )}
                        </div>
                      )}

                      {/* SN (Serial Number) optional */}
                      {selectedProduct.requiresSN && (
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">{t.snLabel}</label>
                          <input type="text" placeholder="Serial Number (SN)" value={sn} onChange={(e) => setSn(e.target.value)} className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs focus:border-gold outline-none font-bold" />
                        </div>
                      )}

                      {/* Contact Fields */}
                      {(selectedProduct.category === 'credit' || selectedProduct.category === 'server') && (
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">{selectedProduct.category === 'credit' ? t.emailLabel : t.whatsappNumberLabel}</label>
                          <input 
                            type={selectedProduct.category === 'credit' ? 'email' : 'text'} 
                            value={selectedProduct.category === 'credit' ? email : whatsappNumber} 
                            onChange={(e) => selectedProduct.category === 'credit' ? setEmail(e.target.value) : setWhatsappNumber(e.target.value)} 
                            placeholder={selectedProduct.category === 'credit' ? "name@domain.com" : "01xxxxxxxxx"} 
                            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs focus:border-gold outline-none font-bold" 
                          />
                        </div>
                      )}
                    </div>

                    {/* Step 3: Payment Type selector */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">{t.paymentMethod}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['vodafone', 'instapay', 'binance', 'paypal'].map(pt => (
                          <button key={pt} onClick={() => setPaymentType(pt as any)} className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${paymentType === pt ? 'border-gold bg-gold/5 text-gold' : 'border-slate-100 dark:border-slate-800/60 bg-transparent'}`}>
                            <span className="text-[8px] font-black uppercase tracking-wider truncate block w-full text-center">{pt}</span>
                          </button>
                        ))}
                      </div>

                      {/* Dynamic instructions based on selection */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs space-y-3">
                        {paymentType === 'vodafone' && (
                          <div className="text-center space-y-2">
                            <p className="font-bold text-slate-400">{t.vodafoneNumberLabel}</p>
                            <span className="text-xl font-mono font-black text-gold block">{VODAFONE_NUMBER}</span>
                            <button onClick={() => handleCopy(VODAFONE_NUMBER, 'cp_v')} className="px-3 py-1 bg-white dark:bg-[#060B18] border rounded font-bold text-[10px]">{copyStatus === 'cp_v' ? t.copied : t.copy}</button>
                            <p className="text-[10px] text-slate-400 leading-tight">{t.instructionVodafone}</p>
                          </div>
                        )}
                        {paymentType === 'instapay' && (
                          <div className="text-center space-y-2">
                            <p className="font-bold text-slate-400">InstaPay Address / Number</p>
                            <span className="text-xl font-mono font-black text-gold block">{INSTAPAY_NUMBER}</span>
                            <button onClick={() => handleCopy(INSTAPAY_NUMBER, 'cp_i')} className="px-3 py-1 bg-white dark:bg-[#060B18] border rounded font-bold text-[10px]">{copyStatus === 'cp_i' ? t.copied : t.copy}</button>
                            <p className="text-[10px] text-slate-400 leading-tight">{t.instructionInstapay}</p>
                          </div>
                        )}
                        {paymentType === 'binance' && (
                          <div className="text-center space-y-2">
                            <p className="font-bold text-slate-400">{t.binanceIdLabel}</p>
                            <span className="text-xl font-mono font-black text-gold block">{BINANCE_ID}</span>
                            <button onClick={() => handleCopy(BINANCE_ID, 'cp_b')} className="px-3 py-1 bg-white dark:bg-[#060B18] border rounded font-bold text-[10px]">{copyStatus === 'cp_b' ? t.copied : t.copy}</button>
                            <p className="text-[10px] text-slate-400 leading-tight">{t.instructionBinance}</p>
                          </div>
                        )}
                        {paymentType === 'paypal' && (
                          <div className="text-center space-y-2">
                            <a href={PAYPAL_LINK} target="_blank" rel="noreferrer" className="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs uppercase transition-colors">PayPal Link</a>
                            <p className="text-[10px] text-slate-400 leading-tight">{t.instructionPaypal}</p>
                          </div>
                        )}

                        <input 
                          type="text"
                          value={paymentType === 'binance' ? binanceTx : senderPhone}
                          onChange={(e) => paymentType === 'binance' ? setBinanceTx(e.target.value) : setSenderPhone(e.target.value)}
                          placeholder={paymentType === 'binance' ? t.binanceTxPlaceholder : t.senderPhonePlaceholder}
                          className="w-full p-3.5 bg-white dark:bg-[#060B18] border rounded-xl text-xs font-bold outline-none text-center"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                      onClick={handleFinalOrder} 
                      disabled={!isFormValid()} 
                      className={`w-full py-5 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 ${
                        isFormValid() 
                          ? 'bg-gold text-[#060B18] shadow-md hover:bg-[#D4B06A]' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <span>{t.confirmOrder}</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN POPUP: ADD / EDIT PRODUCT */}
      <AnimatePresence>
        {(isAddingProduct || editingProduct) && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0D1425] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-white dark:bg-[#0D1425]">
                <h3 className="font-black text-slate-900 dark:text-white text-base font-display uppercase">
                  {editingProduct ? t.adminEditProduct : t.adminAddProduct}
                </h3>
                <button 
                  onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProductForm} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
                {/* Name Ar */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{t.adminProductNameAr} *</label>
                  <input type="text" required value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
                </div>

                {/* Name En */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{t.adminProductNameEn}</label>
                  <input type="text" value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
                </div>

                {/* Price and Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">{t.adminProductPrice} *</label>
                    <input type="number" step="0.01" required value={formPrice} onChange={(e) => setFormPrice(Number(e.target.value) || 0)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">{t.adminProductDuration}</label>
                    <input type="text" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="6 hours" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
                  </div>
                </div>

                {/* Image Link */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{t.adminProductImage} *</label>
                  <input type="text" required value={formImage} onChange={(e) => setFormImage(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
                </div>

                {/* Category selector */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{t.adminProductCategory}</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as any)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold outline-none text-slate-800 dark:text-slate-200">
                    <option value="rent">{t.rentalsTab}</option>
                    <option value="credit">{t.creditsTab}</option>
                    <option value="server">{t.serverTab}</option>
                  </select>
                </div>

                {/* Tooltip Description */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tooltip / Description</label>
                  <textarea value={formTooltip} onChange={(e) => setFormTooltip(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold h-16 resize-none" />
                </div>

                {/* Toggles */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="font-bold text-slate-400">{t.adminProductAvailable}</span>
                  <input type="checkbox" checked={formIsAvailable} onChange={(e) => setFormIsAvailable(e.target.checked)} className="w-4 h-4 text-gold" />
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="font-bold text-slate-400">Requires SN (Serial Number)</span>
                  <input type="checkbox" checked={formRequiresSN} onChange={(e) => setFormRequiresSN(e.target.checked)} className="w-4 h-4 text-gold" />
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold">
                    {t.adminCancelButton}
                  </button>
                  <button type="submit" className="flex-1 py-3.5 bg-gold text-[#060B18] rounded-xl font-black">
                    {t.adminSaveButton}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
