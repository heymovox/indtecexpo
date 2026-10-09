import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { contactConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { waLink, whatsappLinks } from "@/lib/whatsapp";

export const metadata = buildMetadata({
  title: "Thank You",
  description:
    "Your submission has been received. A member of the INDTEC EXPO team will respond within one working day.",
  path: "/thank-you",
  noIndex: true,
});

type ConfirmationType = "exhibitor" | "visitor" | "contact";

function parseType(value: string | string[] | undefined): ConfirmationType | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "exhibitor" || raw === "visitor" || raw === "contact") return raw;
  return null;
}

const content: Record<
  ConfirmationType,
  { eyebrow: string; title: string; description: string; steps: { icon: IconName; title: string; text: string }[] }
> = {
  exhibitor: {
    eyebrow: "Stall Enquiry Received",
    title: "Your Stall Enquiry Is In.",
    description:
      "Thank you for your interest in exhibiting at INDTEC EXPO. Our exhibitions team reviews every enquiry personally and will respond within one working day with stall availability, pricing and a proforma invoice.",
    steps: [
      {
        icon: "inbox",
        title: "Enquiry logged",
        text: "Your reference number below is now linked to your enquiry — keep it handy for all follow-ups.",
      },
      {
        icon: "phone",
        title: "Team call within one working day",
        text: "An account manager will call to confirm your preferred edition, stall size and product category.",
      },
      {
        icon: "stall",
        title: "Availability & proforma",
        text: "You receive a floor-wise availability chart, pricing and a proforma invoice to confirm your booking.",
      },
    ],
  },
  visitor: {
    eyebrow: "Registration Confirmed",
    title: "You're Registered for INDTEC EXPO.",
    description:
      "Your visitor registration has been received. A confirmation email with your reference number is on its way, and your e-pass will be issued ahead of the edition you selected.",
    steps: [
      {
        icon: "mail",
        title: "Check your inbox",
        text: "Your registration confirmation and e-pass arrive at the email address you provided.",
      },
      {
        icon: "ticket",
        title: "Carry your e-pass + business card",
        text: "Show the e-pass at the fast-track desk along with a valid business card or company ID.",
      },
      {
        icon: "calendar",
        title: "Plan your floor walk",
        text: "Browse the events calendar and floor plan to shortlist exhibitors before you arrive.",
      },
    ],
  },
  contact: {
    eyebrow: "Message Received",
    title: "We've Got Your Message.",
    description:
      "Thank you for reaching out. Your enquiry has been routed to the right desk at Konnekt Globe and our team will respond within one working day.",
    steps: [
      {
        icon: "inbox",
        title: "Routed to the right desk",
        text: "Stall bookings, visitor queries, sponsorship and media enquiries each go to a dedicated coordinator.",
      },
      {
        icon: "clock",
        title: "Response within one working day",
        text: "Mon–Sat, 10:00–19:00 IST. For anything urgent, WhatsApp is the fastest route.",
      },
      {
        icon: "whatsapp",
        title: "Prefer to talk now?",
        text: "Message the exhibitions team on WhatsApp and quote your reference number.",
      },
    ],
  },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const type = parseType(params.type);
  const refRaw = params.ref;
  const reference = (Array.isArray(refRaw) ? refRaw[0] : refRaw)?.trim() || null;

  if (!type) {
    return (
      <Section className="py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center border border-success-500/30 bg-success-50 text-success-500">
            <Icon name="check-circle" size={30} strokeWidth={1.5} />
          </span>
          <h1 className="display mt-8 text-[clamp(2rem,4.5vw,3.25rem)] text-navy-900">
            Thank You for Getting in Touch
          </h1>
          <p className="mt-4 text-base leading-relaxed text-steel-600">
            Your submission has been received. If you were expecting a reference
            number, it is on its way by email — and our team will respond within
            one working day.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button href="/" variant="primary" size="lg" withArrow>
              Back to Home
            </Button>
            <Button href={whatsappLinks.support} variant="outline-light" size="lg">
              <Icon name="whatsapp" size={17} className="mr-1.5" />
              WhatsApp Support
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  const copy = content[type];
  const waHref =
    type === "visitor"
      ? waLink(
          `Hello INDTEC EXPO, my visitor registration ${reference ?? ""} has been submitted. Please confirm my e-pass.`,
        )
      : type === "exhibitor"
        ? waLink(
            `Hello INDTEC EXPO, I have submitted stall enquiry ${reference ?? ""}. Please share availability and pricing.`,
          )
        : whatsappLinks.support;

  return (
    <Section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center border border-success-500/30 bg-success-50 text-success-500">
            <Icon name="check-circle" size={30} strokeWidth={1.5} />
          </span>
          <span className="eyebrow eyebrow-dark mt-7 inline-flex">{copy.eyebrow}</span>
          <h1 className="display mt-4 text-[clamp(2rem,5vw,3.5rem)] text-navy-900">
            {copy.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-steel-600 sm:text-lg">
            {copy.description}
          </p>

          {reference ? (
            <div className="mx-auto mt-8 inline-flex items-center gap-3 border border-brand-200 bg-brand-50 px-5 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-500">
                Your Reference
              </span>
              <span className="display-sm tabular text-lg text-brand-700">
                {reference}
              </span>
            </div>
          ) : null}
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-3">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                  <Icon name={step.icon} size={19} strokeWidth={1.5} />
                </span>
                <span className="display tabular text-sm text-steel-400">
                  0{index + 1}
                </span>
              </div>
              <h2 className="display-sm mt-4 text-base text-navy-900">{step.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-steel-600">
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 border border-steel-200 bg-steel-50 p-6 text-center">
          <p className="text-sm leading-relaxed text-steel-600">
            Our exhibitions team is available {contactConfig.hours}. Quote your
            reference number for the fastest response.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button href={waHref} variant="primary" size="lg">
            <Icon name="whatsapp" size={18} className="mr-1.5" />
            Follow Up on WhatsApp
          </Button>
          <Button href="/events" variant="outline" size="lg">
            Explore Events
          </Button>
          {type === "contact" ? (
            <Button href="/exhibitors/book-your-stall" variant="gold" size="lg">
              Book a Stall
            </Button>
          ) : (
            <Button href="/exhibitors/book-your-stall" variant="outline" size="lg">
              Exhibit at INDTEC EXPO
            </Button>
          )}
          <Button href="/" variant="outline" size="lg">
            Back to Home
          </Button>
        </div>
      </div>
    </Section>
  );
}
