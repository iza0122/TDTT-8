import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] bg-neutral-50 dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="w-full border-b dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-center justify-between md:justify-end">
          <div className="md:hidden">
            {/* Hamburger menu for mobile will go here */}
            <span className="text-lg font-bold">Menu</span>
          </div>
          <Header />
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
