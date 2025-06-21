document.addEventListener("DOMContentLoaded", () => {
  const backendUrl = "http://127.0.0.1:3000";
  const orderTableBody = document.getElementById("orderTableBody");

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/orders`);
      if (!response.ok) throw new Error("Gagal memuat data pesanan.");
      const orders = await response.json();

      orderTableBody.innerHTML = "";
      if (orders.length === 0) {
        orderTableBody.innerHTML =
          '<tr><td colspan="7" class="text-center py-4">Belum ada pesanan.</td></tr>';
        return;
      }

      orders.forEach((order) => {
        const statusClass =
          order.status === "SUCCESS"
            ? "text-green-600"
            : order.status === "PENDING"
            ? "text-yellow-600"
            : "text-red-600";
        const row = `
                    <tr class="text-center">
                        <td class="py-2 px-4 border">${order.id}</td>
                        <td class="py-2 px-4 border">${order.customerName}</td>
                        <td class="py-2 px-4 border">${order.customerEmail}</td>
                        <td class="py-2 px-4 border">${order.product.name}</td>
                        <td class="py-2 px-4 border">Rp ${order.totalAmount.toLocaleString(
                          "id-ID"
                        )}</td>
                        <td class="py-2 px-4 border font-bold ${statusClass}">${
          order.status
        }</td>
                        <td class="py-2 px-4 border">${new Date(
                          order.createdAt
                        ).toLocaleString("id-ID")}</td>
                    </tr>
                `;
        orderTableBody.innerHTML += row;
      });
    } catch (error) {
      console.error(error);
      orderTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-red-500">${error.message}</td></tr>`;
    }
  };

  fetchOrders();
});
