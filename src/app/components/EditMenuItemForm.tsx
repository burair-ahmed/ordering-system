import { FC, useState } from 'react';

interface EditMenuItemFormProps {
  item: any;
  onClose: () => void;
  onUpdate: () => void;
}

const EditMenuItemForm: FC<EditMenuItemFormProps> = ({ item, onClose, onUpdate }) => {
  const [title, setTitle] = useState(item.title);
  const [price, setPrice] = useState(item.price);
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState(item.category);

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/updateItem', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: item._id, title, price, description, category }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Menu item updated successfully!');
        onUpdate();
        onClose();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Edit Menu Item</h2>
        <div>
          <label className="block font-semibold mb-1">Title</label>
          <input
            className="w-full border p-2 rounded mb-4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Price</label>
          <input
            type="number"
            className="w-full border p-2 rounded mb-4"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            className="w-full border p-2 rounded mb-4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Category</label>
          <input
            className="w-full border p-2 rounded mb-4"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMenuItemForm;
