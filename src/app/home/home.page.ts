import { AfterViewInit, Component } from '@angular/core';
import { IonHeader, IonToolbar, IonButton, IonContent } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonButton, IonContent],
})
export class HomePage implements AfterViewInit {
  private map!: L.Map;
  private locationMarker?: L.CircleMarker;

  constructor() {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  initMap(): void {
    this.map = L.map('map').setView([0, 0], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    setInterval(() => {
      this.map.invalidateSize();
    }, 200);
  }

  async locateMe() {
    const position = await Geolocation.getCurrentPosition();
    const lat = position.coords.latitude;
    const long = position.coords.longitude;

    this.map.setView([lat, long], 19);

    if (this.locationMarker) {
      this.locationMarker.setLatLng([lat, long]);
    } else {
      this.locationMarker = L.circleMarker([lat, long])
        .addTo(this.map)
        .bindPopup('I am here')
        .openPopup();
    }

    console.log(lat + ' ' + long);
  }
}
