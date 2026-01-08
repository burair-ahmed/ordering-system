/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { FC, useEffect, useMemo, useState, useRef } from 'react';
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
  Box,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Trash2,
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
  DropdownMenuCheckboxItem,
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
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  isVisible?: boolean;
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
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  isVisible?: boolean;
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

  // Authentication & Setup State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(true);
  const [authStep, setAuthStep] = useState<'password' | 'notifications'>('password');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [checkboxChecked, setCheckboxChecked] = useState<boolean>(false);
  const [audioInitialized, setAudioInitialized] = useState<boolean>(false);
  
  // Bulk Selection State for Platters
  const [selectedPlatterIds, setSelectedPlatterIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Bulk Selection State for Menu Items
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<Set<string>>(new Set());
  const [isBulkUpdatingMenu, setIsBulkUpdatingMenu] = useState(false);

  // Category Exclusion Filter
  const [excludedCategories, setExcludedCategories] = useState<Set<string>>(new Set());

  const correctPassword = '123-$CLK-Admin-$Panel-786';

  // Audio context for notifications
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Authentication & Notification Functions
  const initializeAudioContext = async () => {
    try {
      const audioContext = new AudioContext();
      const response = await fetch("/notification/notification.mp3");
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContextRef.current = audioContext;
      audioBufferRef.current = audioBuffer;
      setAudioInitialized(true);
    } catch (error) {
      console.error("AudioContext error:", error);
    }
  };

  const playNotificationSound = () => {
    if (audioContextRef.current && audioBufferRef.current) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setAuthError('');
      setAuthStep('notifications');
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const handleNotificationSetup = () => {
    if (checkboxChecked) {
      initializeAudioContext();
    }
    setIsAuthenticated(true);
    setShowAuthDialog(false);
    toast({ title: 'Welcome back', description: 'Admin access granted.' });
  };

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

  const toggleMenuItemVisibility = async (item: MenuItem) => {
    try {
      const res = await fetch('/api/updateItem', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, id: item._id, isVisible: !item.isVisible }),
      });
      if (res.ok) {
        toast({ title: 'Success', description: `Item is now ${!item.isVisible ? 'visible' : 'hidden'}` });
        fetchMenuItems();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
       toast({ title: 'Error', description: 'Failed to update visibility', variant: 'destructive' });
    }
  };

  const handleBulkMenuVisibilityUpdate = async (isVisible: boolean) => {
    if (selectedMenuItemIds.size === 0) return;
    
    try {
      setIsBulkUpdatingMenu(true);
      const res = await fetch('/api/bulkUpdateMenuItems', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: Array.from(selectedMenuItemIds), 
          isVisible 
        }),
      });

      if (res.ok) {
        toast({ 
          title: 'Bulk Update Successful', 
          description: `Updated ${selectedMenuItemIds.size} menu items to ${isVisible ? 'visible' : 'hidden'}.` 
        });
        setSelectedMenuItemIds(new Set());
        fetchMenuItems();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to bulk update');
      }
    } catch (error: any) {
      toast({ 
        title: 'Bulk Update Failed', 
        description: error.message || 'Something went wrong', 
        variant: 'destructive' 
      });
    } finally {
      setIsBulkUpdatingMenu(false);
    }
  };

  const toggleMenuItemSelection = (id: string) => {
    setSelectedMenuItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategoryExclusion = (category: string) => {
    setExcludedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleAllMenuItemsSelection = () => {
    if (selectedMenuItemIds.size === filteredMenu.length) {
      setSelectedMenuItemIds(new Set());
    } else {
      setSelectedMenuItemIds(new Set(filteredMenu.map(m => m._id)));
    }
  };

  const togglePlatterItemVisibility = async (item: PlatterItem) => {
    try {
      const res = await fetch('/api/updatePlatter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, id: item._id, isVisible: !item.isVisible }),
      });
      if (res.ok) {
         toast({ title: 'Success', description: `Platter is now ${!item.isVisible ? 'visible' : 'hidden'}` });
        fetchPlatterItems();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
       toast({ title: 'Error', description: 'Failed to update visibility', variant: 'destructive' });
    }
  };

  const handleBulkVisibilityUpdate = async (isVisible: boolean) => {
    if (selectedPlatterIds.size === 0) return;
    
    try {
      setIsBulkUpdating(true);
      const res = await fetch('/api/bulkUpdatePlatters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: Array.from(selectedPlatterIds), 
          isVisible 
        }),
      });

      if (res.ok) {
        toast({ 
          title: 'Bulk Update Successful', 
          description: `Updated ${selectedPlatterIds.size} items to ${isVisible ? 'visible' : 'hidden'}.` 
        });
        setSelectedPlatterIds(new Set());
        fetchPlatterItems();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to bulk update');
      }
    } catch (error: any) {
      toast({ 
        title: 'Bulk Update Failed', 
        description: error.message || 'Something went wrong', 
        variant: 'destructive' 
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const togglePlatterSelection = (id: string) => {
    setSelectedPlatterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllPlattersSelection = () => {
    if (selectedPlatterIds.size === filteredPlatters.length) {
      setSelectedPlatterIds(new Set());
    } else {
      setSelectedPlatterIds(new Set(filteredPlatters.map(p => p._id)));
    }
  };

  useEffect(() => {
    if (activeTab === 'menu') fetchMenuItems();
    if (activeTab === 'platter') fetchPlatterItems();
  }, [activeTab]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(menuItems.map(m => m.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    const q = menuQuery.toLowerCase();
    return menuItems.filter(
      (m) => {
        const matchesQuery = m.title.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q);
        const isNotExcluded = excludedCategories.size === 0 || !m.category || !excludedCategories.has(m.category);
        return matchesQuery && isNotExcluded;
      }
    );
  }, [menuQuery, menuItems, excludedCategories]);

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
        {/* Authentication & Notification Setup Dialog */}
        <AnimatePresence>
          {showAuthDialog && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <Card className="border-0 shadow-2xl">
                  <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-pink-600">
                      {authStep === 'password' ? (
                        <ShieldCheck className="h-6 w-6 text-white" />
                      ) : (
                        <Box className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <CardTitle className="text-xl">
                      {authStep === 'password' ? 'Admin Access Required' : 'Enable Order Notifications'}
                    </CardTitle>
                    <CardDescription>
                      {authStep === 'password'
                        ? 'Enter your admin password to access order management'
                        : 'Allow short sounds when new orders arrive'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {authStep === 'password' ? (
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••••••"
                            className="h-11"
                          />
                          {authError && (
                            <p className="text-sm text-red-500">{authError}</p>
                          )}
                        </div>
                        <Button
                          type="submit"
                          className="h-11 w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-95"
                        >
                          Continue
                        </Button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Enable Sound Alerts</span>
                          <input
                            type="checkbox"
                            checked={checkboxChecked}
                            onChange={(e) => setCheckboxChecked(e.target.checked)}
                            className="accent-fuchsia-600 w-4 h-4"
                          />
                        </label>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setIsAuthenticated(true);
                              setShowAuthDialog(false);
                              toast({ title: 'Welcome back', description: 'Admin access granted.' });
                            }}
                            variant="outline"
                            className="flex-1 h-11"
                          >
                            Skip
                          </Button>
                          <Button
                            onClick={handleNotificationSetup}
                            disabled={!checkboxChecked}
                            className={`flex-1 h-11 ${
                              checkboxChecked
                                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Enable Sound
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {Sidebar}

        {/* === Main Area === */}
        {isAuthenticated && (
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
                            <OrdersList
                              audioContextRef={audioContextRef}
                              audioBufferRef={audioBufferRef}
                              playNotificationSound={playNotificationSound}
                              audioInitialized={audioInitialized}
                            />
                          </CardContent>
                        </Card>
                      )}
          
                      {/* Menu Items */}
            {activeTab === 'menu' && (
              <section className="space-y-4 h-[calc(100vh-200px)] overflow-y-auto pr-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sticky top-0 bg-white dark:bg-neutral-950 z-10 pb-2">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Menu Management</h2>
                    <p className="text-sm text-neutral-500">Edit, filter, and preview menu items.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Multi-Category Exclusion Filter */}
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">Exclude:</span>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="outline" size="sm" className="h-10 px-3 flex gap-2 rounded-lg border-dashed">
                             <Archive className="h-4 w-4" />
                             {excludedCategories.size > 0 ? `${excludedCategories.size} Categories` : 'None'}
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="start" className="w-56 mt-2 max-h-80 overflow-y-auto">
                           <DropdownMenuLabel>Exclude Categories</DropdownMenuLabel>
                           <DropdownMenuSeparator />
                           {uniqueCategories.length > 0 ? (
                             uniqueCategories.map((cat) => (
                               <DropdownMenuCheckboxItem
                                 key={cat}
                                 checked={excludedCategories.has(cat)}
                                 onCheckedChange={() => toggleCategoryExclusion(cat)}
                                 onSelect={(e) => e.preventDefault()} // Prevent closing on selection
                               >
                                 {cat}
                               </DropdownMenuCheckboxItem>
                             ))
                           ) : (
                             <div className="px-2 py-1.5 text-xs text-neutral-500">No categories found</div>
                           )}
                           {excludedCategories.size > 0 && (
                             <>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem 
                                 className="text-fuchsia-600 focus:text-fuchsia-600 cursor-pointer justify-center text-xs font-semibold"
                                 onSelect={() => setExcludedCategories(new Set())}
                               >
                                 Clear All Filters
                               </DropdownMenuItem>
                             </>
                           )}
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        value={menuQuery}
                        onChange={(e) => setMenuQuery(e.target.value)}
                        placeholder="Search by name or category"
                        className="h-10 w-72 pl-9"
                      />
                    </div>
                    <Button variant="outline" onClick={fetchMenuItems}>
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Bulk Actions Bar for Menu Items */}
                {selectedMenuItemIds.size > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-[80px] z-20 flex items-center justify-between bg-fuchsia-600 text-white p-3 rounded-xl shadow-lg mb-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{selectedMenuItemIds.size} Selected</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedMenuItemIds(new Set())}
                        className="text-white hover:bg-white/20 h-8"
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        disabled={isBulkUpdatingMenu}
                        onClick={() => handleBulkMenuVisibilityUpdate(true)}
                        className="h-8 gap-1"
                      >
                        <Eye className="h-4 w-4" /> Make Visible
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        disabled={isBulkUpdatingMenu}
                        onClick={() => handleBulkMenuVisibilityUpdate(false)}
                        className="h-8 gap-1"
                      >
                        <EyeOff className="h-4 w-4" /> Make Invisible
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center gap-2 px-1 mb-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleAllMenuItemsSelection}
                    className="text-xs text-neutral-500 flex items-center gap-2"
                  >
                    {selectedMenuItemIds.size === filteredMenu.length && filteredMenu.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    {selectedMenuItemIds.size === filteredMenu.length && filteredMenu.length > 0 ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {loadingMenu ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-40 w-full" />
                        <div className="space-y-2 p-4">
                          <Skeleton className="h-5 w-1/2" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-9 w-24" />
                        </div>
                      </Card>
                    ))
                  ) : filteredMenu.length > 0 ? (
                    filteredMenu.map((item) => {
                      const isSelected = selectedMenuItemIds.has(item._id);
                      return (
                        <Card 
                          key={item._id} 
                          className={`overflow-hidden relative group transition-all duration-200 ${isSelected ? 'ring-2 ring-fuchsia-600 shadow-md' : ''}`}
                        >
                          {/* Selection Checkbox Overlay */}
                          <div 
                            className={`absolute top-2 right-2 z-30 h-6 w-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                              isSelected ? 'bg-fuchsia-600 text-white' : 'bg-black/20 text-white/50 hover:bg-black/30 opacity-0 group-hover:opacity-100'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenuItemSelection(item._id);
                            }}
                          >
                            {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                          </div>

                          <div className="flex h-40 items-center justify-center bg-neutral-100 dark:bg-neutral-900 relative">
                             {/* Discount Badge */}
                             {item.discountValue !== undefined && item.discountValue > 0 && (
                              <div className="absolute top-2 left-2 bg-[#741052] text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                                {item.discountType === 'percentage' ? `-${item.discountValue}%` : `-Rs ${item.discountValue}`}
                              </div>
                             )}
                             {/* Visibility Overlay if hidden */}
                             {!item.isVisible && (
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                                 <span className="text-white font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-2">
                                   <EyeOff className="h-4 w-4"/> Hidden
                                 </span>
                               </div>
                             )}
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={140}
                              height={140}
                              className={`h-28 w-28 rounded-lg object-cover transition-opacity ${!item.isVisible ? 'opacity-50' : ''}`}
                            />
                          </div>
                          <CardContent className="space-y-3 p-4">
                            <div>
                              <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold">{item.title}</h3>
                                <Badge variant={item.status === 'in stock' ? 'default' : 'destructive'}>
                                  {item.status}
                                </Badge>
                              </div>
                              <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                                {item.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <span className="text-sm text-neutral-500 font-medium">Rs {item.price}</span>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleMenuItemVisibility(item)}
                                  className="text-neutral-500 hover:text-[#741052]"
                                  title={item.isVisible ? "Hide from Menu" : "Show on Menu"}
                                >
                                  {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                                <Button size="sm" onClick={() => handleEditMenuItem(item)}>
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-sm text-neutral-500">
                        No menu items available.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            )}
                      {/* Platter Items */}
            {activeTab === "platter" && (
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Platter Management</h2>
                    <p className="text-sm text-neutral-500">Edit, filter, and preview platters.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        value={platterQuery}
                        onChange={(e) => setPlatterQuery(e.target.value)}
                        placeholder="Search by name or category"
                        className="h-10 w-72 pl-9"
                      />
                    </div>
                    <Button variant="outline" onClick={fetchPlatterItems}>
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedPlatterIds.size > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-0 z-20 flex items-center justify-between bg-[#741052] text-white p-3 rounded-xl shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{selectedPlatterIds.size} Selected</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedPlatterIds(new Set())}
                        className="text-white hover:bg-white/20 h-8"
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        disabled={isBulkUpdating}
                        onClick={() => handleBulkVisibilityUpdate(true)}
                        className="h-8 gap-1"
                      >
                        <Eye className="h-4 w-4" /> Make Visible
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        disabled={isBulkUpdating}
                        onClick={() => handleBulkVisibilityUpdate(false)}
                        className="h-8 gap-1"
                      >
                        <EyeOff className="h-4 w-4" /> Make Invisible
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center gap-2 px-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleAllPlattersSelection}
                    className="text-xs text-neutral-500 flex items-center gap-2"
                  >
                    {selectedPlatterIds.size === filteredPlatters.length && filteredPlatters.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    {selectedPlatterIds.size === filteredPlatters.length && filteredPlatters.length > 0 ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="max-h-[600px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {loadingPlatter ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <Skeleton className="h-40 w-full" />
                          <div className="space-y-2 p-4">
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-9 w-24" />
                          </div>
                        </Card>
                      ))
                    ) : filteredPlatters.length > 0 ? (
                      filteredPlatters.map((item) => {
                        const isSelected = selectedPlatterIds.has(item._id);
                        return (
                          <Card 
                            key={item._id} 
                            className={`overflow-hidden relative group transition-all duration-200 ${isSelected ? 'ring-2 ring-fuchsia-600 shadow-md' : ''}`}
                          >
                            {/* Selection Checkbox Overlay */}
                            <div 
                              className={`absolute top-2 right-2 z-30 h-6 w-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                                isSelected ? 'bg-fuchsia-600 text-white' : 'bg-black/20 text-white/50 hover:bg-black/30 opacity-0 group-hover:opacity-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePlatterSelection(item._id);
                              }}
                            >
                              {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            </div>

                            <div className="flex h-40 items-center justify-center bg-neutral-100 dark:bg-neutral-900 relative">
                               {/* Discount Badge */}
                               {item.discountValue !== undefined && item.discountValue > 0 && (
                                <div className="absolute top-2 left-2 bg-[#741052] text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                                  {item.discountType === 'percentage' ? `-${item.discountValue}%` : `-Rs ${item.discountValue}`}
                                </div>
                               )}
                               {/* Visibility Overlay */}
                               {!item.isVisible && (
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                                   <span className="text-white font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-2">
                                     <EyeOff className="h-4 w-4"/> Hidden
                                   </span>
                                 </div>
                               )}
                              <Image
                                src={item.image}
                                alt={item.title}
                                width={140}
                                height={140}
                                className={`h-28 w-28 rounded-lg object-cover transition-opacity ${!item.isVisible ? 'opacity-50' : ''}`}
                              />
                            </div>
                            <CardContent className="space-y-3 p-4">
                              <div>
                                <div className="flex items-center justify-between">
                                  <h3 className="text-base font-semibold">{item.title}</h3>
                                  <Badge variant={item.status === "in stock" ? "default" : "destructive"}>
                                    {item.status}
                                  </Badge>
                                </div>
                                <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                                  {item.description}
                                </p>
                              </div>
                              <div className="flex items-center justify-between mt-4">
                                <span className="text-sm text-neutral-500 font-medium">{item.platterCategory}</span>
                                <div className="flex gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => togglePlatterItemVisibility(item)}
                                    className="text-neutral-500 hover:text-[#741052]"
                                    title={item.isVisible ? "Hide from Menu" : "Show on Menu"}
                                  >
                                    {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </Button>
                                  <Button size="sm" onClick={() => handleEditPlatterItem(item)}>
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <Card>
                        <CardContent className="p-6 text-sm text-neutral-500">
                          No platter items available.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </section>
            )}
          
          
          
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
        )}
      </div>
    </TooltipProvider>
  );
};

export default AdminDashboard;
