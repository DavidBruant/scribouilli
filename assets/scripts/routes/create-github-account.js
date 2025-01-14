// @ts-check

import CreateGithubAccount from "../components/screens/CreateGithubAccount.svelte";
import { svelteTarget } from "../config";
import { replaceComponent } from "../routeComponentLifeCycle";

export default () => {
    const createGithubAccount = new CreateGithubAccount({
      target: svelteTarget,
      props: {},
    });

    replaceComponent(createGithubAccount, () => {});
}
