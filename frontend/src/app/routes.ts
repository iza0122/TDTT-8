import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Videos from "./pages/Videos";
import Map from "./pages/Map";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: Auth,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "videos", Component: Videos },
      { path: "map", Component: Map },
      { path: "profile", Component: Profile },
    ],
  },
]);
