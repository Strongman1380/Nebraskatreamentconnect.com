import { Heart, Phone } from 'lucide-react'

export function AppFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-teal-400" />
              <span className="text-white font-semibold text-sm">Nebraska Treatment Connect</span>
            </div>
            <p className="text-xs leading-relaxed">
              A directory of behavioral health, substance use, and mental health treatment providers across Nebraska.
            </p>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-3">Crisis Resources</h3>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>988 Suicide &amp; Crisis Lifeline: <strong className="text-white">Call or text 988</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>SAMHSA Helpline: <strong className="text-white">1-800-662-4357</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Crisis Text Line: <strong className="text-white">Text HOME to 741741</strong></span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-3">For Providers</h3>
            <p className="text-xs leading-relaxed">
              Are you a treatment facility? Contact your administrator to get a provider account so you can update your facility's availability status.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-xs text-center">
          <p>Availability information is provided directly by treatment facilities. Always call to confirm current openings.</p>
        </div>
      </div>
    </footer>
  )
}
