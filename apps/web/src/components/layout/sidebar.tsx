import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Role } from '@/types/common';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  LayoutDashboard,
  GraduationCap,
  FileCode2,
  ClipboardList,
  ClipboardCheck,
  Terminal,
  Sparkles,
  CreditCard,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/home/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/home/classrooms', label: 'Classrooms', icon: GraduationCap },
  { to: '/home/problems', label: 'Problems', icon: FileCode2 },
  {
    to: '/home/assignments',
    label: 'Assignments',
    icon: ClipboardList,
    roles: [Role.ADMIN, Role.PROFESSOR],
  },
  {
    to: '/home/grading',
    label: 'Gradebook',
    icon: ClipboardCheck,
    roles: [Role.ADMIN, Role.PROFESSOR],
  },
  { to: '/home/playground', label: 'Playground', icon: Terminal },
  { to: '/home/ai', label: 'AI Generate', icon: Sparkles },
  { to: '/home/billing', label: 'Billing', icon: CreditCard },
];

export function Sidebar() {
  const { user } = useAuth();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || !user || user.role === Role.ADMIN || item.roles.includes(user.role),
  );

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-6 text-lg font-semibold">
        <span className="text-brand">Code</span>Campus
      </div>
      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
