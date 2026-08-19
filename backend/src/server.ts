import app from "./app";
import ENV from "./core/config/env";

app.listen(ENV.PORT, () => {
  console.log(`Server running at http://localhost:${ENV.PORT}/api`);
});
