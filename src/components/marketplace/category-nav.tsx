'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MARKETPLACE_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Smartphone,
  Laptop,
  Tv,
  Shirt,
  Footprints,
  Book,
  Library,
  Armchair,
  Utensils,
  Watch,
  Gamepad2,
  Refrigerator,
  Palette,
  Package,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Smartphone,
  Laptop,
  Tv,
  Shirt,
  Footprints,
  Book,
  Library,
  Armchair,
  Utensils,
  Watch,
  Gamepad2,
  Refrigerator,
  Palette,
  Package,
};

export function CategoryNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';

  const categories = MARKETPLACE_CATEGORIES.filter(c => c.type === 'product');

  const handleCategoryClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === 'all') {
      params.delete('category');
    } else {
      params.set('category', id);
    }
    params.set('page', '1');
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide border-b mb-6">
      <div className="flex space-x-2 sm:space-x-4 px-1 min-w-max">
        <button
          onClick={() => handleCategoryClick('all')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            currentCategory === 'all' 
              ? "bg-green-100 text-green-800 border-green-200" 
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>All Items</span>
        </button>

        {categories.map((category) => {
          const Icon = iconMap[category.icon] || Package;
          const isActive = currentCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                isActive 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
