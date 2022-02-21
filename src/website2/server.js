// @ts-check
import polka from "polka";
import sirv from "sirv";
import { repoRoot } from "../utils.js";

const website2Root = (...paths) => repoRoot("src/website2", ...paths);
const serve = sirv(website2Root("public"));

polka()
	.use(serve)
	.listen(8081, (err) => {
		if (err) throw err;
		console.log(`> Running on localhost:8081`);
	});
