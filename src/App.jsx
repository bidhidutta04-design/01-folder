import { useEffect, useMemo, useState } from 'react'
import './storefront.css'

const coffeeImages = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=900&q=85',
]

const fallbackProducts = [
  { id: 'coffee-1', name: 'Sunday Morning Blend', description: 'Chocolate, orange peel, toasted almond', price: 18, category: 'Coffee', tag: 'Bestseller', image: coffeeImages[0] },
  { id: 'coffee-2', name: 'Little Flower Espresso', description: 'Caramel, red apple, milk chocolate', price: 19, category: 'Coffee', tag: 'House espresso', image: coffeeImages[1] },
  { id: 'coffee-3', name: 'Cloudline Decaf', description: 'Brown sugar, plum, cocoa nib', price: 20, category: 'Coffee', tag: 'Swiss Water', image: coffeeImages[2] },
  { id: 'coffee-4', name: 'Guatemala La Esperanza', description: 'Peach, panela, jasmine', price: 22, category: 'Coffee', tag: 'Single origin', image: coffeeImages[3] },
  { id: 'gear-1', name: 'Daily Pour-Over Set', description: 'Ceramic dripper, glass server, filters', price: 42, category: 'Gear', tag: 'Made for slow mornings', image: coffeeImages[4] },
  { id: 'gear-2', name: 'House Diner Mug', description: 'Hand-finished stoneware, 12 oz', price: 24, category: 'Gear', tag: 'Small batch', image: coffeeImages[5] },
]

function readCart() {
  try {
    return JSON.parse(localStorage.getItem('morrow-cart') || '[]')
  } catch {
    return []
  }
}

