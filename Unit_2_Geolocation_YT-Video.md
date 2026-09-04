# Unit 2 (Continued) – Implementing Geolocation and Live Tracking with Leaflet

This continues Unit 2 by walking through the actual implementation: setting up the project, getting the current location, showing it on the map, moving the logic into a service, and adding live tracking with a moving marker, a path line, and a distance tooltip. It ends with converting the app into an installable Android APK.

## 1. Project Setup

```
ionic start <project-name> blank --type=angular --capacitor
```
(blank template, standalone Angular project)

**Known issue:** the project may fail to `serve` with a `tsconfig.json` related error. If this happens:
1. Open `tsconfig.json`.
2. Find the `lib` array (around line 21 in a fresh project).
3. Change `ES2018` to `ES2022`.
4. Save, stop the current process, and run `ionic serve` again.

## 2. Install Dependencies

```
npm install @capacitor/geolocation
npx cap sync

npm install leaflet
npm install --save-dev @types/leaflet
```

- `@capacitor/geolocation` — retrieves the device's latitude/longitude.
- `leaflet` — the map rendering library. Map tiles come from OpenStreetMap (OSM).
- `@types/leaflet` — TypeScript type definitions, saved as a dev dependency, for autocomplete/type checking.

Verify all three appear in `package.json` (the first two under dependencies, `@types/leaflet` under devDependencies).

