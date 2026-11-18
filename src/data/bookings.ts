export interface RecentBooking {
  name: string;
  company: string;
  city: string;
  stall: string;
  ago: string;
}

/**
 * Recent stall bookings shown as social proof in the hero.
 *
 * Replace these with real exhibitor names as they are confirmed — the
 * component only reads this list.
 */
export const recentBookings: RecentBooking[] = [
  {
    name: "Ravi Kumar",
    company: "Sri Sakthi Machines",
    city: "Coimbatore",
    stall: "6 m × 6 m",
    ago: "2 hours ago",
  },
  {
    name: "Anil Gupta",
    company: "Gupta Engineering Works",
    city: "Bengaluru",
    stall: "9 m × 3 m",
    ago: "5 hours ago",
  },
  {
    name: "Mohammed Farhan",
    company: "Farhan Tools",
    city: "Hosur",
    stall: "3 m × 6 m",
    ago: "yesterday",
  },
  {
    name: "Priya Sharma",
    company: "Sharma Automation",
    city: "Bengaluru",
    stall: "6 m × 6 m",
    ago: "yesterday",
  },
  {
    name: "Suresh Menon",
    company: "Menon CNC Solutions",
    city: "Coimbatore",
    stall: "3 m × 3 m",
    ago: "2 days ago",
  },
  {
    name: "Vikram Reddy",
    company: "Reddy Hydraulics",
    city: "Hosur",
    stall: "9 m × 3 m",
    ago: "3 days ago",
  },
];
