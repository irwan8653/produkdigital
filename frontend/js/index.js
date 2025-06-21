document.addEventListener("DOMContentLoaded", () => {
  const backendUrl = "http://127.0.0.1:3000";
  const midtransClientKey = "SB-Mid-client-4DopQX7BRxkZHWGe"; // Masukkan Client Key Anda di sini
  const productList = document.getElementById("productList");

  // Modal elements
  const buyModal = document.getElementById("buyModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const buyForm = document.getElementById("buyForm");
  const modalProductId = document.getElementById("productId");
  const modalProductName = document.getElementById("productName");
  const modalCustomerName = document.getElementById("customerName");
  const modalCustomerEmail = document.getElementById("customerEmail");

  // Load Midtrans Snap.js script
  const snapScript = document.createElement("script");
  snapScript.src = "https://app.sandbox.midtrans.com/snap/snap.js";
  snapScript.setAttribute("data-client-key", midtransClientKey);
  document.head.appendChild(snapScript);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/products`);
      if (!response.ok) throw new Error("Gagal mengambil produk");
      const products = await response.json();

      productList.innerHTML = ""; // Kosongkan daftar sebelum diisi
      products.forEach((product) => {
        const productCard = `
                    <div class="bg-white rounded-lg shadow-md overflow-hidden">
                        <img src="${product.imageUrl}" alt="${
          product.name
        }" class="w-full h-48 object-cover">
                        <div class="p-4">
                            <h2 class="text-lg font-bold text-gray-800">${
                              product.name
                            }</h2>
                            <p class="text-gray-600 mt-1">Rp ${product.price.toLocaleString(
                              "id-ID"
                            )}</p>
                            <button data-product-id="${
                              product.id
                            }" data-product-name="${
          product.name
        }" class="buy-btn mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Beli Sekarang</button>
                        </div>
                    </div>
                `;
        productList.innerHTML += productCard;
      });

      // Tambahkan event listener ke semua tombol "Beli"
      document.querySelectorAll(".buy-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const productId = e.target.getAttribute("data-product-id");
          const productName = e.target.getAttribute("data-product-name");
          openBuyModal(productId, productName);
        });
      });
    } catch (error) {
      console.error(error);
      productList.innerHTML = `<p class="text-red-500">Error: ${error.message}. Pastikan server backend berjalan.</p>`;
    }
  };

  const openBuyModal = (productId, productName) => {
    modalProductId.value = productId;
    modalProductName.value = productName;
    buyModal.classList.remove("hidden");
    buyModal.classList.add("flex");
  };

  const closeBuyModal = () => {
    buyModal.classList.add("hidden");
    buyModal.classList.remove("flex");
    buyForm.reset();
  };

  closeModalBtn.addEventListener("click", closeBuyModal);

  buyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const productId = modalProductId.value;
    const customerName = modalCustomerName.value;
    const customerEmail = modalCustomerEmail.value;

    try {
      const response = await fetch(`${backendUrl}/api/create-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, customerName, customerEmail }),
      });

      if (!response.ok) throw new Error("Gagal membuat transaksi");

      const { token } = await response.json();

      closeBuyModal();

      // Buka popup pembayaran Midtrans
      window.snap.pay(token, {
        onSuccess: function (result) {
          alert("Pembayaran berhasil!");
          console.log(result);
          window.location.href = "/pesanan.html"; // Arahkan ke halaman pesanan
        },
        onPending: function (result) {
          alert("Menunggu pembayaran Anda!");
          console.log(result);
        },
        onError: function (result) {
          alert("Pembayaran gagal!");
          console.log(result);
        },
        onClose: function () {
          alert("Anda menutup popup tanpa menyelesaikan pembayaran");
        },
      });
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  });

  // Muat produk saat halaman pertama kali dibuka
  fetchProducts();
});
