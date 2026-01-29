import { Home, Trophy, BarChart3, Wallet, ArrowLeft, Menu, X } from "lucide-react";
import AahbibiLogo from "@/components/icons/AahbibiLogo";
import { useState } from "react";

type NavItem = "lobby" | "tournament" | "leaderboard" | "cashout";

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  onExit: () => void;
}

const Sidebar = ({ activeItem, onNavigate, onExit }: SidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: { id: NavItem; label: string; icon: typeof Home }[] = [
    { id: "lobby", label: "Lobby", icon: Home },
    { id: "tournament", label: "Tournament", icon: Trophy },
    { id: "leaderboard", label: "Leaderboard", icon: BarChart3 },
    { id: "cashout", label: "Cashout", icon: Wallet },
  ];

  const handleNavigate = (item: NavItem) => {
    onNavigate(item);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-secondary rounded-lg border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-56 h-screen bg-sidebar border-r border-sidebar-border flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-6">
          <AahbibiLogo className="h-8" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={activeItem === item.id ? "sidebar-link-active w-full" : "sidebar-link w-full"}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Exit */}
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={onExit} className="sidebar-link w-full">
            <ArrowLeft className="w-5 h-5" />
            Exit
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
