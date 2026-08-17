const API_URL = "http://127.0.0.1:8000";

export async function getDashboard() {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_URL}/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return res.json();
}

export async function getTopSelling() {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_URL}/admin/top-selling`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function getLiveQueue() {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_URL}/admin/live-queue`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function getOrders() {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_URL}/admin/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch orders");
  }

  return res.json();
}

export async function getTopSellingFoods(
  month: string
) {
  const token = localStorage.getItem(
    "access_token"
  );

  const res = await fetch(
    `${API_URL}/admin/top-selling-foods?month=${encodeURIComponent(month)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(
      "Failed to fetch top selling foods"
    );
  }

  return res.json();
}

export async function getSalesDistribution(month: string) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No access token found");
  }

  const response = await fetch(
    `${API_URL}/admin/sales-distribution?month=${encodeURIComponent(month)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Sales distribution API error:",
      response.status,
      errorText
    );

    throw new Error(
      `Sales distribution API failed: ${response.status}`
    );
  }

  return response.json();
}
export async function getOrderChartData() {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_URL}/admin/order-chart-data`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch order chart data");
  }

  return res.json();
}

export async function getRevenueChartData(year?: number) {
  const token = localStorage.getItem("access_token");

  const params = year
    ? `?year=${year}`
    : "";

  const res = await fetch(
    `${API_URL}/admin/revenue-chart-data${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(
      "Failed to fetch revenue chart data"
    );
  }

  return res.json();
}

export async function updateOrderStatus(
  orderToken: number,
  status: string
) {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_URL}/admin/orders/${orderToken}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error("Failed to update order status");
  }

  return res.json();
}
export async function addFood(
  food: any,
  image: File,
  token: string
) {
  const formData = new FormData();

  formData.append("name", food.name);
  formData.append("description", food.description);
  formData.append("category", food.category);
  formData.append("category_id", food.category_id);
  formData.append("price", food.price);
  formData.append(
      "available",
      String(food.available)
  );

  formData.append("image", image);

  const res = await fetch(
      `${API_URL}/add-food`,
      {
          method: "POST",
          headers: {
              Authorization: `Bearer ${token}`,
          },
          body: formData,
      }
  );

  if (!res.ok) {
      throw new Error("Failed to add food");
  }

  return res.json();
}
export async function updateFood(
  foodName: string,
  food: any,
  token: string
) {
  const res = await fetch(`${API_URL}/update-food/${foodName}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(food),
  });

  if (!res.ok) {
    throw new Error("Failed to update food");
  }

  return res.json();
}

export async function deleteFood(
  foodName: string,
  token: string
) {
  const res = await fetch(`${API_URL}/delete-food/${foodName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete food");
  }

  return res.json();
}
export async function getRecentOrders(
  page = 1,
  limit = 5,
  status = "All",
  search = "",
  sortBy = "token",
  sortOrder = "desc"
) {
  const token = localStorage.getItem("access_token");

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    search,
    sortBy,
    sortOrder,
  });

  const res = await fetch(
    `${API_URL}/admin/recent-orders?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch recent orders");
  }

  return res.json();
}
// ============================================================
// CUSTOMER MANAGEMENT
// ============================================================

export async function getCustomers(
  page = 1,
  limit = 10,
  search = "",
  status = "ALL",
  sort = "LATEST"
) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No access token found");
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
    status_filter: status,
    sort,
  });

  const res = await fetch(
    `${API_URL}/admin/customers?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();

    console.error(
      "Customers API error:",
      res.status,
      errorText
    );

    throw new Error(
      `Failed to fetch customers: ${res.status}`
    );
  }

  return res.json();
}