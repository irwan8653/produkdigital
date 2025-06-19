// =============================================================
// KODE JAVASCRIPT UNTUK HALAMAN CHECKOUT (checkout.js)
// =============================================================

/*
!!! PERINGATAN PENTING !!!
ALUR KERJA YANG AMAN:
1. FRONTEND (kode ini) mengumpulkan data pesanan (nama, email, harga).
2. FRONTEND mengirim data ini ke BACKEND SERVER kamu (misal: Railway).
3. BACKEND menerima data, menambahkan SERVER KEY rahasia, lalu meminta TOKEN ke Midtrans.
4. BACKEND menerima TOKEN dari Midtrans, lalu mengirim TOKEN itu kembali ke FRONTEND.
5. FRONTEND menerima TOKEN, lalu memanggil `snap.pay(token)` untuk menampilkan pop-up.

JANGAN PERNAH MENARUH SERVER KEY MIDTRANS DI SINI!
*/

// Ganti dengan URL API backend Railway atau Heroku kamu
const API_BASE_URL = "https://produkdigital-production.up.railway.app/api"; // << GANTI INI

// Ambil tombol Beli berdasarkan ID-nya
const buyButton = document.getElementById("buy-button"); // << Pastikan tombol beli punya id="buy-button"

buyButton.addEventListener("click", async () => {
  // 1. Kumpulkan data dari form
  const customerName = document.getElementById("customer-name").value; // << GANTI ID sesuai form
  const customerEmail = document.getElementById("customer-email").value; // << GANTI ID sesuai form

  // Validasi sederhana, pastikan nama dan email diisi
  if (!customerName || !customerEmail) {
    alert("Nama Lengkap dan Alamat Email wajib diisi.");
    return;
  }

  // Data produk (bisa diambil dari halaman secara dinamis)
  const productDetails = {
    id: "PRESET-01",
    name: "50 PRESET LIGHTROOM",
    price: 50000,
    quantity: 1,
  };

  // 2. Siapkan data pesanan untuk dikirim ke backend
  const orderData = {
    product: productDetails,
    customer: {
      first_name: customerName,
      email: customerEmail,
    },
  };

  try {
    // Tampilkan loading
    buyButton.textContent = "Memproses...";
    buyButton.disabled = true;

    // 3. Kirim data pesanan ke BACKEND kamu untuk dibuatkan token Midtrans
    const response = await fetch(`${API_BASE_URL}/create-transaction`, {
      // << INI ENDPOINT DI BACKEND KAMU
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal membuat transaksi.");
    }

    const data = await response.json();

    // 4. Terima TOKEN dari backend, lalu panggil Midtrans Snap
    window.snap.pay(data.token, {
      onSuccess: function (result) {
        /* Anda dapat mengirimkan result ke backend Anda untuk verifikasi */
        console.log("SUCCESS", result);
        alert("Pembayaran berhasil!");
        // Arahkan ke halaman terima kasih
        // window.location.href = '/thank-you.html';
      },
      onPending: function (result) {
        /* Status pembayaran saat ini tertunda */
        console.log("PENDING", result);
        alert("Menunggu pembayaran Anda.");
      },
      onError: function (result) {
        /* Terjadi kesalahan saat pembayaran */
        console.log("ERROR", result);
        alert("Pembayaran gagal.");
      },
      onClose: function () {
        /* Pelanggan menutup pop-up tanpa menyelesaikan pembayaran */
        alert("Anda menutup jendela pembayaran.");
      },
    });
  } catch (error) {
    console.error("Error:", error);
    alert(`Terjadi kesalahan: ${error.message}`);
  } finally {
    // Kembalikan tombol ke keadaan semula
    buyButton.textContent = "Beli";
    buyButton.disabled = false;
  }
});
