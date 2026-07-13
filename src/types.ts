export interface Product {
  id: number;
  name: string;
  nameEn?: string;
  priceUsd: number;
  duration?: string;
  image: string;
  category: 'rent' | 'credit' | 'server';
  minQty?: number;
  maxQty?: number;
  sizeOptions?: string[];
  sizePrices?: { [key: string]: number };
  tooltip?: string;
  requiresSN?: boolean;
  downloadLink?: string;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface Order {
  id: number;
  productName: string;
  productImage: string;
  category: Product['category'];
  priceUsd: number;
  quantity: number;
  totalPrice: string;
  status: OrderStatus;
  timestamp: number;
  paymentType: PaymentType;
  details: {
    sn?: string;
    email?: string;
    whatsappNumber?: string;
    remoteTool?: RemoteTool;
    ultraId?: string;
    anyDeskId?: string;
    size?: string;
  };
}

export type Language = 'ar' | 'en';
export type Currency = 'USD' | 'EGP';
export type OrderStatus = 'pending' | 'accepted' | 'rejected';
export type RemoteTool = 'ultra' | 'anydesk';
export type PaymentType = 'vodafone' | 'binance' | 'instapay' | 'paypal';
