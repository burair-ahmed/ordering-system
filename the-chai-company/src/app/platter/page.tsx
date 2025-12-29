'use client';

import { Suspense, useEffect, useState } from "react";
import PlatterItem from "../components/PlatterItem";
import AddPlatterForm from "../components/AddPlatterForm";

// Define the Category type for each category option
interface CategoryOption {
  uuid: string;
  name: string;
  title: string;
  price: number;
}

interface Category {
  categoryName: string;
  options: CategoryOption[];
}

interface AdditionalChoice {
  heading: string;
  options: CategoryOption[];
}

interface Platter {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  image: string;
  categories: Category[];
  status: "in stock" | "out of stock";
  additionalChoices: AdditionalChoice[];
}

function PlattersContent() {
  const [platters, setPlatters] = useState<Platter[]>([]);

  useEffect(() => {
    const fetchPlatters = async () => {
      try {
        const res = await fetch("/api/platter");
        const data = await res.json();

        console.log("API Response:", data);

        if (data && Array.isArray(data) && data.length > 0) {
          setPlatters(data);
        } else {
          console.error("Platters data is not in the expected array format:", data);
          setPlatters([]);
        }
      } catch (error) {
        console.error("Error fetching platters:", error);
        setPlatters([]);
      }
    };

    fetchPlatters();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-semibold text-center mb-6">Platters</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {platters.length === 0 ? (
          <p className="text-xl text-gray-600 text-center">
            No platters available.
          </p>
        ) : (
          platters.map((platter) => (
            <PlatterItem key={platter.id} platter={platter} />
          ))
        )}
      </div>

      <div className="mt-8">
        <AddPlatterForm />
      </div>
    </div>
  );
}

export default function PlattersPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading Platters...</div>}>
      <PlattersContent />
    </Suspense>
  );
}
