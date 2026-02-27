import React from 'react';
import { TopHeader } from './TopHeader';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
  onSearchOpen: () => void;
  onAccountOpen: () => void;
  onCartOpen: () => void;
  cartCount: number;
}

export const Layout = ({
  children,
  activePage,
  setActivePage,
  onSearchOpen,
  onAccountOpen,
  onCartOpen,
  cartCount
}: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopHeader />
      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        onSearchOpen={onSearchOpen}
        onAccountOpen={onAccountOpen}
        onCartOpen={onCartOpen}
        cartCount={cartCount}
      />
      <main className="flex-grow">
        {children}
      </main>
      <Footer setActivePage={setActivePage} />
    </div>
  );
};
