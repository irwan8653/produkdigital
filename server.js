const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const midtransClient = require("midtrans-client");

const app = express();
// PORT akan diambil dari environment variable yang diberikan Vercel
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Konfigurasi CORS yang lebih aman untuk produksi
// Ganti 'https://URL_FRONTEND_ANDA.com' dengan URL frontend Anda nanti
const corsOptions = {
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://URL_FRONTEND_ANDA.com",
  ],
};
app.use(cors(corsOptions));
app.use(express.json());

// Inisialisasi Midtrans dari Environment Variables (Lebih Aman)
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Rute dasar
app.get("/", (req, res) => {
  res.send("Server backend Toko Digital berjalan di Vercel.");
});

// Rute Produk
app.get("/api/produk", async (req, res) => {
  try {
    const produk = await prisma.produk.findMany();
    res.json(produk);
  } catch (error) {
    console.error("Gagal mengambil produk:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Rute Transaksi
app.post("/api/buat-transaksi", async (req, res) => {
  try {
    const order_id = "TRANSAKSI-" + Date.now();
    const { produkId, customerDetails } = req.body; // Ambil detail pelanggan dari frontend

    const produk = await prisma.produk.findUnique({
      where: { id: parseInt(produkId) },
    });

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const hargaAngka = parseInt(produk.harga.replace(/Rp|\.| /g, ""));

    await prisma.pesanan.create({
      data: { order_id: order_id, status: "PENDING", total_harga: hargaAngka },
    });

    const parameter = {
      transaction_details: { order_id: order_id, gross_amount: hargaAngka },
      item_details: [
        { id: produk.id, price: hargaAngka, quantity: 1, name: produk.nama },
      ],
      // Gunakan detail pelanggan dari frontend
      customer_details: customerDetails || {
        first_name: "Pelanggan",
        email: "pelanggan@example.com",
      },
    };

    const transaction = await snap.createTransaction(parameter);
    console.log(`Transaksi baru dibuat dengan Order ID: ${order_id}`);
    res
      .status(200)
      .json({ payment_url: transaction.redirect_url, order_id: order_id });
  } catch (error) {
    console.error("Gagal membuat transaksi:", error.message);
    res.status(500).json({ message: "Gagal memproses pembayaran." });
  }
});

// HAPUS BAGIAN app.listen() KARENA VERCEL MENANGANINYA SECARA OTOMATIS
/*
app.listen(PORT, () => {
  console.log(`Server berhasil dimulai di http://localhost:${PORT}`);
});
*/

// TAMBAHKAN INI DI BARIS PALING BAWAH
// Ini memberitahu Vercel cara menggunakan server Express Anda
module.exports = app;
