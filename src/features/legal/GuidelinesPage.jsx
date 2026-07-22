import { LegalLayout, Section } from './LegalLayout'

export function GuidelinesPage() {
  return (
    <LegalLayout title="Community Guidelines" updated="July 22, 2026">
      <p className="text-sm leading-6 text-charcoal-200">
        The Swingset exists so that consenting adults in the ethical
        non-monogamy and swinger communities can meet, talk, and organize
        safely and discreetly. Everything below flows from two ideas:{' '}
        <strong className="text-charcoal-50">consent</strong> and{' '}
        <strong className="text-charcoal-50">discretion</strong>. Breaking
        these rules can mean content removal, suspension, or a permanent ban —
        at our discretion, with zero-tolerance items enforced immediately.
      </p>

      <Section heading="1. Consent comes first — everywhere">
        <p>
          Consent applies to conversations here just as it does in person. Do
          not send sexually explicit messages or images to anyone who hasn't
          clearly welcomed them. An accepted connection is an invitation to
          talk, not an invitation for anything else.
        </p>
        <p>
          "No" is a complete answer. If someone declines, ignores, or
          disconnects — that's the end of it. Repeated unwanted contact,
          pressure after a refusal, or contacting someone through another
          channel after being blocked is harassment.
        </p>
      </Section>

      <Section heading="2. Discretion is sacred">
        <p>
          Many members' careers, families, or communities don't know about
          their lifestyle, and it must stay that way. What happens on The
          Swingset stays on The Swingset:
        </p>
        <p>
          • No screenshots, downloads, or re-sharing of anyone's profile,
          photos, messages, or attendance — anywhere, ever.{' '}
          <br />• Never reveal a member's identity, lifestyle, or membership to
          anyone outside the platform ("outing"), including a partner's
          workplace, family, or social media.{' '}
          <br />• Never share someone's real name, address, workplace, or
          other identifying details (doxxing) — including in private messages.
        </p>
        <p>
          Outing or doxxing a member is a zero-tolerance offense: immediate,
          permanent ban.
        </p>
      </Section>

      <Section heading="3. Zero tolerance">
        <p>These result in an immediate permanent ban, and where the law requires it, a report to authorities:</p>
        <p>
          • Any sexual content involving, depicting, or soliciting minors —
          reported to NCMEC and law enforcement without exception.{' '}
          <br />• Sharing intimate images of any person without their consent
          (including ex-partners).{' '}
          <br />• Depictions or credible descriptions of non-consensual acts.{' '}
          <br />• Threats, stalking, blackmail, or extortion of any member.{' '}
          <br />• Commercial sexual services: solicitation, advertising, or
          arranging paid sexual encounters is prohibited.
        </p>
      </Section>

      <Section heading="4. Content standards">
        <p>
          The feed, profiles, events, and groups are shared spaces — keep them
          non-explicit. No nudity or sexually explicit imagery on any
          members-wide surface. Automated moderation removes violating images
          and flags the uploader.
        </p>
        <p>
          Private albums are the place for more intimate photos, shared only
          with people you explicitly grant. Everyone visible in a photo must
          be an adult who consented to being photographed and shared.
        </p>
      </Section>

      <Section heading="5. Be real">
        <p>
          Profiles must represent real people. No catfishing, no fake or
          duplicate accounts, no impersonation. Couple profiles must be actual
          couples — both partners aware and participating. Use recent photos of
          yourself. Verification exists to protect everyone; don't attempt to
          game it.
        </p>
      </Section>

      <Section heading="6. Respect the community">
        <p>
          No hate speech, discrimination, or dehumanizing language on the
          basis of race, ethnicity, religion, disability, gender identity,
          sexual orientation, body type, or relationship style. Kink-shaming
          and lifestyle-shaming don't belong here. Disagree respectfully; block
          freely.
        </p>
        <p>
          No spam, no pyramid schemes, no advertising or recruiting for other
          platforms or businesses without our written permission.
        </p>
      </Section>

      <Section heading="7. Events">
        <p>
          Hosts set the rules for their events; attending means agreeing to
          them. Exact locations are shared only with confirmed guests — do not
          pass them on. RSVP honestly, cancel if you can't make it, and respect
          a host's decision to decline or remove a guest. Everything in these
          guidelines applies in person at community events, too.
        </p>
      </Section>

      <Section heading="8. Reporting and enforcement">
        <p>
          Every post, comment, profile, and event has a Report option, and you
          can block any member instantly. Reports are reviewed by
          administrators; we may remove content, warn, suspend, or permanently
          ban an account at our sole discretion. We'd rather act early to keep
          this space safe than give bad actors second chances at your expense.
        </p>
      </Section>
    </LegalLayout>
  )
}
