import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform<T extends Record<string, any>>(items: T[] | null | undefined, search = '', field = 'nom'): T[] {
    if (!items) return [];
    if (!search) return items;
    const s = (search || '').toLowerCase();
    return items.filter(it => ((it?.[field] ?? '') + '').toLowerCase().includes(s));
  }
}
