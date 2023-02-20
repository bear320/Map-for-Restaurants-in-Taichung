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
    apiKey: "AIzaSyDqTJW06G3Slq5zYoyJ_Ejc_919BcG4Aqk",
    authDomain: "taichung-food-map.firebaseapp.com",
    projectId: "taichung-food-map",
    storageBucket: "taichung-food-map.appspot.com",
    messagingSenderId: "896941382762",
    appId: "1:896941382762:web:b4f55812a6001369133e13",
};

const app = initializeApp(firebaseConfig);
