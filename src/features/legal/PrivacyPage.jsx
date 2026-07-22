import { LegalLayout, Section } from './LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="July 22, 2026">
      <p className="text-sm leading-6 text-charcoal-200">
        Discretion is the foundation of The Swingset, and this policy explains
        exactly what we collect, why, and who can see it. Short version: your
        profile is only visible to signed-in members under the visibility you
        choose, we don't sell your data, we don't run ads, and we tell search
        engines to stay out.
      </p>

      <Section heading="1. What we collect">
        <p>
          <strong className="text-charcoal-100">Account information</strong> —
          email address, date of birth (to enforce our 18+ requirement), and a
          display name. Your date of birth is never shown to other members.
        </p>
        <p>
          <strong className="text-charcoal-100">Profile & content</strong> —
          whatever you choose to add: photos, bio, location (city/region only —
          we never ask for exact addresses on profiles), interests,
          preferences, prompts, posts, comments, messages, album photos, event
          RSVPs, and connections.
        </p>
        <p>
          <strong className="text-charcoal-100">Verification selfies</strong> —
          if you choose to verify, your selfie is stored in a restricted area
          that only administrators can access, used solely to confirm your
          photos, and never shown to other members.
        </p>
        <p>
          <strong className="text-charcoal-100">Technical data</strong> —
          standard logs our infrastructure provider (Google Firebase) records
          to run the service, such as IP addresses and timestamps. We don't use
          third-party analytics or advertising trackers.
        </p>
      </Section>

      <Section heading="2. What other members see">
        <p>
          Only signed-in, invited members can see anything at all. Within the
          community, you control visibility: profiles can be members-wide,
          connections-only, or private; posts carry the audience you pick;
          album photos are visible only to people you explicitly grant; exact
          event locations are shown only to confirmed guests. Photos are
          re-encoded on upload so location metadata (EXIF/GPS) is removed
          automatically.
        </p>
        <p>
          Direct messages are visible only to the people in the conversation.
          They are not end-to-end encrypted — like most platforms, they're
          stored on our infrastructure — but access rules restrict them to the
          participants.
        </p>
      </Section>

      <Section heading="3. How we use your information">
        <p>
          To operate the service: showing your profile to the audience you
          chose, delivering messages and notifications, running events, and
          maintaining connections. For safety: enforcing our age requirement,
          reviewing reports, automated screening of uploaded images, and
          preventing banned members from returning. That's it — no ad
          targeting, no selling or renting data to anyone, no marketing lists.
        </p>
      </Section>

      <Section heading="4. Who processes your data">
        <p>
          The Swingset runs on Google Firebase (authentication, database, file
          storage, hosting functions). Uploaded images are screened
          automatically by Google Cloud Vision. These providers process data
          on our behalf under their own security and privacy commitments; data
          is encrypted in transit and at rest.
        </p>
        <p>
          We disclose information outside these processors only if the law
          genuinely requires it (for example, a valid legal order), or to
          report child sexual abuse material to NCMEC as required by law. If a
          disclosure obligation ever conflicts with member safety, we'll limit
          it to the minimum the law compels.
        </p>
      </Section>

      <Section heading="5. Retention & deletion">
        <p>
          Your data stays only while your account exists. Deleting your
          account (Profile → "Delete my account and all data") removes your
          profile, photos, albums, and notifications; residual copies in
          backups age out shortly after. Content you posted into shared spaces
          (such as comments on others' posts) may persist without your name if
          removal would break others' conversations. Moderation records of
          zero-tolerance violations may be retained to keep banned members
          out.
        </p>
      </Section>

      <Section heading="6. Your choices & rights">
        <p>
          You can edit your profile and visibility at any time, block any
          member, control message permissions, use discretion features (quick
          hide, PIN lock, discreet notifications), and delete your account
          entirely. Depending on where you live, you may have additional legal
          rights (access, correction, portability, deletion) — contact an
          administrator through the app and we'll honor them.
        </p>
      </Section>

      <Section heading="7. Age policy">
        <p>
          The Swingset is strictly 18+. We verify age at signup by required
          date of birth and enforce it server-side; accounts found to belong
          to minors are removed immediately. We do not knowingly collect any
          information from anyone under 18.
        </p>
      </Section>

      <Section heading="8. Search engines & third parties">
        <p>
          Every page instructs search engines not to index or archive it. Your
          profile has no public URL — nothing about your membership is
          reachable without signing in with an invited account.
        </p>
      </Section>

      <Section heading="9. Changes & contact">
        <p>
          If we make material changes to this policy we'll give notice in the
          app before they take effect. Questions or requests: contact an
          administrator through the app.
        </p>
      </Section>
    </LegalLayout>
  )
}
