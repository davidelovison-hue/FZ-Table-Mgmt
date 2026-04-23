import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-shift-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shift-widget.component.html',
  styleUrl: './shift-widget.component.css',
})
export class ShiftWidgetComponent implements OnInit, OnDestroy {
  currentTime = signal(this.formatTime(new Date()));
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentTime.set(this.formatTime(new Date()));
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private formatTime(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = days[date.getDay()];
    const dd = date.getDate();
    const mon = months[date.getMonth()];
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${dd} ${mon}, ${hh}:${mm}`;
  }
}
