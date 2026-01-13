// Disable browser's automatic scroll restoration on page refresh
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

const app = createApp(App);

app.use(router);

app.mount("#app");
