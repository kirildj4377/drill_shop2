'use client';
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Check,
  Trash2,
  Send,
  Package,
} from 'lucide-react';

// Пример структуры данных, которую вы будете отдавать из вашей таблицы (CSV/Google Sheets/JSON)
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Сверло по металлу HSS-Co 6.0 мм',
    category: 'Сверла',
    price: 180,
    inStock: true,
    specs: 'Кобльт 5%, DIN 338',
  },
  {
    id: 2,
    name: 'Бур SDS-Plus 10x160 мм',
    category: 'Буры',
    price: 250,
    inStock: true,
    specs: 'Для бетона, 2 кромки',
  },
  {
    id: 3,
    name: 'Коронка алмазная по бетону 68 мм',
    category: 'Коронки',
    price: 1450,
    inStock: true,
    specs: 'М14, сухое резание',
  },
  {
    id: 4,
    name: 'Метчик машинно-ручной М8x1.25 HSS',
    category: 'Метчики',
    price: 320,
    inStock: true,
    specs: 'Комплект 2 шт',
  },
  {
    id: 5,
    name: 'Сверло ступенчатое 4-32 мм HSS-TiN',
    category: 'Сверла',
    price: 890,
    inStock: true,
    specs: 'Покрытие нитрид титана',
  },
  {
    id: 6,
    name: 'Плашка M10x1.5 9XC',
    category: 'Плашки',
    price: 210,
    inStock: true,
    specs: 'Инструментальная сталь',
  },
];

const CATEGORIES = ['Все', 'Сверла', 'Буры', 'Коронки', 'Метчики', 'Плашки'];

// Вставьте сюда данные вашего бота
const TELEGRAM_BOT_TOKEN = '9165001474:AAF2LOnpTU6ZdxiQ2g78AW9bMBG6qv-xpHM';
const TELEGRAM_CHAT_ID = '-5304119008';

export default function ShopApp() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  // Фильтрация товаров по категории и поиску
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'Все' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.specs.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Работа с корзиной
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, count: item.count + 1 } : item
        );
      }
      return [...prev, { ...product, count: 1 }];
    });
  };

  const updateCount = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, count: item.count + delta } : item
        )
        .filter((item) => item.count > 0)
    );
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.count,
    0
  );

  // Отправка заказа в Telegram
  const handleSendOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || !customer.phone) return;

    setIsSubmitting(true);

    const itemsText = cart
      .map(
        (item) =>
          `• <b>${item.name}</b> x ${item.count} шт. = ${
            item.price * item.count
          } грн`
      )
      .join('\n');

    const message = `
🛒 <b>НОВЫЙ ЗАКАЗ С САЙТА</b>

👤 <b>Имя:</b> ${customer.name || 'Не указано'}
📞 <b>Телефон:</b> ${customer.phone}
💬 <b>Комментарий:</b> ${customer.comment || 'Нет'}

📦 <b>Состав заказа:</b>
${itemsText}

💰 <b>Итого к оплате:</b> ${totalPrice} грн
    `;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );

      if (response.ok) {
        setOrderSent(true);
        setCart([]);
        setTimeout(() => {
          setOrderSent(false);
          setIsCartOpen(false);
        }, 3000);
      } else {
        alert('Ошибка при отправке заказа. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка соединения с сервером.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Шапка */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-7 h-7 text-amber-500" />
            <h1 className="text-xl font-bold tracking-wide">
              PRO-Tool | Оснастка и Инструмент
            </h1>
          </div>
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
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Поиск и категории */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск сверла, диаметра, типа (например: 68 мм, SDS, HSS)..."
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

        {/* Сетка товаров */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-lg transition"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  {product.category}
                </span>
                <h3 className="font-bold text-lg text-slate-800 mt-2">
                  {product.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{product.specs}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <span className="text-2xl font-black text-slate-900">
                    {product.price}
                  </span>
                  <span className="text-sm font-medium text-slate-500 ml-1">
                    грн
                  </span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>В корзину</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Товары по вашему запросу не найдены.
          </div>
        )}
      </main>

      {/* Окно Корзины */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-xl font-bold text-slate-900">Корзина</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {orderSent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Заказ принят!
                </h3>
                <p className="text-slate-500 mt-2">
                  Мы уже начали его обрабатывать и свяжемся с вами в ближайшее
                  время.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      Корзина пуста
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border-b border-slate-100 pb-3"
                      >
                        <div className="flex-1 pr-2">
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <span className="text-xs text-slate-500">
                            {item.price} грн / шт.
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCount(item.id, -1)}
                            className="w-6 h-6 border rounded font-bold"
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold">
                            {item.count}
                          </span>
                          <button
                            onClick={() => updateCount(item.id, 1)}
                            className="w-6 h-6 border rounded font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <form
                    onSubmit={handleSendOrder}
                    className="pt-4 border-t border-slate-200 space-y-3"
                  >
                    <div className="flex justify-between font-bold text-lg mb-2">
                      <span>Итого:</span>
                      <span>{totalPrice} грн</span>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Ваше имя"
                        value={customer.name}
                        onChange={(e) =>
                          setCustomer({ ...customer, name: e.target.value })
                        }
                        className="w-full p-2.5 border rounded-lg text-sm border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="Номер телефона *"
                        value={customer.phone}
                        onChange={(e) =>
                          setCustomer({ ...customer, phone: e.target.value })
                        }
                        className="w-full p-2.5 border rounded-lg text-sm border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <textarea
                        placeholder="Комментарий или адрес доставки"
                        value={customer.comment}
                        onChange={(e) =>
                          setCustomer({ ...customer, comment: e.target.value })
                        }
                        className="w-full p-2.5 border rounded-lg text-sm border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none h-20"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-amber-500 hover:bg-amber-600 font-bold py-3 rounded-lg text-slate-900 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isSubmitting ? 'Отправка...' : 'Оформить заказ'}
                      </span>
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
