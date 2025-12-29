const mongoose = require('mongoose');
const MenuItems = require('./src/models/MenuItem'); // Correct the path if needed

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

// Function to update the status of menu items
async function updateMenuItemsStatus() {
  try {
    // Connect to MongoDB (no need for deprecated options)
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update items that don't have a 'status' field set yet
    const result = await MenuItems.updateMany(
      { status: { $exists: false } }, // Only update items that don't have a status yet
      { $set: { status: 'in stock' } } // Set 'in stock' as the default status
    );

    console.log(`Updated ${result.modifiedCount} items to 'in stock' status.`); // Use 'modifiedCount' instead of 'nModified'

    // Close the MongoDB connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error updating menu items:', error);
    await mongoose.connection.close();
  }
}

// Execute the function to update menu items' status
updateMenuItemsStatus();
