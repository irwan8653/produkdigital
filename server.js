const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const midtransClient = require("midtrans-client");

const app = express();
const prisma = new PrismaClient();

// Konfigurasi CORS agar frontend Anda diizinkan
app.use(cors());
app.use(express.json());

// Inisialisasi Midtrans dari Environment Variables (Lebih Aman)
// Kunci Anda tidak hilang, tapi akan dimasukkan di pengaturan Vercel
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Rute dasar untuk cek server
app.get("/", (req, res) => {
  res.send("Server backend P.MAX berjalan di Vercel.");
});

// Rute untuk mendapatkan semua produk
app.get("/api/produk", async (req, res) => {
  try {
    const produk = await prisma.produk.findMany();
    res.json(produk);
  } catch (error) {
    console.error("Gagal mengambil produk:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Rute untuk membuat transaksi pembayaran
app.post("/api/buat-transaksi", async (req, res) => {
  try {
    const order_id = "PMAX-" + Date.now();
    const { produkId, customerDetails } = req.body;

    const produk = await prisma.produk.findUnique({
      where: { id: parseInt(produkId) },
    });

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const hargaAngka = parseInt(String(produk.harga).replace(/Rp|\.| /g, ""));

    await prisma.pesanan.create({
      data: { order_id: order_id, status: "PENDING", total_harga: hargaAngka },
    });

    const parameter = {
      transaction_details: { order_id: order_id, gross_amount: hargaAngka },
      item_details: [
        { id: produk.id, price: hargaAngka, quantity: 1, name: produk.nama },
      ],
      customer_details: customerDetails,
    };

    const transaction = await snap.createTransaction(parameter);
    console.log(`Transaksi baru dibuat dengan Order ID: ${order_id}`);
    res
      .status(200)
      .json({
        payment_url: transaction.redirect_url,
        token: transaction.token,
        order_id: order_id,
      });
  } catch (error) {
    console.error("Gagal membuat transaksi:", error.message);
    res.status(500).json({ message: "Gagal memproses pembayaran." });
  }
});

// Ekspor aplikasi untuk Vercel (ini wajib)
module.exports = app;
