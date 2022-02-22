// @ts-check
import polka from "polka";
import sirv from "sirv";
import { repoRoot } from "../utils.js";

const website2Root = (...paths) => repoRoot("src/website2", ...paths);
const serve = sirv(website2Root("public"));

polka()
	.get("/cross-origin.js", (req, res) => {
		if (!req.query["no-corp"]) {
			res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
		}

		if (req.query["use-cors"]) {
			res.setHeader("Access-Control-Allow-Origin", "*");
		}

		serve(req, res);
	})
	.listen(8081, (err) => {
		if (err) throw err;
		console.log(`> Running on localhost:8081`);
	});
