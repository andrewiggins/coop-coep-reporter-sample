// @ts-check
import { readFileSync } from "fs";
import { createServer } from "https";
import polka from "polka";
import sirv from "sirv";
import { repoRoot } from "../utils.js";

const port = 8081;
const host = "third-party-test.localhost";
const origin = `https://${host}:${port}`;

const siteRoot = (...paths) => repoRoot("src/third-party", ...paths);
const serve = sirv(siteRoot("public"), { dev: true });

const app = polka()
	.get("/cross-origin.js", (req, res) => {
		if (!req.query["no-corp"]) {
			res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
		}

		if (req.query["use-cors"]) {
			res.setHeader("Access-Control-Allow-Origin", "*");
		}

		serve(req, res);
	})
	.get("/popup", (req, res) => {
		serve(req, res);
	})
	.get("/", serve);

const serverOptions = {
	pfx: readFileSync(siteRoot("ssl.pfx")),
	passphrase: "password",
};

// Mount Polka to HTTPS server
// @ts-ignore
createServer(serverOptions, app.handler).listen(port, (_) => {
	console.log(`> Running on ${origin}`);
});
