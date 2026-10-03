import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Admin from './Admin'
import Requisites from './Requisites'
import './App.css'

const YOOMONEY_WALLET = '4100119639377973'

function LegalPage({ type }) {
  const pages = {
    offer: {
      title: 'Публичная оферта',
      text: (
        <>
          <p>
            Настоящая страница содержит основные условия продажи товаров
            через YouTubeOS Shop.
          </p>

          <h3>1. Общие положения</h3>
          <p>
            YouTubeOS Shop предоставляет информацию о товарах, их стоимости,
            наличии, способах оплаты и доставки.
          </p>

          <h3>2. Заказ товара</h3>
          <p>
            Покупатель оформляет заказ через сайт. После оформления заказа
            информация о заказе сохраняется в системе магазина.
          </p>

          <h3>3. Оплата</h3>
          <p>
            Оплата производится способом, указанным на странице оформления
            заказа.
          </p>

          <h3>4. Доставка</h3>
          <p>
            Доставка осуществляется выбранным способом, указанным при
            оформлении заказа.
          </p>

          <h3>5. Возврат</h3>
          <p>
            Условия возврата товара определяются действующим
            законодательством и правилами магазина.
          </p>
        </>
      ),
    },

    privacy: {
      title: 'Политика конфиденциальности',
      text: (
        <>
          <p>
            YouTubeOS Shop уважает конфиденциальность пользователей сайта.
          </p>

          <h3>Какие данные могут использоваться</h3>
          <p>
            Для работы магазина могут обрабатываться данные, необходимые
            для регистрации, оформления заказа, связи с покупателем и
            доставки товара.
          </p>

          <h3>Использование данных</h3>
          <p>
            Полученные данные используются для работы сайта, обработки
            заказов, оплаты, доставки и связи с покупателем.
          </p>

          <h3>Защита данных</h3>
          <p>
            YouTubeOS Shop принимает разумные меры для защиты информации
            пользователей от несанкционированного доступа.
          </p>
        </>
      ),
    },

    delivery: {
      title: 'Доставка и оплата',
      text: (
        <>
          <h3>Доставка</h3>
          <p>
            Доставка товаров осуществляется через службы доставки,
            указанные на сайте. Конкретный способ доставки согласуется
            при оформлении заказа.
          </p>

          <h3>Сроки доставки</h3>
          <p>
            Срок доставки зависит от выбранной службы доставки,
            направления и наличия товара.
          </p>

          <h3>Оплата</h3>
          <p>
            Доступный способ оплаты отображается при оформлении заказа.
          </p>

          <h3>Стоимость доставки</h3>
          <p>
            Стоимость доставки зависит от выбранного способа и
            направления доставки.
          </p>
        </>
      ),
    },

    returns: {
      title: 'Возврат товара',
      text: (
        <>
          <p>
            Возврат и обмен товаров осуществляются в соответствии
            с применимым законодательством и условиями продажи.
          </p>

          <h3>Если товар повреждён</h3>
          <p>
            При получении повреждённого товара рекомендуется сохранить
            упаковку и связаться с поддержкой YouTubeOS Shop.
          </p>

          <h3>Если пришёл другой товар</h3>
          <p>
            Если полученный товар не соответствует заказу, необходимо
            обратиться в поддержку магазина для решения вопроса.
          </p>

          <h3>Связь с магазином</h3>
          <p>
            По вопросам возврата можно обратиться в поддержку:
          </p>

          <p>
            <a
              href="https://t.me/YouTubeOS"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram: @YouTubeOS
            </a>
          </p>
        </>
      ),
    },
  }

  const page = pages[type]

  if (!page) {
    return null
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">
            <span className="logo-main">
              YOUTUBEOS
            </span>

            <span className="logo-shop">
              SHOP
            </span>
          </a>
        </div>
      </header>

      <main className="legal-page">
        <div className="legal-page-inner">
          <a href="/" className="legal-back">
            ← Вернуться в магазин
          </a>

          <p className="section-label">
            YOUTUBEOS SHOP
          </p>

          <h1>{page.title}</h1>

          <div className="legal-content">
            {page.text}
          </div>
        </div>
      </main>

      <footer className="footer">
        <div>
          <strong>YouTubeOS Shop</strong>

          <p>
            © {new Date().getFullYear()} YouTubeOS Shop
          </p>
        </div>

        <a
          href="https://t.me/YouTubeOS"
          target="_blank"
          rel="noopener noreferrer"
          className="header-button"
        >
          Поддержка
        </a>
      </footer>
    </div>
  )
}


