import Image from "next/image";
import Link from "next/link";
import fs from "fs/promises";
import path from "path";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  wholesalePrice: number;
  sku: string;
  variants: {
    sku: string;
    price: number;
    options: Record<string, string>;
  }[];
};

function isValidUrl(string: string) {
  if (string.startsWith('/')) return true;
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function getProducts(): Promise<Product[]> {
  try {
    const dataPath = path.join(process.cwd(), "data", "products.json");
    if (!require('fs').existsSync(dataPath)) {
      return [];
    }
    const fileContents = await fs.readFile(dataPath, "utf8");
    const products: Product[] = JSON.parse(fileContents);
    return products;
  } catch (error) {
    console.error("Error reading products:", error);
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const p = await searchParams;
  const q = p.q?.toLowerCase() || '';
  const category = p.category || '';

  const allProducts = await getProducts();

  // Extract unique categories
  const categories = Array.from(new Set(allProducts.map(p => p.category))).filter(Boolean).sort();

  // Filter products
  const products = allProducts.filter(p => {
    let matches = true;
    if (q) {
      matches = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    if (category && p.category !== category) {
      matches = false;
    }
    return matches;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="sticky top-24">
          <h2 className="text-lg font-medium tracking-tight text-gray-900 mb-4">Shop</h2>

          <form className="mb-6 border-b border-gray-200 pb-6" action="/" method="GET">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <input
                id="search"
                name="q"
                type="text"
                defaultValue={q}
                placeholder="Search products..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              {category && <input type="hidden" name="category" value={category} />}
              <button type="submit" className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>
            </div>
          </form>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Collections</h3>
            <div className="space-y-1">
              <Link
                href={q ? `/?q=${encodeURIComponent(q)}` : '/'}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${!category ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                All Products
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat}
                  href={`/?category=${encodeURIComponent(cat)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${category === cat ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <span className="truncate">{cat}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-8 border-b border-gray-100 pb-5 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gray-900">
              {category ? category : 'Featured Collection'}
            </h1>
            {q && <p className="mt-2 text-sm text-gray-500">Search results for "{q}"</p>}
          </div>
          <div className="text-sm text-gray-500">{products.length} Items</div>
        </div>

        {products.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 12H4M8 16l-4-4 4-4" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">No products found matching your criteria.</p>
            <Link href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors">
              Clear all filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const validImages = product.images?.filter(isValidUrl) || [];

              return (
                <Link key={product.id} href={`/product/${product.id}`} className="group flex flex-col">
                  {/* Image container */}
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-50 relative transition-all duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-gray-200/50">
                    {validImages[0] ? (
                      <Image
                        src={validImages[0]}
                        alt={product.name}
                        fill
                        className={`object-cover object-center transition-all duration-700 group-hover:scale-105 ${validImages[1] ? 'group-hover:opacity-0' : ''}`}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Secondary image for hover effect */}
                    {validImages[1] && (
                      <Image
                        src={validImages[1]}
                        alt={`${product.name} alternate`}
                        fill
                        className="object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    )}
                  </div>
                  <div className="mt-5 flex flex-col gap-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{product.category}</p>
                    <h3 className="text-base text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-semibold text-gray-900">
                        ${product.price.toFixed(2)}
                      </p>
                      {product.price < product.wholesalePrice && (
                        <p className="text-xs text-gray-400 line-through">
                          ${product.wholesalePrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
