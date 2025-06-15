// server.js

const express = require("express");
const cors = require("cors");
const midtransClient = require("midtrans-client");

const app = express();
const port = 3000; // Server kita akan berjalan di port 3000

// Middleware
app.use(cors()); // Mengizinkan akses dari frontend
app.use(express.json()); // Membaca data JSON dari request

// Inisialisasi Midtrans Snap API
// Pastikan isProduction di-set ke 'false' untuk mode Sandbox
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: "SB-Mid-server-JlK5KWfUdV6xHICNh2hyjW14", // GANTI DENGAN SERVER KEY ANDA
  clientKey: "SB-Mid-client-4DopQX7BRxkZHWGe", // GANTI DENGAN CLIENT KEY ANDA
});

// Endpoint untuk membuat transaksi
app.post("/create-transaction", (req, res) => {
  // Data dari frontend (misalnya dari keranjang belanja)
  const { orderId, totalAmount, customerDetails } = req.body;

  // Siapkan parameter untuk Midtrans
  const parameters = {
    transaction_details: {
      order_id: orderId, // ID order harus unik
      gross_amount: totalAmount, // Total harga
    },
    customer_details: {
      first_name: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone,
    },
    credit_card: {
      secure: true,
    },
  };

  // Buat transaksi menggunakan Midtrans Snap API
  snap
    .createTransaction(parameters)
    .then((transaction) => {
      // Kirim token transaksi kembali ke frontend
      console.log("Transaksi berhasil dibuat, token:", transaction.token);
      res.json({ token: transaction.token });
    })
    .catch((error) => {
      console.error("Error membuat transaksi:", error.message);
      res.status(500).json({ error: error.message });
    });
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server backend berjalan di http://localhost:${port}`);
});
