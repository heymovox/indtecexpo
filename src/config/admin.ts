export const adminConfig = {
  basePath: "/admin",
  loginPath: "/admin/login",
  defaultEmail: "admin@heymovox.com",
  /**
   * Sidebar groups, in display order. Every section belongs to exactly one.
   * A superadmin sees 14 sections, which is a long flat list, so the nav is
   * split into five labelled groups instead.
   */
  navGroups: [
    { id: "overview", label: "Overview" },
    { id: "leads", label: "Enquiries & Leads" },
    { id: "content", label: "Content" },
    { id: "media", label: "Media" },
    { id: "system", label: "System" },
  ],
  /** Section id -> AdminMetrics field shown as a quiet count pill. */
  sectionCount: {
    exhibitors: "exhibitorEnquiries",
    bookings: "stallBookings",
    visitors: "visitorRegistrations",
    messages: "contactEnquiries",
  },
  sections: [
    { id: "dashboard", label: "Dashboard", group: "overview", href: "/admin", icon: "grid", roles: ["staff", "admin", "superadmin"] },
    { id: "events", label: "Events", group: "content", href: "/admin/events", icon: "calendar", roles: ["staff", "admin", "superadmin"], editable: ["superadmin"] },
    { id: "exhibitors", label: "Exhibitors", group: "leads", href: "/admin/exhibitors", icon: "building", roles: ["staff", "admin", "superadmin"] },
    { id: "bookings", label: "Stall Bookings", group: "leads", href: "/admin/stall-bookings", icon: "stall", roles: ["staff", "admin", "superadmin"] },
    { id: "visitors", label: "Visitor Registrations", group: "leads", href: "/admin/visitors", icon: "users", roles: ["staff", "admin", "superadmin"] },
    { id: "enquiries", label: "Enquiries", group: "leads", href: "/admin/enquiries", icon: "inbox", roles: ["admin", "superadmin"] },
    { id: "sponsors", label: "Sponsors", group: "content", href: "/admin/sponsors", icon: "award", roles: ["superadmin"] },
    { id: "gallery", label: "Gallery", group: "media", href: "/admin/gallery", icon: "image", roles: ["superadmin"] },
    { id: "floor-plans", label: "Floor Plans", group: "media", href: "/admin/floor-plans", icon: "map", roles: ["superadmin"] },
    { id: "media", label: "Media", group: "media", href: "/admin/media", icon: "news", roles: ["superadmin"] },
    { id: "blog", label: "Blog", group: "content", href: "/admin/blog", icon: "pen", roles: ["superadmin"] },
    { id: "messages", label: "Contact Messages", group: "leads", href: "/admin/contact-messages", icon: "mail", roles: ["admin", "superadmin"] },
    { id: "settings", label: "Settings", group: "system", href: "/admin/settings", icon: "settings", roles: ["staff", "admin", "superadmin"] },
    { id: "users", label: "Users", group: "system", href: "/admin/users", icon: "users", roles: ["superadmin"] },
  ],
  kanbanColumns: [
    { id: "new", label: "New", color: "#1470DC" },
    { id: "contacted", label: "Contacted", color: "#7C3AED" },
    { id: "qualified", label: "Qualified", color: "#F5B301" },
    { id: "proposal", label: "Proposal Sent", color: "#E2711D" },
    { id: "won", label: "Won", color: "#0F9D58" },
    { id: "lost", label: "Lost", color: "#D9232E" },
  ],
} as const;
