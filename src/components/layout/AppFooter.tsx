import { Heart, Phone, ExternalLink } from 'lucide-react'

export function AppFooter() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-teal-500/20 rounded-lg p-1.5">
                <Heart className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-white font-semibold text-sm">Nebraska Treatment Connect</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              A directory of behavioral health, substance use, and mental health treatment providers across Nebraska.
            </p>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Crisis Resources</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-300 font-medium">988 Suicide & Crisis Lifeline</div>
                  <div className="text-xs text-gray-500">Call or text 988</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-300 font-medium">SAMHSA Helpline</div>
                  <div className="text-xs text-gray-500">1-800-662-4357 (24/7, free & confidential)</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-300 font-medium">Crisis Text Line</div>
                  <div className="text-xs text-gray-500">Text HOME to 741741</div>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4">For Providers</h3>
            <p className="text-sm leading-relaxed text-gray-500 mb-4">
              Are you a treatment facility? Contact your administrator to get a provider account and update your availability status.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors"
            >
              Provider Login
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600 text-center sm:text-left">
            Availability information is provided directly by treatment facilities. Always call to confirm current openings.
          </p>
          <p className="text-xs text-gray-700">
            &copy; {new Date().getFullYear()} Nebraska Treatment Connect
          </p>
        </div>
      </div>
    </footer>
  )
}
