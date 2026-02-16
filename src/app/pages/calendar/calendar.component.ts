import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';
import { CongesService } from '../../services/conges.service';
import { EmployesService } from '../../services/employes.service';
import { TypeCongesService } from '../../services/type-conges.service';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoadingComponent } from '../loading/loading.component';
import { trigger, transition, style, animate } from '@angular/animations';

interface CongeExtendedProps {
  debut: any;
  fin: any;
  id: string;
  id_employe: string;
  type: string;
  raison: string;
  commentaire: string;
  date_demande: string;
  date_reponse: string;
  employe?: any;
  statut?: number;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    LoadingComponent,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('500ms 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('600ms 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class CalendarComponent implements OnInit {
  isLoading: boolean = true;
  employees: any[] = [];
  typesConges: any[] = [];
  currentUser: any;
  selectedEmployee: string = '';
  allConges: CongeExtendedProps[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: frLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: [],
    selectable: false,
    selectMirror: true,
    editable: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventResize: this.handleEventResize.bind(this),
    eventDidMount: info => {
      const props = info.event.extendedProps as CongeExtendedProps;
      info.el.setAttribute('title', `Raison: ${props.raison || ''}`);
    }
  };

  constructor(
    private congeSvr: CongesService,
    private employeSvr: EmployesService,
    private typeCongeSvr: TypeCongesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    if (this.isAdmin()) {
      this.loadEmployees();
    }
    this.loadTypesConges();
    this.loadConges();
    this.calendarOptions.selectable = this.isAdmin();
  }

  loadCurrentUser() {
    const userToken = localStorage.getItem('user_token');
    this.currentUser = userToken ? JSON.parse(userToken) : null;
  }

  isAdmin(): boolean {
    const role = this.currentUser?.role?.libelle?.toLowerCase() || '';
    return role === 'directeur' || role === 'rh';
  }

  loadEmployees() {
    this.employeSvr.getList().subscribe({
      next: res => this.employees = res,
      error: err => console.error(err)
    });
  }

  loadTypesConges() {
    this.typeCongeSvr.getList().subscribe({
      next: res => this.typesConges = res,
      error: err => console.error(err)
    });
  }

  loadConges() {
    this.isLoading = true;

    if (this.isAdmin()) {
      this.congeSvr.getList().subscribe({
        next: res => {
          this.allConges = res;
          this.applyFilter();
          this.isLoading = false;
        },
        error: err => this.handleError(err)
      });
    } else {
      const slug = this.currentUser?.employe?.slug;
      if (slug) {
        this.congeSvr.getCongeByEmp(slug).subscribe({
          next: res => {
            this.allConges = res;
            this.applyFilter();
            this.isLoading = false;
          },
          error: err => this.handleError(err)
        });
      }
    }
  }

  applyFilter() {
    const filtered = this.isAdmin() && this.selectedEmployee
      ? this.allConges.filter(c => c.id_employe === this.selectedEmployee)
      : this.allConges;

    this.calendarOptions.events = filtered.map(e => ({
      title: e.employe ? `${e.employe.nom} ${e.employe.prenom}` : 'Employé inconnu',
      start: e.debut,
      end: e.fin,
      classNames:
        e.statut === 1 ? ['fc-event-green'] :
        e.statut === 0 ? ['fc-event-red'] :
        ['fc-event-yellow'],
      extendedProps: e
    }));
  }

  refreshCalendar() {
    this.applyFilter();
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const start = selectInfo.startStr;
    const end = selectInfo.endStr;

    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'Nouvelle demande de congé',
        fields: [
          {
            name: 'id_employe',
            label: 'Employé',
            type: 'select2',
            options: this.employees.map(e => ({ value: e.slug, label: `${e.nom} ${e.prenom}` })),
            validators: ['required']
          },
          { name: 'debut', label: 'Début', type: 'date', value: start, validators: ['required'] },
          { name: 'fin', label: 'Fin', type: 'date', value: end, validators: ['required'] },
          {
            name: 'id_type',
            label: 'Type',
            type: 'select2',
            options: this.typesConges.map(t => ({ value: t.slug, label: t.nom })),
            validators: ['required']
          },
          { name: 'raison', label: 'Raison', type: 'textarea' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.congeSvr.addConge(formData).subscribe({
          next: res => {
            this.snackBar.open(res.message, 'Fermer', { duration: 4000, panelClass: ['snackbar-success'] });
            this.loadConges();
          },
          error: err => this.handleError(err)
        });
      }
    });
  }

  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event;
    const props = event.extendedProps as CongeExtendedProps;

    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'Modifier la demande de congé',
        item: {
          id_employe: props.id_employe,
          debut: event.startStr,
          fin: event.endStr,
          raison: props.raison,
          id_type: props.type
        },
        fields: [
          { name: 'debut', label: 'Début', type: 'date', validators: ['required'] },
          { name: 'fin', label: 'Fin', type: 'date', validators: ['required'] },
          { name: 'id_type', label: 'Type', type: 'select2', options: this.typesConges },
          { name: 'raison', label: 'Raison', type: 'textarea' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.congeSvr.updateConge(props.id, formData).subscribe({
          next: res => {
            this.snackBar.open(res.message, 'Fermer', { duration: 4000, panelClass: ['snackbar-success'] });
            this.loadConges();
          },
          error: err => this.handleError(err)
        });
      }
    });
  }

  handleEventDrop(dropInfo: EventDropArg) {
    const props = dropInfo.event.extendedProps as CongeExtendedProps;
    this.congeSvr.updateConge(props.id, { debut: dropInfo.event.startStr, fin: dropInfo.event.endStr }).subscribe({
      next: () => this.snackBar.open('Dates mises à jour', 'Fermer', { duration: 3000, panelClass: ['snackbar-success'] }),
      error: err => this.handleError(err)
    });
  }

  handleEventResize(resizeInfo: any) {
    const props = resizeInfo.event.extendedProps as CongeExtendedProps;
    this.congeSvr.updateConge(props.id, { debut: resizeInfo.event.startStr, fin: resizeInfo.event.endStr }).subscribe({
      next: () => this.snackBar.open('Dates mises à jour', 'Fermer', { duration: 3000, panelClass: ['snackbar-success'] }),
      error: err => this.handleError(err)
    });
  }

  private handleError(err: any) {
    this.snackBar.open(err.message || 'Erreur', 'Fermer', { duration: 4000, panelClass: ['snackbar-error'] });
    console.error(err);
    this.isLoading = false;
  }

  printProgram() {
    const year = new Date().getFullYear();

    const filteredConges = this.allConges.filter(c => {
      const yearDebut = new Date(c.debut).getFullYear();
      return yearDebut === year;
    });

    if (!filteredConges.length) {
      this.snackBar.open(`Aucun congé enregistré pour ${year}`, 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-info']
      });
      return;
    }

    this.openPrintablePage(filteredConges, year);
  }

  openPrintablePage(conges: any[], year: number) {
    const win = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Programme des Congés ${year}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 13px; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <h2>Programme des Congés - ${year}</h2>
          <table>
            <thead>
              <tr>
                <th>Employé</th>
                <th>Type de congé</th>
                <th>Début</th>
                <th>Fin</th>
              </tr>
            </thead>
            <tbody>
              ${conges.map(c => `
                <tr>
                  <td>${c.employe?.nom || ''} ${c.employe?.prenom || ''}</td>
                  <td>${c.type.nom || ''}</td>
                  <td>${new Date(c.debut).toLocaleDateString()}</td>
                  <td>${new Date(c.fin).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;
    win!.document.write(html);
    win!.document.close();
  }
}
