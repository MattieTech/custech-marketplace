import { checkAdminAccess } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  ShieldCheck, 
  Flag, 
  CreditCard, 
  Scale, 
  ChartBar, 
  FileText,
  ChevronLeft,
  UserCheck,
  Package
} from 'lucide-react';
import { ReactNode } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'moderator', 'finance_admin', 'verification_officer', 'support_agent'] },
  { name: 'Users', href: '/admin/users', icon: Users, roles: ['super_admin', 'moderator', 'finance_admin', 'verification_officer', 'support_agent'] },
  { name: 'Admin Roles', href: '/admin/roles', icon: UserCheck, roles: ['super_admin'] },
  { name: 'Listings', href: '/admin/listings', icon: ShoppingBag, roles: ['super_admin', 'moderator'] },
  { name: 'Orders & Escrow', href: '/admin/orders', icon: Package, roles: ['super_admin', 'finance_admin', 'support_agent'] },
  { name: 'Verification', href: '/admin/verification', icon: ShieldCheck, roles: ['super_admin', 'verification_officer'] },
  { name: 'Reports', href: '/admin/reports', icon: Flag, roles: ['super_admin', 'moderator'] },
  { name: 'Transactions', href: '/admin/transactions', icon: CreditCard, roles: ['super_admin', 'finance_admin'] },
  { name: 'Disputes', href: '/admin/disputes', icon: Scale, roles: ['super_admin', 'support_agent'] },
  { name: 'Referrals', href: '/admin/referrals', icon: Users, roles: ['super_admin', 'finance_admin'] },
  { name: 'Revenue', href: '/admin/revenue', icon: ChartBar, roles: ['super_admin', 'finance_admin'] },
  { name: 'Audit Log', href: '/admin/audit', icon: FileText, roles: ['super_admin'] },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, role } = await checkAdminAccess();
  
  // Basic user details fetch for header
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('display_name, avatar_url').eq('user_id', user.id).maybeSingle();

  const allowedNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-full">
        <div className="p-4 border-b border-slate-800">
          <Link href="/admin" className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-lg">CUSTECH Admin</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.display_name || 'Admin User'}</p>
              <p className="text-xs text-slate-400 capitalize truncate">{role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center md:hidden">
            <ShieldCheck className="h-6 w-6 text-emerald-500 mr-2" />
            <span className="font-bold">Admin</span>
          </div>
          
          <div className="flex items-center space-x-4 ml-auto">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 capitalize">
              {role.replace('_', ' ')}
            </span>
            <Link 
              href="/" 
              className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Marketplace
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
