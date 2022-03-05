import { connection } from "./db/dbconfig";
import createServer from "./util/server";

const app = createServer();
const PORT: number = 4000; // Type assert to string

// DB SETUP
const db = connection;
db.on("error", console.error.bind(console, "MONGODB CONNECTION ERROR"));

app.listen(PORT, () => {
  console.log("CONNECTED ON PORT: ", PORT);
});
