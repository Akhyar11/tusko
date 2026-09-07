<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categoriesData = [
            ['name' => 'Elektronik', 'slug' => 'elektronik'],
            ['name' => 'Komputer & Laptop', 'slug' => 'komputer-laptop'],
            ['name' => 'Handphone & Tablet', 'slug' => 'handphone-tablet'],
            ['name' => 'Pakaian Pria', 'slug' => 'pakaian-pria'],
            ['name' => 'Pakaian Wanita', 'slug' => 'pakaian-wanita'],
            ['name' => 'Otomotif', 'slug' => 'otomotif'],
            ['name' => 'Makanan & Minuman', 'slug' => 'makanan-minuman'],
            ['name' => 'Kesehatan & Kecantikan', 'slug' => 'kesehatan-kecantikan'],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['slug']] = Category::create($c);
        }

        $productsData = [
            [
                'category_id' => $categories['komputer-laptop']->id,
                'name' => 'Mechanical Keyboard Wireless RGB Hot-swappable 75%',
                'slug' => 'mechanical-keyboard-wireless-rgb-75',
                'description' => 'Keyboard mekanikal nirkabel 75% dengan layout compact, switch Gateron Pro Yellow, konektivitas Bluetooth 5.1, 2.4Ghz dongle, dan kabel Type-C. Dilengkapi baterai 4000mAh.',
                'price' => 649000,
                'stock' => 25,
                'stock_minimum' => 5,
                'image_url' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
                'active' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
                ]
            ],
            [
                'category_id' => $categories['handphone-tablet']->id,
                'name' => 'Smartphone Pro 5G 12GB/256GB Layar AMOLED 120Hz',
                'slug' => 'smartphone-pro-5g-12gb-256gb-amoled',
                'description' => 'Smartphone flagship dengan chipset generasi terbaru, kamera 108MP OIS, pengisian daya super cepat 67W, dan layar super AMOLED 120Hz yang sangat jernih.',
                'price' => 4999000,
                'stock' => 12,
                'stock_minimum' => 3,
                'image_url' => 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
                'active' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80'
                ]
            ],
            [
                'category_id' => $categories['elektronik']->id,
                'name' => 'TWS Earphone ANC Noise Cancelling Bluetooth 5.3',
                'slug' => 'tws-earphone-anc-noise-cancelling-bluetooth-53',
                'description' => 'Earphone wireless true stereo dengan Active Noise Cancelling hingga 35dB, bass mendalam punchy, dan ketahanan baterai total 30 jam.',
                'price' => 299000,
                'stock' => 45,
                'stock_minimum' => 10,
                'image_url' => 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
                'active' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80'
                ]
            ],
            [
                'category_id' => $categories['komputer-laptop']->id,
                'name' => 'Mouse Gaming Wireless Ultra-light 58g Sensor 26K DPI',
                'slug' => 'mouse-gaming-wireless-ultra-light-58g',
                'description' => 'Mouse gaming nirkabel berbobot ultra ringan 58 gram tanpa lubang honeycomb, sensor PixArt PAW3395 26.000 DPI.',
                'price' => 525000,
                'stock' => 18,
                'stock_minimum' => 4,
                'image_url' => 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
                'active' => true,
                'images' => []
            ],
            [
                'category_id' => $categories['pakaian-pria']->id,
                'name' => 'Kaos Polos Heavyweight Cotton 24s Premium Unisex',
                'slug' => 'kaos-polos-heavyweight-cotton-24s-premium',
                'description' => 'Kaos basic katun combed 24s gramasi tebal tidak menerawang, potongan regular fit modern, sangat nyaman.',
                'price' => 65000,
                'stock' => 150,
                'stock_minimum' => 20,
                'image_url' => 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
                'active' => true,
                'images' => []
            ],
            [
                'category_id' => $categories['komputer-laptop']->id,
                'name' => 'Monitor Gaming 27 Inch Fast IPS 180Hz 1ms QHD 2K',
                'slug' => 'monitor-gaming-27-inch-fast-ips-180hz-qhd',
                'description' => 'Layar gaming 27 inci resolusi Quad HD (2560x1440), panel Fast IPS 180Hz refresh rate, 1ms response time.',
                'price' => 2850000,
                'stock' => 7,
                'stock_minimum' => 2,
                'image_url' => 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
                'active' => true,
                'images' => []
            ],
            [
                'category_id' => $categories['makanan-minuman']->id,
                'name' => 'Kopi Arabika Gayo Single Origin Specialty Roast 250g',
                'slug' => 'kopi-arabika-gayo-single-origin-250g',
                'description' => 'Biji kopi pilihan dari dataran tinggi Aceh Gayo. Notes: Brown Sugar, Citrus, Dark Chocolate.',
                'price' => 78000,
                'stock' => 60,
                'stock_minimum' => 10,
                'image_url' => 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
                'active' => true,
                'images' => []
            ],
            [
                'category_id' => $categories['handphone-tablet']->id,
                'name' => 'Powerbank 20000mAh Fast Charging 65W Power Delivery',
                'slug' => 'powerbank-20000mah-fast-charging-65w-pd',
                'description' => 'Powerbank kapasitas besar 20.000mAh dengan output Type-C 65W PD, sanggup mengisi laptop dan ponsel.',
                'price' => 389000,
                'stock' => 30,
                'stock_minimum' => 5,
                'image_url' => 'https://images.unsplash.com/photo-1609592424364-d922ec9622d1?auto=format&fit=crop&w=800&q=80',
                'active' => true,
                'images' => []
            ],
        ];

        foreach ($productsData as $p) {
            $images = $p['images'] ?? [];
            unset($p['images']);

            $product = Product::create($p);

            foreach ($images as $index => $imgUrl) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $imgUrl,
                    'sort_order' => $index + 1,
                ]);
            }
        }
    }
}
