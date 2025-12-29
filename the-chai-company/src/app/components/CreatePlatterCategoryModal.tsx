"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreatePlatterCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (newCategory: { _id: string; name: string }) => void;
}

const CreatePlatterCategoryModal: React.FC<CreatePlatterCategoryModalProps> = ({ isOpen, onClose, onCategoryCreated }) => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      // Updated endpoint for Platter Categories
      const res = await fetch('/api/platter-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });

      if (res.ok) {
        const newCat = await res.json();
        onCategoryCreated(newCat);
        setNewCategoryName("");
        onClose();
        toast.success(`Platter Category "${newCat.name}" created!`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Error creating category");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[#741052] flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Platter Category
          </DialogTitle>
          <DialogDescription>
            Add a new category for your PLATTERS (e.g., "Deals", "Sharing").
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platter-category-name" className="text-right">
              Category Name
            </Label>
            <Input
              id="platter-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Family Deals"
              className="col-span-3 focus:border-[#741052] transition-colors"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !newCategoryName.trim()}
              className="bg-gradient-to-r from-[#741052] to-[#d0269b] text-white hover:opacity-90"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Platter Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlatterCategoryModal;
