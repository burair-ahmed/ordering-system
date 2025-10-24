/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ListChecks,
  Plus,
  Settings,
  Table2,
  BarChart3,
  Archive,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Sun,
  Moon,
  ShieldCheck,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import OrdersList from '../components/OrdersList';
import AddMenuItemForm from '../components/MenuItemForm';
import EditMenuItemForm from '../components/EditMenuItemForm';
import TableManagement from '../components/TableManagement';
import AnalyticsPage from '../components/Analytics';
import CompletedOrders from '../components/CompletedOrders';
import AddPlatterForm from '../components/AddPlatterForm';
import EditPlatterForm from '../components/EditPlatterForm';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Variation {
  name: string;
  price: number;
}
interface MenuItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  variations: Variation[];
  status: 'in stock' | 'out of stock';
}
interface Option {
  name: string;
  uuid: string;
}
interface AdditionalChoice {
  heading: string;
  options: Option[];
}
interface Category {
  _id: string;
  categoryName: string;
  options: Option[];
}
interface PlatterItem {
  _id: string;
  title: string;
  description: string;
  basePrice: number;
  platterCategory: string;
  image: string;
  status: 'in stock' | 'out of stock';
  additionalChoices: AdditionalChoice[];
  categories: Category[];
}

type TabKey =
  | 'orders'
  | 'menu'
  | 'platter'
  | 'addmenu'
  | 'addplatter'
  | 'tables'
  | 'completedOrders'
  | 'analytics'
  | 'settings';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'orders', label: 'Orders', icon: ListChecks },
  { key: 'menu', label: 'Menu Items', icon: ListChecks },
  { key: 'platter', label: 'Platter Items', icon: ListChecks },
  { key: 'addmenu', label: 'Add Menu', icon: Plus },
  { key: 'addplatter', label: 'Add Platter', icon: Plus },
  { key: 'tables', label: 'Tables', icon: Table2 },
  { key: 'completedOrders', label: 'Completed', icon: Archive },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const BRAND = {
  primary: 'from-[#741052] via-fuchsia-600 to-pink-600',
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2',
};

