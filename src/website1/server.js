// @ts-check
import polka from "polka";
import sirv from "sirv";
import { repoRoot } from "../utils.js";

const website1Root = (...paths) => repoRoot("src/website1", ...paths);
const serve = sirv(website1Root("public"));

polka()
	.use(serve)
	.listen(8080, (err) => {
		if (err) throw err;
		console.log(`> Running on localhost:8080`);
	});
