import type { FaqItem } from "@/types/content";

export const faqs: FaqItem[] = [
  {
    id: "faq-1",
    group: "Exhibiting",
    question: "How do I book a stall at INDTEC EXPO?",
    answer:
      "Submit the stall enquiry form on the Book Your Stall page with your preferred expo location, stall size and product category. Our team responds within one working day with availability, pricing and a proforma invoice.",
  },
  {
    id: "faq-2",
    group: "Exhibiting",
    question: "What stall sizes and configurations are available?",
    answer:
      "All three editions offer Raw Space (minimum 6 m × 3 m), standard Shell Scheme stalls of 3 m × 3 m and Premium corner spaces of 6 m × 6 m and above. Customised inline and island configurations are available on request.",
  },
  {
    id: "faq-3",
    group: "Exhibiting",
    question: "What is included in the stall booking?",
    answer:
      "Shell scheme stalls include carpet, fascia name panel, table, chairs, waste bin, power point and exhibitor passes. Raw space includes common area maintenance and exhibitor passes. Machinery foundation and three-phase power are billed separately.",
  },
  {
    id: "faq-4",
    group: "Exhibiting",
    question: "Can I exhibit at more than one INDTEC city?",
    answer:
      "Yes. Multi-city packages across Bengaluru, Coimbatore and Hosur attract volume benefits. Mention your preferred combination in the enquiry form and our team will structure a package.",
  },
  {
    id: "faq-5",
    group: "Exhibiting",
    question: "Are there early-bird or association offers?",
    answer:
      "Special exhibitor offers are available for early bookings, association members and multi-city participants. Look for the SPECIAL EXHIBITOR OFFERS callout or ask our team when you submit an enquiry.",
  },
  {
    id: "faq-6",
    group: "Visiting",
    question: "Is visitor registration free?",
    answer:
      "Yes. Registration is free for trade visitors and industry professionals. Pre-register online to receive your e-pass and avoid on-site queues.",
  },
  {
    id: "faq-7",
    group: "Visiting",
    question: "What should I carry to the expo?",
    answer:
      "Carry your printed or digital e-pass, a valid business card or company ID and a photo ID for verification at the entry desk.",
  },
  {
    id: "faq-8",
    group: "Visiting",
    question: "Can students attend INDTEC EXPO?",
    answer:
      "Engineering and technology students are welcome on the final day of each edition with a valid college ID and prior registration through their institution.",
  },
  {
    id: "faq-9",
    group: "Events",
    question: "Where and when is INDTEC EXPO held?",
    answer:
      "INDTEC EXPO 2026–2027 runs across three industrial hubs: Bengaluru at KLE Ground (24–26 Dec 2026), Coimbatore at Codessia Road (12–14 Feb 2027) and Hosur at Hills Exhibition Center (12–15 Mar 2027).",
  },
  {
    id: "faq-10",
    group: "Events",
    question: "What are the exhibition timings?",
    answer:
      "The floor is open from 10:00 to 18:00 on all business days. Inauguration takes place at 10:00 on Day 1 of each edition.",
  },
  {
    id: "faq-11",
    group: "General",
    question: "Who organises INDTEC EXPO?",
    answer:
      "INDTEC EXPO is organised by Konnekt Globe — Exhibitions | Trade Fairs | Business Connect, with the mission of Connecting Industries Globally.",
  },
  {
    id: "faq-12",
    group: "General",
    question: "How do I speak to the exhibitions team?",
    answer:
      "Call 7406213220, 7406213221, 7406213222 or 7406213223, WhatsApp us, or write to info@indtecexpo.com. Our team is available Mon–Sat, 10:00–19:00 IST.",
  },
];

export const faqGroups = ["Exhibiting", "Visiting", "Events", "General"] as const;

export const faqsByGroup = (group: FaqItem["group"]) =>
  faqs.filter((faq) => faq.group === group);
