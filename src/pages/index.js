import React, { useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import L from "leaflet";
import { useMap } from "react-leaflet";
import axios from "axios";

import { promiseToFlyTo, getCurrentLocation } from "lib/map";

import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "../../node_modules/leaflet-geosearch/dist/geosearch.css";

import Layout from "components/Layout";
import Map from "components/Map";

const LOCATION = {
  lat: 37.7783,
  lng: -119.4179,
};
const CENTER = [LOCATION.lat, LOCATION.lng];
const ZOOM = 6;

const MapEffect = () => {
  const map = useMap();

  const searchControl = new GeoSearchControl({
    provider: new OpenStreetMapProvider(),
    position: "topleft",
    style: "bar",
  }).addTo(map);

  useEffect(() => {
    (async function run() {
      async function fetchData() {
        let request;

        try {
          request = await axios.get("https://db.caldc.org/affiliated-clubs");
        } catch (e) {
          console.log(`Failed to fetch clubs: ${e.message}`, e);
          return;
        }

        const { data = [] } = request;
        const hasData = Array.isArray(data) && data.length > 0;

        if (!hasData) return;

        const geoJson = {
          type: "FeatureCollection",
          features: data.map((club = {}) => {
            const {
              Latitude: lat,
              Longitude: lng,
              Name,
              Email,
              Street,
              City,
              State,
              ZIP,
              Country,
            } = club;
            return {
              type: "Feature",
              properties: {
                Name,
                Email,
                Street,
                City,
                State,
                ZIP,
                Country,
              },
              geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
            };
          }),
        };

        const geoJsonLayers = new L.GeoJSON(geoJson, {
          pointToLayer: (feature = {}, latlng) => {
            const { properties = {} } = feature;

            const { Name, Email, Street, City, State } = properties;

            const html = `
              <span class="icon-marker">
                <span class="icon-marker-tooltip">
                  <h2>${Name}</h2>
                  <ul>
                    <li><strong>Street:</strong> ${Street}</li>
                    <li><strong>City:</strong> ${City}</li>
                    <li><strong>State:</strong> ${State}</li>
                    <li><strong>Email:</strong> ${Email}</li>
                  </ul>
                </span>
              </span>
            `;

            return L.marker(latlng, {
              icon: L.divIcon({
                className: "icon",
                html,
              }),
              riseOnHover: true,
            });
          },
        });

        geoJsonLayers.addTo(map);

        return;
      }
      fetchData();

      const location = await getCurrentLocation().catch(() => LOCATION);

      setTimeout(async () => {
        await promiseToFlyTo(map, {
          zoom: ZOOM,
          center: location,
        });
      });
    })();
  }, [map]);

  return null;
};

const IndexPage = () => {
  const markerRef = useRef();

  const mapSettings = {
    center: CENTER,
    defaultBaseMap: "OpenStreetMap",
    zoom: ZOOM,
  };

  return (
    <Layout pageName="home">
      <Helmet>
        <title>Home Page</title>
      </Helmet>

      <Map {...mapSettings}>
        <MapEffect markerRef={markerRef} />
      </Map>
    </Layout>
  );
};

export default IndexPage;
