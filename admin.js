// ======================================================
// KODE JAVASCRIPT UNTUK HALAMAN ADMIN (admin.js)
// ======================================================

// Ganti dengan URL API backend Railway atau Heroku kamu
const API_BASE_URL = "https://produkdigital-production.up.railway.app/api"; // << GANTI INI

// Fungsi untuk mengambil dan menampilkan semua produk
async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error("Gagal mengambil data produk.");
    }
    const products = await response.json();

    const productTableBody = document.getElementById("product-table-body");
    productTableBody.innerHTML = ""; // Kosongkan tabel sebelum diisi

    products.forEach((product) => {
      const row = `
                <tr>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>Rp ${new Intl.NumberFormat("id-ID").format(
                      product.price
                    )}</td>
                    <td>
                        <button class="edit-btn" data-id="${
                          product.id
                        }">Edit</button>
                        <button class="delete-btn" data-id="${
                          product.id
                        }">Hapus</button>
                    </td>
                </tr>
            `;
      productTableBody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error:", error);
    alert(error.message);
  }
}

// Fungsi untuk menangani submit form tambah produk
async function handleFormSubmit(event) {
  // Mencegah halaman refresh saat form disubmit
  event.preventDefault();

  const form = event.target;
  // 'new FormData(form)' akan mengumpulkan semua data input, TERMASUK FILE
  const formData = new FormData(form);

  try {
    // Tampilkan loading atau disable tombol submit
    form.querySelector('button[type="submit"]').textContent = "Menyimpan...";
    form.querySelector('button[type="submit"]').disabled = true;

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      body: formData, // Saat menggunakan FormData, browser otomatis set Content-Type ke multipart/form-data
    });

    if (!response.ok) {
      // Jika status error (400, 500, dll), coba baca pesan error dari backend
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal menambah produk.");
    }

    // Jika berhasil
    alert("Produk berhasil ditambahkan!");
    form.reset(); // Kosongkan form
    fetchProducts(); // Refresh daftar produk di tabel
  } catch (error) {
    console.error("Error saat submit:", error);
    alert(`Error: ${error.message}`);
  } finally {
    // Kembalikan tombol submit ke keadaan semula
    form.querySelector('button[type="submit"]').textContent = "Simpan";
    form.querySelector('button[type="submit"]').disabled = false;
  }
}

// Event listener dijalankan saat seluruh halaman HTML selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  // Panggil fungsi untuk memuat produk saat halaman dibuka
  fetchProducts();

  // Tambahkan event listener ke form tambah produk
  const addProductForm = document.getElementById("add-product-form"); // Pastikan form kamu punya id="add-product-form"
  if (addProductForm) {
    addProductForm.addEventListener("submit", handleFormSubmit);
  }
});
