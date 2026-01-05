import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Platter from "@/models/Platter";
import PageConfig from "@/models/PageConfig";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  await connectDB();

  try {

    let bestSellerQuery = { isBestSeller: true };
    let featuredQuery = { isFeatured: true };

    // Try to get config
    // Try to get config
    const config = await PageConfig.findOne({ type: "order-page" });
    
    let bestSellerId: string | undefined;
    let featuredIds: string[] = [];

    if (config && config.sections) {
        // Find best seller section
        const bestSellerSection = config.sections.find((s: any) => s.type === 'best-seller' && s.isVisible);
        if (bestSellerSection && bestSellerSection.props?.itemIds?.length > 0) {
            bestSellerId = bestSellerSection.props.itemIds[0];
        }

        // Find featured sections (could be multiple, we'll merge them or take headers)
        config.sections
            .filter((s: any) => s.type === 'featured' && s.isVisible && s.props?.itemIds)
            .forEach((s: any) => {
                s.props.itemIds.forEach((id: string) => featuredIds.push(id));
            });
    }

    if (bestSellerId) {
        bestSellerQuery = { _id: bestSellerId } as any;
    }
    if (featuredIds.length > 0) {
        featuredQuery = { _id: { $in: featuredIds } } as any;
    }

    // Fetch Best Seller (Single)
    // Check MenuItems first
    let bestSellers = await MenuItem.find(bestSellerQuery).limit(1);
    
    // If not found in MenuItems, check Platters (if using universal ID this is tricky without knowing model)
    // If we used the query { isBestSeller: true } filtering is easy.
    // If we have a specific ID, we might need to check both if we don't know the type.
    if (bestSellers.length === 0 && bestSellerId) {
         const platter = await Platter.findOne({ _id: bestSellerId });
         if (platter) bestSellers = [platter];
    } else if (bestSellers.length === 0) {
        // Fallback to legacy flag check if config ID didn't match anything 
        // OR if config didn't exist, we already set query to isBestSeller: true
        const platterBestSellers = await Platter.find({ isBestSeller: true }).limit(1);
        if (platterBestSellers.length > 0) bestSellers = platterBestSellers;
    }

    // Fetch Featured Items
    let featuredMenu = await MenuItem.find(featuredQuery).limit(10);
    // If using specific IDs, we want to find ALL IDs in both collections?
    // This is getting complex with split collections. 
    // Simplified strategy: 
    // 1. Fetch from Menu. 
    // 2. Used IDs vs Wanted IDs -> Fetch remaining from Platter.
    
    let featuredPlatters: any[] = [];
    if (featuredIds.length > 0) {
        const foundIds = new Set(featuredMenu.map(i => i._id.toString()));
        const missingIds = featuredIds.map(id => id.toString()).filter(id => !foundIds.has(id));
        
        if (missingIds.length > 0) {
            featuredPlatters = await Platter.find({ _id: { $in: missingIds } });
        }
    } else {
        // Legacy flag mode
        featuredPlatters = await Platter.find({ isFeatured: true }).limit(5);
    }

    const featuredItems = [...featuredMenu, ...featuredPlatters];

    return res.status(200).json({
      bestSellers,
      featuredItems,
    });
  } catch (error) {
    console.error("Error fetching featured items:", error);
    return res.status(500).json({ message: "Error fetching featured items" });
  }
}
