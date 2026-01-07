/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "../context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, ShoppingBag, Utensils, MapPin, Users, ChevronRight, Check, ChevronDown } from "lucide-react";

// --- Custom Select Component ---
interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: any;
  onOpenStateChange?: (isOpen: boolean) => void;
}

function CustomSelect({ options, value, onChange, placeholder, icon: Icon, onOpenStateChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpenStateChange?.(isOpen);
  }, [isOpen, onOpenStateChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-[#FAF3E6] border text-[#2E1C14] rounded-xl px-5 py-4 focus:outline-none transition-all font-medium text-lg hover:bg-[#F5EBE0]
          ${isOpen ? 'border-[#C46A47] ring-2 ring-[#C46A47]/20' : 'border-[#E3D6C6]'}`}
      >
        <span className="flex items-center gap-3">
           <div className={`p-2 rounded-full ${value ? 'bg-[#C46A47] text-white' : 'bg-[#E3D6C6]/50 text-[#6F5A4A]'}`}>
              <Icon size={18} strokeWidth={2.5} />
           </div>
           <span className={value ? "text-[#2E1C14]" : "text-[#6F5A4A]"}>
             {value || placeholder}
           </span>
        </span>
        <ChevronDown 
          className={`text-[#6F5A4A] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          size={20} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-[#FAF3E6] border border-[#E3D6C6] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
              {options.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors mb-1 last:mb-0
                    ${value === option 
                      ? 'bg-[#C46A47]/10 text-[#C46A47] font-semibold' 
                      : 'text-[#6F5A4A] hover:bg-[#C46A47]/5 hover:text-[#6B3F2A]'}`}
                >
                  <span className="truncate mr-2">{option}</span>
                  {value === option && <Check size={16} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrderTypeModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "dinein" | "">("");
  const [selectedArea, setSelectedArea] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const { setOrder } = useOrder();

  const deliveryAreas = [
    "Gulistan-e-Johar-All Blocks", "Johor Block 7", "Johor Block 8", "Johor Block 9", "Johor Block 10",
    "Dalmia Road", "Askari 4", "NHS Phase 1", "NHS Phase 2", "NHS Phase 3", "NHS Phase 4",
    "Scheme 33", "Saadi Town-All Areas", "Malir Checkpost 5", "Malir Checkpost 6", "Malir-All Areas",
    "Gulshan-e-Iqbal Block 1", "Gulshan-e-Iqbal Block 2", "Gulshan-e-Iqbal Block 3", "Gulshan-e-Iqbal Block 4",
    "Gulshan-e-Iqbal Block 5", "Gulshan-e-Iqbal Block 6", "Gulshan-e-Iqbal Block 7", "Gulshan-e-Iqbal Block 8",
    "Gulshan-e-Iqbal Block 9", "Gulshan-e-Iqbal Block 10", "Gulshan-e-Iqbal Block 11", "Gulshan-e-Iqbal Block 13",
    "Gulshan-e-Iqbal Block 14", "Gulshan-e-Iqbal Block 15", "Gulshan-e-Iqbal Block 16", "Gulshan-e-Iqbal Block 17",
    "Gulshan-e-Iqbal Block 18", "Gulshan-e-Iqbal Block 19", "FB Area-All Blocks", "Shah Faisal Colony",
    "Bahadurabad-All Areas", "Shahrah-e-Faisal-On Demand",
  ];

  const generateTableOptions = () => {
    const tables: string[] = [];
    for (let i = 1; i <= 30; i++) {
      tables.push(`${i}`);
      tables.push(`OT-${i}`);
    }
    return tables;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (orderType === "delivery" && selectedArea) {
      setOrder({ orderType: "delivery", area: selectedArea });
      router.push(`/order?type=delivery&area=${encodeURIComponent(selectedArea)}`);
    } else if (orderType === "pickup") {
      setOrder({ orderType: "pickup" });
      router.push(`/order?type=pickup`);
    } else if (orderType === "dinein" && tableNumber) {
      setOrder({ orderType: "dinein", tableId: tableNumber });
      router.push(`/order?type=dinein&tableId=${encodeURIComponent(tableNumber)}`);
    }

    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dynamic Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#2E1C14]/60 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`relative w-full max-w-2xl bg-[#FAF3E6] rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-[#E3D6C6]/50 
          ${isDropdownOpen ? 'overflow-visible' : 'overflow-hidden'}`}
      >
        {/* Decorative Top Bar - Fused structurally, clipped by parent overflow */}
        <div className="h-1.5 md:h-2 w-full bg-gradient-to-r from-[#C46A47] via-[#A65638] to-[#6B3F2A]" />

        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-extrabold text-[#6B3F2A] mb-3 tracking-tight"
            >
              Start Your Order
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[#6F5A4A] text-lg font-light"
            >
              How would you like to enjoy your meal today?
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { id: 'delivery', icon: Bike, label: 'Delivery', desc: 'Doorstep service' },
              { id: 'pickup', icon: ShoppingBag, label: 'Pickup', desc: 'Grab & Go' },
              { id: 'dinein', icon: Utensils, label: 'Dine-In', desc: 'Table service' }
            ].map((option, idx) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                onClick={() => setOrderType(option.id as any)}
                className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 group
                  ${orderType === option.id 
                    ? 'border-[#C46A47] bg-white shadow-xl scale-105 z-10' 
                    : 'border-transparent bg-white/50 hover:bg-white hover:border-[#E3D6C6] hover:shadow-lg'
                  }`}
              >
                {orderType === option.id && (
                  <motion.div 
                    layoutId="check"
                    className="absolute top-3 right-3 text-[#C46A47]"
                  >
                    <Check size={18} strokeWidth={3} />
                  </motion.div>
                )}
                
                <div className={`p-4 rounded-full mb-3 transition-colors duration-300
                  ${orderType === option.id ? 'bg-[#C46A47]/10 text-[#C46A47]' : 'bg-[#E3D6C6]/30 text-[#6F5A4A] group-hover:bg-[#C46A47]/10 group-hover:text-[#C46A47]'}`}>
                  <option.icon size={28} strokeWidth={2} />
                </div>
                
                <span className={`font-bold text-lg mb-1 ${orderType === option.id ? 'text-[#6B3F2A]' : 'text-[#6F5A4A] group-hover:text-[#6B3F2A]'}`}>
                  {option.label}
                </span>
                <span className="text-xs text-[#6F5A4A]/70 font-medium uppercase tracking-wide">
                  {option.desc}
                </span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {orderType && (
              <motion.form
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className=""
              >
                <div className="bg-white p-6 rounded-2xl border border-[#E3D6C6]/50 shadow-inner mb-6">
                  {orderType === "delivery" && (
                    <div className="space-y-4">
                       <label className="flex items-center gap-2 text-sm font-bold text-[#6B3F2A] uppercase tracking-wider">
                        <MapPin size={16} className="text-[#C46A47]" />
                        Select Delivery Area
                      </label>
                      <CustomSelect 
                        options={deliveryAreas} 
                        value={selectedArea} 
                        onChange={setSelectedArea} 
                        placeholder="Choose your location..." 
                        icon={MapPin}
                        onOpenStateChange={setIsDropdownOpen}
                      />
                    </div>
                  )}

                  {orderType === "dinein" && (
                     <div className="space-y-4">
                      <label className="flex items-center gap-2 text-sm font-bold text-[#6B3F2A] uppercase tracking-wider">
                        <Users size={16} className="text-[#C46A47]" />
                        Select Table Number
                      </label>
                      <CustomSelect 
                        options={generateTableOptions()} 
                        value={tableNumber} 
                        onChange={setTableNumber} 
                        placeholder="Tap to select table..." 
                        icon={Utensils}
                        onOpenStateChange={setIsDropdownOpen}
                      />
                    </div>
                  )}

                  {orderType === "pickup" && (
                    <div className="text-center py-4">
                      <p className="text-[#6B3F2A] font-medium text-lg">
                        Great choice! We'll have your order ready for pickup.
                      </p>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white font-bold text-xl py-4 rounded-xl shadow-[0_10px_20px_-5px_rgba(196,106,71,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(196,106,71,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to Menu</span>
                  <ChevronRight size={24} strokeWidth={3} className="opacity-80" />
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