function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Все')

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('YouTubeOS_Shop_cart')
      if (!saved) return []

      const parsed = JSON.parse(saved)

      if (!Array.isArray(parsed)) return []

      return parsed.map((item) => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }))
    } catch {
      return []
    }
  })

  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState(null)

  const [authOpen, setAuthOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const [checkoutLoading, setCheckoutLoading] = useState(false)

  async function loadProducts() {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Ошибка загрузки товаров:', error)
      setProducts([])
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  async function loadUser() {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    setUser(currentUser || null)

    if (!currentUser) {
      setIsAdmin(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (error) {
      console.error('Ошибка проверки роли:', error)
      setIsAdmin(false)
      return
    }

    setIsAdmin(data?.role === 'admin')
  }

  useEffect(() => {
    loadProducts()
    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        'YouTubeOS_Shop_cart',
        JSON.stringify(cart),
      )
    } catch (error) {
      console.error('Ошибка сохранения корзины:', error)
    }
  }, [cart])

  const filteredProducts = useMemo(() => {
    const text = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        !text ||
        product.name?.toLowerCase().includes(text) ||
        product.description?.toLowerCase().includes(text) ||
        product.category?.toLowerCase().includes(text)

      const matchesCategory =
        categoryFilter === 'Все' ||
        product.category?.toLowerCase() ===
          categoryFilter.toLowerCase()

      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  const cartCount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    )
  }, [cart])

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0,
    )
  }, [cart])

  function addToCart(product) {
    if (!product?.id) return

    setCart((current) => {
      const existing = current.find(
        (item) => String(item.id) === String(product.id),
      )

      if (existing) {
        return current.map((item) =>
          String(item.id) === String(product.id)
            ? {
                ...item,
                quantity: Number(item.quantity || 0) + 1,
              }
            : item,
        )
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name || 'Товар',
          price: Number(product.price) || 0,
          image_url: product.image_url || '',
          quantity: 1,
        },
      ]
    })

    setCartOpen(true)
  }

  function increaseQuantity(id) {
    setCart((current) =>
      current.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              quantity: Number(item.quantity || 0) + 1,
            }
          : item,
      ),
    )
  }

  function decreaseQuantity(id) {
    setCart((current) =>
      current
        .map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                quantity: Number(item.quantity || 0) - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function removeFromCart(id) {
    setCart((current) =>
      current.filter(
        (item) => String(item.id) !== String(id),
      ),
    )
  }

  function goToYooMoneyPayment(orderNumber, total) {
    const form = document.createElement('form')

    form.method = 'POST'
    form.action = 'https://yoomoney.ru/quickpay/confirm'
    form.style.display = 'none'

    const fields = {
      receiver: YOOMONEY_WALLET,
      'quickpay-form': 'button',
      paymentType: 'AC',
      sum: Number(total).toFixed(2),
      label: orderNumber,
    }

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input')

      input.type = 'hidden'
      input.name = name
      input.value = value

      form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()
  }

  async function checkout() {
    if (cart.length === 0 || checkoutLoading) return

    if (!user) {
      alert('Сначала войди в аккаунт')
      setAuthOpen(true)
      return
    }

    setCheckoutLoading(true)

    try {
      for (const item of cart) {
        const { data: product, error } = await supabase
          .from('products')
          .select('stock, name')
          .eq('id', item.id)
          .single()

        if (error) throw error

        if (Number(product.stock) < Number(item.quantity)) {
          alert(`Недостаточно товара: ${product.name}`)
          return
        }
      }

      const orderNumber = `PM-${Date.now()
        .toString()
        .slice(-6)}`

      const total = cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0,
      )

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'pending',
          delivery_method: 'СДЭК',
          customer_name:
            user.user_metadata?.name || 'Покупатель',
          customer_phone: 'Не указан',
          customer_email: user.email || null,
          total,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const items = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items)

      if (itemsError) throw itemsError

      for (const item of cart) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single()

        await supabase
          .from('products')
          .update({
            stock: Math.max(
              0,
              Number(product.stock) -
                Number(item.quantity),
            ),
          })
          .eq('id', item.id)
      }

      setCart([])
      setCartOpen(false)

      goToYooMoneyPayment(orderNumber, total)
    } catch (error) {
      console.error('Ошибка оформления:', error)

      alert(
        error.message ||
          'Ошибка оформления заказа',
      )
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()

    setUser(null)
    setIsAdmin(false)
    setAdminOpen(false)
  }

  const pathname = window.location.pathname

  if (pathname === '/requisites') {
    return <Requisites />
  }

  if (pathname === '/offer') {
    return <LegalPage type="offer" />
  }

  if (pathname === '/privacy') {
    return <LegalPage type="privacy" />
  }

  if (pathname === '/delivery') {
    return <LegalPage type="delivery" />
  }

  if (pathname === '/returns') {
    return <LegalPage type="returns" />
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">
            <span className="logo-main">
              YOUTUBEOS
            </span>

            <span className="logo-shop">
              SHOP
            </span>
          </a>

          <div className="search">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  document
                    .getElementById('catalog')
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    })
                }
              }}
              placeholder="Поиск товаров"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="header-actions">
            {isAdmin && (
              <button
                type="button"
                className="header-button"
                onClick={() => setAdminOpen(true)}
              >
                Админка
              </button>
            )}

            {user ? (
              <>
                <button
                  type="button"
                  className="header-button"
                  onClick={() =>
                    alert(
                      'Раздел «Мои заказы» временно обновляется.',
                    )
                  }
                >
                  Мои заказы
                </button>

                <button
                  type="button"
                  className="header-button"
                  onClick={logout}
                >
                  Выйти
                </button>
              </>
            ) : (
              <button
                type="button"
                className="header-button"
                onClick={() => setAuthOpen(true)}
              >
                Войти
              </button>
            )}

            <button
              type="button"
              className="cart-button"
              onClick={() => setCartOpen(true)}
            >
              Корзина

              {cartCount > 0 && (
                <span className="cart-count">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="hero-label">
            YouTubeOS Shop
          </p>

          <p className="hero-text">
            Доставка по всей России и Европе.
          </p>

          <a
            href="#catalog"
            className="hero-button"
          >
            Смотреть каталог
          </a>
        </div>
      </section>

      <section className="catalog" id="catalog">
        <div className="catalog-top">
          <div>
            <p className="section-label">
              КАТАЛОГ
            </p>

            <h2>Наши товары</h2>

            <div className="category-buttons">
              {['Все', 'Музыка'].map(
                (cat) => (
                  <button
                    type="button"
                    key={cat}
                    className={
                      categoryFilter === cat
                        ? 'active-category'
                        : ''
                    }
                    onClick={() =>
                      setCategoryFilter(cat)
                    }
                  >
                    {cat}
                  </button>
                ),
              )}
            </div>
          </div>

          <span className="product-count">
            {filteredProducts.length} товаров
          </span>
        </div>

        {loading ? (
          <div className="empty">
            <div className="loader"></div>

            <h3>Загрузка товаров</h3>

            <p>Подожди немного...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">♫</div>

            <h3>
              {search
                ? 'Ничего не найдено'
                : 'Пока нет товаров'}
            </h3>

            <p>
              {search
                ? 'Попробуй изменить запрос.'
                : 'Товары скоро появятся здесь.'}
            </p>

            {search && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSearch('')}
              >
                Сбросить поиск
              </button>
            )}
          </div>
        ) : (
          <div className="products">
            {filteredProducts.map((product) => (
              <article
                className="product-card"
                key={product.id}
              >
                <div className="product-image">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                    />
                  ) : (
                    <div className="no-image">
                      ♫
                    </div>
                  )}

                  {Number(product.stock) <= 0 && (
                    <div className="sold-out">
                      Нет в наличии
                    </div>
                  )}
                </div>

                <div className="product-info">
                  <div className="category">
                    {product.category || 'ТОВАР'}
                  </div>

                  <h3>{product.name}</h3>

                  <p>
                    {product.description || ''}
                  </p>

                  {Number(product.stock) > 0 ? (
                    <small className="stock-info">
                      Осталось: {product.stock} шт.
                    </small>
                  ) : (
                    <small className="stock-empty">
                      Нет в наличии
                    </small>
                  )}

                  <div className="product-bottom">
                    <strong>
                      {Number(
                        product.price || 0,
                      ).toLocaleString('ru-RU')}{' '}
                      ₽
                    </strong>

                    <button
                      type="button"
                      className="add-button"
                      disabled={
                        Number(product.stock) <= 0
                      }
                      onClick={() =>
                        addToCart(product)
                      }
                    >
                      В корзину
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        <div>
          <strong>YouTubeOS Shop</strong>

          <p>
            © {new Date().getFullYear()} YouTubeOS Shop
          </p>
        </div>

        <div className="footer-links">
          <a href="/offer">
            Публичная оферта
          </a>

          <a href="/privacy">
            Политика конфиденциальности
          </a>

          <a href="/delivery">
            Доставка и оплата
          </a>

          <a href="/returns">
            Возврат товара
          </a>
        </div>

        <a
          href="https://t.me/YouTubeOS"
          target="_blank"
          rel="noopener noreferrer"
          className="header-button"
        >
          Поддержка
        </a>
      </footer>

      {authOpen && (
        <Auth
          onClose={() => {
            setAuthOpen(false)
            loadUser()
          }}
        />
      )}

      {adminOpen && (
        <Admin
          onClose={() => setAdminOpen(false)}
          onProductsChanged={loadProducts}
        />
      )}

      {cartOpen && (
        <div
          className="cart-overlay"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="cart"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="cart-header">
              <h2>Корзина</h2>

              <button
                type="button"
                className="close-button"
                onClick={() => setCartOpen(false)}
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <h3>Корзина пуста</h3>

                <p>
                  Добавь что-нибудь из каталога.
                </p>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map((item) => (
                  <div
                    className="cart-item"
                    key={item.id}
                  >
                    {item.image_url && (
                      <img
                        className="cart-item-image"
                        src={item.image_url}
                        alt={item.name}
                      />
                    )}

                    <div className="cart-item-info">
                      <h3>{item.name}</h3>

                      <strong>
                        {Number(
                          item.price || 0,
                        ).toLocaleString(
                          'ru-RU',
                        )}{' '}
                        ₽
                      </strong>

                      <div className="quantity">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(
                              item.id,
                            )
                          }
                        >
                          −
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(
                              item.id,
                            )
                          }
                        >
                          +
                        </button>

                        <button
                          type="button"
                          className="remove"
                          onClick={() =>
                            removeFromCart(
                              item.id,
                            )
                          }
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="total">
                  <span>Итого</span>

                  <strong>
                    {cartTotal.toLocaleString(
                      'ru-RU',
                    )}{' '}
                    ₽
                  </strong>
                </div>

                <button
                  type="button"
                  className="checkout-button"
                  onClick={checkout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading
                    ? 'Оформляем...'
                    : 'Оформить заказ'}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default App