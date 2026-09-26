import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Admin from './Admin'
import Requisites from './Requisites'
import './App.css'

const YOOMONEY_WALLET = '4100119639377973'

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

  const [myOrders, setMyOrders] = useState([])
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState(null)

  const [authOpen, setAuthOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const [orderSuccess, setOrderSuccess] = useState(null)
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

  async function loadMyOrders() {
    if (!user?.id) return

    setOrdersLoading(true)

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Ошибка загрузки заказов:', error)
      setMyOrders([])
    } else {
      setMyOrders(data || [])
    }

    setOrdersLoading(false)
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

  // Переход на официальную форму оплаты ЮMoney
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
          user_id: user?.id || null,
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'pending',
          delivery_method: 'СДЭК',
          customer_name:
            user?.user_metadata?.name || 'Покупатель',
          customer_phone: 'Не указан',
          customer_email: user?.email || null,
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

      // Закрываем корзину и сразу отправляем покупателя на ЮMoney
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
    setOrdersOpen(false)
    setMyOrders([])
  }

  if (window.location.pathname === '/requisites') {
    return <Requisites />
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

          <p className="logo-subtitle">
            <span>MUSIC</span>
            <b>•</b>
            <span>PONIES</span>
          </p>

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
                  onClick={() => {
                    setOrdersOpen(true)
                    loadMyOrders()
                  }}
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

          <h1 className="hero-title">
            Музыка, пони и всё интересное.
          </h1>

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

      <section className="category-showcase">
        <div
          className="category-card mlp-category"
          onClick={() => {
            setCategoryFilter('MLP')

            document
              .getElementById('catalog')
              ?.scrollIntoView({
                behavior: 'smooth',
              })
          }}
        >
          <span>🦄</span>
          <h2>MLP</h2>

          <p>
            Коллекционные товары
            <br />
            для фанатов.
          </p>
        </div>

        <div
          className="category-card music-category"
          onClick={() => {
            setCategoryFilter('Музыка')

            document
              .getElementById('catalog')
              ?.scrollIntoView({
                behavior: 'smooth',
              })
          }}
        >
          <span>🎵</span>
          <h2>Музыка</h2>

          <p>
            Всё для тех,
            <br />
            кто любит музыку.
          </p>
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
              {['Все', 'Музыка', 'MLP'].map(
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
      </footer>

      {ordersOpen && (
        <div
          className="cart-overlay"
          onClick={() => setOrdersOpen(false)}
        >
          <aside
            className="cart orders-cart"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="cart-header">
              <div>
                <p className="orders-label">
                  ЛИЧНЫЙ КАБИНЕТ
                </p>

                <h2>Мои заказы</h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setOrdersOpen(false)
                }
              >
                ×
              </button>
            </div>

            {ordersLoading ? (
              <div className="cart-empty">
                <div className="loader"></div>

                <h3>Загрузка заказов...</h3>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="cart-empty">
                <div className="empty-icon">📦</div>

                <h3>Заказов пока нет</h3>

                <p>
                  Здесь появятся твои покупки.
                </p>
              </div>
            ) : (
              <div className="orders-list">
                {myOrders.map((order) => {
                  const isExpanded =
                    expandedOrder === order.id

                  const itemsCount =
                    order.order_items?.reduce(
                      (sum, item) =>
                        sum +
                        Number(item.quantity || 0),
                      0,
                    ) || 0

                  const statusText =
                    order.status === 'pending'
                      ? 'В обработке'
                      : order.status

                  return (
                    <div
                      className={`order-card ${
                        isExpanded
                          ? 'order-card-expanded'
                          : ''
                      }`}
                      key={order.id}
                    >
                      <button
                        type="button"
                        className="order-card-main"
                        onClick={() =>
                          setExpandedOrder(
                            isExpanded
                              ? null
                              : order.id,
                          )
                        }
                      >
                        <div className="order-card-top">
                          <div>
                            <span className="order-number-label">
                              ЗАКАЗ
                            </span>

                            <h3>
                              {order.order_number}
                            </h3>
                          </div>

                          <span className="order-status">
                            {statusText}
                          </span>
                        </div>

                        <div className="order-card-info">
                          <div>
                            <span>Сумма</span>

                            <strong>
                              {Number(
                                order.total || 0,
                              ).toLocaleString(
                                'ru-RU',
                              )}{' '}
                              ₽
                            </strong>
                          </div>

                          <div>
                            <span>Оплата</span>

                            <strong
                              className={
                                order.payment_status ===
                                'paid'
                                  ? 'payment-paid'
                                  : 'payment-pending'
                              }
                            >
                              {order.payment_status ===
                              'paid'
                                ? '✓ Оплачено'
                                : 'Ожидает оплаты'}
                            </strong>
                          </div>

                          <div>
                            <span>Товары</span>

                            <strong>
                              {itemsCount} шт.
                            </strong>
                          </div>
                        </div>

                        <div className="order-card-bottom">
                          <span>🚚 СДЭК</span>

                          <span className="order-expand">
                            {isExpanded
                              ? 'Скрыть товары ↑'
                              : 'Показать товары ↓'}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="order-details">
                          <div className="order-details-title">
                            Товары в заказе
                          </div>

                          {order.order_items?.map(
                            (item) => (
                              <div
                                className="order-product"
                                key={item.id}
                              >
                                <div className="order-product-image">
                                  {item.product_image ? (
                                    <img
                                      src={
                                        item.product_image
                                      }
                                      alt={
                                        item.product_name
                                      }
                                    />
                                  ) : (
                                    <span>♫</span>
                                  )}
                                </div>

                                <div className="order-product-info">
                                  <h4>
                                    {item.product_name}
                                  </h4>

                                  <span>
                                    {Number(
                                      item.quantity || 0,
                                    )}{' '}
                                    шт. ×{' '}
                                    {Number(
                                      item.price || 0,
                                    ).toLocaleString(
                                      'ru-RU',
                                    )}{' '}
                                    ₽
                                  </span>
                                </div>

                                <strong>
                                  {(
                                    Number(
                                      item.price || 0,
                                    ) *
                                    Number(
                                      item.quantity || 0,
                                    )
                                  ).toLocaleString(
                                    'ru-RU',
                                  )}{' '}
                                  ₽
                                </strong>
                              </div>
                            ),
                          )}

                          {order.cdek_track && (
                            <div className="order-track">
                              <span>
                                🚚 Трек-номер СДЭК
                              </span>

                              <strong>
                                {order.cdek_track}
                              </strong>
                            </div>
                          )}

                          <div className="order-details-total">
                            <span>Итого</span>

                            <strong>
                              {Number(
                                order.total || 0,
                              ).toLocaleString(
                                'ru-RU',
                              )}{' '}
                              ₽
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </aside>
        </div>
      )}

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