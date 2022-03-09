import "dotenv/config";
import { connection } from "./db/dbconfig";
import createServer from "./util/server";

const app = createServer();
const PORT = parseInt(process.env.PORT as string) || 4000; // Type assert to string

// DB SETUP
connection.on("error", console.error.bind(console, "MONGODB CONNECTION ERROR"));

app.listen(PORT, () => {
  console.log(
    "  ______                             __                           __       \n" +
      "  / ____/   _____   __  __    ____   / /_  ____    ____   ____ _  / /_  ___ \n" +
      " / /       / ___/  / / / /   / __ \\ / __/ / __ \\  / __ \\ / __ `/ / __/ / _ \\\n" +
      "/ /___    / /     / /_/ /   / /_/ // /_  / /_/ / / / / // /_/ / / /_  /  __/\n" +
      "\\____/   /_/      \\__, /   / .___/ \\__/  \\____/ /_/ /_/ \\__,_/  \\__/  \\___/ \n" +
      "                 /____/   /_/                                               "
  );
  console.log("CONNECTED ON PORT: ", PORT);
});
