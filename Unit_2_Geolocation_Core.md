# Unit 2 – DEVICE GEOLOCATION AND INTERACTIVE MAP INTEGRATION

## Overview

Mobile applications can become more context-aware by integrating device capabilities into their interface and application logic. One commonly used device capability is geolocation, which allows an application to obtain the geographical position of a device and use the resulting coordinates to provide location-based functionality.

This unit introduces device geolocation using the official Capacitor Geolocation plugin and visualizes geographical information through Leaflet, an open-source JavaScript library for interactive maps. Capacitor Geolocation provides access to the device's current position and location updates, while Leaflet provides the interactive map interface used to display geographical coordinates, tile layers, markers, and other map elements.

Learners will first create and configure a basic Leaflet map before accessing the device's geographical position. The retrieved latitude and longitude will then be integrated with the map to center the view and display the user's current location. The unit also introduces location permissions, position accuracy, continuous location tracking, and basic error handling required when developing location-aware mobile applications.

By the end of the unit, learners will integrate a native device capability with a third-party mapping library to create a functional location-aware Ionic Angular application.

## Learning Objectives

At the end of this unit, learners should be able to:

1. explain the roles of Capacitor Geolocation, Leaflet, and map tile layers in a location-aware mobile application;
2. install and configure the required geolocation and mapping dependencies in an Ionic Angular project;
3. create an interactive Leaflet map with an appropriate tile layer, map center, zoom level, marker, and attribution;
4. retrieve and interpret device location information using the Capacitor Geolocation API;
5. configure and manage location permissions for supported mobile platforms;
6. integrate geographical coordinates with Leaflet to display and update the device's current location on a map;
7. track location changes using watchPosition() and properly stop tracking using clearWatch(); and
8. handle common location states such as denied permissions, disabled location services, and unavailable or delayed position data.

## Lesson Proper

### Understanding Geolocation and Interactive Mapping

#### Device Geolocation

Device geolocation refers to obtaining geographical information about the current device position. The Capacitor Geolocation plugin provides methods for retrieving a single current position or receiving continuing location updates. The returned position includes latitude, longitude, accuracy, and, when available, altitude, speed, and heading information.

#### Capacitor Geolocation

```
Device / Operating System
        ↓
Capacitor Geolocation
        ↓
Latitude + Longitude + Accuracy
```

Capacitor is responsible for the device capability.

https://capacitorjs.com/docs/apis/geolocation

#### Leaflet

Leaflet is an open-source JavaScript library designed for interactive, mobile-friendly maps. Its Map class creates and manages a map, while additional layers such as tile layers, markers, popups, polylines, and polygons may be placed on it. Leaflet creates and controls the interactive map.

https://leafletjs.com/reference.html

#### Basemap / Tile Layer

Leaflet itself does not supply the geographical map imagery. A tile provider supplies map tiles that Leaflet displays as a layer. The official Leaflet Quick Start uses OpenStreetMap tiles as an example and requires attribution to the map data provider.

https://wiki.openstreetmap.org/wiki/Raster_tile_providers

### Installing and Preparing the Required Packages

#### Capacitor Geolocation

Terminal:
```
npm install @capacitor/geolocation
npx cap sync
```

#### Leaflet

Terminal:
```
npm install leaflet
```

#### Additional

`@types/leaflet`

The `@types/leaflet` package provides TypeScript definitions for leaflet.

Terminal:
```
npm install --save-dev @types/leaflet
```

#### Leaflet CSS

Add the code below to your `global.scss`

`global.scss`:
```scss
@import 'leaflet/dist/leaflet.css';
```

### Creating a Basic Leaflet Map

In this section, it is important to note that we will start with the map preview first before the geolocation that the Capacitor will provide. With this kind of approach, students can easily debug the problem if the problem is the map (leaflet) and not the GPS, permissions or Capacitor.

`html`:
```html
<ion-content>
  <div id="map"></div>
</ion-content>
```

`scss`:
```scss
#map {
  width: 100%;
  height: 400px;
}
```

Codes above are important because Leaflet map container must be defined before making it visible.

`ts concept`:
```ts
import * as L from 'leaflet';

private map!: L.Map;

initMap(): void {
  this.map = L.map('map').setView(
    [latitude, longitude],
    15
  );
}
```

**Actual Implementation in TypeScript** (from the code editor screenshot, transcribed in full):

```ts
import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import {
  …
} from '@ionic/angular/standalone';

import * as L from 'leaflet'; //Importing everything from leaflet + aliasing

@Component({
  …
})

export class HomePage implements AfterViewInit {
  private map!: L.Map; //Property declaration

  constructor() {
  }

  // Angular Lifecycle Hook:Fire after HTML was rendered
  ngAfterViewInit(): void {
    this.initMap();
  }

  // Core method
  initMap(): void {
    // Which coordinate will be view
    this.map = L.map('map').setView([15.65588, 121.039818], 15);
    // Adding the tiles or actual "map"
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // fixing the loading issue
    setInterval(() => {
      this.map.invalidateSize();
    }, 200);
  }
}
```

