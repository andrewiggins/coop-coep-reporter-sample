// @ts-check
import polka from "polka";
import sirv from "sirv";
import { repoRoot } from "../utils.js";

const website2Root = (...paths) => repoRoot("src/website2", ...paths);

polka()
	.use(
		sirv(website2Root("public"), {
			setHeaders(res) {
				// TODO: Hmmm Edge seems to require Access-Control-Allow-Origin. CORP isn't enough
				// res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
				res.setHeader("Access-Control-Allow-Origin", "*");
			},
		})
	)
	.listen(8081, (err) => {
		if (err) throw err;
		console.log(`> Running on localhost:8081`);
	});