**Note:** this implementation does not use a routing API. Paths drawn between points are straight lines (via Leaflet's polyline), not actual road routes. A routing API would be needed for that.

## 3. Build the Map UI

`home.page.html` — replace the content with a container div for the map:
```html
<ion-content>
  <div id="map"></div>
</ion-content>
```

`home.page.scss`:
```scss
#map {
  width: 100%;
  height: 70vh;
}
```

`global.scss` — import the Leaflet stylesheet so the map renders correctly:
```scss
@import 'leaflet/dist/leaflet.css';
```

## 4. Initialize the Map

Import Leaflet and implement `AfterViewInit` (not the constructor — the constructor fires before the view/HTML has finished loading, so the map container may not exist yet):

```ts
import * as L from 'leaflet';
import { AfterViewInit, Component } from '@angular/core';

export class HomePage implements AfterViewInit {
  private map!: L.Map; // non-null assertion: value assigned later, guaranteed

  ngAfterViewInit(): void {
    this.mapInit();
  }

  mapInit(): void {
    this.map = L.map('map', {
      center: [14, 121], // placeholder [latitude, longitude]
      zoom: 13,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Fixes a common sizing bug where the map doesn't render at full size
    setInterval(() => {
      this.map.invalidateSize();
    }, 200);
  }
}
```

Key points:
- `center` takes `[latitude, longitude]`. Latitude ranges -90 to +90, longitude ranges -180 to +180.
- `zoom` ranges roughly 0 (world view) to 18–19 (building level), depending on the tile provider.
- `L.tileLayer(...).addTo(this.map)` is what actually renders the visible map — without it you only have an empty container.
- Tile URL and attribution reference: `wiki.openstreetmap.org/wiki/Raster_tile_providers`

## 5. Get the Current Location

```ts
import { Geolocation } from '@capacitor/geolocation';

latitude: number = 0;
longitude: number = 0;

async getLatLong(): Promise<void> {
  const position = await Geolocation.getCurrentPosition();
  this.latitude = position.coords.latitude;
  this.longitude = position.coords.longitude;
}
```

Important ordering issue: if `mapInit()` runs before `getLatLong()` resolves, the map centers on the placeholder coordinates instead of the real ones, because `getCurrentPosition()` is asynchronous. Fetch the location **first**, then initialize the map using the retrieved coordinates.

## 6. Show the Current Position on the Map

```ts
L.circleMarker([this.latitude, this.longitude]).addTo(this.map);
```

Other shapes are available the same way (check the Leaflet API docs at leafletjs.com for each one's parameters and options):
```ts
// Example: a plain circle with required "radius" option (in meters) and optional styling
L.circle([this.latitude, this.longitude], { radius: 100, color: 'violet' }).addTo(this.map);
```

## 7. Move the Location Logic into a Service

```
ionic generate service services/geo
```

Name it something other than `geolocation` — that name collides with the imported `Geolocation` API and makes the generated class confusing to work with.

`geo.service.ts`:
```ts
import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({ providedIn: 'root' })
export class GeoService {
  async getLatLong() {
    try {
      const position = await Geolocation.getCurrentPosition();
      return {
        lat: position.coords.latitude,
        long: position.coords.longitude,
      };
    } catch (error) {
      return null;
    }
  }
}
```

The service returns an object (or `null` on failure) rather than mutating page properties directly, so any page can consume it.

`home.page.ts`:
```ts
import { inject } from '@angular/core';

private geoService = inject(GeoService);
myStartingPositionX: any;

async ngAfterViewInit() {
  const myStartingPosition = await this.geoService.getLatLong();
  myStartingPositionX = myStartingPosition;

  if (myStartingPositionX == null) {
    this.isMyAlertOpen = true;
  } else {
    this.myStartingPositionX = myStartingPositionX;
    this.mapInit();
  }
}
```

`mapInit()` and the marker code should now reference `this.myStartingPositionX?.lat` / `?.long` instead of hardcoded numbers.

## 8. Handle Errors with an Ionic Alert

Without any feedback, a failed geolocation request just leaves a blank map with no explanation. Add an alert:

`home.page.html`:
```html
<ion-alert
  [message]="myMessage"
  [header]="myHeader"
  [isOpen]="isMyAlertOpen"
  [buttons]="['OK']">
</ion-alert>
```

`home.page.ts`:
```ts
myHeader = 'Geolocation API Error';
myMessage = 'Unable to get current location.';
isMyAlertOpen = false;
```

Set `this.isMyAlertOpen = true` when `getLatLong()` returns `null` (see step 7). This makes the failure visible and dismissible instead of leaving the user waiting on a map that will never load.

## 9. Add Live Tracking with watchPosition

`getCurrentPosition()` returns one snapshot. `watchPosition()` keeps firing a callback every time the device's position changes — this is what live tracking uses.

In `geo.service.ts`:
```ts
import { signal } from '@angular/core';

myLiveLatLong = signal<{ lat: number; long: number } | null>(null);

async watchMe() {
  const watchId = await Geolocation.watchPosition(
    { enableHighAccuracy: true }, // options are required here, unlike getCurrentPosition
    (position) => {
      this.myLiveLatLong.set({
        lat: position?.coords.latitude as number,
        long: position?.coords.longitude as number,
      });
    }
  );
  return watchId;
}
```

Note the difference from `getCurrentPosition()`: `watchPosition()` requires both the options object and the callback function as parameters — options can't be omitted here.

## 10. React to Live Position Changes

```ts
import { effect } from '@angular/core';

myLivePosition: any;
private myLiveMarker!: L.CircleMarker;
private myLiveLine!: L.Polyline;

constructor() {
  this.geoService.watchMe();

  effect(() => {
    const live = this.geoService.myLiveLatLong();
    if (live) {
      this.myLivePosition = live;
      this.updateLiveMarkerAndLine();
    }
  });
}
```

`effect()` only works inside the constructor and re-runs automatically whenever a signal it reads (here, `myLiveLatLong`) changes.

## 11. Simulating Movement for Testing

If you can't physically move while testing (e.g. testing at a desk), temporarily replace the live watch with a `setInterval` that manually increments latitude/longitude every couple of seconds to simulate walking. Use this only for local testing/demonstration — comment it out and use the real `watchMe()` for actual device testing.

## 12. Update the Marker Instead of Recreating It

Creating a new `L.circleMarker(...)` inside the effect on every update adds a new marker each time. Keep a single marker and move it instead:

```ts
updateLiveMarkerAndLine() {
  const { lat, long } = this.myLivePosition;

  if (!this.myLiveMarker) {
    this.myLiveMarker = L.circleMarker([lat, long]).addTo(this.map);
  } else {
    this.myLiveMarker.setLatLng([lat, long]);
  }
}
```

## 13. Draw a Path with Polyline

Convert raw coordinates into Leaflet `LatLng` objects before using them (Leaflet needs actual `LatLng` instances, not plain numbers, for some operations like distance calculation):

```ts
const convertedPos1 = L.latLng(this.myStartingPositionX.lat, this.myStartingPositionX.long);
const convertedPos2 = L.latLng(this.myLivePosition.lat, this.myLivePosition.long);
```

Same create-once/update-after pattern as the marker:
```ts
if (!this.myLiveLine) {
  this.myLiveLine = L.polyline([convertedPos1, convertedPos2]).addTo(this.map);
} else {
  this.myLiveLine.setLatLngs([convertedPos1, convertedPos2]);
}
```

Since no routing API is used, this draws a straight line between the two points rather than following actual roads or paths.

## 14. Show Distance Traveled as a Tooltip

Leaflet's `LatLng` objects have a built-in distance method:
```ts
const distance = convertedPos1.distanceTo(convertedPos2).toFixed(2);
```
- `distanceTo()` returns the distance in meters.
- `.toFixed(2)` limits the decimal places for readability.

Bind it to the line as a tooltip, created once so it doesn't duplicate on every update:
```ts
this.myLiveLine.bindTooltip(`${distance} m`, {
  permanent: true,
  direction: 'top',
});
```

## 15. Build and Convert to an Android APK

Prerequisite: Android Studio must be installed, or the build will not succeed.

1. Build the web app:
   ```
   ionic build
   ```
2. Add the Android platform:
   ```
   ionic cap add android
   ```
3. Open `android/app/src/main/AndroidManifest.xml` and add the following right after the closing `<application>` tag:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   ```
4. After any code change, re-sync before testing on Android:
   ```
   ionic cap sync
   ```
5. Open the Android project in Android Studio:
   ```
   ionic cap open android
   ```
6. Trust/open the project and wait for Gradle sync to finish.
7. (Optional) Run it on an emulator or device to confirm it works.
8. In Android Studio: **Build → Generate App Bundles / APKs → Generate APK(s)**.
9. Locate the generated APK (via the "locate" link Android Studio shows) and install it on a device.

## Key Concepts Recap

| Concept | Why it matters |
|---|---|
| `constructor()` vs `ngAfterViewInit()` | Constructor fires before the view/HTML loads; `ngAfterViewInit()` waits until the view is ready — needed before touching the map's DOM element |
| `!` (non-null assertion) | Declares a property with no initial value but guarantees it will be assigned before use |
| `?` (optional) | Declares a property that may or may not end up with a value |
| Regular property vs `signal()` | A signal wraps a value so `effect()` can react to it automatically when it changes; a signal is read by calling it as a function, e.g. `mySignal()`, and updated with `.set(...)` rather than `=` |
| `getCurrentPosition()` vs `watchPosition()` | `getCurrentPosition()` returns one snapshot; `watchPosition()` keeps firing on every position change, used for live tracking, and returns a `watchId` |
| `effect()` | Runs its callback whenever a signal it reads changes; only usable inside a constructor |
| Create-once, update-after pattern | Used for both the live marker and the live polyline, to move/extend the existing shape instead of stacking new ones on every position update |
| No routing API | Lines drawn are straight lines between coordinates, not paths following actual roads |
