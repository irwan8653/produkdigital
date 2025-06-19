const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const initialProducts = [
  {
    id: 1,
    nama: "Smartphone Pro X",
    harga: 5999000,
    kategori: "elektronik",
    gambar: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400",
    deskripsi: "Smartphone canggih dengan kamera 108MP, layar Super AMOLED, dan performa gaming yang luar biasa.",
  },
  {
    id: 2,
    nama: "T-Shirt Casual Premium",
    harga: 150000,
    kategori: "fashion",
    gambar: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=400",
    deskripsi: "Kaos katun premium yang nyaman dipakai sehari-hari, dengan desain minimalis dan modern.",
  },
  {
    id: 3,
    nama: "Blender Multifungsi 5-Speed",
    harga: 750000,
    kategori: "rumah-tangga",
    gambar: "https://images.unsplash.com/photo-1578643463396-997d01d44865?q=80&w=400",
    deskripsi: "Blender serbaguna untuk membuat jus, smoothies, dan bumbu dapur dengan 5 tingkat kecepatan.",
  },
  {
    id: 4,
    nama: "Headphone Wireless Noise-Cancelling",
    harga: 1200000,
    kategori: "elektronik",
    gambar: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400",
    deskripsi: "Nikmati musik tanpa kabel dengan kualitas suara jernih dan bass mendalam. Baterai tahan hingga 20 jam.",
  },
  {
    id: 5,
    nama: "Sepatu Lari Ultra Light",
    harga: 850000,
    kategori: "fashion",
    gambar: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400",
    deskripsi: "Sepatu lari ringan dengan bantalan responsif, cocok untuk lari jarak jauh maupun pendek.",
  },
  {
    id: 6,
    nama: "Lampu Meja Cerdas RGB",
    harga: 450000,
    kategori: "rumah-tangga",
    gambar: "https://images.unsplash.com/photo-1543505298-b8be9b52a21a?q=80&w=400",
    deskripsi: "Lampu meja pintar yang bisa diatur warna dan kecerahannya melalui aplikasi smartphone.",
  },
];

async function main() {
  console.log('Memulai proses seeding...');
  
  const productCount = await prisma.produk.count();
  if (productCount === 0) {
    console.log('Tabel produk kosong, memasukkan data awal...');
    await prisma.produk.createMany({
      data: initialProducts,
      skipDuplicates: true, 
    });
    console.log('Seeding selesai.');
  } else {
    console.log('Tabel produk sudah berisi data, seeding dilewati.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
