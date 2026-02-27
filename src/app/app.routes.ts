import { Routes } from '@angular/router';
import { MainComponent } from './layouts/main/main.component';
import { ApplicationsComponent } from './pages/applications/applications.component';
import { FonctionsComponent } from './pages/fonctions/fonctions.component';
import { RolesComponent } from './pages/roles/roles.component';
import { DroitsComponent } from './pages/droits/droits.component';
import { ListeComponent } from './pages/employes/liste/liste.component';
import { EditComponent } from './pages/employes/edit/edit.component';
import { DetailsEmployeComponent } from './pages/employes/details-employe/details-employe.component';
import { AjoutComponent } from './pages/employes/ajout/ajout.component';
import { ServicesComponent } from './pages/services/services.component';
import { TypePermissionComponent } from './pages/type-permission/type-permission.component';
import { TypeCongesComponent } from './pages/type-conges/type-conges.component';
import { BureauxComponent } from './pages/bureaux/bureaux.component';
import { ContratsComponent } from './pages/contrats/contrats.component';
import { DetailContratComponent } from './pages/detail-contrat/detail-contrat.component';
import { PermisComponent } from './pages/permis/permis.component';
import { TypesContratsComponent } from './pages/types-contrats/types-contrats.component';
import { CongesComponent } from './pages/conges/conges.component';
import { DocumentsComponent } from './pages/documents/documents.component';
import { DossiersComponent } from './pages/dossiers/dossiers.component';
import { UsersComponent } from './pages/users/users.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { EmployeeProfileComponent } from './pages/employee-profile/employee-profile.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { TachesComponent } from './pages/taches/taches.component';
import { RegisterCodesComponent } from './pages/register-codes/register-codes.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ObjetsComponent } from './pages/objets/objets.component';
import { DemandeExplicationsComponent } from './pages/demande-explications/demande-explications.component';
import { DetailsDemandesExplicationsComponent } from './pages/details-demandes-explications/details-demandes-explications.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminGuard } from './core/admin/admin.guard';
import { PermissionEmployeComponent } from './pages/permission-employe/permission-employe.component';
import { PermissionArchiveComponent } from './pages/permission-archive/permission-archive.component';
import { RapportEmployeComponent } from './pages/rapport-employe/rapport-employe.component';
import { RapportsComponent } from './pages/rapports/rapports.component';
import { SanctionsComponent } from './pages/sanctions/sanctions.component';
import { CahiersDirecteurComponent } from './pages/cahiers-directeur/cahiers-directeur.component';
import { BilanTrimestrielComponent } from './pages/bilan-trimestriel/bilan-trimestriel.component';
import { BilanEmployeComponent } from './pages/bilan-employe/bilan-employe.component';
import { BilanDetailsComponent } from './pages/bilan-details/bilan-details.component';
import { BilanDirecteurComponent } from './pages/bilan-directeur/bilan-directeur.component';
import { CahiersEmployeComponent } from './pages/cahiers-employe/cahiers-employe.component';
import { DetailsBilanComponent } from './pages/details-bilan/details-bilan.component';
import { AppComponent } from './pages/primes/app/app.component';
import { DashboardPrimeComponent } from './pages/primes/dashboard/dashboard.component';
import { ProjetsListeComponent } from './pages/primes/projets-liste/projets-liste.component';
import { ProjetsFormComponent } from './pages/primes/projets-form/projets-form.component';
import { ProjetsDetailsComponent } from './pages/primes/projets-details/projets-details.component';
import { DeveloppeurRapportComponent } from './pages/primes/developpeur-rapport/developpeur-rapport.component';
import { CongesDirecteurComponent } from './pages/conges-directeur/conges-directeur.component';
import { CongesEmployeComponent } from './pages/conges-employe/conges-employe.component';
import { PrimeDeveloppeurComponent } from './pages/prime-developpeur/prime-developpeur.component';
import { CaisseLayoutComponent } from './layouts/caisse-layout/caisse-layout.component';
import { CaisseGuard } from './core/guards/caisse.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: DashboardComponent,
        canActivate: [AdminGuard],
        title: 'Tableau de bord',
      },
      {
        path: 'applications',
        component: ApplicationsComponent,
        canActivate: [AuthGuard],
        title: 'Applications',
      },
      {
        path: 'fonctions',
        component: FonctionsComponent,
        canActivate: [AuthGuard],
        title: 'Fonctions',
      },
      {
        path: 'services',
        component: ServicesComponent,
        canActivate: [AuthGuard],
        title: 'Services',
      },
      {
        path: 'roles',
        component: RolesComponent,
        canActivate: [AuthGuard],
        title: 'Rôles',
      },
      {
        path: 'mes-rapports',
        component: RapportEmployeComponent,
        canActivate: [AuthGuard],
        title: 'Mes rapports',
      },
      {
        path: 'rapports',
        component: RapportsComponent,
        canActivate: [AuthGuard],
        title: 'Rapport trimestriels',
      },
      {
        path: 'add-bilan',
        component: BilanTrimestrielComponent,
        canActivate: [AuthGuard],
        title: 'Ajouter un bilan',
      },
      {
        path: 'edit-bilan/:slug',
        component: BilanTrimestrielComponent,
        canActivate: [AuthGuard],
        title: 'Modifier un bilan',
      },
      {
        path: 'bilans-trimestriel',
        component: BilanDirecteurComponent,
        canActivate: [AuthGuard],
        title: 'Bilans trimestriels',
      },
      {
        path: 'mes-bilans',
        component: BilanEmployeComponent,
        canActivate: [AuthGuard],
        title: 'Mes bilans',
      },
      {
        path: 'bilan-details/:slug',
        component: DetailsBilanComponent,
        canActivate: [AuthGuard],
        title: 'Détails du bilan',
      },
      {
        path: 'suivi-primes',
        component: AppComponent,
        canActivate: [AuthGuard],
        title: 'Suivi des primes',
      },
      {
        path: 'mes-primes',
        component: PrimeDeveloppeurComponent,
        canActivate: [AuthGuard],
        title: 'Suivi de mes primes',
      },
      {
        path: 'primes/dashboard',
        component: DashboardPrimeComponent,
        canActivate: [AuthGuard],
        title: 'Dashboard des primes',
      },
      {
        path: 'primes/rapport-developpeur',
        component: DeveloppeurRapportComponent,
        canActivate: [AuthGuard],
        title: 'Rapports des developpeurs',
      },
      {
        path: 'primes/projets',
        component: ProjetsListeComponent,
        canActivate: [AuthGuard],
        title: 'Liste des projets',
      },
      {
        path: 'projets/nouveau',
        component: ProjetsFormComponent,
        canActivate: [AuthGuard],
        title: 'Nouveau projet',
      },
      {
        path: 'projets/:id',
        component: ProjetsDetailsComponent,
        canActivate: [AuthGuard],
        title: 'Détails du projet',
      },
      {
        path: 'employes',
        component: ListeComponent,
        canActivate: [AuthGuard],
        title: 'Employés',
      },
      {
        path: 'bureaux',
        component: BureauxComponent,
        canActivate: [AuthGuard],
        title: 'Bureaux',
      },
      {
        path: 'cahiers-charges',
        component: CahiersDirecteurComponent,
        canActivate: [AuthGuard],
        title: 'Cahiers des charges',
      },
      {
        path: 'mes-cahiers',
        component: CahiersEmployeComponent,
        canActivate: [AuthGuard],
        title: 'Mes cahiers des charges',
      },
      {
        path: 'permissions',
        component: PermisComponent,
        canActivate: [AuthGuard],
        title: 'Permissions',
      },
      {
        path: 'permissions-archive',
        component: PermissionArchiveComponent,
        canActivate: [AuthGuard],
        title: ' archivées',
      },
      {
        path: 'mes-permissions',
        component: PermissionEmployeComponent,
        canActivate: [AuthGuard],
        title: 'Mes permissions',
      },
      {
        path: 'contrats',
        component: ContratsComponent,
        canActivate: [AuthGuard],
        title: 'Contrats',
      },
      {
        path: 'ajout-employe',
        component: AjoutComponent,
        canActivate: [AuthGuard],
        title: 'Ajouter un employé',
      },
      {
        path: 'edit-employe/:id',
        component: EditComponent,
        canActivate: [AuthGuard],
        title: 'Modifier un employé',
      },
      {
        path: 'detail-employe/:id',
        component: DetailsEmployeComponent,
        canActivate: [AuthGuard],
        title: "Détails de l'employé",
      },
      {
        path: 'detail-contrat/:id',
        component: DetailContratComponent,
        canActivate: [AuthGuard],
        title: 'Détails du contrat',
      },
      {
        path: 'detail-demande/:slug',
        component: DetailsDemandesExplicationsComponent,
        canActivate: [AuthGuard],
        title: "Détails de la demande d'explication",
      },
      {
        path: 'type-permissions',
        component: TypePermissionComponent,
        canActivate: [AuthGuard],
        title: 'Types de permissions',
      },
      {
        path: 'type-conges',
        component: TypeCongesComponent,
        canActivate: [AuthGuard],
        title: 'Types de congés',
      },
      {
        path: 'types-contrats',
        component: TypesContratsComponent,
        canActivate: [AuthGuard],
        title: 'Types de contrats',
      },
      {
        path: 'conges',
        component: CongesDirecteurComponent,
        canActivate: [AuthGuard],
        title: 'Congés',
      },
      {
        path: 'mes-conges',
        component: CongesEmployeComponent,
        canActivate: [AuthGuard],
        title: 'Mes congés',
      },
      {
        path: 'dossiers',
        component: DocumentsComponent,
        canActivate: [AuthGuard],
        title: 'Documents',
      },
      {
        path: 'dossier/:id',
        component: DossiersComponent,
        canActivate: [AuthGuard],
        title: 'Dossiers',
      },
      {
        path: 'sanctions',
        component: SanctionsComponent,
        canActivate: [AuthGuard],
        title: 'Sanctions',
      },
      {
        path: 'droits',
        component: DroitsComponent,
        canActivate: [AuthGuard],
        title: 'Droits',
      },
      {
        path: 'objet-demande-explication',
        component: ObjetsComponent,
        canActivate: [AuthGuard],
        title: "Objets des demandes d'explication",
      },
      {
        path: 'utilisateurs',
        component: UsersComponent,
        canActivate: [AuthGuard],
        title: 'Utilisateurs',
      },
      {
        path: 'programmes-conges',
        component: CalendarComponent,
        canActivate: [AuthGuard],
        title: 'Calendrier des congés',
      },
      {
        path: 'taches',
        component: TachesComponent,
        canActivate: [AuthGuard],
        title: 'Tâches',
      },
      {
        path: 'codes',
        component: RegisterCodesComponent,
        canActivate: [AuthGuard],
        title: "Codes d'enregistrement",
      },
      {
        path: 'demande-explication',
        component: DemandeExplicationsComponent,
        canActivate: [AuthGuard],
        title: "Demandes d'explication",
      },
      {
        path: 'employee-profile',
        component: EmployeeProfileComponent,
        title: 'Mon profil',
      },
    ],
  },

  // caisse
  {
    path: 'caisse',
    component: CaisseLayoutComponent,
    canActivate: [AuthGuard, CaisseGuard],
    children: [
      {
        path: '',
        title: 'Logiciel de caisse',
        loadComponent: () =>
          import('./pages/Caisse/dashboard/dashboard.component').then(
            (c) => c.DashboardComponent,
          ),
      },
      {
        path: 'new-journal',
        title: "Ecriture d'écriture comptable",
        loadComponent: () =>
          import('./pages/Caisse/journal/add-journal/add-journal.component').then(
            (c) => c.AddJournalComponent,
          ),
      },
      {
        path: 'journal',
        title: 'Liste des écritures comptable',
        loadComponent: () =>
          import('./pages/Caisse/journal/journal.component').then(
            (c) => c.JournalComponent,
          ),
      },
      {
        path: 'new-bureaux',
        title: 'Nouveau des bureaux',
        loadComponent: () =>
          import('./pages/Caisse/bureau/add-bureau/add-bureau.component').then(
            (c) => c.AddBureauComponent,
          ),
      },
      {
        path: 'update-bureaux/:rfk',
        title: 'Nouveau des bureaux',
        loadComponent: () =>
          import('./pages/Caisse/bureau/add-bureau/add-bureau.component').then(
            (c) => c.AddBureauComponent,
          ),
      },
      {
        path: 'bureaux',
        title: 'Liste des bureaux',
        loadComponent: () =>
          import('./pages/Caisse/bureau/bureau.component').then(
            (c) => c.BureauComponent,
          ),
      },
      {
        path: 'add-compte',
        title: 'Ajouter un compte',
        loadComponent: () =>
          import('./pages/Caisse/compte/add-compte/add-compte.component').then(
            (c) => c.AddCompteComponent,
          ),
      },
      {
        path: 'update-compte/:rfk',
        title: 'Modifier un compte',
        loadComponent: () =>
          import('./pages/Caisse/compte/add-compte/add-compte.component').then(
            (c) => c.AddCompteComponent,
          ),
      },
      {
        path: 'comptes',
        title: 'Liste des comptes',
        loadComponent: () =>
          import('./pages/Caisse/compte/compte.component').then(
            (c) => c.CompteComponent,
          ),
      },
      {
        path: 'exercices',
        title: 'Liste des exercices comptables',
        loadComponent: () =>
          import('./pages/Caisse/exercice/exercice.component').then(
            (c) => c.ExerciceComponent,
          ),
      },
      {
        path: 'detail-exercice/:exerciceRfk',
        title: "Détail de l'exercice",
        loadComponent: () =>
          import('./pages/Caisse/exercice/detail-exercice/detail-exercice.component').then(
            (c) => c.DetailExerciceComponent,
          ),
      },
    ],
  },

  { path: 'connexion', component: LoginComponent, title: 'Connexion' },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    title: 'Mot de passe oublié',
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: 'Réinitialisation du mot de passe',
  },
  { path: '**', redirectTo: '' },
];