function App() {
  const [products, setProducts] = useState(fallbackProducts)
  const [cart, setCart] = useState(readCart)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('featured')
  const [cartOpen, setCartOpen] = useState(false)
  const [catalogStatus, setCatalogStatus] = useState('Loading fresh picks...')
  const [checkoutStatus, setCheckoutStatus] = useState('')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    fetch('https://api.sampleapis.com/coffee/hot', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Coffee catalog is unavailable')
        return response.json()
      })
      .then((items) => {
        const apiProducts = items.slice(0, 4).map((item, index) => ({
          id: `api-${item.id ?? index}`,
          name: item.title || 'Seasonal Coffee',
          description: item.description || 'A comforting cup, roasted fresh.',
          price: 16 + index * 2,
          category: 'Coffee',
          tag: 'Fresh from the menu',
          image: coffeeImages[index % coffeeImages.length],
        }))

        if (!apiProducts.length) throw new Error('Coffee catalog is empty')
        setProducts([...apiProducts, ...fallbackProducts.filter((item) => item.category === 'Gear')])
        setCatalogStatus('Menu updated from our coffee API')
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setCatalogStatus('Showing our always-in-season menu')
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    localStorage.setItem('morrow-cart', JSON.stringify(cart))
  }, [cart])

  const visibleProducts = useMemo(() => {
    const matching = products.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory
      const matchesSearch = `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })

    if (sort === 'price-low') return [...matching].sort((a, b) => a.price - b.price)
    if (sort === 'price-high') return [...matching].sort((a, b) => b.price - a.price)
    return matching
  }, [activeCategory, products, search, sort])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      return existing
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }]
    })
    setCheckoutStatus('')
    setCartOpen(true)
  }

  function updateQuantity(productId, change) {
    setCart((current) => current
      .map((item) => item.id === productId ? { ...item, quantity: item.quantity + change } : item)
      .filter((item) => item.quantity > 0))
  }

  async function beginCheckout() {
    const checkoutUrl = import.meta.env.VITE_CHECKOUT_API_URL
    if (!checkoutUrl) {
      setCheckoutStatus('Add VITE_CHECKOUT_API_URL to connect your checkout service.')
      return
    }

    setCheckoutStatus('Connecting to checkout...')
    try {
      const response = await fetch(checkoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(({ id, quantity }) => ({ id, quantity })) }),
      })
      if (!response.ok) throw new Error('Checkout could not be started. Please try again.')
      const result = await response.json()
      if (result.url) window.location.assign(result.url)
      else setCheckoutStatus('Checkout service connected, but did not return a payment URL.')
    } catch (error) {
      setCheckoutStatus(error.message || 'Checkout could not be started. Please try again.')
    }
  }

  return (
    <div className="storefront">
      <div className="announcement">Free shipping on orders over $45 <span>•</span> Roasted fresh, shipped fast</div>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Sipsy Coffee home"><span className="wordmark-mark">B.</span> Sipsy<span className="wordmark-note">COFFEE CO.</span></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#shop">Shop coffee</a>
          <a href="#story">Our approach</a>
          <a href="#newsletter">Journal</a>
        </nav>
        <button className="bag-button" type="button" onClick={() => setCartOpen(true)} aria-label={`Open shopping bag, ${cartCount} items`}>
          Bag <span className="bag-count">{cartCount}</span>
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> GOOD COFFEE, NO BIG OCCASION</p>
            <h1>A softer start<br />to your <em>everyday.</em></h1>
            <p className="hero-description">Thoughtful coffee for the first sip, the long catch-up, and all the little pauses in between.</p>
            <a className="button button-dark" href="#shop">Find your morning <span aria-hidden="true">↗</span></a>
            <div className="hero-footnote"><span className="tiny-star">✳</span> Slow mornings taste better.</div>
          </div>
          <div className="hero-image" role="img" aria-label="Freshly brewed coffee on a sunny cafe table">
            <div className="image-caption"><span>01 / THE DAILY RITUAL</span><span>EST. FOR EVERYDAY</span></div>
          </div>
          <div className="hero-index">46° 12' N<br />06° 08' E</div>
        </section>

        <section className="promise-strip" aria-label="Our coffee promise">
          <span>Roasted in small batches</span><i>✳</i><span>Good people, good coffee</span><i>✳</i><span>Here for the everyday</span>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div><p className="eyebrow">THE GOOD STUFF</p><h2>A little something<br className="mobile-break" /> for your daily ritual.</h2></div>
            <p className="catalog-status"><span className="status-dot" />{catalogStatus}</p>
          </div>
          <div className="shop-controls">
            <div className="category-tabs" role="tablist" aria-label="Product category">
              {['All', 'Coffee', 'Gear'].map((category) => (
                <button key={category} type="button" role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>
              ))}
            </div>
            <div className="catalog-tools">
              <label className="search-control"><span className="visually-hidden">Search products</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the shop" /></label>
              <label className="sort-control"><span className="visually-hidden">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
            </div>
          </div>
          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article className="product" key={product.id}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="product-tag">{product.tag}</span>
                  <button className="quick-add" type="button" onClick={() => addToCart(product)} aria-label={`Add ${product.name} to bag`}>+</button>
                </div>
                <div className="product-meta"><span>{product.category === 'Coffee' ? 'WHOLE BEAN · 12 OZ' : 'THE MORROW EDIT'}</span><span>{String(index + 1).padStart(2, '0')}</span></div>
                <div className="product-title-row"><h3>{product.name}</h3><span>${product.price}</span></div>
                <p className="product-description">{product.description}</p>
              </article>
            ))}
            {!visibleProducts.length && <p className="empty-results">No good matches yet. Try another search.</p>}
          </div>
        </section>

        <section className="story-section" id="story">
          <div className="story-image" role="img" aria-label="Coffee beans freshly roasted in small batches" />
          <div className="story-copy"><p className="eyebrow">A GOOD THING, DONE WELL</p><h2>We like our coffee<br />like our mornings:<br /><em>uncomplicated.</em></h2><p>We work with kind people who care about good growing, careful roasting, and making a cup that feels like yours.</p><a href="#shop" className="text-link">A little more about us <span aria-hidden="true">↗</span></a></div>
          <span className="story-note">BETTER BY THE CUP</span>
        </section>

        <section className="newsletter-section" id="newsletter">
          <div><p className="eyebrow">A NOTE FROM MORROW</p><h2>Good things in your inbox.</h2><p>New roasts, small rituals, and the occasional very good playlist.</p></div>
          {subscribed ? <p className="subscribe-success">You're on the list. Talk soon.</p> : <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); if (email.trim()) setSubscribed(true) }}><label className="visually-hidden" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" /><button type="submit" aria-label="Subscribe to the newsletter">Join us <span aria-hidden="true">↗</span></button></form>}
        </section>
      </main>

      <footer className="site-footer"><a className="wordmark footer-wordmark" href="#top"><span className="wordmark-mark">B.</span> Sipsy</a><span>GOOD COFFEE FOR THE IN-BETWEEN.</span><span>© SIPSY COFFEE CO. 2026</span></footer>

      {cartOpen && <div className="cart-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false) }}>
        <aside className="cart-drawer" aria-label="Shopping bag">
          <div className="cart-header"><div><p className="eyebrow">YOUR GOOD THINGS</p><h2>Your bag <span>({cartCount})</span></h2></div><button className="close-cart" type="button" onClick={() => setCartOpen(false)} aria-label="Close shopping bag">×</button></div>
          {cart.length ? <>
            <div className="cart-items">{cart.map((item) => <article className="cart-item" key={item.id}><img src={item.image} alt="" /><div className="cart-item-info"><h3>{item.name}</h3><p>${item.price} · {item.category === 'Coffee' ? '12 oz' : 'Morrow goods'}</p><div className="quantity-control"><button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button></div></div><strong>${item.price * item.quantity}</strong></article>)}</div>
            <div className="cart-summary"><p><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></p><small>Shipping and taxes are calculated at checkout.</small><button className="button button-dark checkout-button" type="button" onClick={beginCheckout}>Continue to checkout <span aria-hidden="true">↗</span></button>{checkoutStatus && <p className="checkout-status" role="status">{checkoutStatus}</p>}</div>
          </> : <div className="empty-cart"><span className="empty-cart-mark">m.</span><p>Your bag is taking a slow morning.</p><button className="button button-dark" type="button" onClick={() => { setCartOpen(false); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }}>Explore the shop <span aria-hidden="true">↗</span></button></div>}
        </aside>
      </div>}
    </div>
  )
}

export default App
