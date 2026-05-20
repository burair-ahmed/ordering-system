'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Truck,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DeliveryArea {
  _id: string;
  name: string;
  charge: number;
  isAvailable: boolean;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function DeliveryChargesManagement() {
  const { toast } = useToast();
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [charge, setCharge] = useState<number | ''>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [note, setNote] = useState('');
  
  // Action Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  // Fetch delivery areas
  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery-areas');
      if (res.ok) {
        const data = await res.json();
        setDeliveryAreas(data);
      } else {
        throw new Error('Failed to fetch delivery areas');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to load delivery charges.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  // Filtered areas based on search query
  const filteredAreas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return deliveryAreas;
    return deliveryAreas.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.note && a.note.toLowerCase().includes(q))
    );
  }, [deliveryAreas, searchQuery]);

  // Compute statistics
  const stats = useMemo(() => {
    const total = deliveryAreas.length;
    const active = deliveryAreas.filter((a) => a.isAvailable).length;
    const inactive = total - active;
    const activeCharges = deliveryAreas.filter((a) => a.isAvailable).map((a) => a.charge);
    const avgCharge =
      activeCharges.length > 0
        ? Math.round(activeCharges.reduce((sum, val) => sum + val, 0) / activeCharges.length)
        : 0;

    return { total, active, inactive, avgCharge };
  }, [deliveryAreas]);

  // Open Dialog for Adding
  const handleAddOpen = () => {
    setEditingArea(null);
    setName('');
    setCharge('');
    setIsAvailable(true);
    setNote('');
    setIsOpen(true);
  };

  // Open Dialog for Editing
  const handleEditOpen = (area: DeliveryArea) => {
    setEditingArea(area);
    setName(area.name);
    setCharge(area.charge);
    setIsAvailable(area.isAvailable);
    setNote(area.note || '');
    setIsOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Delivery area name is required.',
        variant: 'destructive',
      });
      return;
    }

    const numericCharge = charge === '' ? 0 : Number(charge);
    if (isNaN(numericCharge) || numericCharge < 0) {
      toast({
        title: 'Validation Error',
        description: 'Delivery charge must be a non-negative number.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = '/api/delivery-areas';
      const method = editingArea ? 'PUT' : 'POST';
      const bodyPayload = editingArea
        ? { id: editingArea._id, name, charge: numericCharge, isAvailable, note }
        : { name, charge: numericCharge, isAvailable, note };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const responseData = await res.json();

      if (res.ok) {
        toast({
          title: 'Success',
          description: editingArea
            ? `Successfully updated ${name}`
            : `Successfully added ${name}`,
        });
        setIsOpen(false);
        fetchAreas();
      } else {
        throw new Error(responseData.error || 'Request failed');
      }
    } catch (error: any) {
      toast({
        title: 'Request Failed',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Availability Inline
  const handleToggleAvailability = async (area: DeliveryArea) => {
    setTogglingId(area._id);
    try {
      const res = await fetch('/api/delivery-areas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: area._id,
          isAvailable: !area.isAvailable,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Status Updated',
          description: `${area.name} is now ${!area.isAvailable ? 'available' : 'unavailable'} for delivery.`,
        });
        fetchAreas();
      } else {
        throw new Error('Failed to toggle status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update availability status.',
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Delivery Area
  const handleDeleteArea = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/delivery-areas?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: 'Area Deleted',
          description: `Successfully removed ${name} from delivery areas.`,
        });
        fetchAreas();
      } else {
        throw new Error('Delete request failed');
      }
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Could not delete the area.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Sync Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-neutral-900 p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Delivery Charges Panel</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage delivery locations, service availability, pricing structures, and custom notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAreas}
            disabled={loading}
            className="h-10 px-4 gap-2 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleAddOpen}
            className="h-10 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-90 text-white rounded-xl gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Area
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total Areas
            </CardTitle>
            <MapPin className="h-4 w-4 text-fuchsia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-neutral-500 mt-1">Configured in database</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Active Deliveries
            </CardTitle>
            <Truck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</div>
            <p className="text-xs text-neutral-500 mt-1">Available to customers</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Unavailable Areas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.inactive}</div>
            <p className="text-xs text-neutral-500 mt-1">Deliveries currently blocked</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Avg Active Charge
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Rs. {stats.avgCharge}</div>
            <p className="text-xs text-neutral-500 mt-1">Across active regions</p>
          </CardContent>
        </Card>
      </div>

      {/* Table & Filtering */}
      <Card className="border">
        <CardHeader className="pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">All Delivery Regions</CardTitle>
            <CardDescription>Filter areas, toggle availability, edit charges and special conditions.</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by area name or note..."
              className="h-10 pl-9 rounded-xl border-gray-300"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading && deliveryAreas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" />
              <p className="text-sm text-neutral-500">Loading delivery areas...</p>
            </div>
          ) : filteredAreas.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-neutral-900/30 border-b text-neutral-500 font-medium">
                  <th className="p-4 pl-6">Region Name</th>
                  <th className="p-4">Charge (PKR)</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Notes / Restrictions</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAreas.map((area) => (
                    <motion.tr
                      key={area._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors"
                    >
                      <td className="p-4 pl-6 font-semibold text-neutral-800 dark:text-neutral-200">
                        {area.name}
                      </td>
                      <td className="p-4 font-mono font-medium text-neutral-600 dark:text-neutral-400">
                        Rs. {area.charge}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={togglingId === area._id}
                          onClick={() => handleToggleAvailability(area)}
                          className={`rounded-full px-3 py-1 text-xs gap-1.5 h-7 ${
                            area.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                          }`}
                        >
                          {togglingId === area._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : area.isAvailable ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                          )}
                          {area.isAvailable ? 'Active' : 'Blocked'}
                        </Button>
                      </td>
                      <td className="p-4 max-w-xs truncate text-neutral-500">
                        {area.note ? (
                          <Badge variant="outline" className="font-normal border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/10 dark:text-amber-400">
                            {area.note}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditOpen(area)}
                            className="h-8 w-8 text-neutral-500 hover:text-fuchsia-600 rounded-lg"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteArea(area._id, area.name)}
                            className="h-8 w-8 text-neutral-500 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-neutral-500">
              <MapPin className="h-8 w-8 mx-auto mb-3 text-neutral-300" />
              <p className="font-medium">No regions found matching your query.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingArea ? 'Edit Delivery Area' : 'Add Delivery Area'}</DialogTitle>
            <DialogDescription>
              Configure details below for ordering area delivery validation and pricing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label htmlFor="modal-name" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Region / Area Name
              </label>
              <Input
                id="modal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Johor Block 7"
                required
                className="rounded-xl border-gray-300 focus:ring-fuchsia-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="modal-charge" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Delivery Charge (PKR)
              </label>
              <Input
                id="modal-charge"
                type="number"
                min="0"
                value={charge}
                onChange={(e) => setCharge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 250"
                required
                className="rounded-xl border-gray-300 focus:ring-fuchsia-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="modal-note" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Warning / Restrictions Note (Optional)
              </label>
              <Input
                id="modal-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Delivery not possible after Magrib"
                className="rounded-xl border-gray-300 focus:ring-fuchsia-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-dashed">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Allow Delivery
                </span>
                <p className="text-xs text-neutral-500">
                  Enable/disable order dispatch to this location.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="accent-fuchsia-600 h-5 w-5 rounded border-gray-300 cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border-neutral-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-xl hover:opacity-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
