export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "SECURITY";
export type VehicleStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED";
export type MaintenanceStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TravelStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
export type VisitStatus = "EXPECTED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
export type PackageStatus = "REGISTERED" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "RECEIVED" | "RETURNED";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
};

export const mockNotifications: NotificationItem[] = [
  { id: "n1", title: "Vehicle due for service", body: "B-204 needs next service in 8 days.", time: "5 min ago" },
  { id: "n2", title: "Travel approval needed", body: "2 requests are waiting for manager review.", time: "21 min ago" },
  { id: "n3", title: "Visitor check-in", body: "Ava Patel has arrived at the front desk.", time: "1 hour ago" },
];

export const mockVehicles = [
  { id: "V-101", plateNumber: "B-204", make: "Toyota", model: "Hiace", year: 2022, status: "AVAILABLE" as VehicleStatus, branch: "Central Branch", mileage: 38240 },
  { id: "V-102", plateNumber: "C-118", make: "Ford", model: "Transit", year: 2021, status: "IN_USE" as VehicleStatus, branch: "North Branch", mileage: 52100 },
  { id: "V-103", plateNumber: "N-022", make: "Mercedes", model: "Sprinter", year: 2023, status: "MAINTENANCE" as VehicleStatus, branch: "Central Branch", mileage: 27480 },
  { id: "V-104", plateNumber: "S-905", make: "Isuzu", model: "Truck", year: 2020, status: "AVAILABLE" as VehicleStatus, branch: "South Branch", mileage: 76312 },
];

export const mockMaintenance = [
  { id: "M-01", title: "Brake inspection", target: "VEHICLE", status: "IN_PROGRESS" as MaintenanceStatus, vehicle: "B-204", priority: "HIGH", branch: "Central Branch", scheduledFor: "2026-10-28" },
  { id: "M-02", title: "Generator service", target: "FACILITY", status: "OPEN" as MaintenanceStatus, vehicle: "—", priority: "MEDIUM", branch: "North Branch", scheduledFor: "2026-10-30" },
  { id: "M-03", title: "Fleet tire rotation", target: "VEHICLE", status: "COMPLETED" as MaintenanceStatus, vehicle: "C-118", priority: "LOW", branch: "South Branch", scheduledFor: "2026-10-21" },
];

export const mockTravel = [
  { id: "T-01", traveler: "Mariam Smith", destination: "Kampala", purpose: "Vendor audit", status: "PENDING" as TravelStatus, departure: "2026-10-27", returnAt: "2026-10-29", amount: "$620" },
  { id: "T-02", traveler: "Daniel Kim", destination: "Kigali", purpose: "Operations review", status: "APPROVED" as TravelStatus, departure: "2026-10-25", returnAt: "2026-10-27", amount: "$340" },
  { id: "T-03", traveler: "Helena Ross", destination: "Nairobi", purpose: "Supplier meeting", status: "REJECTED" as TravelStatus, departure: "2026-11-02", returnAt: "2026-11-04", amount: "$880" },
];

export const mockVisitors = [
  { id: "VST-01", name: "Ava Patel", company: "Northwind Labs", host: "Sarah Mwangi", expectedAt: "2026-10-24 09:30", status: "CHECKED_IN" as VisitStatus },
  { id: "VST-02", name: "Tariq Ali", company: "Mebra Group", host: "Lukas Njeri", expectedAt: "2026-10-24 11:00", status: "EXPECTED" as VisitStatus },
  { id: "VST-03", name: "Maya Okafor", company: "BluePeak", host: "Noah King", expectedAt: "2026-10-24 15:30", status: "CHECKED_OUT" as VisitStatus },
];

export const mockPackages = [
  { id: "PKG-1024", tracking: "PKG-1Q4X", destination: "North Branch", status: "IN_TRANSIT" as PackageStatus, sender: "Central Branch", updated: "45 mins ago" },
  { id: "PKG-1051", tracking: "PKG-4D2Z", destination: "South Branch", status: "DISPATCHED" as PackageStatus, sender: "West Branch", updated: "2 hours ago" },
  { id: "PKG-1180", tracking: "PKG-9JQ7", destination: "Warehouse B", status: "DELIVERED" as PackageStatus, sender: "Central Branch", updated: "Today" },
];

export const mockEvents = [
  { id: "E-01", title: "Quarterly security briefing", date: "2026-10-25", time: "09:00", branch: "Central Branch", type: "MEETING" },
  { id: "E-02", title: "Maintenance planning", date: "2026-10-28", time: "14:00", branch: "North Branch", type: "WORKSHOP" },
  { id: "E-03", title: "Staff recognition", date: "2026-11-02", time: "16:30", branch: "All branches", type: "EVENT" },
];

export const dashboardStats = [
  { label: "Active vehicles", value: "184", change: "+6%" },
  { label: "Open work orders", value: "19", change: "-3" },
  { label: "Travel approvals", value: "7", change: "2 pending" },
  { label: "Today's visitors", value: "14", change: "3 checked in" },
];

export const navItems = [
  { name: "Overview", href: "/", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "SECURITY"] },
  { name: "Reports", href: "/reports", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
  { name: "Vehicles", href: "/vehicles", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] },
  { name: "Maintenance", href: "/maintenance", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] },
  { name: "Travel", href: "/travel", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] },
  { name: "Visitors", href: "/visitors", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "SECURITY"] },
  { name: "Packages", href: "/packages", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] },
  { name: "Events", href: "/events", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] },
  { name: "Check-in", href: "/check-in", roles: ["SECURITY", "ADMIN", "MANAGER"] },
  { name: "Administration", href: "/admin", roles: ["SUPER_ADMIN", "ADMIN"] },
  { name: "Change password", href: "/change-password", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "SECURITY"] },
];
