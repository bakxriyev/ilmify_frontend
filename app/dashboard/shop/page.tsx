'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { shopApi, ShopProduct, StudentPurchase } from '@/lib/api';
import { ShoppingBag, Package, X, Plus, Minus, Loader2 } from 'lucide-react';
import Image from 'next/image';

// Rasm URL yordamchisi
const getImageUrl = (photo: string | null): string => {
  if (!photo) return '/images/placeholder.png';
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';
  return `${base}/uploads/shop/${photo}`;
};

// Mahsulot modal oynasi uchun prop
interface ProductModalProps {
  product: ShopProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (productId: number, quantity: number) => Promise<void>;
  isPurchasing: boolean;
}

function ProductModal({ product, isOpen, onClose, onPurchase, isPurchasing }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const handlePurchase = async () => {
    await onPurchase(product.id, quantity);
    onClose();
    setQuantity(1); // reset
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Rasm */}
          {product.photo && (
            <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
              <img
                src={getImageUrl(product.photo)}
                alt={product.name}
                className="object-contain w-full h-full"
              />
            </div>
          )}

          {/* Tafsilotlar */}
          <div className="space-y-3">
            <p className="text-gray-700">{product.description}</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Narxi:</span>
              <span className="font-bold text-yellow-600">{product.price_in_coins} coin</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Qolgan soni:</span>
              <span className="font-semibold">{product.quantity} dona</span>
            </div>
            {product.size && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hajmi:</span>
                <span>{product.size}</span>
              </div>
            )}
          </div>

          {/* Miqdor tanlash */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="font-medium">Miqdor:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
                disabled={quantity >= product.quantity}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sotib olish tugmasi */}
          <button
            onClick={handlePurchase}
            disabled={isPurchasing || product.quantity === 0}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPurchasing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" />
                Sotib olish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { user } = useAuth();
  const studentId = user?.id ? Number(user.id) : null;

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [purchases, setPurchases] = useState<StudentPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Ma'lumotlarni yuklash
  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, purchasesData] = await Promise.all([
          shopApi.getProducts(),
          shopApi.getStudentPurchases(studentId),
        ]);
        setProducts(productsData);
        setPurchases(purchasesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  // Sotib olish funksiyasi
  const handlePurchase = async (productId: number, quantity: number) => {
    if (!studentId) return;
    setIsPurchasing(true);
    try {
      await shopApi.purchaseProduct({
        product_id: productId,
        quantity,
        student_id: studentId,
      });
      // Mahsulotlar va buyurtmalarni qayta yuklash
      const [updatedProducts, updatedPurchases] = await Promise.all([
        shopApi.getProducts(),
        shopApi.getStudentPurchases(studentId),
      ]);
      setProducts(updatedProducts);
      setPurchases(updatedPurchases);
    } catch (err: any) {
      alert(err.message || 'Xarid amalga oshmadi');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!studentId) return <div className="p-8 text-center">Iltimos, tizimga kiring.</div>;
  if (loading) return <div className="p-8 text-center">Yuklanmoqda...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Xatolik: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900">Shop</h1>
            <p className="text-gray-500 text-lg">Buy books! Because it is the best investment</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-5 py-2.5 rounded-xl font-medium transition ${
                activeTab === 'products'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="inline mr-2 h-4 w-4" />
              Mahsulotlar
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl font-medium transition ${
                activeTab === 'orders'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className="inline mr-2 h-4 w-4" />
              Mening xaridlarim
            </button>
          </div>
        </div>

        {/* Tabs content */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setIsModalOpen(true);
                }}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer group border border-gray-100 overflow-hidden"
              >
                {/* Rasm qismi */}
                <div className="h-40 bg-gray-100 flex items-center justify-center p-4">
                  {product.photo ? (
                    <img
                      src={getImageUrl(product.photo)}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                    />
                  ) : (
                    <ShoppingBag className="h-16 w-16 text-gray-300" />
                  )}
                </div>
                {/* Tafsilotlar */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 h-10">{product.description}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-yellow-600 font-bold">{product.price_in_coins} coin</span>
                    <span className="text-sm text-gray-500">Qoldiq: {product.quantity}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                      setIsModalOpen(true);
                    }}
                    className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition"
                  >
                    Sotib olish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            {purchases.length === 0 ? (
              <p className="text-center text-gray-500 py-10">Siz hali hech narsa sotib olmagansiz.</p>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50"
                  >
                    {/* Rasm */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {purchase.product.photo ? (
                        <img
                          src={getImageUrl(purchase.product.photo)}
                          alt={purchase.product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    {/* Ma'lumot */}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{purchase.product.name}</h4>
                      <p className="text-sm text-gray-500">
                        Soni: {purchase.quantity}  |  Narxi: {purchase.product.price_in_coins} coin/dona
                      </p>
                      <p className="text-xs text-gray-400">
                        Sotib olingan: {new Date(purchase.createdAt).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-yellow-600">
                        {purchase.quantity * purchase.product.price_in_coins} coin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mahsulot modal oynasi */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPurchase={handlePurchase}
        isPurchasing={isPurchasing}
      />
    </div>
  );
}