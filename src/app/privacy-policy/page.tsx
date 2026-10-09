import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { contactConfig, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Konnekt Globe collects, uses, stores and protects personal data across the INDTEC EXPO website, visitor registration and exhibitor enquiry processes — in line with the DPDP Act, 2023.",
  path: "/privacy-policy",
});

const sections: { id: string; heading: string; paragraphs: string[]; list?: string[] }[] = [
  {
    id: "scope",
    heading: "1. Scope of This Policy",
    paragraphs: [
      `This Privacy Policy explains how ${siteConfig.organizer.name} ("Konnekt Globe", "we", "us"), the organiser of ${siteConfig.fullName}, collects and processes personal data when you use ${siteConfig.website} (the "Website"), register as a visitor, submit an exhibitor enquiry, contact us, or otherwise interact with us in connection with the INDTEC EXPO exhibitions.`,
      "By using the Website or submitting your information through our forms, you acknowledge that you have read and understood this Policy. If you do not agree with the practices described here, please do not submit your personal data through the Website.",
    ],
  },
  {
    id: "data-we-collect",
    heading: "2. Personal Data We Collect",
    paragraphs: [
      "We collect only the data reasonably necessary for the purposes described in this Policy. Depending on how you interact with us, this may include:",
    ],
    list: [
      "Identity and professional details — full name, designation, company name, city and industry sector.",
      "Contact details — email address, phone / WhatsApp number.",
      "Visitor registration data — the expo editions you plan to visit and your stated areas of interest.",
      "Exhibitor enquiry data — stall preferences, product categories, stall sizes and messages submitted through the stall enquiry form.",
      "Technical data — IP address, browser type, device information, pages visited and referring URLs, collected automatically through cookies and similar technologies.",
      "Communications — records of correspondence when you call, email or message us.",
    ],
  },
  {
    id: "how-we-use",
    heading: "3. How We Use Your Data",
    paragraphs: [
      "We process personal data only for stated, lawful purposes, including:",
    ],
    list: [
      "Issuing visitor e-passes and managing entry across INDTEC EXPO editions.",
      "Responding to exhibitor, sponsorship, media and general enquiries within one working day.",
      "Sending transactional communications — confirmations, reference numbers, scheduling calls and event-related updates you have requested.",
      "Curating the exhibition experience — routing sector enquiries to the right coordinator and sharing relevant agenda or delegation information with registered visitors.",
      "Improving the Website, measuring campaign performance and maintaining security.",
      "Meeting legal, accounting and regulatory obligations applicable to exhibitions organised in India.",
    ],
  },
  {
    id: "consent",
    heading: "4. Consent",
    paragraphs: [
      "Where we rely on consent — for example, marketing communications or optional event updates — we ask for it explicitly through a clear affirmative action (the consent checkbox on our forms). You may withdraw consent at any time by writing to us using the contact details in Section 13; withdrawal does not affect the lawfulness of processing carried out before it.",
      "Consent is not bundled into other terms. Declining optional consent does not prevent you from registering for the expo or submitting an enquiry.",
    ],
  },
  {
    id: "cookies",
    heading: "5. Cookies & Similar Technologies",
    paragraphs: [
      "The Website uses cookies — small text files stored on your device — to keep the site functioning, remember preferences, and understand how visitors use the site so we can improve it.",
    ],
    list: [
      "Strictly necessary cookies — required for core site functions such as form submission and security. These cannot be switched off.",
      "Performance cookies — help us understand page performance and usage patterns in aggregate.",
      "Preference cookies — remember choices such as your location or language between visits.",
    ],
  },
  {
    id: "sharing",
    heading: "6. Sharing Your Data",
    paragraphs: [
      "We do not sell personal data. We share it only where necessary:",
    ],
    list: [
      "With service providers who support our operations — exhibition registration systems, email delivery, hosting and analytics — bound by contractual confidentiality obligations.",
      "With co-organisers, venue partners or association partners where required to deliver a service you requested (for example, a delegation registration).",
      "With law enforcement, regulators or courts where disclosure is required by applicable law.",
      "In connection with a business reorganisation, merger or transfer, subject to equivalent protection of your data.",
    ],
  },
  {
    id: "retention",
    heading: "7. Data Retention",
    paragraphs: [
      "We retain personal data only for as long as needed for the purposes described in this Policy, or as required by law.",
      "Visitor registration records are typically retained for the duration of the expo series plus a limited period for follow-up and statistical reporting. Enquiry records are retained while your enquiry is active and for a reasonable period afterwards for relationship management. Technical logs are retained for shorter security cycles. When retention periods end, data is deleted or irreversibly anonymised.",
    ],
  },
  {
    id: "security",
    heading: "8. Data Security",
    paragraphs: [
      "We maintain reasonable technical and organisational safeguards appropriate to the nature of the data — including access controls, encrypted transport (HTTPS), restricted internal access and vendor due diligence. No method of transmission or storage is completely secure, but we review our safeguards periodically and act promptly on any incident that affects your data.",
    ],
  },
  {
    id: "your-rights",
    heading: "9. Your Rights",
    paragraphs: [
      "Subject to applicable law, including the Digital Personal Data Protection Act, 2023 (DPDP Act), you may have the right to:",
    ],
    list: [
      "Access the personal data we hold about you.",
      "Request correction of inaccurate or incomplete data.",
      "Request erasure of your data, subject to legal retention requirements.",
      "Withdraw consent for optional processing at any time.",
      "Grievance redressal — raise a complaint with our designated Grievance Officer, and thereafter with the Data Protection Board of India as prescribed under the DPDP Act.",
    ],
  },
  {
    id: "children",
    heading: "10. Children's Data",
    paragraphs: [
      "INDTEC EXPO is a trade exhibition. The Website is not directed at children, and we do not knowingly collect personal data from persons below the age of 18. Engineering and technology students may attend on the designated student day through institutional registration coordinated by their college — that data is collected from the institution, not from individual minors through this Website.",
    ],
  },
  {
    id: "third-party",
    heading: "11. Third-Party Links",
    paragraphs: [
      "The Website may link to external sites — partner websites, maps, social media platforms. This Policy does not apply to those sites, and we encourage you to review their privacy practices before sharing any personal data.",
    ],
  },
  {
    id: "changes",
    heading: "12. Changes to This Policy",
    paragraphs: [
      "We may update this Policy to reflect changes in our practices, technology or legal requirements. Material changes will be highlighted on this page with an updated effective date. Continued use of the Website after changes are posted constitutes acceptance of the revised Policy.",
    ],
  },
  {
    id: "contact",
    heading: "13. Contact & Grievance Officer",
    paragraphs: [
      `For questions about this Policy, to exercise your rights, or to raise a grievance, contact our Grievance Officer at ${siteConfig.organizer.name}, ${contactConfig.address.line2}.`,
      `Email: ${contactConfig.email}. We acknowledge grievances within 72 hours and aim to resolve them within the period prescribed by applicable law.`,
      `Office hours: ${contactConfig.hours}.`,
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="How we collect, use and protect your personal data across the INDTEC EXPO website and registration processes — consistent with India's Digital Personal Data Protection Act, 2023."
        image="/images/hero/hero-contact.svg"
        crumbs={[{ label: "Privacy Policy" }]}
        compact
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          {/* TOC */}
          <nav aria-label="Policy contents" className="lg:sticky lg:top-24">
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
              This policy is specific to {siteConfig.fullName}, organised by{" "}
              {siteConfig.organizer.name}.
            </p>
          </nav>

          {/* Body */}
          <div className="max-w-3xl space-y-12">
            <div className="border-b border-steel-200 pb-6">
              <p className="text-sm uppercase tracking-[0.16em] text-steel-500">
                Effective · 1 August 2026
              </p>
              <p className="mt-3 text-base leading-relaxed text-steel-600">
                {siteConfig.organizer.name} (&ldquo;Konnekt Globe&rdquo;,
                &ldquo;we&rdquo;), organiser
                of {siteConfig.fullName}, is the data controller for personal
                data processed through this Website. This policy is written to
                be read in plain language — if anything is unclear, write to us
                and we will explain.
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
                </div>
              </section>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
