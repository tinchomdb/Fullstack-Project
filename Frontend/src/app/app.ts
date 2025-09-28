import { Component, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy } from '@angular/core';
import { environment } from '../environments/environment';

interface WeatherForecast {
  date: string;
  temperatureC: number;
  summary?: string;
  temperatureF?: number;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly title = signal('app');
  protected readonly forecasts = signal<WeatherForecast[] | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly apiBase = environment.apiBase;

  constructor(private http: HttpClient) {
    // optional: log changes to forecasts during development
    effect(() => {
      const v = this.forecasts();
      // console.debug('forecasts updated', v);
    });
  }

  ngOnInit(): void {
    this.loadWeather();
  }

  private loadWeather() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<WeatherForecast[]>(`${this.apiBase}/weatherforecast`).subscribe({
      next: (data) => {
        // server returns DateOnly and PascalCase; normalize keys
        const normalized = (data || []).map(
          (d) =>
            ({
              date: (d as any).date ?? (d as any).Date ?? d.date,
              temperatureC: (d as any).temperatureC ?? (d as any).TemperatureC ?? d.temperatureC,
              summary: (d as any).summary ?? (d as any).Summary ?? d.summary,
              temperatureF: (d as any).temperatureF ?? (d as any).TemperatureF ?? d.temperatureF,
            } as WeatherForecast)
        );
        this.forecasts.set(normalized);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load weather');
        this.loading.set(false);
      },
    });
  }
}
