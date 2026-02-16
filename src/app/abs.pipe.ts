import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'abs',
  standalone: true
})
export class AbsPipe implements PipeTransform {
  transform(value: number | null | undefined): number {
    return Math.abs(value ?? 0);
  }
}
