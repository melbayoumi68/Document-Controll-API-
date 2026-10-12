import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  Compass,
  Eye,
  EyeOff,
  FileCheck2,
  Globe,
  HardHat,
  KeyRound,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from 'lucide-react'

// استيراد الصورة باستخدام اسم متغير صحيح واسم الملف الأصلي
import loginHero from '@/assets/loginHero2.webp'

import { authService } from '@/services/authService'
import { LoginRequest, LoginResponse } from '@/types/auth'
import { useLanguageStore } from '@/stores/languageStore'
import { useThemeStore } from '@/stores/themeStore'

interface FormErrors {
  usernameOrEmail?: string
  password?: string
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const { isDark, toggleTheme } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const usernameInputRef = useRef<HTMLInputElement>(null)
  const isRtl = language === 'ar'

  // التركيز على حقل اسم المستخدم عند فتح الصفحة
  useEffect(() => {
    usernameInputRef.current?.focus()
  }, [])

  // إعادة توجيه المستخدم المسجل دخوله بالفعل
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser()
      handleRoleRedirect(user)
    }
  }, [])

  const handleRoleRedirect = (user: LoginResponse | null) => {
    if (!user) {
      navigate('/dashboard', { replace: true })
      return
    }

    if (user.mustSetPassword) {
      navigate('/change-password', { replace: true })
      return
    }

    const from = (location.state as any)?.from?.pathname

    navigate(from || '/dashboard', { replace: true })
  }

  // التحقق من صحة البيانات المدخلة
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = isRtl
        ? 'اسم المستخدم أو البريد الإلكتروني مطلوب'
        : 'Username or email is required'
    }

    if (!password) {
      newErrors.password = isRtl
        ? 'كلمة المرور مطلوبة'
        : 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = isRtl
        ? 'كلمة المرور يجب ألا تقل عن 6 أحرف'
        : 'Password must be at least 6 characters'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  // عرض رسالة مناسبة حسب الخطأ القادم من الـ API
  const getLoginErrorMessage = (err: any): string => {
    const status = err?.response?.status

    if (status === 400) {
      return isRtl
        ? 'بيانات تسجيل الدخول غير صحيحة.'
        : 'The login request is invalid.'
    }

    if (status === 401) {
      return isRtl
        ? 'اسم المستخدم أو كلمة المرور غير صحيحة.'
        : 'Invalid username or password.'
    }

    if (status === 403) {
      return isRtl
        ? 'ليس لديك صلاحية لتسجيل الدخول.'
        : 'You are not authorized to sign in.'
    }

    if (status >= 500) {
      return isRtl
        ? 'تعذر تسجيل الدخول حالياً. حاول مرة أخرى لاحقاً.'
        : 'Server error. Please try again later.'
    }

    return isRtl
      ? 'تعذر تسجيل الدخول. يرجى التحقق من البيانات والاتصال بالخادم.'
      : 'Unable to sign in. Please check your credentials and try again.'
  }

  // تنفيذ تسجيل الدخول
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const credentials: LoginRequest = {
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      }

      const response = await authService.login(credentials, rememberMe)

      toast.success(
        isRtl
          ? `مرحباً بك، م. ${response.fullName}`
          : `Welcome back, ${response.fullName}`,
        {
          duration: 2500,
        }
      )

      handleRoleRedirect(response)
    } catch (err: any) {
      toast.error(getLoginErrorMessage(err), {
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // تعبئة بيانات الحسابات التجريبية
  const fillDemoAccount = (username: string) => {
    setUsernameOrEmail(username)
    setPassword('password123')
    setErrors({})
    usernameInputRef.current?.focus()
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen w-full items-center justify-center bg-[#03045e] px-4 py-8 transition-colors dark:bg-[#0c1017] sm:px-6 lg:px-8"
    >
      {/* خلفية شبكية هندسية */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(37,99,235,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.15) 1px, transparent 1px)',
          backgroundSize: '3rem 3rem',
        }}
      />

      {/* أزرار تغيير اللغة والوضع الليلي */}
      <div className="absolute top-5 end-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-blue-200/70 bg-white/80 px-3.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />

          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200/70 bg-white/80 text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-blue-600" />
          )}
        </button>
      </div>

      {/* البطاقة الرئيسية */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-blue-950/10 dark:bg-[#151c28] dark:shadow-black/40 sm:p-12 lg:rounded-[3rem] lg:p-16">
        <div className="grid grid-cols-1 items-center lg:grid-cols-12 lg:gap-12">

          {/* الجانب الأيسر: الشعار ونموذج تسجيل الدخول */}
          <div className="lg:col-span-6 xl:col-span-7">

            {/* الشعار */}
            <div className="mb-7">
              <div className="inline-block">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                    <FileCheck2 className="h-5 w-5" />
                  </div>

                  <div className="leading-tight">
                    <span className="text-xl font-black tracking-wider text-slate-900 dark:text-white">
                      DC SYSTEM
                    </span>

                    <span className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      Technical Office
                    </span>
                  </div>
                </div>

                <svg
                  className="mt-1 h-3.5 w-32 text-blue-600 dark:text-blue-400"
                  viewBox="0 0 100 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M 5,18 Q 50,-8 95,18"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* عنوان الصفحة */}
            <div className="mb-6">
              <h1 className="flex items-center gap-2.5 text-2xl font-light tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                <Sparkles
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  strokeWidth={1.8}
                />

                <span>{isRtl ? 'أهلاً بعودتك' : 'Welcome back'}</span>
              </h1>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isRtl
                  ? 'منصة إدارة المستندات والمراجعات والمخططات الهندسية'
                  : 'Engineering Technical Office & Document Control System'}
              </p>
            </div>

            {/* نموذج تسجيل الدخول */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="max-w-md space-y-3.5"
            >

              {/* اسم المستخدم أو البريد الإلكتروني */}
              <div>
                <div className="relative">
                  <input
                    ref={usernameInputRef}
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    autoComplete="username"
                    disabled={isLoading}
                    value={usernameOrEmail}
                    onChange={(e) => {
                      setUsernameOrEmail(e.target.value)

                      if (errors.usernameOrEmail) {
                        setErrors((prev) => ({
                          ...prev,
                          usernameOrEmail: undefined,
                        }))
                      }
                    }}
                    placeholder={
                      isRtl
                        ? 'اسم المستخدم أو البريد الإلكتروني'
                        : 'Email or username'
                    }
                    aria-invalid={Boolean(errors.usernameOrEmail)}
                    aria-describedby={
                      errors.usernameOrEmail
                        ? 'usernameOrEmail-error'
                        : undefined
                    }
                    className={`h-12 w-full rounded-full border bg-white px-6 pe-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 ${
                      errors.usernameOrEmail
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />

                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-4 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                </div>

                {errors.usernameOrEmail && (
                  <p
                    id="usernameOrEmail-error"
                    className="ms-4 mt-1 text-[11px] font-medium text-red-500"
                  >
                    {errors.usernameOrEmail}
                  </p>
                )}
              </div>

              {/* كلمة المرور */}
              <div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)

                      if (errors.password) {
                        setErrors((prev) => ({
                          ...prev,
                          password: undefined,
                        }))
                      }
                    }}
                    placeholder={isRtl ? 'كلمة المرور' : 'Password'}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? 'password-error' : undefined
                    }
                    className={`h-12 w-full rounded-full border bg-white px-6 pe-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 ${
                      errors.password
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />

                  {/* زر إظهار وإخفاء كلمة المرور */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 end-0 flex items-center pe-4 text-slate-400 transition hover:text-blue-600 dark:hover:text-blue-400"
                    title={
                      showPassword
                        ? isRtl
                          ? 'إخفاء كلمة المرور'
                          : 'Hide password'
                        : isRtl
                          ? 'إظهار كلمة المرور'
                          : 'Show password'
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p
                    id="password-error"
                    className="ms-4 mt-1 text-[11px] font-medium text-red-500"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              {/* تذكرني وزر تسجيل الدخول */}
              <div className="flex items-center justify-between pt-1">
                <label
                  htmlFor="rememberMe"
                  className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                  />

                  <span>{isRtl ? 'تذكرني' : 'Remember me'}</span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-11 min-w-[125px] items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />

                      <span>
                        {isRtl ? 'تسجيل الدخول' : 'Sign in'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* الحسابات التجريبية */}
            <div className="mt-7 max-w-md">
              <details className="group rounded-2xl border border-blue-100 bg-blue-50/50 p-2.5 transition dark:border-slate-800 dark:bg-slate-800/40">
                <summary className="flex cursor-pointer select-none items-center justify-between px-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <HardHat className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />

                    {isRtl
                      ? 'حسابات تجريبية للمهندسين'
                      : 'Engineering Demo Accounts'}
                  </span>

                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                    {isRtl ? 'عرض الأدوار' : 'View roles'}
                  </span>
                </summary>

                <div className="mt-2.5 grid grid-cols-3 gap-1.5 pt-1">

                  {/* حساب مدير النظام */}
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('admin1')}
                    className="rounded-xl border border-blue-200/80 bg-white p-2 text-start transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                      Super Admin
                    </div>

                    <div className="mt-0.5 font-mono text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      admin1
                    </div>
                  </button>

                  {/* حساب المهندس */}
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('eng01')}
                    className="rounded-xl border border-cyan-200/80 bg-white p-2 text-start transition hover:border-cyan-500 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <div className="text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400">
                      Engineer
                    </div>

                    <div className="mt-0.5 font-mono text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      eng01
                    </div>
                  </button>

                  {/* حساب الاستشاري */}
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('cons01')}
                    className="rounded-xl border border-emerald-200/80 bg-white p-2 text-start transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                      Consultant
                    </div>

                    <div className="mt-0.5 font-mono text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      cons01
                    </div>
                  </button>

                </div>
              </details>
            </div>
          </div>

          {/* الجانب الأيمن: الصورة */}
          <div className="mt-8 flex items-center justify-center lg:col-span-6 lg:mt-0 xl:col-span-5">
            <div
              className="relative aspect-square w-full max-w-[380px] overflow-hidden bg-slate-900 shadow-2xl shadow-blue-900/25 transition-transform hover:scale-[1.01]"
              style={{
                borderRadius: '45% 55% 62% 38% / 40% 48% 52% 60%',
              }}
            >
              <img
                src={loginHero}
                alt="Technical Office"
                className="h-full w-full object-cover object-center brightness-95 contrast-110"
              />

              {/* التدرج اللوني */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-slate-950/20 to-blue-900/20" />

              {/* الشارة العلوية */}
              <div className="absolute top-5 start-7 flex items-center gap-1.5 rounded-full border border-white/20 bg-blue-600/70 px-3 py-1 text-[10px] font-semibold text-white shadow-md backdrop-blur-md">
                <Compass className="h-3 w-3" />

                <span>Technical Office</span>
              </div>

              {/* النص السفلي */}
              <div className="absolute bottom-6 inset-x-0 flex flex-col items-center justify-center px-4 text-center">
                <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />

                  <span>
                    {isRtl
                      ? 'إدارة واعتماد المستندات'
                      : 'Document Management & Review'}
                  </span>
                </div>

                <p className="mt-2 text-[10px] font-mono tracking-wider text-blue-200/80">
                  REV 02 • ISO 9001 COMPLIANT
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default LoginPage