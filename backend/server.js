// Import semua package yang dibutuhkan
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const dotenv = require("dotenv");
const midtransClient = require("midtrans-client");
const nodemailer = require("nodemailer");

// Muat environment variables dari file .env
dotenv.config();

// Inisialisasi Express app dan Prisma Client
const app = express();
const prisma = new PrismaClient();

// === PERUBAHAN UNTUK PRODUKSI 1: DETEKSI LINGKUNGAN ===
// Mengecek apakah server berjalan di mode produksi.
// Di Railway/Vercel/Heroku, NODE_ENV akan otomatis di-set ke 'production'.
const isProduction = process.env.NODE_ENV === "production";

// --- KONFIGURASI MIDDLEWARE ---

// === PERUBAHAN UNTUK PRODUKSI 2: KONFIGURASI CORS DINAMIS ===
// Mengatur CORS agar lebih aman di produksi.
const allowedOrigins = [
  "http://localhost:5500", // Live Server
  "http://127.0.0.1:5500", // Live Server
  "http://localhost:3000", // npx serve
  // Tambahkan URL frontend produksi Anda di sini nanti, contoh: 'https://nama-website-anda.vercel.app'
];

// Untuk npx serve yang portnya bisa berubah-ubah, kita bisa tambahkan logika
// Jika tidak di produksi, kita bisa lebih fleksibel.
if (!isProduction) {
  // Regex untuk mengizinkan localhost dengan port apapun saat development
  allowedOrigins.push(/http:\/\/localhost:\d+/);
  allowedOrigins.push(/http:\/\/127.0.0.1:\d+/);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Izinkan request tanpa origin (seperti dari Postman atau server-to-server)
      if (!origin) return callback(null, true);

      // Cek apakah origin ada di dalam daftar yang diizinkan
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return origin === allowedOrigin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// Middleware untuk membaca JSON dan URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware untuk menyajikan file statis (gambar produk)
// Di produksi, Railway akan menangani ini secara berbeda, tetapi ini tetap diperlukan
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- KONFIGURASI MULTER (UNTUK UPLOAD GAMBAR) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// --- KONFIGURASI MIDTRANS ---
// === PERUBAHAN UNTUK PRODUKSI 3: MODE MIDTRANS DINAMIS ===
const snap = new midtransClient.Snap({
  isProduction: isProduction, // Otomatis 'true' di produksi, 'false' di lokal
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// --- KONFIGURASI NODEMAILER (UNTUK KIRIM EMAIL) ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- API ROUTES ---

// === PRODUK ROUTES ===

// GET: Mendapatkan semua produk
app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Gagal mengambil data produk." });
  }
});

// POST: Membuat produk baru
app.post("/api/products", upload.single("image"), async (req, res) => {
  const { name, price, productFilePath } = req.body;

  // === PERUBAHAN UNTUK PRODUKSI 4: URL GAMBAR DINAMIS ===
  const baseUrl = isProduction
    ? process.env.BACKEND_URL_PROD
    : process.env.BACKEND_URL_DEV;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseInt(price),
        imageUrl,
        productFilePath,
      },
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Gagal membuat produk baru." });
  }
});

// PUT: Mengupdate produk
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, price, productFilePath } = req.body;
  let imageUrl;

  if (req.file) {
    // Menggunakan logika URL dinamis yang sama seperti di atas
    const baseUrl = isProduction
      ? process.env.BACKEND_URL_PROD
      : process.env.BACKEND_URL_DEV;
    imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
  }

  try {
    const productData = {
      name,
      price: parseInt(price),
      productFilePath,
    };

    if (imageUrl) {
      productData.imageUrl = imageUrl;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: productData,
    });
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Gagal mengupdate produk." });
  }
});

// DELETE: Menghapus produk
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Gagal menghapus produk." });
  }
});

// === PESANAN / ORDER ROUTES ===

// GET: Mendapatkan semua pesanan
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: true },
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Gagal mengambil data pesanan." });
  }
});

// === MIDTRANS & PAYMENT ROUTES ===

// POST: Membuat transaksi baru
app.post("/api/create-transaction", async (req, res) => {
  const { productId, customerName, customerEmail } = req.body;
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }
    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await prisma.order.create({
      data: {
        id: orderId,
        midtransOrderId: orderId,
        customerName,
        customerEmail,
        status: "PENDING",
        totalAmount: product.price,
        productId: product.id,
      },
    });
    const parameter = {
      transaction_details: { order_id: orderId, gross_amount: product.price },
      customer_details: { first_name: customerName, email: customerEmail },
      item_details: [
        {
          id: product.id,
          price: product.price,
          quantity: 1,
          name: product.name,
        },
      ],
    };
    const transaction = await snap.createTransaction(parameter);
    res.json({ token: transaction.token });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Gagal membuat transaksi." });
  }
});

// POST: Menerima notifikasi dari Midtrans (Webhook)
app.post("/api/midtrans-notification", async (req, res) => {
  const notificationJson = req.body;
  try {
    const statusResponse = await snap.transaction.notification(
      notificationJson
    );
    const order_id = statusResponse.order_id;
    const transaction_status = statusResponse.transaction_status;
    const fraud_status = statusResponse.fraud_status;

    console.log(
      `Notifikasi diterima untuk order ${order_id}: status transaksi ${transaction_status}, status fraud ${fraud_status}`
    );
    const order = await prisma.order.findUnique({
      where: { midtransOrderId: order_id },
      include: { product: true },
    });

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    let newStatus = "PENDING";
    if (transaction_status == "capture" || transaction_status == "settlement") {
      if (fraud_status == "accept") {
        newStatus = "SUCCESS";
      }
    } else if (
      transaction_status == "cancel" ||
      transaction_status == "deny" ||
      transaction_status == "expire"
    ) {
      newStatus = "FAILED";
    }

    if (newStatus === "SUCCESS" && order.status !== "SUCCESS") {
      await prisma.order.update({
        where: { midtransOrderId: order_id },
        data: { status: "SUCCESS" },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: order.customerEmail,
        subject: `Produk Digital Anda: ${order.product.name}`,
        html: `<h1>Terima kasih telah membeli!</h1><p>Halo ${order.customerName},</p><p>Pembayaran Anda untuk produk <strong>${order.product.name}</strong> telah berhasil.</p><p>Silakan unduh produk Anda melalui link di bawah ini:</p><p><a href="${order.product.productFilePath}" target="_blank">Unduh Sekarang</a></p><br><p>Terima kasih,</p><p>Tim Toko Digital Anda</p>`,
      };
      await transporter.sendMail(mailOptions);
      console.log(`Email terkirim ke ${order.customerEmail}`);
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling Midtrans notification:", error);
    res.status(500).json({ error: "Gagal memproses notifikasi." });
  }
});

// --- Menjalankan Server ---
const PORT = process.env.PORT || 3000;

// === PERUBAHAN UNTUK PRODUKSI 5: CARA SERVER 'MENDENGAR' ===
// Di produksi, server harus 'mendengar' di 0.0.0.0, bukan 127.0.0.1
// Dengan hanya memberikan PORT, Express akan otomatis melakukan hal yang benar.
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
