import { createBrowserRouter } from "react-router";
import Layout from "./common/components/Layout";
import HomePage from "./features/content/pages/HomePage";
import VideosPage from "./features/content/pages/VideosPage";
import MapPage from "./features/discovery/pages/MapPage";
import ProfilePage from "./features/identity/pages/ProfilePage";
import AuthPage from "./features/identity/pages/AuthPage";


export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "videos", Component: VideosPage },
      { path: "map", Component: MapPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);