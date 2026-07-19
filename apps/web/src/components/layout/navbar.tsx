import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/context/auth-context';

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
      <div />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback>{initials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/home/profile')}>
              <UserIcon className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/home/settings')}>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOut className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
