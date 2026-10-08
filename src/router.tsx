import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Carrega a proxima pagina quando a pessoa aponta ou encosta no link, antes do clique.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
