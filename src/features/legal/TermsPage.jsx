import { Link } from 'react-router-dom'
import { LegalLayout, Section } from './LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="July 22, 2026">
      <p className="text-sm leading-6 text-charcoal-200">
        These Terms of Service ("Terms") govern your use of The Swingset (the
        "Service"). By creating an account or using the Service you agree to
        these Terms, our{' '}
        <Link to="/legal/privacy" className="text-gold-400 hover:text-gold-300">Privacy Policy</Link>, and our{' '}
        <Link to="/legal/guidelines" className="text-gold-400 hover:text-gold-300">Community Guidelines</Link>.
        If you don't agree, don't use the Service.
      </p>

      <Section heading="1. Eligibility">
        <p>
          You must be at least 18 years old (or the age of majority where you
          live, if higher) to use the Service. You must provide a truthful
          date of birth. The Service is invite-only: an account requires a
          valid invite code, and membership may be refused or revoked at our
          discretion. You may hold one account, for yourself.
        </p>
        <p>
          This is an adults-only social community. By using it you confirm
          you're comfortable encountering frank, adult-oriented discussion of
          consensual non-monogamy.
        </p>
      </Section>

      <Section heading="2. Your account">
        <p>
          You're responsible for your account and everything done with it.
          Keep your credentials private, use accurate information, and tell us
          promptly if you believe your account has been compromised. We may
          suspend or terminate accounts that violate these Terms or the
          Community Guidelines.
        </p>
      </Section>

      <Section heading="3. Your content">
        <p>
          You keep ownership of the content you post — profiles, photos,
          posts, comments, messages ("Content"). You grant us a limited,
          non-exclusive, royalty-free license to host, store, display, and
          transmit your Content solely to operate the Service. This license
          ends when you delete the Content or your account, except where
          limited copies persist briefly in backups.
        </p>
        <p>
          You promise that you have the right to share everything you post,
          and that every person visible in any image you upload is an adult
          who consented to being photographed and to the image being shared
          here. Uploading content depicting anyone without their consent is
          grounds for immediate termination.
        </p>
        <p>
          Other members' Content is theirs. You receive no right to copy,
          screenshot, download, or redistribute anything from the Service.
        </p>
      </Section>

      <Section heading="4. Acceptable use">
        <p>
          The <Link to="/legal/guidelines" className="text-gold-400 hover:text-gold-300">Community Guidelines</Link>{' '}
          are part of these Terms. In addition, you agree not to: access or
          attempt to access other members' data beyond what the Service
          intentionally shows you; probe, scrape, or reverse-engineer the
          Service; interfere with its operation; use it for any commercial
          purpose without our written permission; or use it to break any law.
        </p>
      </Section>

      <Section heading="5. Moderation">
        <p>
          We may review reported content, remove any Content, and restrict,
          suspend, or terminate any account, at any time, at our sole
          discretion, with or without notice. Automated systems screen
          uploaded images. We are not obligated to monitor the Service, and we
          don't guarantee we'll catch every violation.
        </p>
      </Section>

      <Section heading="6. Safety — meeting in person">
        <p>
          The Swingset does not run background checks and does not vouch for
          any member, event, or host. Photo verification confirms only that a
          member matched their photos at the time of review. You alone decide
          whom to meet and where; use judgment, meet in public first, tell
          someone you trust, and never feel pressure to continue an encounter.
          Anything that happens between members — online or in person — is
          between them.
        </p>
      </Section>

      <Section heading="7. Termination">
        <p>
          You can delete your account at any time from your profile, which
          removes your profile, photos, and notifications from the Service. We
          may suspend or terminate your access at our discretion, including
          for violations of these Terms. Sections 3, 8, 9, and 10 survive
          termination.
        </p>
      </Section>

      <Section heading="8. Disclaimers">
        <p>
          The Service is provided "as is" and "as available," without
          warranties of any kind, express or implied, including
          merchantability, fitness for a particular purpose, and
          non-infringement. We don't warrant that the Service will be
          uninterrupted, secure, or error-free, or that any member is who they
          claim to be.
        </p>
      </Section>

      <Section heading="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, The Swingset and its
          operators will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of data, arising
          from or related to your use of the Service — including interactions
          or encounters with other members — even if advised of the
          possibility. Our total liability for any claim will not exceed the
          greater of $100 or the amount you paid us in the twelve months
          before the claim.
        </p>
      </Section>

      <Section heading="10. Indemnification">
        <p>
          You agree to defend and hold harmless The Swingset and its operators
          from claims, damages, and expenses (including reasonable attorneys'
          fees) arising from your Content, your use of the Service, or your
          violation of these Terms.
        </p>
      </Section>

      <Section heading="11. Changes">
        <p>
          We may update these Terms. For material changes we'll give notice in
          the app; continued use after notice means you accept the updated
          Terms. If you don't accept them, stop using the Service and delete
          your account.
        </p>
      </Section>

      <Section heading="12. Governing law & contact">
        <p>
          These Terms are governed by the laws of the State of Wisconsin, USA,
          without regard to conflict-of-law rules, and disputes will be
          resolved in the state or federal courts located in Milwaukee County,
          Wisconsin. Questions about these Terms: contact an administrator
          through the app.
        </p>
      </Section>
    </LegalLayout>
  )
}
