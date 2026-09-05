import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1 */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 inline-flex">
              <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-sm">
                <Image
                  src="/logo.png"
                  alt="CUSTECH Marketplace Logo"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-green-400 tracking-tight leading-none">CUSTECH</span>
                <span className="text-[10px] font-semibold text-gray-300 tracking-[0.25em] uppercase mt-1">Marketplace</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              The official verified marketplace for the Confluence University of Science and Technology (CUSTECH) community in Osara. Buy, sell, and connect safely.
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 text-gray-300">Marketplace</h3>
            <ul className="space-y-3">
              <li><Link href="/marketplace" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Buy & Sell</Link></li>
              <li><Link href="/services" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Services</Link></li>
              <li><Link href="/housing" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Housing</Link></li>
              <li><Link href="/businesses" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Businesses</Link></li>
              <li><Link href="/marketplace?category=deals" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Campus Deals</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 text-gray-300">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/trust" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Trust Center</Link></li>
              <li><Link href="/help" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Help & FAQ</Link></li>
              <li><Link href="/safety" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Safety Tips</Link></li>
              <li><Link href="/report" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Report Issue</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 text-gray-300">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/terms" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/guidelines" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Community Guidelines</Link></li>
              <li><Link href="/cookies" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} CUSTECH Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
