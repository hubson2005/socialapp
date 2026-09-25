import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { Loader2 } from "lucide-react";
import {
  ProtectedRoute,
  AdminRoute,
  PublicOnlyRoute,
} from "./routes/AuthRoutes";

// Pages chargées à la demande (code-splitting)
const Login             = lazy(() => import("./pages/Login"));
const Dashboard         = lazy(() => import("./pages/Dashboard"));
const UserDashboard     = lazy(() => import("./pages/UserDashboard"));
const PublicProfile     = lazy(() => import("./pages/PublicProfile"));
const PublicBookingPage = lazy(() => import("./pages/PublicBookingPage"));
const PublicForm        = lazy(() => import("./components/forms/PublicForm"));
const PublicEventPage   = lazy(() => import("./pages/PublicEventPage"));
const EventsDashboard   = lazy(() => import("./pages/EventsDashboard"));
const EventEditorPage   = lazy(() => import("./pages/EventEditorPage"));
const Home              = lazy(() => import("./pages/Home"));
const Blog               = lazy(() => import("./pages/Blog"));
const BlogPostPage       = lazy(() => import("./pages/BlogPostPage"));
const PrivacyPolicy      = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService     = lazy(() => import("./pages/TermsOfService"));
const DeleteAccount      = lazy(() => import("./pages/DeleteAccount"));
const ResetPassword      = lazy(() => import("./pages/ResetPassword"));
const WhatsAppCRM        = lazy(() => import("./pages/WhatsAppCRM"));

const isAdminDomain = () => {
  const hostname = window.location.hostname;
  return (
    hostname === "admin.socialapp.work" ||
    import.meta.env.VITE_FORCE_ADMIN === "true"
  );
};

function AdminApp() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute redirectTo="/dashboard">
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/dashboard/whatsapp-crm"
        element={
          <AdminRoute>
            <WhatsAppCRM />
          </AdminRoute>
        }
      />
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function PublicApp() {
  return (
    <Routes>
      <Route path="/"                  element={<Home />} />

      {/* Routes légales — chemins longs (liens du footer) */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy.html" element={<Navigate to="/privacy-policy" replace />} />
      <Route path="/politique-de-confidentialite" element={<Navigate to="/privacy-policy" replace />} />
      <Route path="/terms-of-service"  element={<TermsOfService />} />

      {/* Alias courts — redirigent vers les routes canoniques */}
      <Route path="/privacy"           element={<Navigate to="/privacy-policy" replace />} />
      <Route path="/terms"             element={<Navigate to="/terms-of-service" replace />} />

      <Route path="/delete-account"    element={<DeleteAccount />} />
      <Route path="/reset-password"    element={<ResetPassword />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute redirectTo="/dashboard">
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/whatsapp-crm"
        element={
          <ProtectedRoute>
            <WhatsAppCRM />
          </ProtectedRoute>
        }
      />

      {/* Mode Événement — dashboard de gestion (liste + édition) */}
      <Route
        path="/dashboard/events"
        element={
          <ProtectedRoute>
            <EventsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/events/new"
        element={
          <ProtectedRoute>
            <EventEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/events/:id"
        element={
          <ProtectedRoute>
            <EventEditorPage />
          </ProtectedRoute>
        }
      />

      {/* ✅ FIX : route publique du formulaire — DOIT être déclarée avant
          "/:username" et "*" pour que /form/:formId ne soit pas avalée
          par le catch-all et redirigée vers la home. */}
      <Route path="/form/:formId" element={<PublicForm />} />

      {/* Lien direct de réservation (service ou événement précis) — doit
       aussi être déclaré avant "/:username" pour la même raison. */}
      <Route path="/book/:profileId/:type/:itemId" element={<PublicBookingPage />} />

      <Route path="/:username" element={<PublicProfile />} />
      {/* Blog — doit aussi être déclaré avant "/:username" pour la même raison */}
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />

      {/* Page publique d'un événement (Mode Événement) — doit aussi être
       déclarée avant "*" pour la même raison. */}
      <Route path="/e/:slug" element={<PublicEventPage />} />

      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthLoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#060412',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
    }}>
      <img
        src="/Logo_SocialApp.png"
        alt="SocialApp"
        style={{ width: 54, height: 54, borderRadius: 14, boxShadow: '0 8px 28px rgba(255,140,0,0.4)' }}
      />
      <Loader2 size={22} color="#ff8c00" className="animate-spin" />
    </div>
  );
}

function RoleBasedDashboard() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (isAdmin) {
    if (window.location.hostname === "socialapp.work") {
      window.location.href = "https://admin.socialapp.work/dashboard";
      return null;
    }
    return <Dashboard />;
  }
  return <UserDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<AuthLoadingScreen />}>
        {isAdminDomain() ? <AdminApp /> : <PublicApp />}
      </Suspense>
    </AuthProvider>
  );
}