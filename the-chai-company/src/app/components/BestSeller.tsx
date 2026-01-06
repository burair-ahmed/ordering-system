import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface BestSellerProps {
  item: any; // Using any for now to support both MenuItem and Platter, can be refined to a Union type
  onOrder?: () => void;
}

const BestSeller = ({ item, onOrder }: BestSellerProps) => {
  if (!item) return null;

  return (
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
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#D4AF37] text-[#2E1C14] font-bold text-sm tracking-wide mb-6 uppercase">
                #1 Best Seller
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#F5E6D3] mb-6 leading-tight">
                {item.title}
              </h2>
              <p className="text-[#D3C0A6] text-lg mb-8 line-clamp-3">
                {item.description}
              </p>
              <div className="flex items-center gap-6">
                <div className="text-3xl font-bold text-[#FF8C00]">
                 Rs. {item.price || item.basePrice}
                </div>
                <Button 
                  onClick={onOrder}
                  className="bg-[#FF8C00] hover:bg-[#E07B00] text-white px-8 py-6 rounded-xl text-lg font-semibold shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Order Now
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
  );
};

export default BestSeller;
