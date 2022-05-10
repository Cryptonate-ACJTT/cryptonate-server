import "dotenv/config";
import { existsSync } from "fs";
import { promisify } from "util";
import { connection } from "./db/dbconfig";
import { CryptoClient, IndexClient, KeyDaemonClient } from "./middleware/crypto";
import createServer from "./util/server";

const app = createServer();
const PORT = parseInt(process.env.PORT as string) || 4000; // Type assert to string

// KEYDAEMON INIG
KeyDaemonClient.getInstance();

// CRYPTO INIT
CryptoClient.getInstance();

// make sure python files are compiled!

let projectPath = "src/contracts/pyTEAL/project.py";
let clearPath = "src/contracts/pyTEAL/default_clear_state.py";

let srcfp = "src/contracts/TEAL/";
let buildfp = "build/contracts/TEAL/";

(async () => {
	const exec = promisify(require("child_process").exec);
	try {
		await exec(`python3 ${projectPath} > ${srcfp}project.teal; python3 ${clearPath} > ${srcfp}clear_state.teal; cp ${srcfp}project.teal ${srcfp}clear_state.teal ${buildfp}`);
	} catch(err) {
		console.error(err);
	}
})();


// INDEXER INIT
IndexClient.getInstance();

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
