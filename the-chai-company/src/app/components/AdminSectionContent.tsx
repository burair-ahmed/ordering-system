
"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LuxuryConfirmModal } from "./LuxuryConfirmModal";

// --- Types ---
interface MenuItem {
    _id: string;
    title: string;
}

interface PageSection {
  id: string;
  type: 'best-seller' | 'featured' | 'slider' | 'grid';
  title: string;
  isVisible: boolean;
  props: {
    sourceType?: 'category' | 'manual'; 
    itemType?: 'menu' | 'platter'; // New field for differentiating categories
    categoryId?: string; 
    itemIds?: string[];
  };
}

// --- Types ---
interface CategoryItem {
    _id: string;
    name: string;
}

const SECTION_Types = [
    { type: 'best-seller', label: 'Best Seller Section', desc: 'Highlights a single product' },
    { type: 'featured', label: 'Featured Slider', desc: 'Horizontal scroll of highlighted items' },
    { type: 'grid', label: 'Product Grid', desc: 'Standard grid layout for any category' },
    { type: 'slider', label: 'Category Slider', desc: 'Horizontal scroll for any category' },
];

// --- Sortable Section Component ---
function SortableSection({ section, index, updateSection, removeSection, items, categories, platterCategories }: {
    section: PageSection;
    index: number;
    updateSection: (id: string, updates: Partial<PageSection>) => void;
    removeSection: (id: string) => void;
    items: MenuItem[];
    categories: CategoryItem[];
    platterCategories: CategoryItem[];
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
    const [expanded, setExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const updateProps = (updates: any) => {
        updateSection(section.id, { props: { ...section.props, ...updates } });
    };

    const toggleItemId = (itemId: string) => {
        const currentIds = section.props.itemIds || [];
        const newIds = currentIds.includes(itemId)
            ? currentIds.filter(id => id !== itemId)
            : [...currentIds, itemId];
        updateProps({ itemIds: newIds });
    };

    const filteredItems = items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div ref={setNodeRef} style={style} className="bg-white border rounded-xl shadow-sm mb-4 overflow-hidden">
            {/* Header / Drag Handle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 border-b">
                <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical size={20} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                         <span className="font-semibold text-gray-800">{section.title || "Untitled Section"}</span>
                         <Badge variant="outline" className="text-xs uppercase">{section.type.replace('-', ' ')}</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Switch 
                        checked={section.isVisible} 
                        onCheckedChange={(c) => updateSection(section.id, { isVisible: c })} 
                    />
                    <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => removeSection(section.id)}>
                        <Trash2 size={18} />
                    </Button>
                </div>
            </div>

            {/* Configuration Body */}
            {expanded && (
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Section Title (Displayed)</Label>
                            <Input 
                                value={section.title} 
                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                placeholder="e.g. Our Best Sellers"
                            />
                        </div>
                         
                        {/* Source Type Selector (If applicable) */}
                        {['grid', 'slider'].includes(section.type) && (
                            <div>
                                <Label>Data Source</Label>
                                <Select 
                                    value={section.props.sourceType} 
                                    onValueChange={(val: any) => updateProps({ sourceType: val })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="category">Category</SelectItem>
                                        <SelectItem value="manual">Manual Selection</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        {/* New Item Type Selector for Category Source */}
                        {section.props.sourceType === 'category' && ['grid', 'slider'].includes(section.type) && (
                            <div>
                                <Label>Item Type</Label>
                                <Select 
                                    value={section.props.itemType || 'menu'} 
                                    onValueChange={(val: any) => updateProps({ itemType: val, categoryId: "" })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="menu">Menu Items</SelectItem>
                                        <SelectItem value="platter">Platters</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Category Selector */}
                    {section.props.sourceType === 'category' && (['grid', 'slider'].includes(section.type)) && (
                        <div>
                            <Label>Select {section.props.itemType === 'platter' ? 'Platter ' : ''}Category</Label>
                            <Select 
                                value={section.props.categoryId} 
                                onValueChange={(val) => updateProps({ categoryId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose category..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {(section.props.itemType === 'platter' ? platterCategories : categories).map(cat => (
                                        <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Manual Item Selector */}
                    {(section.type === 'best-seller' || section.type === 'featured' || section.props.sourceType === 'manual') && (
                        <div>
                            <Label>Select Items {section.type === 'best-seller' ? '(Single)' : '(Multiple)'}</Label>
                            
                            {/* Simple Search & List */}
                            <div className="border rounded-md mt-2">
                                <div className="p-2 border-b">
                                     <Input 
                                        placeholder="Search items..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                                <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                                    {filteredItems.slice(0, 50).map(item => {
                                        const isSelected = section.props.itemIds?.includes(item._id);
                                        return (
                                            <div 
                                                key={item._id}
                                                className={`flex items-center justify-between p-2 rounded cursor-pointer ${isSelected ? "bg-orange-50 border border-orange-200" : "hover:bg-gray-50"}`}
                                                onClick={() => {
                                                    if (section.type === 'best-seller') {
                                                        // Single select behavior
                                                        updateProps({ itemIds: [item._id] });
                                                    } else {
                                                        toggleItemId(item._id);
                                                    }
                                                }}
                                            >
                                                <span className="text-sm">{item.title}</span>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {section.props.itemIds?.length || 0} items selected
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Main CMS Component ---
export default function AdminSectionContent() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [platterCategories, setPlatterCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
      fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [configRes, menuRes, platterRes, categoriesRes, platterCatsRes] = await Promise.all([
            fetch("/api/page-config").then(r => r.json()),
            fetch("/api/getitemsadmin").then(r => r.json()),
            fetch("/api/platteradmin").then(r => r.json()),
            fetch("/api/categories").then(r => r.json()),
            fetch("/api/platter-categories").then(r => r.json())
        ]);
        
        setCategories(categoriesRes || []);
        setPlatterCategories(platterCatsRes || []);
        
        const combinedItems = [
            ...(menuRes || []),
            ...(platterRes || [])
        ].map((i: any) => ({ _id: i._id, title: i.title }));
        
        setItems(combinedItems);
        
        if (configRes && configRes.sections) {
            setSections(configRes.sections);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const addSection = (type: any) => {
      // Lazy load uuid to avoid SSR issues if any, though "use client" handles it.
      const newSection: PageSection = {
          id: uuidv4(),
          type: type.type,
          title: type.label,
          isVisible: true,
          props: {
              sourceType: 'category',
              itemType: 'menu',
              categoryId: categories.length > 0 ? categories[0].name : "",
              itemIds: []
          }
      };
      setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
      setSectionToDelete(id);
      setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
      if (sectionToDelete) {
          setSections(sections.filter(s => s.id !== sectionToDelete));
          setSectionToDelete(null);
      }
  };

  const updateSection = (id: string, updates: Partial<PageSection>) => {
      setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
          setSections((items) => {
              const oldIndex = items.findIndex((i) => i.id === active.id);
              const newIndex = items.findIndex((i) => i.id === over.id);
              return arrayMove(items, oldIndex, newIndex);
          });
      }
  };

  const saveConfig = async () => {
      setSaving(true);
      try {
          await fetch("/api/page-config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sections })
          });
          toast.success("Layout saved successfully.");
      } catch (e) {
          toast.error("Failed to save layout.");
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading CMS...</div>;

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Sidebar - Tools */}
      <div className="w-[300px] flex flex-col gap-4">
          <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#6B3F2A]">Available Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  {SECTION_Types.map(t => (
                      <div key={t.type} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => addSection(t)}>
                          <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-800">{t.label}</span>
                              <Plus size={16} className="text-[#C46A47]" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                      </div>
                  ))}
              </CardContent>
          </Card>
          
          <div className="mt-auto">
             <Button size="lg" className="w-full bg-[#C46A47] hover:bg-[#A65335]" onClick={saveConfig} disabled={saving}>
                 <Save className="w-4 h-4 mr-2" />
                 {saving ? "Saving..." : "Save Layout"}
             </Button>
          </div>
      </div>

      {/* Main Stage - Preview/Edit */}
      <div className="flex-1 bg-gray-50 border rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-white flex justify-between items-center">
              <h2 className="font-semibold text-gray-700">Page Layout ({sections.length} sections)</h2>
              <span className="text-xs text-gray-400">Drag items to reorder</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragEnd={handleDragEnd}
              >
                  <SortableContext 
                    items={sections.map(s => s.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                      <div className="max-w-3xl mx-auto pb-20">
                          {sections.map((section, index) => (
                              <SortableSection 
                                key={section.id} 
                                section={section} 
                                index={index}
                                updateSection={updateSection}
                                removeSection={removeSection}
                                items={items}
                                categories={categories}
                                platterCategories={platterCategories}
                              />
                          ))}
                      </div>
                  </SortableContext>
              </DndContext>
          </div>
      </div>
      
      <LuxuryConfirmModal 
        isOpen={isDeleteModalOpen}
        title="Delete Section"
        message="Are you sure you want to remove this section? This action cannot be undone."
        confirmLabel="Delete Section"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        variant="danger"
      />
    </div>
  );
}
