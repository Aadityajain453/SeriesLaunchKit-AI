import CookieConsent from './components/common/CookieConsent';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import {
  ProtectedRoute,
  PublicOnlyRoute,
} from './components/common/RouteGuards';

import AppLayout from './components/layout/AppLayout';
import FullPageLoader from './components/common/FullPageLoader';
import { LoadingBlock } from './components/common/ui';

import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivacyPolicy from './pages/PrivacyPolicy';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const FilmStudio = lazy(() => import('./pages/FilmStudio'));
const SeriesStudio = lazy(() => import('./pages/SeriesStudio'));
const SeriesCreate = lazy(() => import('./pages/SeriesCreate'));
const SeriesDetail = lazy(() => import('./pages/SeriesDetail'));
const MyProjects = lazy(() => import('./pages/MyProjects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const MyVideos = lazy(() => import('./pages/MyVideos'));
const GenHistory = lazy(() => import('./pages/GenHistory'));
const Training = lazy(() => import('./pages/Training'));
const Bonuses = lazy(() => import('./pages/Bonuses'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <CookieConsent />
      <Routes>

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Public Privacy Policy */}
        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />

        {/* Authentication Routes */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <Dashboard />
                </Suspense>
              }
            />

            <Route
              path="/film-studio"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <FilmStudio />
                </Suspense>
              }
            />

            <Route
              path="/series-studio"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <SeriesStudio />
                </Suspense>
              }
            />

            <Route
              path="/series-studio/new"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <SeriesCreate />
                </Suspense>
              }
            />

            <Route
              path="/series-studio/:id"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <SeriesDetail />
                </Suspense>
              }
            />

            <Route
              path="/my-projects"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <MyProjects />
                </Suspense>
              }
            />

            <Route
              path="/my-projects/:id"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <ProjectDetail />
                </Suspense>
              }
            />

            <Route
              path="/my-videos"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <MyVideos />
                </Suspense>
              }
            />

            <Route
              path="/gen-history"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <GenHistory />
                </Suspense>
              }
            />

            <Route
              path="/training"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <Training />
                </Suspense>
              }
            />

            <Route
              path="/bonuses"
              element={
                <Suspense fallback={<LoadingBlock />}>
                  <Bonuses />
                </Suspense>
              }
            />

          </Route>
        </Route>

        {/* 404 Route */}
        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </Suspense>
  );
}
