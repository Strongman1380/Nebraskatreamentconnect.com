import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, LogOut, Settings, User, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function AppHeader() {
  const { role, email, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMobileMenuOpen(false)
  }

  return (
    <header className="bg-blue-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-teal-500 rounded-lg p-1.5 group-hover:bg-teal-400 transition-colors">
              <Heart className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm leading-tight tracking-tight">Nebraska Treatment Connect</div>
              <div className="text-blue-400 text-[11px] leading-tight">Find treatment & recovery services</div>
            </div>
            <div className="sm:hidden">
              <div className="font-bold text-sm leading-tight">NE Treatment Connect</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {role === 'public' && (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <User className="w-4 h-4" />
                Provider Login
              </Link>
            )}

            {role === 'provider' && (
              <>
                <Link
                  to="/provider"
                  className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  My Facility
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
                <div className="w-px h-5 bg-blue-800 mx-1" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-blue-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="max-w-[140px] truncate">{email}</span>
                </button>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2 text-blue-300 hover:text-white rounded-lg hover:bg-white/10 transition-all"
            onClick={() => setMobileMenuOpen(o => !o)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-blue-900 py-3 space-y-1">
            {role === 'public' && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-blue-300 hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all"
              >
                <User className="w-4 h-4" />
                Provider Login
              </Link>
            )}
            {role === 'provider' && (
              <>
                <Link
                  to="/provider"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-blue-300 hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  My Facility
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 text-blue-300 hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            )}
            {role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-blue-300 hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Admin Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 text-blue-300 hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({email})
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
