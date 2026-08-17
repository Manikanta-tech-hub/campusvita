export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

interface Order {
  order_id?: string;
  token?: number;
  name?: string;
  email?: string;
  user_email?: string;
  total?: number;
  payment_amount?: number;
  payment_status?: string;
  status?: string;
  created_at?: string;
  payment_date?: string;
  date?: string;
}

interface OrdersResponse {
  success?: boolean;
  orders?: Order[];
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

function getRelativeTime(dateValue?: string) {
  if (!dateValue) {
    return "Recently";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(
    0,
    Math.floor(diffMs / 60000)
  );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const hours = Math.floor(diffMinutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export async function getAdminNotifications(): Promise<Notification[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${API_URL}/admin/orders?page=1&limit=20&status_filter=ALL&payment_status=ALL`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch notifications: HTTP ${response.status}`
    );
  }

  const data: OrdersResponse = await response.json();

  const orders = Array.isArray(data.orders)
    ? data.orders
    : [];

  return orders
    .filter((order) => order.order_id)
    .map((order) => {
      const customer =
        order.name ||
        order.user_email ||
        order.email ||
        "Customer";

      const orderNumber =
        order.order_id ||
        String(order.token ?? "");

      const amount =
        order.payment_amount ??
        order.total ??
        0;

      const paymentSuccessful =
        String(order.payment_status || "").toLowerCase() ===
          "paid" ||
        String(order.payment_status || "").toLowerCase() ===
          "success" ||
        String(order.payment_status || "").toLowerCase() ===
          "completed";

      const title = paymentSuccessful
        ? "Payment Received"
        : "New Order";

      const message = paymentSuccessful
        ? `₹${Number(amount).toLocaleString("en-IN")} received for Order #${orderNumber}`
        : `${customer} placed Order #${orderNumber}`;

      return {
        id: `order-${order.order_id}`,
        title,
        message,
        time: getRelativeTime(
          order.payment_date ||
            order.created_at ||
            order.date
        ),
        unread: false,
      };
    });
}