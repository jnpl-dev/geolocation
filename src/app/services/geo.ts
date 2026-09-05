import { Injectable, signal } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({ providedIn: 'root' })
export class Geo {
  movingPosition = signal<{ lat: number; lng: number } | null>(null);
  private watchId: string | null = null;

  async getCurrentLocation() {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
  }

  async watchPosition() {
    this.watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (pos) => {
        if (pos) {
          this.movingPosition.set({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        }
      }
    );
    return this.watchId;
  }

  async stopWatching() {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      this.movingPosition.set(null);
    }
  }

  async requestPermissions() {
    const status = await Geolocation.requestPermissions();
    return status.location;
  }
}