const AdminDashboard: FC = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [platterItems, setPlatterItems] = useState<PlatterItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingPlatter, setLoadingPlatter] = useState(false);

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedPlatterItem, setSelectedPlatterItem] = useState<PlatterItem | null>(null);
  const [showEditMenuItemModal, setShowEditMenuItemModal] = useState(false);
  const [showEditPlatterItemModal, setShowEditPlatterItemModal] = useState(false);

  const [showPasswordOverlay, setShowPasswordOverlay] = useState(true);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const correctPassword = '123-$CLK-Admin-$Panel-786';

  const [menuQuery, setMenuQuery] = useState('');
  const [platterQuery, setPlatterQuery] = useState('');
  const closeMenuEdit = () => {
    setSelectedMenuItem(null);
    setShowEditMenuItemModal(false);
  };
  const closePlatterEdit = () => {
    setSelectedPlatterItem(null);
    setShowEditPlatterItemModal(false);
  };
  const handleEditMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setShowEditMenuItemModal(true);
  };
  const handleEditPlatterItem = (item: PlatterItem) => {
    setSelectedPlatterItem(item);
    setShowEditPlatterItemModal(true);
  };
    const refreshMenuItems = async () => fetchMenuItems();
  const refreshPlatterItems = async () => fetchPlatterItems();

  useEffect(() => {
    if (showPasswordOverlay) document.body.classList.add('overflow-hidden');
    else document.body.classList.remove('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, [showPasswordOverlay]);

  const fetchMenuItems = async () => {
    try {
      setLoadingMenu(true);
      const res = await fetch('/api/getitemsadmin');
      const data: MenuItem[] = await res.json();
      setMenuItems(data);
    } catch (e) {
      toast({
        title: 'Failed to load menu items',
        description: 'Please try again',
        variant: 'destructive',
      });
      console.error(e);
    } finally {
      setLoadingMenu(false);
    }
  };

  const fetchPlatterItems = async () => {
    try {
      setLoadingPlatter(true);
      const res = await fetch('/api/platteradmin');
      const data: PlatterItem[] = await res.json();
      setPlatterItems(data);
    } catch (e) {
      toast({
        title: 'Failed to load platter items',
        description: 'Please try again',
        variant: 'destructive',
      });
      console.error(e);
    } finally {
      setLoadingPlatter(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'menu') fetchMenuItems();
    if (activeTab === 'platter') fetchPlatterItems();
  }, [activeTab]);

  const filteredMenu = useMemo(() => {
    const q = menuQuery.toLowerCase();
    return menuItems.filter(
      (m) =>
        m.title.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q)
    );
  }, [menuQuery, menuItems]);

  const filteredPlatters = useMemo(() => {
    const q = platterQuery.toLowerCase();
    return platterItems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.platterCategory?.toLowerCase().includes(q)
    );
  }, [platterQuery, platterItems]);

  const handleLogout = () => {
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setShowPasswordOverlay(false);
      setErrorMessage('');
      toast({ title: 'Welcome back', description: 'Admin access granted.' });
    } else {
      setErrorMessage('Incorrect password. Please try again.');
    }
  };

  // === Responsive Sidebar Handling ===
  const Sidebar = (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col border-r bg-white/90 dark:bg-neutral-900/80 backdrop-blur transition-transform duration-300 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${isSidebarCollapsed ? 'w-[76px]' : 'w-64'}`}
    >
      <div className="flex h-16 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-fuchsia-600 to-pink-600" />
          {!isSidebarCollapsed && (
            <span className="text-sm font-semibold tracking-wide">Admin Panel</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarCollapsed((s) => !s)}
          className="hidden md:flex"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-2 overflow-y-auto">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <Button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setIsMobileSidebarOpen(false);
              }}
              variant={active ? 'secondary' : 'ghost'}
              className={`h-10 w-full justify-start gap-3 rounded-xl px-3 text-sm ${
                active
                  ? 'bg-fuchsia-50 text-fuchsia-700 dark:bg-neutral-800 dark:text-fuchsia-300'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {!isSidebarCollapsed && <span>{label}</span>}
            </Button>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <Button variant="ghost" className="w-full justify-start gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-600" />
          {!isSidebarCollapsed && (
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium">Admin User</span>
              <span className="text-xs text-neutral-500">admin@panel</span>
            </div>
          )}
        </Button>
      </div>
    </aside>
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <AnimatePresence>
          {showPasswordOverlay && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <motion.div className="w-full max-w-md p-4">
                <Card className="border-0 shadow-2xl">
                  <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-pink-600">
                      <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">Admin Access</CardTitle>
                    <CardDescription>
                      Enter your admin password to continue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={submitPassword} className="space-y-4">
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="h-11"
                      />
                      {errorMessage && (
                        <p className="text-sm text-red-500">{errorMessage}</p>
                      )}
                      <Button
                        type="submit"
                        className={`h-11 w-full bg-gradient-to-r ${BRAND.primary} text-white hover:opacity-95 ${BRAND.ring}`}
                      >
                        Continue
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {Sidebar}

        {/* === Main Area === */}
        <section className="flex flex-1 flex-col overflow-y-auto">
          {/* Topbar */}
          <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-4 backdrop-blur dark:bg-neutral-900/70">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
              <LayoutDashboard className="h-5 w-5 text-fuchsia-600" />
              <span className="hidden sm:inline text-sm font-medium text-neutral-600 dark:text-neutral-300">
                Dashboard
              </span>
              <Badge
                variant="outline"
                className="hidden sm:inline border-fuchsia-300 text-fuchsia-700 dark:text-fuchsia-300"
              >
                {activeTab}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input placeholder="Search..." className="h-9 w-48 pl-9 sm:w-64" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-3 sm:p-6">
            {/* Keep all your existing tab content here — unchanged */}
            {/* ... */}
                      {activeTab === 'orders' && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-xl">Order Management</CardTitle>
                            <CardDescription>Track and process live orders in real-time.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <OrdersList />
                          </CardContent>
                        </Card>
                      )}
          
                      {/* Menu Items */}
          {activeTab==='menu'&&(<section className="space-y-4 h-[calc(100vh-200px)] overflow-y-auto pr-2"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sticky top-0 bg-white dark:bg-neutral-950 z-10 pb-2"><div className="space-y-1"><h2 className="text-xl font-semibold">Menu Management</h2><p className="text-sm text-neutral-500">Edit, filter, and preview menu items.</p></div><div className="flex items-center gap-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/><Input value={menuQuery} onChange={(e)=>setMenuQuery(e.target.value)} placeholder="Search by name or category" className="h-10 w-72 pl-9"/></div><Button variant="outline" onClick={fetchMenuItems}>Refresh</Button></div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{loadingMenu?Array.from({length:6}).map((_,i)=>(<Card key={i} className="overflow-hidden"><Skeleton className="h-40 w-full"/><div className="space-y-2 p-4"><Skeleton className="h-5 w-1/2"/><Skeleton className="h-4 w-3/4"/><Skeleton className="h-9 w-24"/></div></Card>)):filteredMenu.length>0?filteredMenu.map((item)=>(<Card key={item._id} className="overflow-hidden"><div className="flex h-40 items-center justify-center bg-neutral-100 dark:bg-neutral-900"><Image src={item.image} alt={item.title} width={140} height={140} className="h-28 w-28 rounded-lg object-cover"/></div><CardContent className="space-y-3 p-4"><div><div className="flex items-center justify-between"><h3 className="text-base font-semibold">{item.title}</h3><Badge variant={item.status==='in stock'?'default':'destructive'}>{item.status}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p></div><div className="flex items-center justify-between"><span className="text-sm text-neutral-500">{item.category}</span><Button size="sm" onClick={()=>handleEditMenuItem(item)}>Edit</Button></div></CardContent></Card>)):(<Card><CardContent className="p-6 text-sm text-neutral-500">No menu items available.</CardContent></Card>)}</div></section>)}
                      {/* Platter Items */}
          {activeTab==="platter"&&(<section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="space-y-1"><h2 className="text-xl font-semibold">Platter Management</h2><p className="text-sm text-neutral-500">Edit, filter, and preview platters.</p></div><div className="flex items-center gap-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/><Input value={platterQuery} onChange={e=>setPlatterQuery(e.target.value)} placeholder="Search by name or category" className="h-10 w-72 pl-9"/></div><Button variant="outline" onClick={fetchPlatterItems}>Refresh</Button></div></div><div className="max-h-[600px] overflow-y-auto pr-2"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{loadingPlatter?Array.from({length:6}).map((_,i)=>(<Card key={i} className="overflow-hidden"><Skeleton className="h-40 w-full"/><div className="space-y-2 p-4"><Skeleton className="h-5 w-1/2"/><Skeleton className="h-4 w-3/4"/><Skeleton className="h-9 w-24"/></div></Card>)):filteredPlatters.length>0?filteredPlatters.map(item=>(<Card key={item._id} className="overflow-hidden"><div className="flex h-40 items-center justify-center bg-neutral-100 dark:bg-neutral-900"><Image src={item.image} alt={item.title} width={140} height={140} className="h-28 w-28 rounded-lg object-cover"/></div><CardContent className="space-y-3 p-4"><div><div className="flex items-center justify-between"><h3 className="text-base font-semibold">{item.title}</h3><Badge variant={item.status==="in stock"?"default":"destructive"}>{item.status}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p></div><div className="flex items-center justify-between"><span className="text-sm text-neutral-500">{item.platterCategory}</span><Button size="sm" onClick={()=>handleEditPlatterItem(item)}>Edit</Button></div></CardContent></Card>)):(<Card><CardContent className="p-6 text-sm text-neutral-500">No platter items available.</CardContent></Card>)}</div></div></section>)}
          
          
          
                      {/* Add forms */}
                      {activeTab === 'addmenu' && (<Card><CardHeader><CardTitle className="text-xl">Add Menu Item</CardTitle><CardDescription>Create a new item for your menu.</CardDescription></CardHeader><CardContent><AddMenuItemForm /></CardContent></Card>)}
          
                      {activeTab === 'addplatter' && (<Card><CardHeader><CardTitle className="text-xl">Add Platter</CardTitle><CardDescription>Create a new platter combination.</CardDescription></CardHeader><CardContent><AddPlatterForm /></CardContent></Card>)}
          
                      {activeTab === 'tables' && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-xl">Table Management</CardTitle>
                            <CardDescription>Manage dine-in tables and QR codes.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <TableManagement />
                          </CardContent>
                        </Card>
                      )}
          
                      {activeTab === 'completedOrders' && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-xl">Completed Orders</CardTitle>
                            <CardDescription>History of fulfilled orders.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <CompletedOrders />
                          </CardContent>
                        </Card>
                      )}
          
                      {activeTab === 'analytics' && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-xl">Analytics</CardTitle>
                            <CardDescription>Monitor sales and performance trends.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <AnalyticsPage />
                          </CardContent>
                        </Card>
                      )}
          
                      {activeTab === 'settings' && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-xl">Settings</CardTitle>
                            <CardDescription>Configure application preferences.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <p className="text-sm text-neutral-500">Appearance</p>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" onClick={() => setTheme('light')}>Light</Button>
                                  <Button variant="outline" onClick={() => setTheme('dark')}>Dark</Button>
                                  <Button variant="outline" onClick={() => setTheme('system')}>System</Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm text-neutral-500">Session</p>
                                <Button variant="destructive" onClick={handleLogout} className="gap-2">
                                  <LogOut className="h-4 w-4" /> Logout
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
          
                      {/* ===== Edit Modals (Dialog with smooth animation) ===== */}
                      <Dialog open={showEditMenuItemModal} onOpenChange={setShowEditMenuItemModal}>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Menu Item</DialogTitle>
                            <DialogDescription>Update details and save changes.</DialogDescription>
                          </DialogHeader>
                          {selectedMenuItem && (
                            <EditMenuItemForm item={selectedMenuItem} onClose={closeMenuEdit} onUpdate={refreshMenuItems} />
                          )}
                        </DialogContent>
                      </Dialog>
          
                      <Dialog open={showEditPlatterItemModal} onOpenChange={setShowEditPlatterItemModal}>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Platter</DialogTitle>
                            <DialogDescription>Update details and save changes.</DialogDescription>
                          </DialogHeader>
                          {selectedPlatterItem && (
                            <EditPlatterForm item={selectedPlatterItem} onClose={closePlatterEdit} onUpdate={refreshPlatterItems} />
                          )}
                        </DialogContent>
                      </Dialog>
          </main>
        </section>
      </div>
    </TooltipProvider>
  );
};

export default AdminDashboard;
