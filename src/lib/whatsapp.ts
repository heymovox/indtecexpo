import { siteConfig } from "@/config/site";

const BASE = `https://wa.me/${siteConfig.whatsappNumber}`;

export function waLink(message: string): string {
  return `${BASE}?text=${encodeURIComponent(message)}`;
}

export const whatsappLinks = {
  general: waLink(
    "Hello INDTEC EXPO, I would like to know more about the 2026–2027 editions.",
  ),
  exhibitor: waLink(
    "Hello INDTEC EXPO, I would like to enquire about booking a stall.",
  ),
  visitor: waLink(
    "Hello INDTEC EXPO, I would like to register as a visitor for the upcoming edition.",
  ),
  floorPlan: waLink(
    "Hello INDTEC EXPO, please share the latest floor plan and stall availability.",
  ),
  support: waLink("Hello INDTEC EXPO, I need assistance with my enquiry."),
};

export function waLinkForEnquiry(reference: string, company: string): string {
  return waLink(
    `Hello INDTEC EXPO, I have submitted stall enquiry ${reference} for ${company}. Please share availability and pricing.`,
  );
}

export function waLinkForVisitor(reference: string, name: string): string {
  return waLink(
    `Hello INDTEC EXPO, my visitor registration ${reference} is submitted in the name of ${name}. Please confirm my e-pass.`,
  );
}
