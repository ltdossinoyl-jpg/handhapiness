"use client";

import { useState, useMemo } from 'react';
import { Product } from '@/app/page';

interface Option {
    name: string;
    values: string[];
}

interface Props {
    product: Product;
    options: Option[];
}

export default function ClientVariantSelector({ product, options }: Props) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        options.forEach(opt => {
            initial[opt.name] = opt.values[0];
        });
        return initial;
    });

    const [quantity, setQuantity] = useState(1);

    const selectedVariant = useMemo(() => {
        if (product.variants.length === 0) return null;

        // Find variant that matches all selected options perfectly
        return product.variants.find(variant => {
            return Object.entries(selectedOptions).every(
                ([key, value]) => variant.options[key] === value
            );
        }) || product.variants[0]; // fallback
    }, [product, selectedOptions]);

    const handleOptionChange = (optionName: string, value: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [optionName]: value
        }));
    };

    const handleAddToCart = () => {
        alert(`Added ${quantity} of ${product.name} to cart!\nVariant: ${JSON.stringify(selectedOptions)}\nPrice: $${displayedPrice}`);
    };

    const displayedPrice = selectedVariant?.price || product.price || 0;

    return (
        <div>
            <div className="mb-6">
                <span className="text-2xl font-light text-gray-900">${displayedPrice.toFixed(2)}</span>
            </div>

            {options.length > 0 && (
                <div className="space-y-6 mb-8 pt-6 border-t border-gray-200">
                    {options.map((option) => (
                        <div key={option.name}>
                            <h3 className="text-sm font-medium text-gray-900 mb-3">{option.name}</h3>
                            <div className="flex flex-wrap gap-3">
                                {option.values.map(val => (
                                    <button
                                        key={val}
                                        onClick={() => handleOptionChange(option.name, val)}
                                        className={`px-4 py-2 text-sm border rounded-md transition-colors ${selectedOptions[option.name] === val
                                                ? 'border-gray-900 bg-gray-900 text-white'
                                                : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Area */}
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <button
                        onClick={() => setQuantity(q => q + 1)}
                        className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        +
                    </button>
                </div>

                <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-gray-900 text-white px-8 py-3 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors"
                >
                    Add to Cart
                </button>
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500">
                {selectedVariant?.sku && <p>SKU: {selectedVariant.sku}</p>}
                {product.wholesalePrice > 0 && <p>Wholesale Price: ${product.wholesalePrice.toFixed(2)}</p>}
            </div>
        </div>
    );
}
