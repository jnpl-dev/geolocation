# Geolocation App - Video Script

## Part 1: Code Walkthrough (1:30)

### Show: `src/app/services/geo.ts`

**Script:**
"This is our geolocation service. It has three main methods.

`getCurrentLocation()` calls `Geolocation.getCurrentPosition` with high accuracy enabled. It returns a single position — latitude and longitude. We use this for the Locate Me button and the initial map load.

`watchPosition()` is different. It calls `Geolocation.watchPosition`, which takes a callback function. This callback fires every time the device detects a new position. Each time it fires, we update our `movingPosition` Angular signal. The method returns a watch ID string, which we store so we can stop it later.

`stopWatching()` calls `Geolocation.clearWatch` with the stored watch ID. This stops the callback from firing, resets the signal to null, and clears the watch ID."

---

### Show: `src/app/home/home.page.ts` (lines 34-84, the effect)

**Script:**
"In our home page constructor, we have an Angular effect that watches the `movingPosition` signal. Every time the signal updates — meaning the device moved — the effect runs.

If tracking is active, it creates or updates a blue circle marker at the new position, draws a green polyline from the start to the current position, calculates the distance using Leaflet's `distanceTo` method, displays it in a tooltip at the midpoint, and pans the map to follow the user."

---

### Show: `src/app/home/home.page.ts` (lines 178-186, start/stop)

**Script:**
"`startTracking` sets the `isTracking` flag to true and calls `watchPosition` on the service. This starts the continuous location updates.

`stopTracking` sets `isTracking` to false and calls `stopWatching` on the service. This stops the callback from firing, so the blue marker and polyline freeze in place."

---

## Part 2: App Demo (2:30)

### Show: App launching on device

**Script:**
"When the app loads, it calls `getCurrentPosition` to get the initial location, places a red marker at that position, and reverse geocodes the coordinates to show the address in the info card."

---

### Show: Tap "Locate Me" button

**Script:**
"When I tap Locate Me, it fetches a fresh position using `getCurrentPosition`, moves the red marker to the new location, and resets any previous tracking data — the blue marker, polyline, and distance are all cleared."

---

### Show: Tap "Start Tracking" button, then walk/move

**Script:**
"Now I'll tap Start Tracking. This calls `watchPosition`, which starts firing its callback every time the device moves. You can see the blue marker appearing and following my position. The green polyline connects the start point to my current location, and the distance tooltip updates in real time."

---

### Show: Tap "Stop Tracking" button

**Script:**
"When I tap Stop Tracking, it calls `clearWatch` with the stored watch ID. The callback stops firing immediately. The blue marker, polyline, and distance tooltip freeze at their last positions — no more updates."

---

### Show: Tap "Locate Me" again

**Script:**
"If I tap Locate Me again, it sets a new starting position, clears the old blue marker and polyline, and resets the distance to zero. I can then start a fresh tracking session."

---

## Part 3: Key Concepts (1:00)

### Show: `geo.ts` side by side with a diagram or just the code

**Script:**
"To summarize the difference: `getCurrentPosition` is a one-time fetch. It returns a single position and is done. `watchPosition` is continuous — it keeps calling your callback function every time the device detects movement.

The watch ID returned by `watchPosition` is how you identify that specific watcher. When you call `clearWatch` with that ID, the system stops sending position updates. In our app, this means the live tracking markers freeze, the distance stops updating, and the effect in our component no longer processes new positions.

This is the core difference between a single location lookup and continuous geolocation tracking."
