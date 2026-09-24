import testMongoConnection from './testConnection';
import PageConfig from '../models/PageConfig';
import Platter from '../models/Platter';
import MenuItem from '../models/MenuItem';

export interface ClassicCategoryConfig {
  id: string;
  name: string;
  isPlatter: boolean;
  isVisible: boolean;
}

export interface ServerMenuData {
  pageConfig: {
    sections: any[];
    useCmsLayout: boolean;
    classicBannerType: 'hero' | 'image-slider';
    classicCategories: ClassicCategoryConfig[];
  };
  platters: any[];
  itemsBySectionOrCategory: { [key: string]: any[] };
}

const DEFAULT_CLASSIC_CATEGORIES: ClassicCategoryConfig[] = [
  { id: "sharing-platters", name: "Sharing Platters", isPlatter: true, isVisible: true },
  { id: "meal-boxes", name: "Meal Boxes", isPlatter: true, isVisible: true },
  { id: "fast-food-deals", name: "Fast Food Deals", isPlatter: true, isVisible: true },
  { id: "very-fast-food", name: "Very Fast Food", isPlatter: false, isVisible: true },
  { id: "beast-bbq", name: "Beast BBQ", isPlatter: false, isVisible: true },
  { id: "pizza-parlour", name: "Pizza Parlour", isPlatter: false, isVisible: true },
  { id: "hotpot-and-chinese", name: "Hotpot and Chinese", isPlatter: false, isVisible: true },
  { id: "rolls-royce", name: "Rolls Royce", isPlatter: false, isVisible: true },
  { id: "the-chai-company", name: "The Chai Company", isPlatter: false, isVisible: true },
  { id: "very-extra", name: "Very Extra", isPlatter: false, isVisible: true },
];

