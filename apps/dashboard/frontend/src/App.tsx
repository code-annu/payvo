import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { appRouter } from "./router/router";
import QueryProvider from "./app/query/QueryProvider";

function App() {
  return (
    <QueryProvider>
      <RouterProvider router={appRouter} />
      <Toaster position="top-right" richColors closeButton />
    </QueryProvider>
  );
}

export default App;