### Understanding Geolocation Data

| Property | Meaning |
|---|---|
| latitude | North–south geographical position |
| longitude | East–west geographical position |
| accuracy | Estimated accuracy of the reported coordinates |
| altitude | Height relative to sea level, when available |
| speed | Device speed, when available |
| heading | Direction of movement, when available |

The Capacitor Position object contains a coords object with these location-related values.

Example:
```
position.coords.latitude
position.coords.longitude
position.coords.accuracy
```

### Configuring Location Permissions

#### Android

Current Capacitor documentation requires coarse and fine location declarations in `AndroidManifest.xml` for standard geolocation use:

`AndroidManifest.xml`:
```xml
<uses-permission
  android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission
  android:name="android.permission.ACCESS_FINE_LOCATION" />
```

**Important:** Paste the above code in `android/app/src/main/AndroidManifest.xml`. Place it after the `<application>` closing tag. If you can't find the location, type this code in your terminal: `ionic cap add android`

An optional GPS hardware feature declaration may also be added when GPS is required by the application.

### Getting the Current Device Location

Import the Geolocation in your TypeScript then create a custom method that will log the latitude and longitude

```ts
import {
  Geolocation
} from '@capacitor/geolocation';

async getCurrentLocation(): Promise<void> {
  const position =
    await Geolocation.getCurrentPosition();
  const latitude =
    position.coords.latitude;
  const longitude =
    position.coords.longitude;
  console.log(latitude);
  console.log(longitude);
}
```

`getCurrentPosition()` returns a `Promise<Position>`, which is why `await` naturally fits the method. To display it on our template, use the following code:

```html
<p>Latitude: {{ latitude }}</p>
<p>Longitude: {{ longitude }}</p>
```

**Try this:** Convert the example code into a signal

### Integrating Geolocation with Leaflet

In this section with the capability of Geolocation API of producing latitude and longitude alongside with others and connect them into our existing code example. In template, let's add a button that will trigger the `locateMe()` method.

`home.page.html`:
```html
<ion-header>
  <ion-toolbar>
    <ion-button (click)="locateMe()">Locate Me</ion-button>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div id="map"></div>
</ion-content>
```

`home.page.ts`:
```ts
import { AfterViewInit, Component } from '@angular/core';
import {
  …
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import * as L from 'leaflet'; //Importing everything from leaflet + aliasing

@Component({
  …
})
export class HomePage implements AfterViewInit {
  private map!: L.Map; //Property declaration

  constructor() {}

  // Angular Lifecycle Hook:Fire after HTML was rendered
  ngAfterViewInit(): void {
    this.initMap();
  }

  // Core method
  initMap(): void {
    // Which coordinate will be view
    this.map = L.map('map').setView([0, 0], 15);
    // Adding the tiles or actual "map"
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    // fixing the loading issue
    setInterval(() => {
      this.map.invalidateSize();
    }, 200);
  }

  async locateMe() {
    const position = await Geolocation.getCurrentPosition();
    const lat = position.coords.latitude; const long = position.coords.longitude;
    // Updating the current map view
    this.map.setView([lat, long], 19);
    // adding a circle marker to current position
    L.circleMarker([lat, long]).addTo(this.map).bindPopup('I am here').openPopup();
    console.log(lat + ' ' + long);
  }
}
```

### Avoiding Multiple Location Markers

You will notice that every time you click the "Locate Me" button, it will recreate a new marker. To avoid this, you can add a simple conditional statement that will update the location marker once it has no value.

To accomplish this, let's create a new property called `locationMarker`. Notice the "?" symbol, it represents that value will be optional.

```ts
private locationMarker?: L.CircleMarker;
```

Then update the `locateMe()` with the following code:

```ts
async locateMe() {
  const position = await Geolocation.getCurrentPosition();
  const lat = position.coords.latitude;
  const long = position.coords.longitude;
  // Updating the current map view
  this.map.setView([lat, long], 19);
  if (this.locationMarker) {
    // just updating the latitude and longitude
    this.locationMarker.setLatLng([lat, long]);
  } else {
    // adding a circle marker to current position
    this.locationMarker = L.circleMarker([lat, long])
      .addTo(this.map)
      .bindPopup('I am here')
      .openPopup();
    console.log(lat + ' ' + long);
  }
}
```

More about Capacitor Geolocation API here:
https://www.youtube.com/watch?v=ZhrFD0bWWIY
