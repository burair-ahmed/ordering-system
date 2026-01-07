import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MenuItemModal } from "./MenuItemModal";
import { PlatterItemModal } from "./PlatterItemModal";

interface BestSellerProps {
  item: any; // Using any for now to support both MenuItem and Platter, can be refined to a Union type
  onOrder?: () => void;
}

const BestSeller = ({ item, onOrder }: BestSellerProps) => {
  const [showModal, setShowModal] = useState(false);

  if (!item) return null;

  const isPlatter = item.basePrice !== undefined || item.categories !== undefined;

  const handleOrderClick = () => {
    setShowModal(true);
    if (onOrder) onOrder();
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#2E1C14] to-[#4A2C20] shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            
            {/* Text Content */}
            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center order-2 md:order-1 z-10 relative">
               {/* Decorative Background Element */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/pattern.png')] pointer-events-none" />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#C46A47]/20 text-[#C46A47] font-bold text-sm tracking-widest mb-6 uppercase border border-[#C46A47]/30 backdrop-blur-sm">
                  #1 Best Seller
                </span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#F5E6D3] mb-6 leading-tight tracking-tighter">
                  {item.title}
                </h2>
                <p className="text-[#D3C0A6] text-lg mb-8 line-clamp-3 font-light leading-relaxed opacity-90">
                  {item.description}
                </p>
                <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#C46A47] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Price</span>
                    <div className="text-3xl md:text-4xl font-black text-[#C46A47] flex items-baseline gap-1">
                      <span className="text-lg font-bold">Rs.</span>
                      {Math.round(item.price || item.basePrice)}
                    </div>
                  </div>
                  <Button 
                    onClick={handleOrderClick}
                    className="bg-[#C46A47] hover:bg-[#A65638] text-white px-10 py-7 rounded-2xl text-xl font-black shadow-[0_20px_40px_-10px_rgba(196,106,71,0.4)] transition-all hover:scale-[1.02] active:scale-95 border-b-4 border-[#82462F] tracking-tight group relative overflow-hidden"
                  >
                    <span className="relative z-10">Order Now</span>
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer transition-transform" />
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Image Content */}
            <div className="relative h-[400px] md:h-[500px] order-1 md:order-2">
              <div className="absolute inset-0 bg-gradient-to-t from-[#2E1C14] via-transparent to-transparent md:bg-gradient-to-l opacity-60 z-10" />
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {isPlatter ? (
        <PlatterItemModal 
          platter={item} 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
        />
      ) : (
        <MenuItemModal 
          item={item} 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
};

export default BestSeller;
