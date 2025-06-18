const express = require("express");
const cors = require("cors"); // 1. PASTIKAN BARIS INI ADA
const { PrismaClient } = require("@prisma/client");
const midtransClient = require("midtrans-client");

const app = express();
const prisma = new PrismaClient();

// --- PENGATURAN PENTING ---
app.use(cors()); // 2. PASTIKAN BARIS INI ADA SEBELUM RUTE LAINNYA
app.use(express.json());

// Inisialisasi Midtrans Snap dari Environment Variables
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Rute dasar untuk cek server
app.get("/", (req, res) => {
  res.send("Server backend P.MAX berjalan.");
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
app.post("/create-transaction", async (req, res) => {
  try {
    const { items, customerDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Keranjang belanja kosong atau tidak valid." });
    }

    const productIds = items.map((item) => item.id);

    const productsFromDb = await prisma.produk.findMany({
      where: {
        id: { in: productIds },
      },
    });

    const productMap = new Map(productsFromDb.map((p) => [p.id, p]));

    let gross_amount = 0;
    const item_details = items.map((cartItem) => {
      const productData = productMap.get(cartItem.id);

      if (!productData) {
        throw new Error(
          `Produk dengan ID ${cartItem.id} tidak ditemukan di database.`
        );
      }

      const subtotal = productData.harga * cartItem.quantity;
      gross_amount += subtotal;

      return {
        id: productData.id,
        price: productData.harga,
        quantity: cartItem.quantity,
        name: productData.nama,
      };
    });

    if (gross_amount <= 0) {
      return res.status(400).json({ error: "Total harga tidak valid." });
    }

    const order_id = "PMAX-" + Date.now();

    await prisma.pesanan.create({
      data: {
        order_id: order_id,
        status: "PENDING",
        total_harga: gross_amount,
      },
    });

    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: gross_amount,
      },
      item_details: item_details,
      customer_details: customerDetails,
    };

    const transaction = await snap.createTransaction(parameter);
    console.log(`Transaksi baru dibuat dengan Order ID: ${order_id}`);
    res.status(200).json(transaction);
  } catch (error) {
    console.error("Gagal membuat transaksi:", error);
    res
      .status(500)
      .json({ error: "Gagal memproses pembayaran: " + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berhasil dimulai di port ${PORT}`);
});
