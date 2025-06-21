document.addEventListener("DOMContentLoaded", () => {
  const backendUrl =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
      ? "http://127.0.0.1:3000"
      : "https://produkdigital-production.up.railway.app"; // <-- Pastikan ini URL Railway Anda
  const productForm = document.getElementById("productForm");
  const productTableBody = document.getElementById("productTableBody");
  const formTitle = document.getElementById("form-title");
  const productIdInput = document.getElementById("productId");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  const fetchAndDisplayProducts = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/products`);
      if (!response.ok) throw new Error("Gagal memuat produk.");
      const products = await response.json();

      productTableBody.innerHTML = "";
      if (products.length === 0) {
        productTableBody.innerHTML =
          '<tr><td colspan="4" class="text-center py-4">Belum ada produk.</td></tr>';
        return;
      }

      products.forEach((product) => {
        const row = `
                    <tr class="text-center">
                        <td class="py-2 px-4 border"><img src="${
                          product.imageUrl
                        }" alt="${
          product.name
        }" class="h-16 w-16 object-cover mx-auto"></td>
                        <td class="py-2 px-4 border">${product.name}</td>
                        <td class="py-2 px-4 border">Rp ${product.price.toLocaleString(
                          "id-ID"
                        )}</td>
                        <td class="py-2 px-4 border">
                            <button class="edit-btn bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600" data-id="${
                              product.id
                            }">Edit</button>
                            <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" data-id="${
                              product.id
                            }">Hapus</button>
                        </td>
                    </tr>
                `;
        productTableBody.innerHTML += row;
      });
    } catch (error) {
      console.error(error);
      productTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">${error.message}</td></tr>`;
    }
  };

  const resetForm = () => {
    productForm.reset();
    productIdInput.value = "";
    formTitle.textContent = "Tambah Produk Baru";
    cancelEditBtn.classList.add("hidden");
  };

  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(productForm);
    const productId = productIdInput.value;
    const url = productId
      ? `${backendUrl}/api/products/${productId}`
      : `${backendUrl}/api/products`;
    const method = productId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        body: formData, // Biarkan browser yang mengatur Content-Type menjadi multipart/form-data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menyimpan produk.");
      }

      resetForm();
      fetchAndDisplayProducts(); // Muat ulang daftar produk
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  });

  productTableBody.addEventListener("click", async (e) => {
    // Handle Delete
    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
        try {
          const response = await fetch(`${backendUrl}/api/products/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Gagal menghapus produk.");
          fetchAndDisplayProducts();
        } catch (error) {
          console.error(error);
          alert(`Error: ${error.message}`);
        }
      }
    }

    // Handle Edit
    if (e.target.classList.contains("edit-btn")) {
      const id = e.target.dataset.id;
      const row = e.target.closest("tr");
      const name = row.cells[1].textContent;
      const price = row.cells[2].textContent.replace(/[^0-9]/g, "");

      formTitle.textContent = "Edit Produk";
      productIdInput.value = id;
      document.getElementById("name").value = name;
      document.getElementById("price").value = price;
      // Link download tidak ditampilkan untuk keamanan, harus diisi ulang jika ingin diubah
      document.getElementById("productFilePath").value = "";
      document.getElementById("productFilePath").placeholder =
        "Isi untuk mengubah link download";

      cancelEditBtn.classList.remove("hidden");
      window.scrollTo(0, 0); // Scroll ke atas ke form
    }
  });

  cancelEditBtn.addEventListener("click", resetForm);

  // Muat semua produk saat halaman pertama kali dibuka
  fetchAndDisplayProducts();
});
