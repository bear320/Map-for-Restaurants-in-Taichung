import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

createApp(App).use(store).use(router).mount("#app");

// Dynamic title
router.beforeEach((to, from, next) => {
    document.title = to.meta.title;
    next();
});

// Firebase
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: process.env.VUE_FIREBASE_apiKey,
    authDomain: "taichung-food-map.firebaseapp.com",
    projectId: "taichung-food-map",
    storageBucket: "taichung-food-map.appspot.com",
    messagingSenderId: process.env.VUE_FIREBASE_messagingSenderId,
    appId: process.env.VUE_FIREBASE_appId,
};

initializeApp(firebaseConfig);
