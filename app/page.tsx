'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Check, Trash2, Send, Package, RefreshCw, Image as ImageIcon, X } from 'lucide-react';

const CATEGORIES = ['Все', 'Сверло', 'Сверла', 'Бур', 'Буры', 'Коронка', 'Коронки', 'Метчик', 'Метчики', 'Плашка', 'Плашки'];

const TELEGRAM_BOT_TOKEN = '9165001474:AAF2LOnpTU6ZdxiQ2g78AW9bMBG6qv-xpHM';
const TELEGRAM_CHAT_ID = '-5304119008';

export default function ShopApp() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any>(null); // Для модального окна товара
  const [customer, setCustomer] = useState({ name: '', phone: '', comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  // Загрузка товаров из Google Таблицы (через CSV-ссылку)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTnNXX-vE88eqintLKDluTAtlHDp7HQ-wo_uNBbaB9SKcidb9oWd44VlckmSehp5q4Ps1eIce_e-8uS/pub?output=csv';
      
      const response = await fetch(SHEET_CSV_URL);
      const data = await response.text();
      
      const rows = data.split('\n').map(row => row.split(','));
      const headers = rows[0].map(h => h.trim().replace(/"/g, ''));
      
      const parsedProducts = rows.slice(1).map((row, index) => {
        if (row.length < headers.length) return null;
        let item: any = { id: index + 1 };
        headers.forEach((header, i) => {
          let val: any = row[i] ? row[i].trim().replace(/"/g, '') : '';
          if (header === 'price') val = Number(val) || 0;
          item[header] = val;
        });
        return item.name ? item : null;
      }).filter(Boolean);

      setProducts(parsedProducts);
    } catch (error) {
      console.error('Ошибка загрузки таблицы', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Фильтрация товаров
  const filteredProducts = products.filter((product) => {
    const prodCategory = product.category ? product.category.trim().toLowerCase() : '';
    const selCategory = selectedCategory.trim().toLowerCase();
    
    const matchesCategory = selectedCategory === 'Все' || prodCategory === selCategory;
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.specs?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Корзина
  const addToCart = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // чтобы при клике на кнопку не открывалось модальное окно товара
    setCart((prev: any[]) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, count: item.count + 1 } : item);
      }
      return [...prev, { ...product, count: 1 }];
    });
  };

  const updateCount = (id: any, delta: any) => {
    setCart((prev: any[]) =>
      prev
        .map((item) => (item.id === id ? { ...item, count: item.count + delta } : item))
        .filter((item) => item.count > 0)
    );
  };

  const totalPrice = cart.reduce((sum, item) => sum + Number(item.price) * item.count, 0);

  // Отправка в Telegram
  const handleSendOrder = async (e: any) => {
    e.preventDefault();
    if (cart.length === 0 || !customer.phone) return;

    setIsSubmitting(true);
    const itemsText = cart
      .map((item) => `• <b>${item.name}</b> x ${item.count} шт. = ${Number(item.price) * item.count} грн`)
      .join('\n');

    const message = `
🛒 <b>НОВЫЙ ЗАКАЗ С САЙТА</b>

👤 <b>Имя:</b> ${customer.name || 'Не указано'}
📞 <b>Телефон:</b> ${customer.phone}
💬 <b>Комментарий:</b> ${customer.comment || 'Нет'}

📦 <b>Состав заказа:</b>
${itemsText}

💰 <b>Итого:</b> ${totalPrice} грн
    `;

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (response.ok) {
        setOrderSent(true);
        setCart([]);
        setTimeout(() => {
          setOrderSent(false);
          setIsCartOpen(false);
        }, 3000);
      } else {
        alert('Ошибка отправки в Telegram');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-7 h-7 text-amber-500" />
            <h1 className="text-xl font-bold tracking-wide">PRO-Tool | Каталог оснастки</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchProducts}
              title="Обновить товары из таблицы"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Корзина</span>
              {cart.length > 0 && (
                <span className="bg-slate-900 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {cart.reduce((sum, i) => sum + i.count, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию или характеристикам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Загрузка товаров из таблицы...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div 
  key={product.id} 
  onClick={() => setActiveProduct(product)}
  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between hover:shadow-xl cursor-pointer transition transform hover:-translate-y-1 relative z-10"
>
  {/* Картинка товара с защитой от битых ссылок */}
  <div className="w-full h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden border-b border-slate-100">
    {product.image ? (
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-cover"
        onError={(e: any) => {
          // Если ссылка в таблице битая, картинка скрывается, а заглушка остается
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    ) : null}
    
    {/* Заглушка, если ссылки нет или картинка не загрузилась */}
    <div className={`flex-col items-center text-slate-400 ${product.image ? 'hidden' : 'flex'}`}>
      <ImageIcon className="w-10 h-10 mb-1 opacity-50" />
      <span className="text-xs">Нет фото</span>
    </div>

    <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 backdrop-blur-sm px-2 py-0.5 rounded">
      {product.category}
    </span>
  </div>

  <div className="p-5 flex-1 flex flex-col justify-between">
    <div>
      <h3 className="font-bold text-base text-slate-800 leading-snug">{product.name}</h3>
      <p className="text-xs text-slate-500 mt-1">{product.specs}</p>
    </div>

    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
      <div>
        <span className="text-xl font-black text-slate-900">{product.price}</span>
        <span className="text-xs font-medium text-slate-500 ml-1">грн</span>
      </div>
      <button
        onClick={(e) => addToCart(product, e)}
        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition z-20 relative"
      >
        <ShoppingCart className="w-4 h-4" />
        <span>В корзину</span>
      </button>
    </div>
  </div>
</div>
            ))}
          </div>
        )}
      </main>

      {/* Модальное окно карточки товара */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]">
            <button 
              onClick={() => setActiveProduct(null)} 
              className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Картинка в модалке */}
            <div className="w-full md:w-1/2 bg-slate-100 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100">
              {activeProduct.image ? (
                <img src={activeProduct.image} alt={activeProduct.name} className="max-h-72 object-contain rounded-lg" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 py-16">
                  <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                  <span className="text-sm">Нет изображения</span>
                </div>
              )}
            </div>

            {/* Информация в модалке */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  {activeProduct.category}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{activeProduct.name}</h2>
                
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Характеристики:</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {activeProduct.specs || 'Не указаны'}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Описание:</h4>
                  <p className="text-sm text-slate-600">
                    {activeProduct.description || 'Профессиональная оснастка высокого качества для стабильной и долговечной работы.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900">{activeProduct.price}</span>
                  <span className="text-sm font-medium text-slate-500 ml-1">грн</span>
                </div>
                <button
                  onClick={() => {
                    addToCart(activeProduct);
                    setActiveProduct(null);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>В корзину</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Окно корзины */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-xl font-bold text-slate-900">Ваш заказ</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            {orderSent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Заказ успешно отправлен!</h3>
                <p className="text-slate-500 mt-2">Менеджер свяжется с вами в Telegram или по телефону.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Корзина пуста</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="flex-1 pr-2">
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <span className="text-xs text-slate-500">{item.price} грн / шт.</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => updateCount(item.id, -1)} className="w-6 h-6 border rounded font-bold">-</button>
                          <span className="text-sm font-semibold">{item.count}</span>
                          <button onClick={() => updateCount(item.id, 1)} className="w-6 h-6 border rounded font-bold">+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <form onSubmit={handleSendOrder} className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between font-bold text-lg mb-2">
                      <span>Итого:</span>
                      <span>{totalPrice} грн</span>
                    </div>

                    <input
                      type="text"
                      placeholder="Ваше имя"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-sm border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Номер телефона *"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-sm border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <textarea
                      placeholder="Комментарий или адрес доставки"
                      value={customer.comment}
                      onChange={(e) => setCustomer({ ...customer, comment: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-sm border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none h-20"
                    ></textarea>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-amber-500 hover:bg-amber-600 font-bold py-3 rounded-lg text-slate-900 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Отправка...' : 'Отправить заказ в Telegram'}</span>
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
