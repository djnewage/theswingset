import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { AgeGate } from './features/auth/AgeGate'
import { DiscretionProvider } from './features/discretion/DiscretionProvider'
import { DiscretionSettingsPage } from './features/discretion/DiscretionSettingsPage'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { WelcomePage } from './features/auth/WelcomePage'
import { RedirectIfAuthed, RequireAuth, RequireProfile } from './features/auth/guards'
import { AppShell } from './components/AppShell'
import { ProfilePage } from './features/profiles/ProfilePage'
import { EditProfilePage } from './features/profiles/EditProfilePage'
import { CouplePage } from './features/profiles/CouplePage'
import { FeedPage } from './features/feed/FeedPage'
import { ComposePage } from './features/feed/ComposePage'
import { PostPage } from './features/feed/PostPage'
import { EventsPage } from './features/events/EventsPage'
import { EventFormPage } from './features/events/EventFormPage'
import { EventPage } from './features/events/EventPage'
import { DiscoverPage } from './features/discover/DiscoverPage'
import { ConnectionsPage } from './features/connections/ConnectionsPage'
import { AlbumViewPage } from './features/albums/AlbumViewPage'
import { UserProfileView } from './features/profiles/UserProfileView'
import { CoupleProfileView } from './features/profiles/CoupleProfileView'
import { NotificationsPage } from './features/notifications/NotificationsPage'
import { VerifyPage } from './features/verification/VerifyPage'
import { AdminVerificationsPage } from './features/verification/AdminVerificationsPage'
import { AdminPage } from './features/admin/AdminPage'
import { GroupsPage } from './features/groups/GroupsPage'
import { GroupPage } from './features/groups/GroupPage'
import { TravelPage } from './features/travel/TravelPage'
import { MessagesPage } from './features/messages/MessagesPage'
import { ThreadPage } from './features/messages/ThreadPage'
import { ReactionsPage } from './features/prompts/ReactionsPage'
import { TermsPage } from './features/legal/TermsPage'
import { PrivacyPage } from './features/legal/PrivacyPage'
import { GuidelinesPage } from './features/legal/GuidelinesPage'

// '/theswingset' on GitHub Pages, '' everywhere else (BASE_URL ends with '/').
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <DiscretionProvider>
      <AgeGate>
        <AuthProvider>
        <BrowserRouter basename={BASENAME}>
          <Routes>
            {/* Public: readable before signup (linked from the agreement checkbox). */}
            <Route path="/legal/terms" element={<TermsPage />} />
            <Route path="/legal/privacy" element={<PrivacyPage />} />
            <Route path="/legal/guidelines" element={<GuidelinesPage />} />

            <Route element={<RedirectIfAuthed />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/welcome" element={<WelcomePage />} />

              <Route element={<RequireProfile />}>
                <Route element={<AppShell />}>
                  <Route index element={<FeedPage />} />
                  <Route path="post/:postId" element={<PostPage />} />
                  <Route path="discover" element={<DiscoverPage />} />
                  <Route path="connections" element={<ConnectionsPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="messages/:threadId" element={<ThreadPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="verify" element={<VerifyPage />} />
                  <Route path="settings/discretion" element={<DiscretionSettingsPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="groups/:groupId" element={<GroupPage />} />
                  <Route path="travel" element={<TravelPage />} />
                  <Route path="reactions" element={<ReactionsPage />} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="admin/verifications" element={<AdminVerificationsPage />} />
                  <Route path="albums/:albumId" element={<AlbumViewPage />} />
                  <Route path="u/:uid" element={<UserProfileView />} />
                  <Route path="c/:coupleId" element={<CoupleProfileView />} />
                  <Route path="compose" element={<ComposePage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="events/new" element={<EventFormPage />} />
                  <Route path="events/:eventId" element={<EventPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="profile/edit" element={<EditProfilePage />} />
                  <Route path="couple" element={<CouplePage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </AgeGate>
    </DiscretionProvider>
  )
}
