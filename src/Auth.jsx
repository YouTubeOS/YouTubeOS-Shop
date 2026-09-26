import { useState } from 'react'
import { supabase } from './supabase'

function Auth({ onClose }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage(
          'Регистрация прошла. Проверь почту, если подтверждение включено.'
        )
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        onClose()
      }
    }

    setLoading(false)
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="auth-close" onClick={onClose}>
          ×
        </button>

        <p className="section-label">PONY&MUSIC</p>

        <h2>
          {mode === 'login'
            ? 'С возвращением'
            : 'Создать аккаунт'}
        </h2>

        <p className="auth-description">
          {mode === 'login'
            ? 'Войди, чтобы продолжить покупки.'
            : 'Создай аккаунт для оформления заказов.'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Имя
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Твоё имя"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Минимум 6 символов"
              minLength={6}
              required
            />
          </label>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Подожди...'
              : mode === 'login'
                ? 'Войти'
                : 'Зарегистрироваться'}
          </button>
        </form>

        <button
          className="auth-switch"
          onClick={() => {
            setMode(
              mode === 'login'
                ? 'register'
                : 'login'
            )
            setMessage('')
          }}
        >
          {mode === 'login'
            ? 'Нет аккаунта? Зарегистрироваться'
            : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  )
}

export default Auth