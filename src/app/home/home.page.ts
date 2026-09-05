import { AfterViewInit, Component, inject, effect, signal } from '@angular/core';
import { IonButton, IonContent, IonAlert } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { Geo } from '../services/geo';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonButton, IonContent, IonAlert],
})
export class HomePage implements AfterViewInit {
  map!: L.Map;
  latlng: { lat: number; lng: number } = { lat: 0, lng: 0 };

  GeolocationService = inject(Geo);

  isAlertOpen = false;
  alertButtons = ['Refresh'];
  display_name = signal('');
  loader?: HTMLIonLoadingElement;

  lastMarker?: L.CircleMarker;
  distanceLine?: L.Polyline;
  distanceTooltip?: L.Tooltip;
  distanceFromStart = signal(0);

  myHeader = 'Geolocation API Error';
  myMessage = 'Unable to get current location.';

  constructor(private loadingController: LoadingController) {
    effect(() => {
      const pos = this.GeolocationService.movingPosition();
      if (pos && this.map) {
        const startLatLng = L.latLng(this.latlng.lat, this.latlng.lng);
        const movingLatLng = L.latLng(pos.lat, pos.lng);

        if (!this.lastMarker) {
          this.lastMarker = L.circleMarker([pos.lat, pos.lng], {
            radius: 5,
            color: 'blue',
          }).addTo(this.map);
        } else {
          this.lastMarker.setLatLng([pos.lat, pos.lng]);
        }

        const distance = startLatLng.distanceTo(movingLatLng);
        this.distanceFromStart.set(distance);

        if (!this.distanceLine) {
          this.distanceLine = L.polyline([startLatLng, movingLatLng], {
            color: 'green',
          }).addTo(this.map);
        } else {
          this.distanceLine.setLatLngs([startLatLng, movingLatLng]);
        }

        const midpoint = L.latLng(
          (startLatLng.lat + movingLatLng.lat) / 2,
          (startLatLng.lng + movingLatLng.lng) / 2
        );

        if (!this.distanceTooltip) {
          this.distanceTooltip = L.tooltip({
            permanent: true,
            direction: 'top',
            offset: [0, -10],
            className: 'distance-tooltip',
          })
            .setLatLng(midpoint)
            .setContent(`${distance.toFixed(2)} m`)
            .addTo(this.map);
        } else {
          this.distanceTooltip.setLatLng(midpoint);
          this.distanceTooltip.setContent(`${distance.toFixed(2)} m`);
        }

        this.map.panTo([pos.lat, pos.lng]);
      }
    });
  }

  async ngAfterViewInit() {
    await this.getCurrentLocation();
  }

  async getCurrentLocation() {
    try {
      this.showLoading();
      const coordinates = await this.GeolocationService.getCurrentLocation();
      this.latlng = coordinates;
      this.mapInit();
      await this.hideLoading();

      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${this.latlng.lat}&lon=${this.latlng.lng}&format=json`
      )
        .then((res) => res.json())
        .then((data) => {
          this.display_name.set(data.display_name);
        });
    } catch (error) {
      await this.hideLoading();
      this.isAlertOpen = true;
    }
  }

  mapInit() {
    this.map = L.map('map', {
      center: [this.latlng.lat, this.latlng.lng],
      zoom: 19,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    L.circleMarker([this.latlng.lat, this.latlng.lng], {
      radius: 5,
      color: '#d62828',
    }).addTo(this.map);

    setInterval(() => {
      this.map.invalidateSize();
    }, 200);

    this.GeolocationService.watchPosition();
  }

  async locateMe() {
    const position = await this.GeolocationService.getCurrentLocation();
    this.latlng = position;

    this.map.setView([position.lat, position.lng], 19);

    if (this.lastMarker) {
      this.lastMarker.setLatLng([position.lat, position.lng]);
    } else {
      this.lastMarker = L.circleMarker([position.lat, position.lng], {
        radius: 5,
        color: '#d62828',
      }).addTo(this.map);
    }

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${position.lat}&lon=${position.lng}&format=json`
    )
      .then((res) => res.json())
      .then((data) => {
        this.display_name.set(data.display_name);
      });

    console.log(position.lat + ' ' + position.lng);
  }

  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
    window.location.reload();
  }

  async showLoading() {
    this.loader = await this.loadingController.create({
      message: 'Please wait',
    });
    await this.loader.present();
  }

  async hideLoading() {
    if (this.loader) {
      await this.loader.dismiss();
      this.loader = undefined;
    }
  }
}
