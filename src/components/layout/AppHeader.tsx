import { Link, useNavigate } from 'react-router-dom'
import { Heart, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function AppHeader() {
  const { role, email, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-teal-500 rounded-lg p-1.5 group-hover:bg-teal-400 transition-colors">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight">Nebraska Treatment Connect</div>
              <div className="text-blue-300 text-xs leading-tight">Find treatment & recovery services</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-3">
            {role === 'public' && (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                Provider Login
              </Link>
            )}

            {role === 'provider' && (
              <>
                <Link
                  to="/provider"
                  className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm font-medium transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  My Facility
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm font-medium transition-colors"
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
                  className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm font-medium transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {email}
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
