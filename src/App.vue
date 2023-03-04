<template>
    <section class="container">
        <div id="map"></div>
        <div class="restaurant-info" ref="restaurantInfo" @mousewheel="scrollCheck">
            <div
                class="info-card"
                v-for="item in apiResponse"
                :key="item.RestaurantID"
                :id="item.RestaurantID"
                :class="{ focus: this.activeID === item.RestaurantID }"
                :ref="item.RestaurantID"
                @click="updateActive(item.RestaurantID, map, item.Position.PositionLon, item.Position.PositionLat)"
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
import geoData from "@/assets/data/cities.json";

const MAPBOXTOKEN = process.env.VUE_APP_MAPBOXTOKEN;

export default {
    data() {
        return {
            authUrl: "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token",
            apiUrl: "https://tdx.transportdata.tw/api/basic/v2/Tourism/Restaurant/Taichung?%24format=JSON",
            clientId: process.env.VUE_APP_TDX_ID,
            clientSecret: process.env.VUE_APP_TDX_SECRET,
            accessToken: "",
            apiResponse: [],
            activeID: "",
            map: null,
            scrollTop: 0,
        };
    },
    methods: {
        async getAuthorizationHeader() {
            const parameters = {
                grant_type: "client_credentials",
                client_id: this.clientId,
                client_secret: this.clientSecret,
            };
            const response = await fetch(this.authUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams(parameters),
            });
            const data = await response.json();
            this.accessToken = JSON.stringify(data);
        },
        async getApiResponse() {
            if (this.accessToken !== "") {
                const response = await fetch(this.apiUrl, {
                    headers: {
                        Authorization: `Bearer ${JSON.parse(this.accessToken).access_token}`,
                    },
                });
                const data = await response.json();
                this.apiResponse = data;
                this.activeID = data[0].RestaurantID;
            }
        },
        mapboxInit() {
            mapboxgl.accessToken = MAPBOXTOKEN;
            const map = new mapboxgl.Map({
                // 地圖 container 之 id
                container: "map",
                // 地圖樣式
                style: "mapbox://styles/mapbox/streets-v12",
                // 初始位置
                center: [120, 24],
                // 初始縮放 level
                zoom: 8,
                // 關閉預設地圖歸屬
                attributionControl: false,
                // 傾斜角度
                pitch: 45,
            })
                // 地圖歸屬訊息
                .addControl(
                    new mapboxgl.AttributionControl({
                        // 自訂地圖歸屬訊息
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
            this.apiResponse.map((rest) => {
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

            map.on("load", () => {
                // 新增 source
                map.addSource("cities", {
                    type: "geojson",
                    data: geoData,
                });

                // 新增 layer
                map.addLayer({
                    // unique id
                    id: "citiesLayer",
                    // 圖層類型： line
                    type: "line",
                    // 資料來源名稱
                    source: "cities",
                    // 如何繪製和應用數據（渲染過程前期）
                    layout: {
                        "line-join": "round",
                        "line-cap": "round",
                    },
                    // 該圖層數據樣式（渲染過程後期）
                    paint: {
                        "line-color": "#888",
                        "line-width": 2,
                    },
                });

                map.addLayer({
                    // unique id
                    id: "Taichung City",
                    // 圖層類型： fill
                    type: "fill",
                    // 資料來源名稱
                    source: "cities",
                    // 該圖層數據樣式（渲染過程後期）
                    paint: {
                        "fill-color": "Chocolate",
                        "fill-opacity": 0.25,
                    },
                    // 對 source 進行篩選
                    filter: ["==", "COUNTYNAME", "臺中市"],
                });
            });

            this.map = map;
        },
        scrollCheck() {
            const scrollDistance = this.$refs.restaurantInfo.scrollTop;
            if (scrollDistance - this.scrollTop < 0) return;
            this.scrollTop = scrollDistance;

            for (let i = 0; i < this.apiResponse.length; i++) {
                const correspond = this.apiResponse[i];

                // 滾動時確認第 i 個 card 是否在畫面內
                if (this.isCardShow(correspond.RestaurantID)) {
                    // 如若在畫面內就繼續執行
                    this.updateActive(
                        correspond.RestaurantID,
                        this.map,
                        correspond.Position.PositionLon,
                        correspond.Position.PositionLat
                    );

                    // 只針對在畫面中的最上面一個執行
                    break;
                }
            }
        },
        isCardShow(id) {
            // 根據 id 取得對應元素
            const card = this.$refs[id][0];
            // 取得該卡片元素的高度
            const cardHeight = card.offsetHeight;
            // 使用 getBoundingClientRect() 取得卡片元素相對 viewport 的位置訊息
            const domRect = card.getBoundingClientRect();

            // 檢查該 id 之卡片是否在 viewport 內
            // 條件一： top 小於 viewport 高度（卡片頂部在 viewport 範圍內）
            // 條件二： bottom 大於卡片高度的一半（卡片底部在 viewport 範圍內）
            // 若兩條件皆滿足，則會 return true，反之則 return false
            return domRect.top < window.innerHeight && domRect.bottom > cardHeight * 0.75;
        },
        updateActive(restID, map, lng, lat) {
            // 檢查餐廳 id 是否與 activeID 一樣，如若一致則 return
            if (restID === this.activeID) return;

            // 使用 flyto() 移動至餐廳位置
            map.flyTo({
                center: [lng, lat],
                zoom: 18,
                speed: 1,
            });

            // 移除帶有 focus 之 class
            this.$refs[this.activeID][0].classList.remove("focus");

            // 找到 id 為該餐廳 id 之卡片，並新增 focus 之 class
            this.$refs[restID][0].classList.add("focus");

            // 將該餐廳 id 賦值給 activeID
            this.activeID = restID;
        },
    },
    async mounted() {
        // 呼叫 API
        await this.getAuthorizationHeader();
        await this.getApiResponse();

        // 初始化地圖
        this.mapboxInit();
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