const DEFAULT_SECTIONS = [
  { id: 'default-hero', type: 'hero', title: 'Little Karachi Express', isVisible: true, props: { subtitle: 'Authentic Pakistani & Karachi Cuisines', backgroundImage: '/bg-hero.webp', overlayOpacity: 0.4, ctaText: 'Order Now', ctaAction: 'scroll', align: 'center', textColor: 'white' }},
  { id: 'default-platters', type: 'grid', title: 'Sharing Platters', isVisible: true, props: { sourceType: 'category', itemType: 'platter', categoryId: 'Sharing Platters', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-mealboxes', type: 'grid', title: 'Meal Boxes', isVisible: true, props: { sourceType: 'category', itemType: 'platter', categoryId: 'Meal Boxes', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-fastfood-deals', type: 'grid', title: 'Fast Food Deals', isVisible: true, props: { sourceType: 'category', itemType: 'platter', categoryId: 'Fast Food Deals', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-veryfastfood', type: 'grid', title: 'Very Fast Food', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Very Fast Food', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-beastbbq', type: 'grid', title: 'Beast BBQ', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Beast BBQ', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-pizza', type: 'grid', title: 'Pizza Parlour', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Pizza Parlour', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-hotpot', type: 'grid', title: 'Hotpot and Chinese', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Hotpot and Chinese', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-rolls', type: 'grid', title: 'Rolls Royce', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Rolls Royce', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-chai', type: 'grid', title: 'The Chai Company', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'The Chai Company', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-extra', type: 'grid', title: 'Very Extra', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Very Extra', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
];

// Helper to sanitize MongoDB documents into plain JSON
function sanitizeMongoDoc(doc: any): any {
  if (!doc) return doc;
  return JSON.parse(JSON.stringify(doc));
}

export async function getServerMenuData(): Promise<ServerMenuData> {
  try {
    await testMongoConnection();

    // 1. Fetch PageConfig
    const configDoc = await PageConfig.findOne({ type: "order-page" }).lean();
    const pageConfig = configDoc ? sanitizeMongoDoc(configDoc) : {
      sections: DEFAULT_SECTIONS,
      useCmsLayout: true,
      classicBannerType: 'hero',
      classicCategories: DEFAULT_CLASSIC_CATEGORIES
    };

    const sections = (pageConfig.sections && pageConfig.sections.length > 0)
      ? pageConfig.sections
      : DEFAULT_SECTIONS;
    const useCmsLayout = pageConfig.useCmsLayout !== undefined ? pageConfig.useCmsLayout : true;
    const classicCategories = (pageConfig.classicCategories && pageConfig.classicCategories.length > 0)
      ? pageConfig.classicCategories
      : DEFAULT_CLASSIC_CATEGORIES;
    const classicBannerType = pageConfig.classicBannerType || 'hero';

    // 2. Fetch all visible platters
    const rawPlatters = await Platter.find({ isVisible: { $ne: false } })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    const platters = sanitizeMongoDoc(rawPlatters).map((p: any) => ({
      ...p,
      id: p.id || p._id?.toString() || '',
    }));

    // 3. Fetch initial items by section / category
    const itemsBySectionOrCategory: { [key: string]: any[] } = {};

    if (useCmsLayout) {
      // CMS Layout: preload items for each grid/slider section
      await Promise.all(
        sections.map(async (section: any) => {
          if (!section.isVisible || (section.type !== 'grid' && section.type !== 'slider')) {
            return;
          }

          if (section.props?.sourceType === 'category') {
            if (section.props?.itemType === 'platter') {
              const filtered = platters.filter(
                (p: any) => p.platterCategory === section.props.categoryId
              );
              itemsBySectionOrCategory[section.id] = filtered;
            } else {
              const category = section.props.categoryId || '';
              const rawItems = await MenuItem.find({
                isVisible: { $ne: false },
                category,
              })
                .sort({ sortOrder: 1, createdAt: 1 })
                .limit(12)
                .lean();

              itemsBySectionOrCategory[section.id] = sanitizeMongoDoc(rawItems).map((item: any) => ({
                ...item,
                id: item.id || item._id?.toString() || '',
              }));
            }
          } else if (section.props?.sourceType === 'manual' && section.props?.itemIds?.length > 0) {
            const rawItems = await MenuItem.find({
              isVisible: { $ne: false },
              $or: [
                { id: { $in: section.props.itemIds } },
                { _id: { $in: section.props.itemIds } }
              ]
            }).lean();

            const rawPlattersList = await Platter.find({
              isVisible: { $ne: false },
              $or: [
                { id: { $in: section.props.itemIds } },
                { _id: { $in: section.props.itemIds } }
              ]
            }).lean();

            const combined = [...sanitizeMongoDoc(rawItems), ...sanitizeMongoDoc(rawPlattersList)];
            const sorted = (section.props.itemIds || [])
              .map((id: string) => combined.find((item: any) => item._id === id || item.id === id))
              .filter(Boolean);

            itemsBySectionOrCategory[section.id] = sorted;
          }
        })
      );
    } else {
      // Classic Layout: preload items for each classic category
      const activeMenuCats = classicCategories.filter((c: any) => !c.isPlatter && c.isVisible !== false);
      await Promise.all(
        activeMenuCats.map(async (cat: any) => {
          const rawItems = await MenuItem.find({
            isVisible: { $ne: false },
            category: cat.name,
          })
            .sort({ sortOrder: 1, createdAt: 1 })
            .limit(10)
            .lean();

          itemsBySectionOrCategory[cat.name] = sanitizeMongoDoc(rawItems).map((item: any) => ({
            ...item,
            id: item.id || item._id?.toString() || '',
          }));
        })
      );
    }

    return {
      pageConfig: {
        sections,
        useCmsLayout,
        classicBannerType,
        classicCategories,
      },
      platters,
      itemsBySectionOrCategory,
    };
  } catch (error) {
    console.error("Error in getServerMenuData:", error);
    return {
      pageConfig: {
        sections: DEFAULT_SECTIONS,
        useCmsLayout: true,
        classicBannerType: 'hero',
        classicCategories: DEFAULT_CLASSIC_CATEGORIES,
      },
      platters: [],
      itemsBySectionOrCategory: {},
    };
  }
}
