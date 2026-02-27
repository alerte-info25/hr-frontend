import { Component, OnInit, signal, ApplicationRef } from '@angular/core';
import { first } from 'rxjs';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent implements OnInit {
  isFaded = signal(false);

  constructor(private appRef: ApplicationRef) {}

  ngOnInit(): void {
    this.appRef.isStable.pipe(first(Boolean)).subscribe(() => {
      setTimeout(() => {
        this.isFaded.set(true);
      }, 500);
    });
  }
}
