const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const midtransClient = require("midtrans-client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static(uploadsDir));

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

app.get("/", (req, res) => res.send("Server backend P.MAX berjalan."));

app.post("/create-transaction", async (req, res) => {
  try {
    const { items, customerDetails } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Keranjang belanja kosong." });
    const productIds = items.map((item) => item.id);
    const productsFromDb = await prisma.produk.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(productsFromDb.map((p) => [p.id, p]));
    let gross_amount = 0;
    const item_details = items.map((cartItem) => {
      const productData = productMap.get(cartItem.id);
      if (!productData) throw new Error(`Produk dengan ID ${cartItem.id} tidak ditemukan.`);
      const subtotal = productData.harga * cartItem.quantity;
      gross_amount += subtotal;
      return { id: productData.id, price: productData.harga, quantity: cartItem.quantity, name: productData.nama };
    });
    if (gross_amount <= 0) return res.status(400).json({ error: "Total harga tidak valid." });
    const order_id = "PMAX-" + Date.now();
    await prisma.pesanan.create({ data: { order_id, status: "PENDING", total_harga: gross_amount } });
    const parameter = { transaction_details: { order_id, gross_amount }, item_details, customer_details };
    const transaction = await snap.createTransaction(parameter);
    res.status(200).json(transaction);
  } catch (error) {
    console.error("Gagal membuat transaksi:", error);
    res.status(500).json({ error: "Gagal memproses pembayaran: " + error.message });
  }
});

// =======================================================
// RUTE UNTUK ADMIN (API PENGELOLA PRODUK)
// =======================================================
app.get("/api/products", async (req, res) => {
    try {
        const products = await prisma.produk.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(products);
    } catch (error) { res.status(500).json({ message: "Gagal mengambil produk.", error: error.message }); }
});

app.get("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.produk.findUnique({ where: { id: parseInt(id) } });
        if (!product) return res.status(404).json({ message: "Produk tidak ditemukan." });
        res.json(product);
    } catch (error) { res.status(500).json({ message: "Gagal mengambil produk.", error: error.message }); }
});

// --- RUTE POST DIPERBARUI DENGAN VALIDASI ---
app.post("/api/products", upload.single('gambar'), async (req, res) => {
    try {
        const { nama, deskripsi, kategori } = req.body;
        const harga = Number(req.body.harga); // Konversi harga menjadi Angka

        // Validasi data di sisi server
        if (!nama || !deskripsi || !kategori) {
            return res.status(400).json({ message: "Semua kolom teks wajib diisi." });
        }
        if (isNaN(harga) || harga <= 0) {
            return res.status(400).json({ message: "Harga harus berupa angka positif yang valid." });
        }

        const gambarPath = req.file ? `/uploads/${req.file.filename}` : null;
        const product = await prisma.produk.create({ data: { nama, deskripsi, harga: harga, kategori, gambar: gambarPath } });
        res.status(201).json(product);
    } catch (error) { 
        console.error("Error saat menambah produk:", error);
        res.status(400).json({ message: "Gagal menambah produk.", error: error.message }); 
    }
});

// --- RUTE PUT DIPERBARUI DENGAN VALIDASI ---
app.put("/api/products/:id", upload.single('gambar'), async (req, res) => {
    const { id } = req.params;
    try {
        const { nama, deskripsi, kategori } = req.body;
        const harga = Number(req.body.harga);

        // Validasi data di sisi server
        if (!nama || !deskripsi || !kategori) {
            return res.status(400).json({ message: "Semua kolom teks wajib diisi." });
        }
        if (isNaN(harga) || harga <= 0) {
            return res.status(400).json({ message: "Harga harus berupa angka positif yang valid." });
        }

        const dataToUpdate = { nama, deskripsi, harga: harga, kategori };
        if (req.file) { dataToUpdate.gambar = `/uploads/${req.file.filename}`; }
        const product = await prisma.produk.update({ where: { id: parseInt(id) }, data: dataToUpdate });
        res.json(product);
    } catch (error) { 
        console.error("Error saat mengedit produk:", error);
        res.status(400).json({ message: "Gagal mengedit produk.", error: error.message }); 
    }
});

app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.produk.delete({ where: { id: parseInt(id) } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Gagal menghapus produk.", error: error.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berhasil dimulai di port ${PORT}`));
