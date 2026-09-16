import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

const PLACEHOLDER_CHICKEN_IMG = 'https://res.cloudinary.com/dubg6octv/image/upload/v1767351631/menu_items/mlwu0o8vwdxo90j9e424.webp';
const PLACEHOLDER_BEEF_IMG = 'https://res.cloudinary.com/dubg6octv/image/upload/v1767351630/menu_items/qqrhqk6vztjpvxuzruyv.webp';

const productsToUpload = [
  {
    title: 'Chicken White Biryani – 1 KG Deg',
    description: '1 KG Chicken, 1 KG Rice',
    price: 2050,
    image: PLACEHOLDER_CHICKEN_IMG,
    category: 'Pulao.com',
    status: 'in stock',
    isVisible: true,
    sortOrder: 1,
    variations: []
  },
  {
    title: 'Beef White Biryani – 1 KG Deg',
    description: '1 KG Beef, 1 KG Rice',
    price: 2950,
    image: PLACEHOLDER_BEEF_IMG,
    category: 'Pulao.com',
    status: 'in stock',
    isVisible: true,
    sortOrder: 2,
    variations: []
  },
  {
    title: 'Chicken White Biryani – 375 Gram',
    description: '375 Gram – Rice, 1 Chicken Piece, Aloo',
    price: 225,
    image: PLACEHOLDER_CHICKEN_IMG,
    category: 'Pulao.com',
    status: 'in stock',
    isVisible: true,
    sortOrder: 3,
    variations: []
  },
  {
    title: 'Beef White Biryani – 375 Gram',
    description: '375 Gram – Rice, 3 Beef Pieces, Aloo',
    price: 275,
    image: PLACEHOLDER_BEEF_IMG,
    category: 'Pulao.com',
    status: 'in stock',
    isVisible: true,
    sortOrder: 4,
    variations: []
  },
  {
    title: 'Chicken White Biryani – 500 Gram',
    description: '500 Gram – Rice, 1 Chicken Piece, Aloo',
    price: 300,
    image: PLACEHOLDER_CHICKEN_IMG,
    category: 'Pulao.com',
    status: 'in stock',
    isVisible: true,
    sortOrder: 5,
    variations: []
  },
  {
    title: 'Beef White Biryani – 500 Gram',
    description: '500 Gram – Rice, 4 Beef Pieces, Aloo',
    price: 370,
    image: PLACEHOLDER_BEEF_IMG,
    category: 'Pulao.com',
    status: 'in stock',
    isVisible: true,
    sortOrder: 6,
    variations: []
  }
];

async function uploadProducts() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('Database connection failed');
    process.exit(1);
  }

  // 1. Ensure Pulao.com exists in categories collection
  const existingCategory = await db.collection('categories').findOne({ name: 'Pulao.com' });
  if (!existingCategory) {
    await db.collection('categories').insertOne({
      name: 'Pulao.com',
      createdAt: new Date()
    });
    console.log('Created category Pulao.com in categories collection');
  } else {
    console.log('Category Pulao.com already exists in categories collection');
  }

  // 2. Insert items into menuitems collection
  for (const prod of productsToUpload) {
    const existing = await db.collection('menuitems').findOne({
      title: prod.title,
      category: prod.category
    });

    if (existing) {
      console.log(`Product "${prod.title}" already exists, updating...`);
      await db.collection('menuitems').updateOne(
        { _id: existing._id },
        {
          $set: {
            description: prod.description,
            price: prod.price,
            image: prod.image,
            status: prod.status,
            isVisible: prod.isVisible,
            sortOrder: prod.sortOrder,
            variations: prod.variations
          }
        }
      );
    } else {
      const doc = {
        id: uuidv4(),
        title: prod.title,
        price: prod.price,
        description: prod.description,
        image: prod.image,
        variations: prod.variations,
        category: prod.category,
        createdAt: new Date(),
        status: prod.status,
        discountValue: 0,
        sortOrder: prod.sortOrder,
        isVisible: prod.isVisible
      };
      await db.collection('menuitems').insertOne(doc);
      console.log(`Inserted product: "${prod.title}" (Rs. ${prod.price})`);
    }
  }

  // 3. Ensure Pulao.com is in PageConfig classicCategories
  const pageConfig = await db.collection('pageconfigs').findOne({ type: 'order-page' });
  if (pageConfig) {
    const classicCats: any[] = pageConfig.classicCategories || [];
    const hasPulao = classicCats.some((c: any) => c.name.toLowerCase() === 'pulao.com' || c.id === 'pulao-com');
    if (!hasPulao) {
      classicCats.push({
        id: 'pulao-com',
        name: 'Pulao.com',
        isPlatter: false,
        isVisible: true
      });
      await db.collection('pageconfigs').updateOne(
        { type: 'order-page' },
        { $set: { classicCategories: classicCats } }
      );
      console.log('Added Pulao.com to PageConfig.classicCategories');
    } else {
      console.log('Pulao.com already present in PageConfig.classicCategories');
    }
  }

  // 4. Verify Pulao.com products in menuitems
  const pulaoItems = await db.collection('menuitems').find({ category: 'Pulao.com', isVisible: true }).sort({ sortOrder: 1 }).toArray();
  console.log('\n--- Verified Active Pulao.com Products ---');
  pulaoItems.forEach((item, i) => {
    console.log(`${i + 1}. [${item.id}] ${item.title} — Rs. ${item.price} | Desc: ${item.description}`);
  });

  await mongoose.disconnect();
  console.log('\nUpload complete!');
}

uploadProducts().catch(console.error);
