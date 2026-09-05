'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MARKETPLACE_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [condition, setCondition] = useState<string[]>(searchParams.get('condition')?.split(',') || []);
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [verifiedSeller, setVerifiedSeller] = useState(searchParams.get('verifiedSeller') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    
    if (condition.length > 0) params.set('condition', condition.join(','));
    else params.delete('condition');
    
    if (location) params.set('location', location);
    else params.delete('location');
    
    if (verifiedSeller) params.set('verifiedSeller', 'true');
    else params.delete('verifiedSeller');
    
    if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);
    else params.delete('sortBy');
    
    params.set('page', '1');
    router.push(`/marketplace?${params.toString()}`);
  };

  const handleClear = () => {
    setMinPrice('');
    setMaxPrice('');
    setCondition([]);
    setLocation('');
    setVerifiedSeller(false);
    setSortBy('newest');
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('condition');
    params.delete('location');
    params.delete('verifiedSeller');
    params.delete('sortBy');
    params.set('page', '1');
    router.push(`/marketplace?${params.toString()}`);
  };

  const toggleCondition = (val: string) => {
    setCondition(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Sort By</h3>
        <Select 
          value={sortBy} 
          onValueChange={(val) => setSortBy(val)}
          options={[
            { value: "newest", label: "Newest" },
            { value: "price_asc", label: "Price: Low to High" },
            { value: "price_desc", label: "Price: High to Low" },
            { value: "views", label: "Most Viewed" }
          ]}
          className="w-full"
        />
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range (₦)</h3>
        <div className="flex items-center space-x-2">
          <Input 
            type="number" 
            placeholder="Min" 
            value={minPrice} 
            onChange={(e: any) => setMinPrice(e.target.value)} 
          />
          <span>-</span>
          <Input 
            type="number" 
            placeholder="Max" 
            value={maxPrice} 
            onChange={(e: any) => setMaxPrice(e.target.value)} 
          />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Condition</h3>
        <div className="space-y-2">
          {conditions.map((cond) => (
            <label key={cond} className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={condition.includes(cond)}
                onChange={() => toggleCondition(cond)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">{cond}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
        <Input 
          type="text" 
          placeholder="e.g. Hostels, Lecture Hall..." 
          value={location} 
          onChange={(e: any) => setLocation(e.target.value)} 
        />
      </div>

      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={verifiedSeller}
            onChange={(e) => setVerifiedSeller(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm font-semibold text-gray-900">Verified Sellers Only</span>
        </label>
      </div>

      <div className="flex space-x-2 pt-4 border-t">
        <Button onClick={handleClear} variant="outline" className="w-1/2">Clear</Button>
        <Button onClick={handleApply} className="w-1/2 bg-green-600 hover:bg-green-700 text-white">Apply</Button>
      </div>
    </div>
  );
}
