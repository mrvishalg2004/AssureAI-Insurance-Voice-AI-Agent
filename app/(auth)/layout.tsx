import Link from 'next/link';
import { VeritasLogo } from '@/components/icons';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link href="/" className="flex items-center gap-2 text-foreground" prefetch={false}>
          <VeritasLogo className="h-6 w-6" />
          <span className="text-lg font-bold font-headline">AssureAI</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
