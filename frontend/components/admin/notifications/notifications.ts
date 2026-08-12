export interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    unread: boolean;
  }
  
  export const notifications: Notification[] = [
    {
      id: 1,
      title: "New Order",
      message: "Rahul Kumar placed Order #1029",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Payment Received",
      message: "₹560 received successfully",
      time: "8 min ago",
      unread: true,
    },
    {
      id: 3,
      title: "Inventory Alert",
      message: "Cheese stock is running low",
      time: "25 min ago",
      unread: false,
    },
    {
      id: 4,
      title: "System Update",
      message: "Daily backup completed successfully",
      time: "1 hour ago",
      unread: false,
    },
  ];