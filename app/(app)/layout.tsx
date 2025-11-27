'use client';

import Link from 'next/link';
import {
  Bot,
  CircleUser,
  History,
  LineChart,
  Menu,
  MessageSquare,
  Phone,
  Settings,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { VeritasLogo } from '@/components/icons';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/chat', icon: MessageSquare, label: 'Chat Assistant' },
    { href: '/history', icon: History, label: 'History' },
  ];

  const adminNavItems = [
    { href: '/admin/bulk-calls', icon: Phone, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'User Management' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold" prefetch={false}>
              <VeritasLogo className="h-6 w-6 text-primary" />
              <span className="text-lg font-headline">AssureAI</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <h3 className="px-3 pt-2 text-xs font-semibold text-muted-foreground/70 uppercase">Admin</h3>
                {adminNavItems.map((item) => (
                    <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                        isActive(item.href) && 'bg-muted text-primary'
                    )}
                    prefetch={false}
                    >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    </Link>
                ))}
            </nav>
            <div className="my-4 mx-4 border-t"></div>
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    isActive(item.href) && 'bg-muted text-primary'
                  )}
                  prefetch={false}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                  prefetch={false}
                >
                  <VeritasLogo className="h-6 w-6 text-primary" />
                  <span className="sr-only">AssureAI</span>
                </Link>
                 <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground/70 uppercase">Admin</h3>
                 {adminNavItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
                       isActive(item.href) && 'bg-muted text-foreground'
                    )}
                    prefetch={false}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                 <div className="my-2 border-t"></div>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
                       isActive(item.href) && 'bg-muted text-foreground'
                    )}
                    prefetch={false}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            {/* Can add search here if needed */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/" prefetch={false}>Logout</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
          <Toaster />
        </main>
      </div>
    </div>
  );
}
