import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { contactConfig, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms & Conditions",
  description:
    "Terms governing visitor registration, exhibitor stall bookings, sponsorship and use of the INDTEC EXPO website — including booking, cancellation, liability and force majeure provisions.",
  path: "/terms",
});

interface TermSection {
  id: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
  afterList?: string[];
}

const sections: TermSection[] = [
  {
    id: "acceptance",
    heading: "1. Acceptance of Terms",
    paragraphs: [
      `These Terms & Conditions ("Terms") govern your use of ${siteConfig.website} (the "Website") and your participation in ${siteConfig.fullName} exhibitions organised by ${siteConfig.organizer.name} ("Konnekt Globe", "we", "us").`,
      "By using the Website, submitting a visitor registration, submitting an exhibitor enquiry, entering into a sponsorship arrangement or attending an INDTEC EXPO edition, you agree to these Terms. If you are agreeing on behalf of a company, you confirm that you are authorised to bind that company.",
    ],
  },
  {
    id: "website-use",
    heading: "2. Use of the Website",
    paragraphs: [
      "The Website is provided for legitimate business purposes connected with INDTEC EXPO. You agree not to:",
    ],
    list: [
      "Submit false, misleading or incomplete information through any form.",
      "Use the Website or its content for unlawful, fraudulent or promotional purposes not authorised by us.",
      "Attempt to interfere with the operation or security of the Website, or scrape content at scale without written permission.",
      "Impersonate another person or company, or misrepresent your affiliation with any entity.",
    ],
  },
  {
    id: "visitor-registration",
    heading: "3. Visitor Registration & Entry",
    paragraphs: [
      "Visitor registration is free for verified trade and industry professionals. Registration does not guarantee entry — final admission is subject to on-site verification of your identity and trade status.",
    ],
    list: [
      "Each registration is personal and non-transferable unless expressly permitted in writing.",
      "Pre-registered visitors receive an e-pass by email; the e-pass must be presented with a valid business card or company ID at the entry desk.",
      "Access hours, hall capacity limits and safety directions issued by us or the venue must be followed at all times.",
      "We reserve the right to refuse or withdraw admission where registration information is found to be false, or where conduct risks the safety or business environment of the exhibition.",
      "Student and general public access, where offered, is restricted to designated days and requires institutional or prior registration as announced.",
    ],
  },
  {
    id: "stall-bookings",
    heading: "4. Exhibitor Stall Bookings",
    paragraphs: [
      "An exhibitor booking is confirmed only when we issue written confirmation (including a booking reference and proforma / invoice) and the applicable payment is received within the stated timeline. Submitting an enquiry through the Website does not create a booking or reserve space.",
    ],
    list: [
      "Stall allocations are subject to availability and are assigned at our discretion, having regard to sector zoning, technical feasibility and layout balance.",
      "Prices quoted are exclusive of applicable GST and other statutory levies, which will be charged as prevailing.",
      "Raw space exhibitors are responsible for their own stall design, fabrication and approvals; designs must be submitted for approval before the build-up deadline communicated in the exhibitor manual.",
      "Additional charges apply for three-phase power, water, machinery foundation, rigging and other services ordered separately.",
      "Exhibitors must occupy their stall by the published build-up deadline; unoccupied stalls may be reallocated without refund.",
    ],
  },
  {
    id: "cancellation",
    heading: "5. Cancellation, Postponement & Substitution",
    paragraphs: [
      "Cancellation requests must be submitted in writing to the exhibitions team. Cancellation charges apply on a sliding scale based on how much notice is given before the first day of the edition concerned:",
    ],
    list: [
      "90 days or more before the edition — a documented administrative / marketing retention may apply.",
      "60 to 89 days before — 50% of the total booking value is payable.",
      "30 to 59 days before — 75% of the total booking value is payable.",
      "Fewer than 30 days before — 100% of the total booking value is payable.",
      "Failure to occupy the stall, or withdrawal after build-up begins, counts as late cancellation at 100%.",
    ],
    afterList: [
      "Exhibitor substitution (another company taking over the same stall) is permitted up to 14 days before the edition, subject to written approval and any reasonable administrative charge.",
      "If an edition is postponed, the booking transfers to the rescheduled dates. If an edition is cancelled outright, confirmed exhibitors may choose a full credit toward another INDTEC EXPO edition or a refund of amounts paid, less documented third-party costs already committed by us (for example venue or logistics deposits).",
      "We are not liable for exhibitor travel, accommodation, freight or other indirect costs arising from cancellation, postponement or rescheduling.",
    ],
  },
  {
    id: "sponsorship",
    heading: "6. Sponsorship & Partnership",
    paragraphs: [
      "Sponsorship and partnership packages are governed by a separate written agreement setting out rights, deliverables, commercial terms and brand usage. Where a conflict arises between these Terms and a signed sponsorship agreement, the sponsorship agreement prevails for that arrangement.",
      "Sponsor logos, brand assets and co-branded materials must be supplied in the formats specified and may be used by either party only within the scope agreed in writing.",
    ],
  },
  {
    id: "conduct-ip",
    heading: "7. Conduct, IP & Content",
    paragraphs: [
      "The INDTEC EXPO name, logo, Website design and original content belong to Konnekt Globe or its licensors and may not be used without written permission.",
      "Exhibitors and attendees must respect intellectual property rights on the floor. Suspected infringements should be reported to the exhibition management desk; we may assist venue security or authorities but do not adjudicate IP disputes.",
      "Photography and filming on the exhibition floor requires prior consent where other exhibitors or attendees are identifiable. We may use floor imagery containing general crowds for promotional purposes.",
      "Disruptive conduct, harassment of staff or attendees, or behaviour that jeopardises safety may result in removal from the venue without refund.",
    ],
  },
  {
    id: "liability",
    heading: "8. Liability & Indemnity",
    paragraphs: [
      "The Website and its content are provided on an “as is” basis. While we take reasonable care in preparing and publishing information, we do not warrant that it is complete, current or error-free, and may correct or update content at any time without notice.",
      "To the maximum extent permitted by law, Konnekt Globe is not liable for any indirect, incidental or consequential loss — including lost profits, business interruption or loss of data — arising from use of the Website, attendance at an edition, or any exhibitor or sponsorship arrangement.",
      "Our aggregate liability in connection with any booking or these Terms is limited to the amount actually paid by you to us for the relevant edition or arrangement.",
      "Nothing in these Terms limits liability for fraud, wilful misconduct, or any liability that cannot be excluded under applicable Indian law.",
      "Attendees and exhibitors are responsible for their own equipment, goods, exhibits and personnel. We recommend appropriate insurance cover for exhibits, machinery and public liability.",
      "You agree to indemnify Konnekt Globe against claims arising from your misuse of the Website, breach of these Terms, or infringement of third-party rights in your exhibits and materials.",
    ],
  },
  {
    id: "force-majeure",
    heading: "9. Force Majeure",
    paragraphs: [
      "Neither party is liable for failure or delay in performing obligations (including hosting an exhibition) where caused by events beyond its reasonable control — including natural disasters, fire, flood, epidemic or pandemic, war, civil disturbance, government action, statutory restrictions, venue unavailability, power or internet failure, or industrial action.",
      "In such cases we may reschedule, relocate or cancel the affected edition, and the cancellation, postponement and refund provisions in Section 5 will apply.",
    ],
  },
  {
    id: "privacy-law",
    heading: "10. Privacy & Governing Law",
    paragraphs: [
      "Personal data submitted through the Website is processed in accordance with our Privacy Policy, which forms part of these Terms by reference.",
      "These Terms are governed by the laws of India. Any dispute arising out of or in connection with these Terms or an INDTEC EXPO arrangement is subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.",
      "If any provision of these Terms is held unenforceable, the remaining provisions continue in full force. Our failure to enforce a provision is not a waiver of it.",
    ],
  },
  {
    id: "contact-terms",
    heading: "11. Contact",
    paragraphs: [
      `Questions about these Terms, a booking or an existing arrangement can be directed to ${siteConfig.organizer.name}, ${contactConfig.address.line1}, ${contactConfig.address.line2}.`,
      `Email: ${contactConfig.email} · Exhibitor desk: ${contactConfig.exhibitorEmail}. Office hours: ${contactConfig.hours}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & Conditions"
        description="The terms that govern use of the INDTEC EXPO website, visitor registration, stall bookings, sponsorship and attendance at our exhibitions."
        image="/images/hero/hero-contact.svg"
        crumbs={[{ label: "Terms & Conditions" }]}
        compact
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <nav aria-label="Terms contents" className="lg:sticky lg:top-24">
            <h2 className="display-sm text-sm tracking-[0.18em] text-navy-800">
              CONTENTS
            </h2>
            <ol className="mt-4 space-y-2 border-l border-steel-200 pl-4">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="link-underline block text-sm text-steel-600 transition hover:text-brand-600"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-6 border border-steel-200 bg-steel-50 p-4 text-xs leading-relaxed text-steel-500">
              These terms apply to {siteConfig.fullName}, organised by{" "}
              {siteConfig.organizer.name}.
            </p>
          </nav>

          <div className="max-w-3xl space-y-12">
            <div className="border-b border-steel-200 pb-6">
              <p className="text-sm uppercase tracking-[0.16em] text-steel-500">
                Effective · 1 August 2026
              </p>
              <p className="mt-3 text-base leading-relaxed text-steel-600">
                Please read these Terms carefully before using the Website or
                entering into any booking or participation arrangement with us.
                They contain important provisions on cancellation, liability and
                dispute resolution.
              </p>
            </div>

            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="display text-xl text-navy-900 sm:text-2xl">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-[15px] leading-relaxed text-steel-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.list ? (
                    <ul className="space-y-2.5 pt-1">
                      {section.list.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-[15px] leading-relaxed text-steel-600"
                        >
                          <span
                            aria-hidden
                            className="mt-2 h-1.5 w-1.5 shrink-0 bg-signal-500"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {section.afterList?.map((paragraph, index) => (
                    <p
                      key={`after-${index}`}
                      className="text-[15px] leading-relaxed text-steel-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
