/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { FC, useEffect, useState, useRef } from 'react';
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
  Sun,
  Moon,
  Truck,
  Tag,
  Menu as MenuIcon,
  X,
  Volume2,
  VolumeX,
  Activity,
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
import BulkDiscountManagement from '../components/BulkDiscountManagement';
import DeliveryChargesManagement from '../components/DeliveryChargesManagement';

// New modular subcomponents
import AdminAuthDialog from '../components/AdminAuthDialog';
import MenuManagement from '../components/MenuManagement';
import PlatterManagement from '../components/PlatterManagement';
import BehavioralAnalytics from '../components/BehavioralAnalytics';
import AdminPageBuilder from '../components/AdminPageBuilder';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  | 'bulkDiscounts'
  | 'deliveryCharges'
  | 'tables'
  | 'completedOrders'
  | 'analytics'
  | 'behavioral'
  | 'layoutBuilder'
  | 'settings';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'orders', label: 'Live Orders', icon: ListChecks },
  { key: 'menu', label: 'Menu Catalog', icon: ListChecks },
  { key: 'platter', label: 'Gourmet Platters', icon: ListChecks },
  { key: 'addmenu', label: 'Add New Menu', icon: Plus },
  { key: 'addplatter', label: 'Add New Platter', icon: Plus },
  { key: 'bulkDiscounts', label: 'Bulk Discounts', icon: Tag },
  { key: 'deliveryCharges', label: 'Delivery Charges', icon: Truck },
  { key: 'tables', label: 'Dine-in Tables', icon: Table2 },
  { key: 'completedOrders', label: 'Completed Orders', icon: Archive },
  { key: 'analytics', label: 'Analytics Panel', icon: BarChart3 },
  { key: 'behavioral', label: 'Behavioral Insights', icon: Activity },
  { key: 'layoutBuilder', label: 'Order Page CMS', icon: LayoutDashboard },
  { key: 'settings', label: 'Preferences', icon: Settings },
];

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

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [audioInitialized, setAudioInitialized] = useState<boolean>(false);
  const [systemTime, setSystemTime] = useState<string>('');

  const correctPassword = '123-$CLK-Admin-$Panel-786';

  // Audio Context references for alerts
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Update header local clock
  useEffect(() => {
    setSystemTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const initializeAudioContext = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch('/notification/notification.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContextRef.current = audioContext;
      audioBufferRef.current = audioBuffer;
      setAudioInitialized(true);
    } catch (error) {
      console.error('AudioContext initialization error:', error);
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

  const handleAuthSuccess = (enableAudio: boolean) => {
    if (enableAudio) {
      initializeAudioContext();
    }
    setIsAuthenticated(true);
    toast({
      title: 'Dashboard Unlocked',
      description: 'Access to administrative panel granted successfully.',
    });
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setShowEditMenuItemModal(true);
  };

  const handleEditPlatterItem = (item: PlatterItem) => {
    setSelectedPlatterItem(item);
    setShowEditPlatterItemModal(true);
  };

  const fetchMenuItems = async () => {
    try {
      setLoadingMenu(true);
      const res = await fetch('/api/getitemsadmin');
      const data: MenuItem[] = await res.json();
      setMenuItems(data);
    } catch (e) {
      toast({
        title: 'Network Error',
        description: 'Failed to synchronize menu items.',
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
        title: 'Network Error',
        description: 'Failed to synchronize platter configurations.',
        variant: 'destructive',
      });
      console.error(e);
    } finally {
      setLoadingPlatter(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'menu' || activeTab === 'bulkDiscounts') fetchMenuItems();
    if (activeTab === 'platter' || activeTab === 'bulkDiscounts') fetchPlatterItems();
  }, [activeTab, isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast({
      title: 'Logged Out',
      description: 'Administrative workspace locked successfully.',
    });
  };

  if (!isAuthenticated) {
    return (
      <AdminAuthDialog
        correctPassword={correctPassword}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        
        {/* FROSTED GLASS SIDEBAR CONTAINER */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col border-r border-neutral-200/60 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-2xl transition-all duration-300 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        >
          {/* Logo brand head */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-100 dark:border-neutral-800/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-2xl bg-gradient-to-br from-[#741052] to-pink-500 shadow-md shadow-fuchsia-500/10 flex items-center justify-center text-white text-xs font-black">
                CLK
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Cafe Little Karachi</span>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Admin Workspace</span>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed((s) => !s)}
              className="hidden md:flex h-8 w-8 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden h-8 w-8 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Nav List */}
          <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
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
                  className={`h-11 w-full justify-start gap-3 rounded-2xl px-3 text-xs font-semibold tracking-wide transition-all ${
                    active
                      ? 'bg-fuchsia-50/80 text-[#741052] dark:bg-neutral-800/80 dark:text-fuchsia-300 shadow-sm border border-fuchsia-100/50 dark:border-neutral-700/50'
                      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-neutral-400'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{label}</span>}
                </Button>
              );
            })}
          </nav>

          {/* Footer User Info Section */}
          <div className="border-t border-neutral-100 dark:border-neutral-800/50 p-3 bg-neutral-50/30 dark:bg-neutral-900/10">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className={
                "w-full justify-start gap-3 rounded-xl text-neutral-600 dark:text-neutral-300 px-3 h-11 " +
                "hover:text-rose-600 hover:bg-rose-500/10"
              }
            >
              <LogOut className="h-4.5 w-4.5 text-neutral-400 shrink-0 group-hover:text-rose-500" />
              {!isSidebarCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Lock Workspace</span>}
            </Button>
          </div>
        </aside>

        {/* MAIN DISPLAY VIEWPORT */}
        <section className="flex flex-1 flex-col overflow-y-auto">
          
          {/* HEADER BAR */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200/50 bg-white/70 dark:bg-neutral-950/60 px-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
              
              <div className="hidden sm:flex items-center gap-2">
                <LayoutDashboard className="h-4.5 w-4.5 text-fuchsia-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Dashboard</span>
                <span className="text-neutral-300 dark:text-neutral-700">/</span>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  {TABS.find(t => t.key === activeTab)?.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Audio indicators */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-500 uppercase bg-neutral-50/50 dark:bg-neutral-900/40">
                    {audioInitialized ? (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Sound Active</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Muted</span>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Live order audio alert status</TooltipContent>
              </Tooltip>

              {/* Local Clock */}
              <span className="hidden md:inline text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500">
                {systemTime}
              </span>

              <span className="text-neutral-200 dark:text-neutral-800 hidden md:inline">|</span>

              {/* Dark mode switch */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg shrink-0"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
              </Button>
            </div>
          </header>

          {/* DASHBOARD TAB CONTAINER CHANGER */}
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 space-y-6">
            
            {/* Orders view */}
            {activeTab === 'orders' && (
              <Card className="border border-neutral-200/50 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-900/40 dark:to-neutral-900/10 border-b">
                  <CardTitle className="text-xl font-bold tracking-tight">Real-time Orders</CardTitle>
                  <CardDescription>Process, track, and dispatch ongoing customer checkout requests.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <OrdersList
                    audioContextRef={audioContextRef}
                    audioBufferRef={audioBufferRef}
                    playNotificationSound={playNotificationSound}
                    audioInitialized={audioInitialized}
                  />
                </CardContent>
              </Card>
            )}

            {/* Menu view */}
            {activeTab === 'menu' && (
              <MenuManagement
                menuItems={menuItems}
                loading={loadingMenu}
                refreshData={fetchMenuItems}
                onEditItem={handleEditMenuItem}
              />
            )}

            {/* Platter view */}
            {activeTab === 'platter' && (
              <PlatterManagement
                platterItems={platterItems}
                loading={loadingPlatter}
                refreshData={fetchPlatterItems}
                onEditItem={handleEditPlatterItem}
              />
            )}

            {/* Add menu form */}
            {activeTab === 'addmenu' && (
              <Card className="border border-neutral-200/50 shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Add New Dish</CardTitle>
                  <CardDescription>Enter specifications to populate a new single item in the menu.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AddMenuItemForm />
                </CardContent>
              </Card>
            )}

            {/* Add platter form */}
            {activeTab === 'addplatter' && (
              <Card className="border border-neutral-200/50 shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Compose Platter</CardTitle>
                  <CardDescription>Select individual menu options to assemble a dynamic gourmet combo deal platter.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AddPlatterForm />
                </CardContent>
              </Card>
            )}

            {/* Bulk Discounts Management */}
            {activeTab === 'bulkDiscounts' && (
              <BulkDiscountManagement
                menuItems={menuItems}
                platterItems={platterItems}
                isLoading={loadingMenu || loadingPlatter}
                refreshData={async () => {
                  await fetchMenuItems();
                  await fetchPlatterItems();
                }}
              />
            )}

            {/* Dynamic Delivery Charges Panel */}
            {activeTab === 'deliveryCharges' && (
              <DeliveryChargesManagement />
            )}

            {/* Table QR Management */}
            {activeTab === 'tables' && (
              <Card className="border border-neutral-200/50 shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Table Layout</CardTitle>
                  <CardDescription>Configure tables, generate dine-in barcodes, and download QR codes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TableManagement />
                </CardContent>
              </Card>
            )}

            {/* Completed order history */}
            {activeTab === 'completedOrders' && (
              <Card className="border border-neutral-200/50 shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Completed Orders Archive</CardTitle>
                  <CardDescription>Historical overview of fulfilled customer dispatches.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CompletedOrders />
                </CardContent>
              </Card>
            )}

            {/* Analytics dashboards */}
            {activeTab === 'analytics' && (
              <Card className="border border-neutral-200/50 shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Workspace Analytics</CardTitle>
                  <CardDescription>Evaluate business sales metrics, peak order periods, and performance trends.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnalyticsPage />
                </CardContent>
              </Card>
            )}

            {/* Behavioral analytics */}
            {activeTab === 'behavioral' && (
              <Card className="border border-neutral-200/50 shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Behavioral Insights</CardTitle>
                  <CardDescription>Analyze real-time user shopping flows, event drop-offs, and popular items views.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BehavioralAnalytics />
                </CardContent>
              </Card>
            )}

            {/* Order page CMS page builder tab */}
            {activeTab === 'layoutBuilder' && (
              <Card className="border border-neutral-200/50 shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Order Page CMS</CardTitle>
                  <CardDescription>Design and customize sections, banners, grids, and card styles for the customer ordering page.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminPageBuilder />
                </CardContent>
              </Card>
            )}

            {/* Preferences settings tab */}
            {activeTab === 'settings' && (
              <Card className="border border-neutral-200/50 shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Admin Preferences</CardTitle>
                  <CardDescription>Adjust localized dashboard configurations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Display Theme</p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-xl text-xs h-9 px-4 font-semibold" onClick={() => setTheme('light')}>Light</Button>
                        <Button variant="outline" className="rounded-xl text-xs h-9 px-4 font-semibold" onClick={() => setTheme('dark')}>Dark</Button>
                        <Button variant="outline" className="rounded-xl text-xs h-9 px-4 font-semibold" onClick={() => setTheme('system')}>System</Button>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Workspace Session</p>
                      <Button variant="destructive" onClick={handleLogout} className="gap-2 rounded-xl text-xs font-semibold h-9 px-4">
                        <LogOut className="h-4 w-4" /> Lock Workspace
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </section>
      </div>

      {/* RENDER DYNAMIC POPUP MODALS IN CENTRAL ROOT */}
      {showEditMenuItemModal && selectedMenuItem && (
        <EditMenuItemForm
          item={selectedMenuItem}
          onClose={() => {
            setSelectedMenuItem(null);
            setShowEditMenuItemModal(false);
          }}
          onUpdate={fetchMenuItems}
        />
      )}

      {showEditPlatterItemModal && selectedPlatterItem && (
        <EditPlatterForm
          item={selectedPlatterItem}
          onClose={() => {
            setSelectedPlatterItem(null);
            setShowEditPlatterItemModal(false);
          }}
          onUpdate={fetchPlatterItems}
        />
      )}
    </TooltipProvider>
  );
};

export default AdminDashboard;
