<template>
    <section class="container">
        <div id="map"></div>
        <div class="restaurant-info">
            <div
                class="info-card"
                v-for="item in info"
                :key="item.RestaurantID"
                :id="item.RestaurantID"
                :class="{ focus: this.activeID === item.RestaurantID }"
                @click="clickCard(item.RestaurantID, map, item.Position.PositionLon, item.Position.PositionLat)"
            >
                <h3>{{ item.RestaurantName }}</h3>
                <p>營業時間：{{ item.OpenTime }}</p>
                <p>電話：{{ item.Phone }}</p>
                <p>地址：{{ item.Address }}</p>
            </div>
        </div>
    </section>
</template>

<script>
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { Control } from "mapbox-gl";
import geoData from "@/assets/data/cities.json";

export default {
    data() {
        return {
            info: [],
            activeID: "",
            map: null,
        };
    },
    methods: {
        isCardShow(id) {
            const card = document.getElementById(id);
            const cardHeight = document.getElementById(id).offsetHeight;
            const domRect = card.getBoundingClientRect();

            // 檢查該卡片是否在 viewport 內
            return domRect.top < window.innerHeight && domRect.bottom > cardHeight * 0.5;
        },
        updateActive(restID, map, lng, lat) {
            if (restID === this.activeID) return;

            map.flyTo({
                center: [lng, lat],
                zoom: 18,
                speed: 1,
            });

            const elememts = document.getElementsByClassName("focus");

            Array.from(elememts).forEach((element) => {
                element.classList.remove("focus");
            });
            document.getElementById(restID).classList.add("focus");

            this.activeID = restID;
        },
        clickCard(ID, map, lng, lat) {
            if (ID === this.activeID) return;
            console.log(map);

            map.flyTo({
                center: [lng, lat],
                zoom: 18,
                speed: 1,
            });

            const elememts = document.getElementsByClassName("focus");

            Array.from(elememts).forEach((element) => {
                element.classList.remove("focus");
            });
            document.getElementById(ID).classList.add("focus");
        },
    },
    async mounted() {
        // 呼叫 API
        const data = await fetch(
            "https://tdx.transportdata.tw/api/basic/v2/Tourism/Restaurant/Taichung?%24format=JSON"
        ).then((res) => res.json());
        this.info = data;
        this.activeID = data[0].RestaurantID;

        // 初始化地圖
        mapboxgl.accessToken =
            "pk.eyJ1IjoiYmVhcjMyMCIsImEiOiJjbGVibzYwZWUwMDN1M3FudGFvNzJ3cW9vIn0.5wN7g9_4AQTz8QQCgVWIfg";
        const map = new mapboxgl.Map({
            container: "map", // container ID
            style: "mapbox://styles/mapbox/streets-v12", // style URL
            center: [120, 24], // starting position [lng, lat]
            zoom: 8, // starting zoom
            attributionControl: false,
            pitch: 45,
        })
            // 地圖歸屬訊息
            .addControl(
                new mapboxgl.AttributionControl({
                    customAttribution: "Map designd by Oliver Xiong",
                })
            )
            // 全螢幕顯示
            .addControl(new mapboxgl.FullscreenControl())
            // 地圖縮放
            .addControl(
                new mapboxgl.NavigationControl({
                    // 顯示指南針
                    showCompass: true,
                    // 顯示縮放
                    showZoom: true,
                })
            )
            // 瀏覽器定位
            .addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true,
                    },
                    // 自動追蹤使用者移動
                    trackUserLocation: true,
                    showUserHeading: true,
                })
            )
            .flyTo({
                center: [120.640321, 24.167208],
                zoom: 15,
                speed: 0.35,
            });

        // Marker
        // Restaurants in Taichung
        data.map((rest) => {
            const marker = new mapboxgl.Marker({
                color: "tomato",
                scale: 0.8,
            })
                .setLngLat([rest.Position.PositionLon, rest.Position.PositionLat])
                .setPopup(
                    new mapboxgl.Popup({ maxWidth: "300px", closeOnMove: true }).setHTML(
                        `
						<div class="rest-intro">
							<img class="rest-img" src=${rest.Picture.PictureUrl1} />
							<div class="rest-content">
								<h2>${rest.RestaurantName}</h2>
								<p>營業時間：${rest.OpenTime}</p>
								<p>電話：<a href="tel:${rest.Phone}">${rest.Phone}</a></p>
								<p>地址：${rest.Address}</p>
							</div>
						</div>
						`
                    )
                )
                .addTo(map);
        });

        this.map = map;

        document.querySelector(".restaurant-info").onscroll = () => {
            for (let i = 0; i < data.length; i++) {
                const correspond = data[i];

                // 滾動時確認第 i 個 card 是否在畫面內
                if (this.isCardShow(correspond.RestaurantID)) {
                    // 如若在畫面內就繼續執行
                    this.updateActive(
                        correspond.RestaurantID,
                        map,
                        correspond.Position.PositionLon,
                        correspond.Position.PositionLat
                    );

                    // 只針對在畫面中的最上面一個執行
                    break;
                }
            }
        };

        map.on("load", () => {
            map.addSource("cities", {
                type: "geojson",
                data: geoData,
            });

            map.addLayer({
                id: "citiesLayer",
                type: "line",
                source: "cities",
                layout: {
                    "line-join": "round",
                    "line-cap": "round",
                },
                paint: {
                    "line-color": "#888",
                    "line-width": 2,
                },
            });

            map.addLayer({
                id: "Taichung City",
                type: "fill",
                source: "cities",
                paint: {
                    "fill-color": "Chocolate",
                    "fill-opacity": 0.25,
                },
                filter: ["==", "COUNTYNAME", "臺中市"],
            });
        });
    },
    beforeDestroy() {
        document.querySelector(".restaurant-info").onscroll = null;
    },
};
</script>

<style lang="scss">
body {
    margin: 0;

    #app {
        .container {
            position: relative;
            width: 100vw;
            height: 100vh;

            #map {
                position: absolute;
                top: 0;
                right: 0;
                width: 80%;
                height: 100%;

                .rest-intro {
                    box-sizing: border-box;
                    padding: 0.5rem;

                    .rest-img {
                        width: 3rem;
                        height: 3rem;
                        border-radius: 50%;
                        object-fit: cover;
                        object-position: center;
                    }

                    .rest-content {
                        p {
                            a {
                                text-decoration: none;
                                color: black;
                            }
                        }
                    }
                }
            }

            .restaurant-info {
                position: absolute;
                top: 0;
                left: 0;
                width: 20%;
                height: 100%;
                background-color: #fff;
                box-shadow: 5px 0 5px #0003;
                overflow: scroll;

                .info-card {
                    box-sizing: border-box;
                    padding: 1.5rem;
                    border-bottom: 1px solid #0005;
                    color: #0005;

                    h3 {
                        font-size: 1.5rem;
                        margin: 0 0 0.5rem;
                    }

                    p {
                        font-size: 0.8rem;
                        margin: 0;

                        & + p {
                            margin-top: 0.5rem;
                        }
                    }
                }

                .focus {
                    color: #000;
                    box-shadow: 0 3px 3px #0002;
                }
            }
        }
    }
}
</style>
