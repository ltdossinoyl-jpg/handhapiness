import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { Product } from '@/app/page';

// Add to Cart button requires a client component if we wanted logic, but we can do a minimal client component or a simple server-rendered button
import ClientVariantSelector from './ClientVariantSelector';

function isValidUrl(string: string) {
    if (string.startsWith('/')) return true;
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function getProduct(slug: string): Promise<Product | null> {
    try {
        const dataPath = path.join(process.cwd(), 'data', 'products.json');
        if (!require('fs').existsSync(dataPath)) return null;

        const fileContents = await fs.readFile(dataPath, 'utf8');
        const products: Product[] = JSON.parse(fileContents);
        return products.find(p => p.id === slug) || null;
    } catch (error) {
        console.error('Error reading products:', error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const p = await params;
    const product = await getProduct(p.slug);

    if (!product) return { title: 'Product Not Found' };

    return {
        title: `${product.name} | Handmade Bestseller`,
        description: product.description.substring(0, 160),
    };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const p = await params;
    const product = await getProduct(p.slug);

    if (!product) {
        notFound();
    }

    // Find unique options for variants
    const optionsMap: Record<string, Set<string>> = {};

    product.variants.forEach(variant => {
        Object.entries(variant.options).forEach(([name, value]) => {
            if (!optionsMap[name]) optionsMap[name] = new Set();
            optionsMap[name].add(value);
        });
    });

    const productOptions = Object.entries(optionsMap).map(([name, values]) => ({
        name,
        values: Array.from(values)
    }));

    const validImages = product.images?.filter(isValidUrl) || [];

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row gap-12">
            {/* Image Gallery */}
            <div className="md:w-1/2 flex flex-col space-y-4">
                {validImages.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {/* Main Image */}
                        <div className="relative w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden ring-1 ring-gray-200/50 shadow-sm">
                            <Image
                                src={validImages[0]}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-700 hover:scale-105"
                                sizes="(min-width: 768px) 50vw, 100vw"
                                priority
                            />
                        </div>
                        {/* Thumbnails */}
                        {validImages.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
                                {validImages.map((img, i) => (
                                    <div key={i} className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-amber-200 ring-1 ring-gray-200/50 transition-all">
                                        <Image src={img} alt={`${product.name} ${i}`} fill className="object-cover" sizes="96px" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full aspect-square bg-gray-50 flex items-center justify-center rounded-2xl text-gray-300 ring-1 ring-gray-200/50 shadow-sm">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="md:w-1/2 flex flex-col">
                {/* JSON-LD Schema Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org/",
                            "@type": "Product",
                            name: product.name,
                            image: product.images,
                            description: product.description,
                            sku: product.sku || product.variants?.[0]?.sku,
                            offers: {
                                "@type": "Offer",
                                url: `https://example.com/product/${product.id}`,
                                priceCurrency: "USD",
                                price: product.price,
                                availability: "https://schema.org/InStock"
                            }
                        })
                    }}
                />

                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-4">{product.name}</h1>

                <ClientVariantSelector product={product} options={productOptions} />

                {/* Description */}
                <div className="mt-8 border-t border-gray-200 pt-8 text-gray-600 prose prose-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                    <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\ng/g, '<br/>') || 'No description provided.' }} />
                </div>
            </div>
        </div>
    );
}
